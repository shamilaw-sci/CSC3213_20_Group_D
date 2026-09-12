/**
 * @file    hospital.repository.js
 * @module  Hospital
 * @desc    Database queries for hospital profiles and hospital
 *          staff account lookups.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Retrieves a hospital profile using the linked user account ID.
 *
 * @param {string} userId - UUID of the hospital staff user
 * @returns {Promise<Object|null>} Hospital profile or null
 */
const getHospitalByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
        id,
        user_id,
        name,
        type,
        location,
        departments,
        is_verified,
        is_active,
        created_at
     FROM hospitals
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Retrieves a hospital profile using its hospital ID.
 *
 * @param {string} hospitalId - UUID of the hospital profile
 * @returns {Promise<Object|null>} Hospital profile or null
 */
const getHospitalById = async (hospitalId) => {
  const result = await pool.query(
    `SELECT
        id,
        user_id,
        name,
        type,
        location,
        departments,
        is_verified,
        is_active,
        created_at
     FROM hospitals
     WHERE id = $1`,
    [hospitalId]
  );

  return result.rows[0] || null;
};

module.exports = {
  getHospitalByUserId,
  getHospitalById
};