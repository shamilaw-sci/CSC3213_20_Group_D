/**
 * @file    doctor.repository.js
 * @module  Doctor
 * @desc    Database queries for the Doctor module.
 *          Handles all direct interactions with the doctors table.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

/**
 * Get a doctor by their doctor ID.
 * @param {string} id - UUID of the doctor
 * @returns {Promise<Object|null>} Doctor object or null
 */
const getDoctorById = async (id) => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone, u.role
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Get a doctor by their user ID.
 * @param {string} userId - UUID from the users table
 * @returns {Promise<Object|null>} Doctor object or null
 */
const getDoctorByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone, u.role
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Update a doctor's profile fields.
 * @param {string} id   - UUID of the doctor
 * @param {Object} data - Fields to update
 * @returns {Promise<Object|null>} Updated doctor object or null
 */
const updateDoctor = async (id, data) => {
  const { specialization, qualifications, years_experience, hospital_name } = data;
  const result = await pool.query(
    `UPDATE doctors
     SET specialization   = COALESCE($1, specialization),
         qualifications   = COALESCE($2, qualifications),
         years_experience = COALESCE($3, years_experience),
         hospital_name    = COALESCE($4, hospital_name),
         updated_at       = NOW()
     WHERE id = $5
     RETURNING *`,
    [specialization, qualifications, years_experience, hospital_name, id]
  );
  return result.rows[0] || null;
};

/**
 * Get all verified doctors (used by patients when booking appointments).
 * @returns {Promise<Array>} Array of verified doctor objects
 */
const getAllDoctors = async () => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.is_verified = true
     ORDER BY d.created_at DESC`
  );
  return result.rows;
};

module.exports = {
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  getAllDoctors,
};