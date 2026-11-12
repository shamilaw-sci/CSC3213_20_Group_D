/**
 * @file    consent.service.js
 * @module  Patient
 * @desc    Business logic for patient privacy consent and temporary
 *          doctor access to protected medical information.
 *
 *          Doctors may request a patient-approved OTP during an
 *          active consultation. A successful OTP verification grants
 *          temporary access to the patient's currently locked
 *          categories for that specific consultation.
 *
 * @author  Wasana Karunanayaka (S/21/081)
 */

const bcrypt =
  require('bcryptjs');

const consentRepository =
  require('./consent.repository');

const patientRepository =
  require('./patient.repository');

const doctorRepository =
  require('../doctor/doctor.repository');

const appointmentRepository =
  require('../appointment/appointment.repository');

const {
  generateOtp,
  getOtpExpiry
} = require('../../utils/otp');

const {
  sendConsentAccessOtpEmail
} = require('../../utils/email');

const OTP_EXPIRY_MINUTES =
  10;

const ACCESS_GRANT_MINUTES =
  15;

const MAX_OTP_ATTEMPTS =
  5;

/* =========================================================
   COMMON HELPERS
========================================================= */

/**
 * Creates a service error with an HTTP status code.
 *
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
const createServiceError = (
  message,
  statusCode
) => {
  const error =
    new Error(message);

  error.statusCode =
    statusCode;

  return error;
};

/**
 * Resolves the authenticated doctor profile using
 * the logged-in Care4U user ID.
 *
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const resolveDoctorProfile =
  async (
    requestingUser
  ) => {
    if (!requestingUser) {
      throw createServiceError(
        'Authentication is required',
        401
      );
    }

    if (
      requestingUser.role
        ?.toLowerCase() !==
      'doctor'
    ) {
      throw createServiceError(
        'Only doctors can request temporary access to protected medical information',
        403
      );
    }

    if (!requestingUser.id) {
      throw createServiceError(
        'Authenticated user could not be resolved',
        401
      );
    }

    const doctor =
      await doctorRepository
        .getDoctorByUserId(
          requestingUser.id
        );

    if (!doctor) {
      throw createServiceError(
        'Doctor profile could not be resolved',
        404
      );
    }

    return doctor;
  };

/**
 * Ensures that privacy settings are being accessed
 * by the patient who owns the requested profile.
 *
 * @param {string} patientId
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const ensurePatientOwnsConsentSettings =
  async (
    patientId,
    requestingUser
  ) => {
    if (!requestingUser) {
      throw createServiceError(
        'Authentication is required',
        401
      );
    }

    if (
      requestingUser.role
        ?.toLowerCase() !==
      'patient'
    ) {
      throw createServiceError(
        'Only patients can manage their privacy settings',
        403
      );
    }

    if (!requestingUser.id) {
      throw createServiceError(
        'Authenticated user could not be resolved',
        401
      );
    }

    const patient =
      await patientRepository
        .getPatientByUserId(
          requestingUser.id
        );

    if (!patient) {
      throw createServiceError(
        'Patient profile could not be resolved',
        404
      );
    }

    if (
      String(patient.id) !==
      String(patientId)
    ) {
      throw createServiceError(
        'You can only manage privacy settings for your own patient profile',
        403
      );
    }

    return patient;
  };

/**
 * Validates that the patient exists and that the supplied
 * appointment belongs to both this patient and the
 * authenticated doctor.
 *
 * Temporary consent access is only available while the
 * consultation is active.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const validateDoctorConsultationContext =
  async (
    patientId,
    appointmentId,
    requestingUser
  ) => {
    if (!patientId) {
      throw createServiceError(
        'Patient ID is required',
        400
      );
    }

    if (!appointmentId) {
      throw createServiceError(
        'Appointment ID is required',
        400
      );
    }

    const doctor =
      await resolveDoctorProfile(
        requestingUser
      );

    const doctorId =
      doctor.id;

    const patient =
      await patientRepository
        .getPatientById(
          patientId
        );

    if (!patient) {
      throw createServiceError(
        'Patient not found',
        404
      );
    }

    const appointment =
      await appointmentRepository
        .getAppointmentById(
          appointmentId
        );

    if (!appointment) {
      throw createServiceError(
        'Appointment not found',
        404
      );
    }

    if (
      String(
        appointment.patient_id
      ) !==
      String(patientId)
    ) {
      throw createServiceError(
        'This appointment does not belong to the selected patient',
        403
      );
    }

    if (
      String(
        appointment.doctor_id
      ) !==
      String(doctorId)
    ) {
      throw createServiceError(
        'You can only request access during your own patient consultation',
        403
      );
    }

    if (
      appointment.status !==
      'in_progress'
    ) {
      throw createServiceError(
        'Temporary consent access is only available during an active consultation',
        409
      );
    }

    return {
      patient,
      appointment,
      doctor,
      doctorId
    };
  };

/**
 * Returns normalized patient locked categories.
 *
 * @param {string} patientId
 * @returns {Promise<Array<string>>}
 */
const getLockedCategories =
  async (
    patientId
  ) => {
    const settings =
      await consentRepository
        .getConsentSettings(
          patientId
        );

    return Array.isArray(
      settings.locked_categories
    )
      ? settings.locked_categories
      : [];
  };

/* =========================================================
   PATIENT PRIVACY SETTINGS
========================================================= */

/**
 * Retrieves privacy settings for the authenticated
 * patient's own profile.
 *
 * @param {string} patientId
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const getPatientConsentSettings =
  async (
    patientId,
    requestingUser
  ) => {
    await ensurePatientOwnsConsentSettings(
      patientId,
      requestingUser
    );

    return await consentRepository
      .getConsentSettings(
        patientId
      );
  };

/**
 * Updates privacy settings for the authenticated
 * patient's own profile.
 *
 * @param {string} patientId
 * @param {Array<string>} lockedCategories
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const updatePatientConsentSettings =
  async (
    patientId,
    lockedCategories,
    requestingUser
  ) => {
    await ensurePatientOwnsConsentSettings(
      patientId,
      requestingUser
    );

    if (
      !Array.isArray(
        lockedCategories
      )
    ) {
      throw createServiceError(
        'lockedCategories must be an array',
        400
      );
    }

    const normalizedCategories =
      [
        ...new Set(
          lockedCategories
            .filter(
              (category) =>
                typeof category ===
                'string'
            )
            .map(
              (category) =>
                category.trim()
            )
            .filter(Boolean)
        )
      ];

    return await consentRepository
      .upsertConsentSettings(
        patientId,
        normalizedCategories
      );
  };

/* =========================================================
   REQUEST CONSENT OTP
========================================================= */

/**
 * Requests temporary access to a patient's protected
 * medical information.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const requestConsentAccessOtp =
  async (
    patientId,
    appointmentId,
    requestingUser
  ) => {
    const {
      patient,
      doctorId
    } =
      await validateDoctorConsultationContext(
        patientId,
        appointmentId,
        requestingUser
      );

    const lockedCategories =
      await getLockedCategories(
        patientId
      );

    if (
      lockedCategories.length ===
      0
    ) {
      throw createServiceError(
        'This patient has no protected medical categories requiring temporary consent',
        409
      );
    }

    const existingGrant =
      await consentRepository
        .getActiveConsentAccessGrant(
          patientId,
          doctorId,
          appointmentId
        );

    if (existingGrant) {
      return {
        alreadyGranted: true,

        lockedCategories,

        grantedCategories:
          existingGrant
            .granted_categories ||
          [],

        expiresAt:
          existingGrant
            .expires_at
      };
    }

    if (
      !patient.user_id ||
      !patient.email
    ) {
      throw createServiceError(
        'This patient does not have a registered Care4U email. OTP consent access is unavailable for this patient.',
        409
      );
    }

    if (
      patient.is_verified !==
      true
    ) {
      throw createServiceError(
        'The patient email has not been verified. OTP consent access cannot be used.',
        409
      );
    }

    const otpCode =
      generateOtp();

    const otpHash =
      await bcrypt.hash(
        otpCode,
        12
      );

    const expiresAt =
      getOtpExpiry(
        OTP_EXPIRY_MINUTES
      );

    await consentRepository
      .invalidateActiveAccessRequests(
        patientId,
        doctorId,
        appointmentId
      );

    const request =
      await consentRepository
        .createConsentAccessRequest({
          patientId,
          doctorId,
          appointmentId,

          requestedCategories:
            lockedCategories,

          otpHash,
          expiresAt
        });

    const emailResult =
      await sendConsentAccessOtpEmail(
        patient.email,
        patient.full_name,
        otpCode
      );

    if (
      !emailResult.success
    ) {
      await consentRepository
        .invalidateConsentAccessRequest(
          request.id
        );

      console.error('[ConsentAccess] Patient consent code email delivery failed.');

      throw createServiceError(
        'Failed to send the patient consent access code',
        502
      );
    }

    return {
      alreadyGranted: false,

      requestId:
        request.id,

      lockedCategories:
        request
          .requested_categories,

      expiresAt:
        request
          .expires_at,

      delivery:
        'email'
    };
  };

/* =========================================================
   VERIFY CONSENT OTP
========================================================= */

/**
 * Verifies the patient's consent OTP and grants the
 * authenticated doctor temporary access.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @param {string} otpCode
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const verifyConsentAccessOtp =
  async (
    patientId,
    appointmentId,
    otpCode,
    requestingUser
  ) => {
    const {
      doctorId
    } =
      await validateDoctorConsultationContext(
        patientId,
        appointmentId,
        requestingUser
      );

    const normalizedOtp =
      String(
        otpCode ||
        ''
      ).trim();

    if (
      !/^\d{6}$/.test(
        normalizedOtp
      )
    ) {
      throw createServiceError(
        'A valid 6-digit consent code is required',
        400
      );
    }

    const request =
      await consentRepository
        .getActiveConsentAccessRequest(
          patientId,
          doctorId,
          appointmentId
        );

    if (!request) {
      throw createServiceError(
        'No active consent code was found. Request a new code and try again.',
        400
      );
    }

    if (
      request.attempt_count >=
      MAX_OTP_ATTEMPTS
    ) {
      await consentRepository
        .invalidateConsentAccessRequest(
          request.id
        );

      throw createServiceError(
        'Too many invalid consent code attempts. Request a new code.',
        429
      );
    }

    const isMatch =
      await bcrypt.compare(
        normalizedOtp,
        request.otp_hash
      );

    if (!isMatch) {
      const updatedRequest =
        await consentRepository
          .incrementConsentAccessAttempt(
            request.id
          );

      const attemptCount =
        updatedRequest
          ?.attempt_count ||
        request.attempt_count +
          1;

      if (
        attemptCount >=
        MAX_OTP_ATTEMPTS
      ) {
        await consentRepository
          .invalidateConsentAccessRequest(
            request.id
          );

        throw createServiceError(
          'Too many invalid consent code attempts. Request a new code.',
          429
        );
      }

      const attemptsRemaining =
        MAX_OTP_ATTEMPTS -
        attemptCount;

      throw createServiceError(
        `Invalid consent code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
        400
      );
    }

    const usedRequest =
      await consentRepository
        .markConsentAccessRequestUsed(
          request.id
        );

    if (!usedRequest) {
      throw createServiceError(
        'This consent code is no longer available. Request a new code.',
        409
      );
    }

    await consentRepository
      .revokeActiveConsentAccessGrants(
        patientId,
        doctorId,
        appointmentId
      );

    const grantExpiresAt =
      new Date();

    grantExpiresAt.setMinutes(
      grantExpiresAt.getMinutes() +
      ACCESS_GRANT_MINUTES
    );

    const grant =
      await consentRepository
        .createConsentAccessGrant({
          patientId,
          doctorId,
          appointmentId,

          requestId:
            request.id,

          grantedCategories:
            request
              .requested_categories ||
            [],

          expiresAt:
            grantExpiresAt
        });

    return {
      granted: true,

      grantedCategories:
        grant
          .granted_categories,

      grantedAt:
        grant
          .granted_at,

      expiresAt:
        grant
          .expires_at
    };
  };

/* =========================================================
   ACCESS STATUS
========================================================= */

/**
 * Returns the current temporary consent-access state.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @param {Object} requestingUser
 * @returns {Promise<Object>}
 */
const getConsentAccessStatus =
  async (
    patientId,
    appointmentId,
    requestingUser
  ) => {
    const {
      doctorId
    } =
      await validateDoctorConsultationContext(
        patientId,
        appointmentId,
        requestingUser
      );

    const lockedCategories =
      await getLockedCategories(
        patientId
      );

    if (
      lockedCategories.length ===
      0
    ) {
      return {
        hasLockedCategories:
          false,

        lockedCategories:
          [],

        hasActiveGrant:
          false,

        grantedCategories:
          [],

        expiresAt:
          null
      };
    }

    const grant =
      await consentRepository
        .getActiveConsentAccessGrant(
          patientId,
          doctorId,
          appointmentId
        );

    return {
      hasLockedCategories:
        true,

      lockedCategories,

      hasActiveGrant:
        Boolean(grant),

      grantedCategories:
        grant
          ?.granted_categories ||
        [],

      expiresAt:
        grant
          ?.expires_at ||
        null
    };
  };

/* =========================================================
   INTERNAL ACCESS CHECK
========================================================= */

/**
 * Checks whether the authenticated doctor currently has
 * temporary access to a protected category.
 *
 * @param {string} patientId
 * @param {string} appointmentId
 * @param {Object} requestingUser
 * @param {string} category
 * @returns {Promise<boolean>}
 */
const hasTemporaryCategoryAccess =
  async (
    patientId,
    appointmentId,
    requestingUser,
    category
  ) => {
    if (
      !requestingUser ||
      requestingUser.role
        ?.toLowerCase() !==
        'doctor' ||
      !requestingUser.id ||
      !appointmentId ||
      !category
    ) {
      return false;
    }

    const doctor =
      await doctorRepository
        .getDoctorByUserId(
          requestingUser.id
        );

    if (!doctor) {
      return false;
    }

    const grant =
      await consentRepository
        .getActiveConsentAccessGrant(
          patientId,
          doctor.id,
          appointmentId
        );

    if (!grant) {
      return false;
    }

    const grantedCategories =
      (
        grant.granted_categories ||
        []
      ).map(
        (item) =>
          String(item)
            .trim()
            .toLowerCase()
      );

    return grantedCategories.includes(
      String(category)
        .trim()
        .toLowerCase()
    );
  };

module.exports = {
  getPatientConsentSettings,
  updatePatientConsentSettings,

  requestConsentAccessOtp,
  verifyConsentAccessOtp,
  getConsentAccessStatus,
  hasTemporaryCategoryAccess
};
