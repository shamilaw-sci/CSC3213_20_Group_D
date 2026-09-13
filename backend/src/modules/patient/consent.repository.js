/**
 * @file    consent.repository.js
 * @module  Patient
 * @desc    Database queries for Patient Privacy & Consent Controls.
 *          Handles patient privacy settings, temporary OTP access
 *          requests, and short-lived doctor access grants.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const {
  pool
} = require('../../config/db');

/* =========================================================
   PATIENT CONSENT SETTINGS
========================================================= */

/**
 * Retrieves a patient's consent settings.
 *
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
const getConsentSettings = async (
  patientId
) => {
  const result =
    await pool.query(
      `SELECT
        locked_categories
       FROM consent_settings
       WHERE patient_id = $1`,
      [
        patientId
      ]
    );

  if (
    result.rows.length === 0
  ) {
    return {
      locked_categories: []
    };
  }

  return result.rows[0];
};

/**
 * Updates or creates a patient's consent settings.
 *
 * @param {string} patientId
 * @param {Array<string>} lockedCategories
 * @returns {Promise<Object>}
 */
const upsertConsentSettings = async (
  patientId,
  lockedCategories
) => {
  const result =
    await pool.query(
      `INSERT INTO consent_settings
        (
          patient_id,
          locked_categories,
          updated_at
        )
       VALUES
        (
          $1,
          $2,
          NOW()
        )
       ON CONFLICT (patient_id)
       DO UPDATE SET
         locked_categories =
           EXCLUDED.locked_categories,
         updated_at =
           NOW()
       RETURNING
         locked_categories`,
      [
        patientId,
        lockedCategories
      ]
    );

  return result.rows[0];
};

/* =========================================================
   CONSENT ACCESS REQUESTS
========================================================= */

/**
 * Invalidates any unused OTP requests for the same
 * doctor, patient, and appointment.
 *
 * A new OTP request should replace older pending OTPs.
 *
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} appointmentId
 * @returns {Promise<number>} Number of invalidated requests
 */
const invalidateActiveAccessRequests =
  async (
    patientId,
    doctorId,
    appointmentId
  ) => {
    const result =
      await pool.query(
        `UPDATE consent_access_requests
         SET
           invalidated_at = NOW()
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND used_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > NOW()
         RETURNING id`,
        [
          patientId,
          doctorId,
          appointmentId
        ]
      );

    return result.rowCount;
  };

/**
 * Creates a new OTP consent-access request.
 *
 * Only the hashed OTP is stored.
 *
 * @param {Object} requestData
 * @returns {Promise<Object>}
 */
const createConsentAccessRequest =
  async ({
    patientId,
    doctorId,
    appointmentId,
    requestedCategories,
    otpHash,
    expiresAt
  }) => {
    const result =
      await pool.query(
        `INSERT INTO consent_access_requests
          (
            patient_id,
            doctor_id,
            appointment_id,
            requested_categories,
            otp_hash,
            expires_at
          )
         VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
         RETURNING
           id,
           patient_id,
           doctor_id,
           appointment_id,
           requested_categories,
           expires_at,
           attempt_count,
           used_at,
           invalidated_at,
           created_at`,
        [
          patientId,
          doctorId,
          appointmentId,
          requestedCategories,
          otpHash,
          expiresAt
        ]
      );

    return result.rows[0];
  };

/**
 * Retrieves the latest currently usable OTP request
 * for a specific doctor/patient/appointment context.
 *
 * The OTP hash is intentionally returned because the
 * service layer needs it for bcrypt verification.
 *
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} appointmentId
 * @returns {Promise<Object|null>}
 */
const getActiveConsentAccessRequest =
  async (
    patientId,
    doctorId,
    appointmentId
  ) => {
    const result =
      await pool.query(
        `SELECT
          id,
          patient_id,
          doctor_id,
          appointment_id,
          requested_categories,
          otp_hash,
          expires_at,
          attempt_count,
          used_at,
          invalidated_at,
          created_at
         FROM consent_access_requests
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND used_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [
          patientId,
          doctorId,
          appointmentId
        ]
      );

    return (
      result.rows[0] ||
      null
    );
  };

/**
 * Increments the failed verification attempt count.
 *
 * @param {string} requestId
 * @returns {Promise<Object|null>}
 */
const incrementConsentAccessAttempt =
  async (
    requestId
  ) => {
    const result =
      await pool.query(
        `UPDATE consent_access_requests
         SET
           attempt_count =
             attempt_count + 1
         WHERE id = $1
         RETURNING
           id,
           attempt_count,
           expires_at,
           used_at,
           invalidated_at`,
        [
          requestId
        ]
      );

    return (
      result.rows[0] ||
      null
    );
  };

/**
 * Marks an OTP request as successfully used.
 *
 * @param {string} requestId
 * @returns {Promise<Object|null>}
 */
const markConsentAccessRequestUsed =
  async (
    requestId
  ) => {
    const result =
      await pool.query(
        `UPDATE consent_access_requests
         SET
           used_at = NOW()
         WHERE id = $1
           AND used_at IS NULL
           AND invalidated_at IS NULL
         RETURNING
           id,
           used_at`,
        [
          requestId
        ]
      );

    return (
      result.rows[0] ||
      null
    );
  };

/**
 * Invalidates a specific OTP request.
 *
 * Used when the maximum number of failed verification
 * attempts has been reached.
 *
 * @param {string} requestId
 * @returns {Promise<Object|null>}
 */
const invalidateConsentAccessRequest =
  async (
    requestId
  ) => {
    const result =
      await pool.query(
        `UPDATE consent_access_requests
         SET
           invalidated_at = NOW()
         WHERE id = $1
           AND used_at IS NULL
           AND invalidated_at IS NULL
         RETURNING
           id,
           invalidated_at`,
        [
          requestId
        ]
      );

    return (
      result.rows[0] ||
      null
    );
  };

/* =========================================================
   TEMPORARY CONSENT ACCESS GRANTS
========================================================= */

/**
 * Creates a temporary consent access grant after
 * successful OTP verification.
 *
 * @param {Object} grantData
 * @returns {Promise<Object>}
 */
const createConsentAccessGrant =
  async ({
    patientId,
    doctorId,
    appointmentId,
    requestId,
    grantedCategories,
    expiresAt
  }) => {
    const result =
      await pool.query(
        `INSERT INTO consent_access_grants
          (
            patient_id,
            doctor_id,
            appointment_id,
            request_id,
            granted_categories,
            expires_at
          )
         VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
         RETURNING
           id,
           patient_id,
           doctor_id,
           appointment_id,
           request_id,
           granted_categories,
           granted_at,
           expires_at,
           revoked_at,
           created_at`,
        [
          patientId,
          doctorId,
          appointmentId,
          requestId,
          grantedCategories,
          expiresAt
        ]
      );

    return result.rows[0];
  };

/**
 * Retrieves the latest active temporary access grant
 * for the doctor/patient/appointment combination.
 *
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} appointmentId
 * @returns {Promise<Object|null>}
 */
const getActiveConsentAccessGrant =
  async (
    patientId,
    doctorId,
    appointmentId
  ) => {
    const result =
      await pool.query(
        `SELECT
          id,
          patient_id,
          doctor_id,
          appointment_id,
          request_id,
          granted_categories,
          granted_at,
          expires_at,
          revoked_at,
          created_at
         FROM consent_access_grants
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND revoked_at IS NULL
           AND expires_at > NOW()
         ORDER BY granted_at DESC
         LIMIT 1`,
        [
          patientId,
          doctorId,
          appointmentId
        ]
      );

    return (
      result.rows[0] ||
      null
    );
  };

/**
 * Revokes active temporary access grants for the same
 * patient, doctor, and appointment.
 *
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} appointmentId
 * @returns {Promise<number>}
 */
const revokeActiveConsentAccessGrants =
  async (
    patientId,
    doctorId,
    appointmentId
  ) => {
    const result =
      await pool.query(
        `UPDATE consent_access_grants
         SET
           revoked_at = NOW()
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND revoked_at IS NULL
           AND expires_at > NOW()
         RETURNING id`,
        [
          patientId,
          doctorId,
          appointmentId
        ]
      );

    return result.rowCount;
  };

module.exports = {
  getConsentSettings,
  upsertConsentSettings,

  invalidateActiveAccessRequests,
  createConsentAccessRequest,
  getActiveConsentAccessRequest,
  incrementConsentAccessAttempt,
  markConsentAccessRequestUsed,
  invalidateConsentAccessRequest,

  createConsentAccessGrant,
  getActiveConsentAccessGrant,
  revokeActiveConsentAccessGrants
};