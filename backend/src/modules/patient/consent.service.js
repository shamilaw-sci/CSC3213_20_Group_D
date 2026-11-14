/**
 * @file consent.service.js
 * @module Patient
 * @desc Own-patient privacy settings and consultation-bound, hashed-OTP consent.
 * @author Wasana Karunanayaka (S/21/081)
 * Stage 4A transaction/validation changes: Codex Review Assistant.
 */
const bcrypt = require('bcryptjs');
const consentRepository = require('./consent.repository');
const patientRepository = require('./patient.repository');
const doctorRepository = require('../doctor/doctor.repository');
const appointmentRepository = require('../appointment/appointment.repository');
const { generateOtp, getOtpExpiry } = require('../../utils/otp');
const { sendConsentAccessOtpEmail } = require('../../utils/email');
const OTP_EXPIRY_MINUTES = 10;
const ACCESS_GRANT_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

/** @param {string} message Public reason. @param {number} statusCode HTTP status.
 * @returns {Error} Expected service failure, without SQL/provider internals.
 */
const createServiceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/** Resolve account ID to doctor profile ID; never substitute one for the other.
 * @param {Object} user Authenticated public identity. @param {Object} db Optional transaction client.
 * @returns {Promise<Object>} Linked doctor, or an authentication/role/profile error.
 */
const resolveDoctorProfile = async (user, db) => {
  if (!user?.id) throw createServiceError('Authentication is required', 401);
  if (user.role !== 'doctor') throw createServiceError('Only doctors can request temporary consent access', 403);
  const doctor = await doctorRepository.getDoctorByUserId(user.id, db);
  if (!doctor) throw createServiceError('Doctor profile could not be resolved', 404);
  if (user.profile_id && String(user.profile_id) !== String(doctor.id)) {
    throw createServiceError('Your doctor profile has changed. Sign in again.', 403);
  }
  return doctor;
};

/** @param {string} patientId Target profile UUID. @param {Object} user Session identity.
 * @param {Object} db Optional transaction client. @returns {Promise<Object>} Owning patient.
 */
const ensurePatientOwnsConsentSettings = async (patientId, user, db) => {
  if (!user?.id) throw createServiceError('Authentication is required', 401);
  if (user.role !== 'patient') throw createServiceError('Only patients can manage their privacy settings', 403);
  const patient = await patientRepository.getPatientByUserId(user.id, db);
  if (!patient || String(patient.id) !== String(patientId)) {
    throw createServiceError('You can only manage privacy settings for your own patient profile', 403);
  }
  return patient;
};

/** Validate both profile assignments and the active consultation before record/grant access.
 * A transaction client also holds an appointment share lock against status transitions.
 * @param {string} patientId Patient profile UUID. @param {string} appointmentId Appointment UUID.
 * @param {Object} user Doctor session. @param {Object} db Optional transaction client.
 * @returns {Promise<Object>} Patient, appointment, doctor and doctorId.
 */
const validateDoctorConsultationContext = async (patientId, appointmentId, user, db) => {
  if (typeof patientId !== 'string' || !patientId || typeof appointmentId !== 'string' || !appointmentId) {
    throw createServiceError('A patient and active consultation are required', 400);
  }
  const doctor = await resolveDoctorProfile(user, db);
  const patient = await patientRepository.getPatientById(patientId, db);
  if (!patient) throw createServiceError('Patient not found', 404);
  const appointment = await appointmentRepository.getAppointmentById(appointmentId, db);
  if (!appointment || String(appointment.patient_id) !== String(patientId) ||
      String(appointment.doctor_id) !== String(doctor.id)) {
    throw createServiceError('This consultation is not assigned to you and the selected patient', 403);
  }
  if (appointment.status !== 'in_progress') throw createServiceError('An active consultation is required', 409);
  return { patient, doctor, doctorId: doctor.id, appointment };
};

/** Validate rather than silently dropping malformed locks. Existing labels remain supported.
 * Clinical keyword classification is separately documented; no diagnosis taxonomy is invented.
 * @param {Array<string>} categories Complete category list. @returns {Array<string>} Trimmed unique labels.
 */
const normalizeCategories = categories => {
  if (!Array.isArray(categories) || categories.length > 50 || categories.some(
    item => typeof item !== 'string' || !item.trim() || item.trim().length > 100)) {
    throw createServiceError('Privacy categories must be a list of nonempty names (up to 100 characters each)', 400);
  }
  return [...new Set(categories.map(item => item.trim()))];
};

/** @param {string} patientId Patient profile. @param {Object} db Optional transaction.
 * @returns {Promise<Array<string>>} Valid stored locks. Malformed stored settings fail closed.
 */
const getLockedCategories = async (patientId, db) => {
  const settings = await consentRepository.getConsentSettings(patientId, db);
  return normalizeCategories(settings?.locked_categories);
};

/** @param {string} patientId Target profile. @param {Object} user Owning session.
 * @returns {Promise<Object>} Validated locked_categories; does not authenticate a doctor.
 */
const getPatientConsentSettings = async (patientId, user) => {
  await ensurePatientOwnsConsentSettings(patientId, user);
  return { locked_categories: await getLockedCategories(patientId) };
};

/** Serialize settings with OTP/grant changes without changing existing revocation policy.
 * @param {string} patientId Profile UUID. @param {Array<string>} categories Full replacement.
 * @param {Object} user Owner session. @returns {Promise<Object>} Acknowledged stored settings.
 */
const updatePatientConsentSettings = async (patientId, categories, user) => {
  await ensurePatientOwnsConsentSettings(patientId, user);
  const normalized = normalizeCategories(categories);
  return consentRepository.withPatientTransaction(patientId, async db => {
    await ensurePatientOwnsConsentSettings(patientId, user, db);
    return consentRepository.upsertConsentSettings(patientId, normalized, db);
  });
};

/** Create a replacement request atomically, then submit email after releasing SQL locks.
 * Provider acknowledgement is not confirmed delivery; failed/throwing submission invalidates
 * only this request ID and cannot invalidate a newer replacement. Out-of-order emails remain possible.
 * @param {string} patientId Patient. @param {string} appointmentId Consultation.
 * @param {Object} user Doctor session. @returns {Promise<Object>} Request or existing grant metadata, never the OTP/hash.
 */
const requestConsentAccessOtp = async (patientId, appointmentId, user) => {
  // Validate role/context before taking a patient mutation lock or generating a code.
  await validateDoctorConsultationContext(patientId, appointmentId, user);
  const otpCode = generateOtp();
  const otpHash = await bcrypt.hash(otpCode, 12);
  const result = await consentRepository.withPatientTransaction(patientId, async db => {
    const { patient, doctorId } = await validateDoctorConsultationContext(patientId, appointmentId, user, db);
    const lockedCategories = await getLockedCategories(patientId, db);
    if (!lockedCategories.length) throw createServiceError('This patient has no locked categories requiring consent', 409);
    const grant = await consentRepository.getActiveConsentAccessGrant(patientId, doctorId, appointmentId, db);
    if (grant) return { alreadyGranted: true, lockedCategories, grantedCategories: grant.granted_categories || [], expiresAt: grant.expires_at };
    if (!patient.user_id || !patient.email || patient.is_verified !== true) {
      throw createServiceError('A verified patient email is required for consent codes', 409);
    }
    await consentRepository.invalidateActiveAccessRequests(patientId, doctorId, appointmentId, db);
    const request = await consentRepository.createConsentAccessRequest({ patientId, doctorId, appointmentId,
      requestedCategories: lockedCategories, otpHash, expiresAt: getOtpExpiry(OTP_EXPIRY_MINUTES) }, db);
    return { patient, request };
  });
  if (result.alreadyGranted) return result;
  try {
    const sent = await sendConsentAccessOtpEmail(result.patient.email, result.patient.full_name, otpCode);
    if (sent?.success !== true) throw new Error('Unacknowledged provider submission');
  } catch {
    await consentRepository.invalidateConsentAccessRequest(result.request.id);
    throw createServiceError('The consent email could not be submitted. Request a new code.', 502);
  }
  return { alreadyGranted: false, requestId: result.request.id,
    lockedCategories: result.request.requested_categories, expiresAt: result.request.expires_at, delivery: 'email' };
};

/** Commit attempt counters even when an expected verification error must be returned.
 * Serialize read/compare/consume/revoke/grant; an unexpected write failure rolls everything back.
 * @param {string} patientId Patient. @param {string} appointmentId Appointment.
 * @param {string} otpCode Six-digit string. @param {Object} user Doctor.
 * @returns {Promise<Object>} Grant acknowledgement only after commit.
 */
const verifyConsentAccessOtp = async (patientId, appointmentId, otpCode, user) => {
  if (typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
    throw createServiceError('Enter the complete 6-digit consent code', 400);
  }
  await validateDoctorConsultationContext(patientId, appointmentId, user);
  const result = await consentRepository.withPatientTransaction(patientId, async db => {
    const { doctorId } = await validateDoctorConsultationContext(patientId, appointmentId, user, db);
    const request = await consentRepository.getActiveConsentAccessRequest(patientId, doctorId, appointmentId, db);
    if (!request) return { error: createServiceError('No active consent code was found. Request a new code.', 400) };
    if (request.attempt_count >= MAX_OTP_ATTEMPTS) {
      await consentRepository.invalidateConsentAccessRequest(request.id, db);
      return { error: createServiceError('Too many attempts. Request a new consent code.', 429) };
    }
    const matches = await bcrypt.compare(otpCode.trim(), request.otp_hash);
    if (!matches) {
      const updated = await consentRepository.incrementConsentAccessAttempt(request.id, db);
      const attempts = updated?.attempt_count ?? MAX_OTP_ATTEMPTS;
      if (attempts >= MAX_OTP_ATTEMPTS) await consentRepository.invalidateConsentAccessRequest(request.id, db);
      return { error: createServiceError(attempts >= MAX_OTP_ATTEMPTS
        ? 'Too many attempts. Request a new consent code.'
        : `Incorrect consent code. ${MAX_OTP_ATTEMPTS - attempts} attempts remaining.`, attempts >= MAX_OTP_ATTEMPTS ? 429 : 400) };
    }
    const used = await consentRepository.markConsentAccessRequestUsed(request.id, db);
    if (!used) return { error: createServiceError('This consent code is expired or no longer available. Request a new code.', 409) };
    await consentRepository.revokeActiveConsentAccessGrants(patientId, doctorId, appointmentId, db);
    const grant = await consentRepository.createConsentAccessGrant({ patientId, doctorId, appointmentId,
      requestId: request.id, grantedCategories: normalizeCategories(request.requested_categories),
      expiresAt: new Date(Date.now() + ACCESS_GRANT_MINUTES * 60000) }, db);
    return { granted: true, grantedCategories: grant.granted_categories, grantedAt: grant.granted_at, expiresAt: grant.expires_at };
  });
  if (result.error) throw result.error;
  return result;
};

/** @param {string} patientId Patient. @param {string} appointmentId Active appointment.
 * @param {Object} user Assigned doctor. @returns {Promise<Object>} Current locks and unexpired/unrevoked grant metadata.
 */
const getConsentAccessStatus = async (patientId, appointmentId, user) => {
  const { doctorId } = await validateDoctorConsultationContext(patientId, appointmentId, user);
  const lockedCategories = await getLockedCategories(patientId);
  const grant = lockedCategories.length ? await consentRepository.getActiveConsentAccessGrant(patientId, doctorId, appointmentId) : null;
  return { hasLockedCategories: !!lockedCategories.length, lockedCategories, hasActiveGrant: !!grant,
    grantedCategories: grant?.granted_categories || [], expiresAt: grant?.expires_at || null };
};

/** @param {string} patientId Patient. @param {string} appointmentId Consultation.
 * @param {Object} user Doctor. @param {string} category Lock label.
 * @returns {Promise<boolean>} False on invalid context; checks assignment as well as grant expiry/revocation.
 */
const hasTemporaryCategoryAccess = async (patientId, appointmentId, user, category) => {
  if (typeof category !== 'string' || !category.trim()) return false;
  try {
    const status = await getConsentAccessStatus(patientId, appointmentId, user);
    return status.hasActiveGrant && status.grantedCategories.some(item =>
      typeof item === 'string' && item.trim().toLowerCase() === category.trim().toLowerCase());
  } catch { return false; }
};

module.exports = { getPatientConsentSettings, updatePatientConsentSettings, requestConsentAccessOtp,
  verifyConsentAccessOtp, getConsentAccessStatus, hasTemporaryCategoryAccess, validateDoctorConsultationContext };
