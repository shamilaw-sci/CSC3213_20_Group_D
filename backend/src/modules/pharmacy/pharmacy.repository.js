/**
 * @file    pharmacy.repository.js
 * @module  Pharmacy
 * @desc    Database queries for pharmacy registration,
 *          verification, and profile management.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new pharmacy record in the database.
 * @param {string} userId        - UUID of the linked user account
 * @param {string} name          - Pharmacy name
 * @param {string} licenseNumber - Official pharmacy license number
 * @param {string} address       - Physical address
 * @param {string} phone         - Contact phone number
 * @returns {Promise<Object>} The newly created pharmacy row
 */
const createPharmacy = async (userId, name, licenseNumber, address, phone) => {
  const result = await pool.query(
    `INSERT INTO pharmacies (user_id, name, license_number, address, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, licenseNumber, address, phone]
  );
  return result.rows[0];
};

/**
 * Finds a pharmacy by its ID.
 * @param {string} id - UUID of the pharmacy
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM pharmacies WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Finds a pharmacy by its linked user ID.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM pharmacies WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Finds a pharmacy by its license number.
 * Used to check for duplicate registrations.
 * @param {string} licenseNumber - License number to check
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyByLicense = async (licenseNumber) => {
  const result = await pool.query(
    `SELECT * FROM pharmacies WHERE license_number = $1`,
    [licenseNumber]
  );
  return result.rows[0] || null;
};

/**
 * Approves a pharmacy by setting is_verified to true.
 * @param {string} id - UUID of the pharmacy
 * @returns {Promise<Object|null>} Updated pharmacy row or null
 */
const approvePharmacy = async (id) => {
  const result = await pool.query(
    `UPDATE pharmacies
     SET is_verified = true, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createPharmacy,
  getPharmacyById,
  getPharmacyByUserId,
  getPharmacyByLicense,
  approvePharmacy,
};