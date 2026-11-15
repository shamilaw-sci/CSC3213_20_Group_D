/**
 * @file    consent.service.js
 * @module  Patient
 * @desc    Checks patient consent and controls temporary doctor access to private records.
 * @author  Wasana Karunanayaka (S/21/081)
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


/** Attach an HTTP status to a validation error so the controller can return the right response. */
const createServiceError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/**
 * FEATURE: Check doctor identity
 * LOGIC: Find the doctor profile linked to the logged-in account; reject a mismatched profile.
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

/**
 * FEATURE: Protect privacy settings
 * LOGIC: Only the patient who owns the profile can read or change its protected categories.
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

/**
 * FEATURE: Confirm active consultation
 * LOGIC: Doctor, patient and appointment must match and the appointment must be in progress.
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

/**
 * FEATURE: Check protected category names
 * LOGIC: Reject invalid lists, limit them to 50 entries and remove duplicate names.
 */
const normalizeCategories = categories => {
  if (!Array.isArray(categories) || categories.length > 50 || categories.some(
    item => typeof item !== 'string' || !item.trim() || item.trim().length > 100)) {
    throw createServiceError('Privacy categories must be a list of nonempty names (up to 100 characters each)', 400);
  }
  return [...new Set(categories.map(item => item.trim()))];
};


/**
 * FEATURE: Read protected record categories
 * LOGIC: Load saved settings and normalize the list before it is used in access decisions.
 */
const getLockedCategories = async (patientId, db) => {
  const settings = await consentRepository.getConsentSettings(patientId, db);
  return normalizeCategories(settings?.locked_categories);
};


/**
 * FEATURE: Show patient privacy choices
 * LOGIC: Check that the signed-in patient owns the profile before returning their category locks.
 */
const getPatientConsentSettings = async (patientId, user) => {
  await ensurePatientOwnsConsentSettings(patientId, user);
  return { locked_categories: await getLockedCategories(patientId) };
};

/**
 * FEATURE: Change patient privacy locks
 * LOGIC: Check the owner, validate categories and save the update inside a patient transaction.
 */
const updatePatientConsentSettings = async (patientId, categories, user) => {
  await ensurePatientOwnsConsentSettings(patientId, user);
  const normalized = normalizeCategories(categories);
  return consentRepository.withPatientTransaction(patientId, async db => {
    await ensurePatientOwnsConsentSettings(patientId, user, db);
    return consentRepository.upsertConsentSettings(patientId, normalized, db);
  });
};

/**
 * FEATURE: Request temporary doctor access
 * LOGIC: During an active consultation, generate a 10-minute code, store its hash and email it to the patient. An existing valid grant is reused.
 */
const requestConsentAccessOtp = async (patientId, appointmentId, user) => {
  // Validate role/context before taking a patient mutation lock or generating a code.
  await validateDoctorConsultationContext(patientId, appointmentId, user);
  const otpCode = generateOtp();
  // Store only a bcrypt hash of the six-digit consent code; the plain code is emailed to the patient.
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
    // Invalidate older unused codes for this doctor, patient and appointment before creating a new request.
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

/**
 * FEATURE: Verify temporary consent
 * LOGIC: Check the six-digit code; allow at most 5 wrong attempts. A valid code is used once and grants 15 minutes of access.
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
    // Check the stored hash; failed attempts are counted and the code is invalidated at the limit.
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
    // A verified one-use code grants access only to the requested categories for fifteen minutes.
    const grant = await consentRepository.createConsentAccessGrant({ patientId, doctorId, appointmentId,
      requestId: request.id, grantedCategories: normalizeCategories(request.requested_categories),
      expiresAt: new Date(Date.now() + ACCESS_GRANT_MINUTES * 60000) }, db);
    return { granted: true, grantedCategories: grant.granted_categories, grantedAt: grant.granted_at, expiresAt: grant.expires_at };
  });
  if (result.error) throw result.error;
  return result;
};

/**
 * FEATURE: Check access before viewing records
 * LOGIC: Require the same active consultation, then look for an unexpired grant to the protected categories.
 */
const getConsentAccessStatus = async (patientId, appointmentId, user) => {
  const { doctorId } = await validateDoctorConsultationContext(patientId, appointmentId, user);
  const lockedCategories = await getLockedCategories(patientId);
  const grant = lockedCategories.length ? await consentRepository.getActiveConsentAccessGrant(patientId, doctorId, appointmentId) : null;
  return { hasLockedCategories: !!lockedCategories.length, lockedCategories, hasActiveGrant: !!grant,
    grantedCategories: grant?.granted_categories || [], expiresAt: grant?.expires_at || null };
};

/**
 * FEATURE: Check one protected category
 * LOGIC: Allow it only if the current grant includes that category; any failed check denies access.
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
