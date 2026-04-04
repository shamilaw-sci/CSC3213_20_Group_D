/**
 * @file patient.repository.js
 * @module Patient
 * @desc Database query functions for the Patient module.
 *       All direct SQL interactions for patient data live here.
 * @author Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Fetches a patient record by their patient table ID,
 * joined with the users table for full profile data.
 * @param {string} id - UUID of the patient (patients.id)
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientById(id) {
  const result = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.nic,
      p.uhi,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.emergency_contact_relationship,
      p.qr_code_id,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Fetches a patient record by their linked user ID.
 * @param {string} userId - UUID from the users table (users.id)
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientByUserId(userId) {
  const result = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.nic,
      p.uhi,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.emergency_contact_relationship,
      p.qr_code_id,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Updates editable fields on a patient record.
 * Only the fields passed in `data` will be updated.
 * @param {string} id - UUID of the patient (patients.id)
 * @param {Object} data - Fields to update
 * @param {string} [data.blood_group]
 * @param {string} [data.emergency_contact_name]
 * @param {string} [data.emergency_contact_phone]
 * @param {string} [data.emergency_contact_relationship]
 * @returns {Promise<Object|null>} Updated patient row or null
 */
async function updatePatient(id, data) {
  const {
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
  } = data;

  const result = await pool.query(
    `UPDATE patients
    SET
      blood_group = COALESCE($1, blood_group),
      emergency_contact_name = COALESCE($2, emergency_contact_name),
      emergency_contact_phone = COALESCE($3, emergency_contact_phone),
      emergency_contact_relationship = COALESCE($4, emergency_contact_relationship)
    WHERE id = $5
    RETURNING *`,
    [
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      id,
    ]
  );
  return result.rows[0] || null;
}

module.exports = {
  getPatientById,
  getPatientByUserId,
  updatePatient,
};