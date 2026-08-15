/**
 * @file    laboratory.repository.js
 * @module  Laboratory
 * @desc    Database queries for laboratory registration,
 *          verification, and profile management.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new laboratory record in the database.
 * @param {string} userId        - UUID of the linked user account
 * @param {string} name          - Laboratory name
 * @param {string} licenseNumber - Official lab license number
 * @param {string} address       - Physical address
 * @param {string} phone         - Contact phone number
 * @param {Array}  availableTests - List of available test types
 * @returns {Promise<Object>} The newly created laboratory row
 */
const createLaboratory = async (userId, name, licenseNumber, address, phone, availableTests) => {
  const result = await pool.query(
    `INSERT INTO laboratories (user_id, name, license_number, address, phone, available_tests)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, licenseNumber, address, phone, availableTests]
  );
  return result.rows[0];
};

/**
 * Finds a laboratory by its ID.
 * @param {string} id - UUID of the laboratory
 * @returns {Promise<Object|null>} Laboratory row or null
 */
const getLaboratoryById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM laboratories WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finds a laboratory by its linked user ID.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object|null>} Laboratory row or null
 */
const getLaboratoryByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM laboratories WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Finds a laboratory by its license number.
 * @param {string} licenseNumber - License number to check
 * @returns {Promise<Object|null>} Laboratory row or null
 */
const getLaboratoryByLicense = async (licenseNumber) => {
  const result = await pool.query(
    `SELECT * FROM laboratories WHERE license_number = $1`,
    [licenseNumber]
  );
  return result.rows[0] || null;
};

/**
 * Approves a laboratory by setting is_verified to true.
 * @param {string} id - UUID of the laboratory
 * @returns {Promise<Object|null>} Updated laboratory row or null
 */
const approveLaboratory = async (id) => {
  const result = await pool.query(
    `UPDATE laboratories
     SET is_verified = true, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Gets all verified laboratories.
 * @returns {Promise<Array>} List of verified laboratories
 */
const getAllVerifiedLaboratories = async () => {
  const result = await pool.query(
    `SELECT * FROM laboratories WHERE is_verified = true AND is_active = true
     ORDER BY name ASC`
  );
  return result.rows;
};

module.exports = {
  createLaboratory,
  getLaboratoryById,
  getLaboratoryByUserId,
  getLaboratoryByLicense,
  approveLaboratory,
  getAllVerifiedLaboratories,
};