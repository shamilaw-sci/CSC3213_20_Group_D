/**
 * @file    pharmacy.service.js
 * @module  Pharmacy
 * @desc    Business logic for pharmacy registration,
 *          approval, and profile retrieval.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const pharmacyRepository = require('./pharmacy.repository');
const { pool } = require('../../config/db');
const bcrypt = require('bcrypt');

/**
 * Registers a new pharmacy by creating a user account
 * and a linked pharmacy record.
 * @param {string} email         - Pharmacist email
 * @param {string} password      - Pharmacist password (plain text — will be hashed)
 * @param {string} phone         - Contact phone number
 * @param {string} name          - Pharmacy name
 * @param {string} licenseNumber - Official pharmacy license number
 * @param {string} address       - Physical address
 * @returns {Promise<Object>} The created pharmacy object
 */
const registerPharmacy = async (email, password, phone, name, licenseNumber, address) => {
  // Step 1: Check if license number already exists
  const existingLicense = await pharmacyRepository.getPharmacyByLicense(licenseNumber);
  if (existingLicense) {
    const error = new Error('A pharmacy with this license number already exists');
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Check if email already exists in users table
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Step 3: Hash the password
  const passwordHash = await bcrypt.hash(password, 12);

  // Step 4: Create a user account with role 'pharmacist'
  const userResult = await pool.query(
    `INSERT INTO users (email, phone, password_hash, role, is_verified, is_active)
     VALUES ($1, $2, $3, 'pharmacist', false, true)
     RETURNING id, email, role`,
    [email, phone, passwordHash]
  );
  const newUser = userResult.rows[0];

  // Step 5: Create the pharmacy record linked to that user
  const pharmacy = await pharmacyRepository.createPharmacy(
    newUser.id,
    name,
    licenseNumber,
    address,
    phone
  );

  return {
    user: newUser,
    pharmacy,
  };
};

/**
 * Retrieves a pharmacy profile by its ID.
 * @param {string} id - UUID of the pharmacy
 * @returns {Promise<Object>} Pharmacy object
 */
const getPharmacyById = async (id) => {
  const pharmacy = await pharmacyRepository.getPharmacyById(id);
  if (!pharmacy) {
    const error = new Error('Pharmacy not found');
    error.statusCode = 404;
    throw error;
  }
  return pharmacy;
};

/**
 * Approves a pharmacy account — only callable by admin.
 * @param {string} id - UUID of the pharmacy to approve
 * @returns {Promise<Object>} Updated pharmacy object
 */
const approvePharmacy = async (id) => {
  const pharmacy = await pharmacyRepository.getPharmacyById(id);
  if (!pharmacy) {
    const error = new Error('Pharmacy not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await pharmacyRepository.approvePharmacy(id);
  return updated;
};

/**
 * Gets dashboard statistics for a pharmacy.
 * @param {string} pharmacyId - UUID of the pharmacy
 * @returns {Promise<Object>} Dashboard stats and recent prescriptions
 */
const getPharmacyDashboard = async (pharmacyId) => {
  const pharmacy = await pharmacyRepository.getPharmacyById(pharmacyId);
  if (!pharmacy) {
    const error = new Error('Pharmacy not found');
    error.statusCode = 404;
    throw error;
  }

  const stats = await pharmacyRepository.getPharmacyDashboardStats(pharmacyId);

  return {
    pharmacy,
    stats,
  };
};

module.exports = {
  registerPharmacy,
  getPharmacyById,
  approvePharmacy,
  getPharmacyDashboard,
};