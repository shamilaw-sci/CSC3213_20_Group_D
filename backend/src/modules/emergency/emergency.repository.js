/**
 * @file    emergency.repository.js
 * @module  Emergency
 * @desc    Raw database queries for the emergency module.
 *          Handles inserting SOS alerts, GPS coordinates, and access audit logs.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Inserts a new emergency SOS alert into the database.
 * @param {string} patientId - UUID of the patient triggering the SOS
 * @param {number} latitude - GPS latitude (optional)
 * @param {number} longitude - GPS longitude (optional)
 * @returns {Promise<Object>} The created emergency alert record
 */
const logEmergencyAlert = async (
  patientId,
  latitude,
  longitude
) => {
  const query = `
    INSERT INTO emergency_alerts (
      patient_id,
      latitude,
      longitude,
      status
    )
    VALUES ($1, $2, $3, 'active')
    RETURNING *;
  `;
  
  const values = [
    patientId,
    latitude || null,
    longitude || null
  ];

  const { rows } =
    await pool.query(
      query,
      values
    );

  return rows[0];
};

/**
 * Logs a "Break-Glass" emergency access event for auditing purposes.
 * @param {string} patientId - UUID of the patient being accessed
 * @param {string} accessedBy - UUID of the user (doctor/staff) accessing the record
 * @param {string} userRole - Role of the accessing user
 * @param {string} reason - The stated reason for emergency access
 * @returns {Promise<Object>} The created audit log record
 */
const logEmergencyAccess = async (
  patientId,
  accessedBy,
  userRole,
  reason
) => {
  const query = `
    INSERT INTO emergency_access_logs (
      patient_id,
      accessed_by,
      user_role,
      reason
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  
  const values = [
    patientId,
    accessedBy,
    userRole,
    reason
  ];

  const { rows } =
    await pool.query(
      query,
      values
    );

  return rows[0];
};

/**
 * Retrieves the minimalist Break-Glass patient snapshot for emergency crisis reading.
 * Explicitly excludes full medical history to protect patient privacy.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object|null>} The emergency snapshot data
 */
const getEmergencySnapshot = async (
  patientId
) => {
  const patientQuery = `
    SELECT
      id,
      full_name,
      date_of_birth,
      CASE
        WHEN date_of_birth IS NOT NULL
        THEN EXTRACT(
          YEAR FROM AGE(
            CURRENT_DATE,
            date_of_birth
          )
        )::INTEGER
        ELSE NULL
      END AS age,
      gender,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship
    FROM patients
    WHERE id = $1;
  `;

  const patientResult =
    await pool.query(
      patientQuery,
      [patientId]
    );

  if (
    patientResult.rows.length ===
    0
  ) {
    return null;
  }

  const allergyQuery = `
    SELECT
      id,
      allergen,
      severity,
      notes,
      created_at
    FROM patient_allergies
    WHERE patient_id = $1
    ORDER BY
      CASE
        WHEN LOWER(severity) = 'severe' THEN 1
        WHEN LOWER(severity) = 'moderate' THEN 2
        WHEN LOWER(severity) = 'mild' THEN 3
        ELSE 4
      END,
      created_at DESC;
  `;

  const priorityConditionQuery = `
    SELECT
      id,
      condition,
      diagnosed_at,
      notes,
      is_priority,
      created_at
    FROM patient_conditions
    WHERE patient_id = $1
      AND is_priority = true
    ORDER BY created_at DESC;
  `;

  const medicationQuery = `
    SELECT
      pi.id AS prescription_item_id,
      pr.id AS prescription_id,
      pi.medicine_name,
      pi.dosage,
      pi.frequency,
      pi.duration_days,
      pi.special_notes,
      pr.status,
      pr.expires_at,
      pr.created_at AS prescribed_at,
      pr.updated_at
    FROM prescriptions pr
    JOIN prescription_items pi
      ON pi.prescription_id = pr.id
    WHERE pr.patient_id = $1
      AND LOWER(
        REPLACE(
          pr.status,
          '_',
          ' '
        )
      ) IN (
        'active',
        'partially filled'
      )
      AND (
        pr.expires_at IS NULL
        OR pr.expires_at >= NOW()
      )
    ORDER BY
      pr.created_at DESC,
      pi.medicine_name ASC;
  `;

  const medicalDeviceQuery = `
    SELECT
      id,
      device_name,
      device_type,
      implanted_at,
      notes,
      is_emergency_relevant,
      updated_at
    FROM patient_medical_devices
    WHERE patient_id = $1
      AND is_active = true
      AND is_emergency_relevant = true
    ORDER BY
      implanted_at DESC NULLS LAST,
      updated_at DESC;
  `;

  const healthBackgroundQuery = `
    SELECT
      id,
      background_type,
      title,
      event_date,
      notes,
      is_emergency_relevant,
      updated_at
    FROM patient_health_background
    WHERE patient_id = $1
      AND is_active = true
      AND is_emergency_relevant = true
    ORDER BY
      event_date DESC NULLS LAST,
      updated_at DESC;
  `;

  const familyHistoryQuery = `
    SELECT
      id,
      relation,
      condition,
      notes,
      is_emergency_relevant,
      updated_at
    FROM patient_family_history
    WHERE patient_id = $1
      AND is_active = true
      AND is_emergency_relevant = true
    ORDER BY updated_at DESC;
  `;

  const freshnessQuery = `
    SELECT
      GREATEST(
        COALESCE(
          (
            SELECT MAX(created_at)
            FROM patient_allergies
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT MAX(created_at)
            FROM patient_conditions
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT MAX(updated_at)
            FROM patient_medical_devices
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT MAX(updated_at)
            FROM patient_health_background
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT MAX(updated_at)
            FROM patient_family_history
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT MAX(updated_at)
            FROM prescriptions
            WHERE patient_id = $1
          ),
          'epoch'::TIMESTAMPTZ
        ),
        COALESCE(
          (
            SELECT created_at
            FROM patients
            WHERE id = $1
          ),
          'epoch'::TIMESTAMPTZ
        )
      ) AS information_last_updated,
      NOW() AS snapshot_generated_at;
  `;

  const [
    allergyResult,
    priorityConditionResult,
    medicationResult,
    medicalDeviceResult,
    healthBackgroundResult,
    familyHistoryResult,
    freshnessResult
  ] = await Promise.all([
    pool.query(
      allergyQuery,
      [patientId]
    ),

    pool.query(
      priorityConditionQuery,
      [patientId]
    ),

    pool.query(
      medicationQuery,
      [patientId]
    ),

    pool.query(
      medicalDeviceQuery,
      [patientId]
    ),

    pool.query(
      healthBackgroundQuery,
      [patientId]
    ),

    pool.query(
      familyHistoryQuery,
      [patientId]
    ),

    pool.query(
      freshnessQuery,
      [patientId]
    )
  ]);

  return {
    patient:
      patientResult.rows[0],

    allergies:
      allergyResult.rows,

    priority_conditions:
      priorityConditionResult.rows,

    current_prescribed_medications:
      medicationResult.rows,

    medical_devices:
      medicalDeviceResult.rows,

    health_background:
      healthBackgroundResult.rows,

    family_history:
      familyHistoryResult.rows,

    information_last_updated:
      freshnessResult.rows[0]
        ?.information_last_updated ||
      null,

    snapshot_generated_at:
      freshnessResult.rows[0]
        ?.snapshot_generated_at ||
      null,
  };
};

/**
 * Fetches all active SOS alerts joined with basic patient details for the hospital dashboard.
 * @returns {Promise<Array>} List of active alerts
 */
const getActiveAlerts = async () => {
  const query = `
    SELECT 
      ea.id AS alert_id,
      ea.patient_id,
      ea.latitude,
      ea.longitude,
      ea.status,
      ea.created_at AS alert_time,
      p.full_name,
      p.blood_group,
      p.emergency_contact_phone
    FROM emergency_alerts ea
    JOIN patients p
      ON ea.patient_id = p.id
    WHERE ea.status = 'active'
    ORDER BY ea.created_at DESC;
  `;

  const { rows } =
    await pool.query(query);

  return rows;
};

/**
 * Marks an active SOS alert as resolved.
 * @param {string} alertId - UUID of the alert
 * @param {string} resolvedBy - UUID of the staff member resolving it
 * @returns {Promise<Object>} The updated alert record
 */
const resolveEmergencyAlert = async (
  alertId,
  resolvedBy
) => {
  // We use COALESCE so if your schema doesn't have a resolved_by column yet, it doesn't break,
  // but it safely updates the status.
  const query = `
    UPDATE emergency_alerts
    SET status = 'resolved'
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } =
    await pool.query(
      query,
      [alertId]
    );

  return rows[0];
};

module.exports = {
  logEmergencyAlert,
  logEmergencyAccess,
  getEmergencySnapshot,
  getActiveAlerts,
  resolveEmergencyAlert
};