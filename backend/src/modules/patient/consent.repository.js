/**
 * @file    consent.repository.js
 * @module  Patient
 * @desc    Stores patient privacy settings, consent codes and temporary access records.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const {
  pool
} = require('../../config/db');



/**
 * FEATURE: Read privacy locks
 * LOGIC: Return the protected categories; use an empty list when no settings exist.
 */
const getConsentSettings = async (
  patientId,
  db = pool
) => {
  const result =
    await db.query(
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
 * FEATURE: Save privacy locks
 * LOGIC: Insert settings or update the existing row for this patient.
 */
const upsertConsentSettings = async (
  patientId,
  lockedCategories,
  db = pool
) => {
  const result =
    await db.query(
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



/**
 * FEATURE: Replace old consent codes
 * LOGIC: Make earlier unused codes invalid for the same doctor, patient and appointment.
 */
const invalidateActiveAccessRequests =
  async (
    patientId,
    doctorId,
    appointmentId,
  db = pool
) => {
    const result =
      await db.query(
        `UPDATE consent_access_requests
         SET
           invalidated_at = NOW()
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND used_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > clock_timestamp()
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
 * FEATURE: Store consent request
 * LOGIC: Save the hashed code, protected categories and expiry without storing the plain code.
 */
const createConsentAccessRequest =
  async ({
    patientId,
    doctorId,
    appointmentId,
    requestedCategories,
    otpHash,
    expiresAt
  },
  db = pool
) => {
    const result =
      await db.query(
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
 * FEATURE: Find usable consent code
 * LOGIC: Only return an unused, unexpired, non-invalidated request for this exact consultation.
 */
const getActiveConsentAccessRequest =
  async (
    patientId,
    doctorId,
    appointmentId,
  db = pool
) => {
    const result =
      await db.query(
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
           AND expires_at > clock_timestamp()
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
 * FEATURE: Count wrong consent codes
 * LOGIC: Increase failed attempts only while the code is still valid and below the limit.
 */
const incrementConsentAccessAttempt =
  async (
    requestId,
  db = pool
) => {
    const result =
      await db.query(
        `UPDATE consent_access_requests
         SET
           attempt_count =
             attempt_count + 1
         WHERE id = $1
           AND used_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > clock_timestamp()
           AND attempt_count < 5
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
 * FEATURE: Prevent code reuse
 * LOGIC: Mark the code used only if it is still valid and has attempts remaining.
 */
const markConsentAccessRequestUsed =
  async (
    requestId,
  db = pool
) => {
    const result =
      await db.query(
        `UPDATE consent_access_requests
         SET
           used_at = NOW()
         WHERE id = $1
           AND used_at IS NULL
           AND invalidated_at IS NULL
           AND expires_at > clock_timestamp()
           AND attempt_count < 5
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
 * FEATURE: Disable consent code
 * LOGIC: Prevent a failed or replaced request from being used.
 */
const invalidateConsentAccessRequest =
  async (
    requestId,
  db = pool
) => {
    const result =
      await db.query(
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



/**
 * FEATURE: Record temporary access
 * LOGIC: Store which doctor, patient, appointment and categories the permission applies to, with an expiry.
 */
const createConsentAccessGrant =
  async ({
    patientId,
    doctorId,
    appointmentId,
    requestId,
    grantedCategories,
    expiresAt
  },
  db = pool
) => {
    const result =
      await db.query(
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
 * FEATURE: Check temporary access
 * LOGIC: Return permission only if it belongs to this consultation and has not expired or been revoked.
 */
const getActiveConsentAccessGrant =
  async (
    patientId,
    doctorId,
    appointmentId,
  db = pool
) => {
    const result =
      await db.query(
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
           AND expires_at > clock_timestamp()
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
 * FEATURE: Replace existing permission
 * LOGIC: Revoke earlier access grants for the same doctor, patient and appointment.
 */
const revokeActiveConsentAccessGrants =
  async (
    patientId,
    doctorId,
    appointmentId,
  db = pool
) => {
    const result =
      await db.query(
        `UPDATE consent_access_grants
         SET
           revoked_at = NOW()
         WHERE patient_id = $1
           AND doctor_id = $2
           AND appointment_id = $3
           AND revoked_at IS NULL
           AND expires_at > clock_timestamp()
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
 * FEATURE: Handle simultaneous consent requests
 * LOGIC: Lock this patient row, perform related changes together, then commit or roll back as one operation.
 */
const withPatientTransaction = async (patientId, work) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const patient = await client.query('SELECT id FROM patients WHERE id = $1 FOR UPDATE', [patientId]);
    if (!patient.rows.length) {
      const error = new Error('Patient not found'); error.statusCode = 404; throw error;
    }
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  withPatientTransaction,
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
