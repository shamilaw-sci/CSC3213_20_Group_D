/**
 * @file    emergency.repository.js
 * @module  Emergency
 * @desc    Raw database queries for the emergency module.
 *          Handles inserting SOS alerts and GPS coordinates.
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

module.exports = {
  logEmergencyAlert
};