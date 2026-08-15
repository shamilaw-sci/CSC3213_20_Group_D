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

module.exports = {
  logEmergencyAlert,
  logEmergencyAccess
};