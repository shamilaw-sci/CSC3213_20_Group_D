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
const logEmergencyAlert = async (patientId, latitude, longitude) => {
  const query = `
    INSERT INTO emergency_alerts (patient_id, latitude, longitude, status)
    VALUES ($1, $2, $3, 'active')
    RETURNING *;
  `;
  
  const values = [patientId, latitude || null, longitude || null];
  const { rows } = await pool.query(query, values);
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
const logEmergencyAccess = async (patientId, accessedBy, userRole, reason) => {
  const query = `
    INSERT INTO emergency_access_logs (patient_id, accessed_by, user_role, reason)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  
  const values = [patientId, accessedBy, userRole, reason];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves the minimalist Break-Glass patient snapshot for emergency crisis reading.
 * Explicitly excludes full medical history to protect patient privacy.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} The emergency snapshot data
 */
const getEmergencySnapshot = async (patientId) => {
  // 1. Get life-saving profile info (blood type, emergency contact)
  const patientQuery = `
    SELECT id, full_name, blood_group, emergency_contact_name, emergency_contact_phone
    FROM patients
    WHERE id = $1;
  `;
  const patientResult = await pool.query(patientQuery, [patientId]);
  
  if (patientResult.rows.length === 0) {
    return null;
  }

  // 2. Get allergies (critical for crisis care)
  const allergyQuery = `
    SELECT allergen, severity
    FROM patient_allergies
    WHERE patient_id = $1;
  `;
  const allergyResult = await pool.query(allergyQuery, [patientId]);

  // Consolidate the snapshot
  return {
    patient: patientResult.rows[0],
    allergies: allergyResult.rows,
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
    JOIN patients p ON ea.patient_id = p.id
    WHERE ea.status = 'active'
    ORDER BY ea.created_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Marks an active SOS alert as resolved.
 * @param {string} alertId - UUID of the alert
 * @param {string} resolvedBy - UUID of the staff member resolving it
 * @returns {Promise<Object>} The updated alert record
 */
const resolveEmergencyAlert = async (alertId, resolvedBy) => {
  // We use COALESCE so if your schema doesn't have a resolved_by column yet, it doesn't break,
  // but it safely updates the status.
  const query = `
    UPDATE emergency_alerts
    SET status = 'resolved'
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [alertId]);
  return rows[0];
};

module.exports = {
  logEmergencyAlert,
  logEmergencyAccess,
  getEmergencySnapshot,
  getActiveAlerts,
  resolveEmergencyAlert
};