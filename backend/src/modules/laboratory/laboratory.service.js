/**
 * @file    laboratory.service.js
 * @module  Laboratory
 * @desc    Business logic for laboratory registration,
 *          approval, and profile retrieval.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const laboratoryRepository = require('./laboratory.repository');
const { pool } = require('../../config/db');
const bcrypt = require('bcrypt');

/**
 * Registers a new laboratory by creating a user account
 * and a linked laboratory record.
 * @param {string} email          - Lab email
 * @param {string} password       - Lab password (plain text — will be hashed)
 * @param {string} phone          - Contact phone number
 * @param {string} name           - Laboratory name
 * @param {string} licenseNumber  - Official lab license number
 * @param {string} address        - Physical address
 * @param {Array}  availableTests - List of test types the lab offers
 * @returns {Promise<Object>} The created laboratory object
 */
const registerLaboratory = async (email, password, phone, name, licenseNumber, address, availableTests) => {
  // Step 1: Check if license number already exists
  const existingLicense = await laboratoryRepository.getLaboratoryByLicense(licenseNumber);
  if (existingLicense) {
    const error = new Error('A laboratory with this license number already exists');
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Check if email already exists
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

  // Step 4: Create user account with role 'lab_staff'
  const userResult = await pool.query(
    `INSERT INTO users (email, phone, password_hash, role, is_verified, is_active)
     VALUES ($1, $2, $3, 'lab_staff', false, true)
     RETURNING id, email, role`,
    [email, phone, passwordHash]
  );
  const newUser = userResult.rows[0];

  // Step 5: Create the laboratory record
  const laboratory = await laboratoryRepository.createLaboratory(
    newUser.id,
    name,
    licenseNumber,
    address,
    phone,
    availableTests || []
  );

  return {
    user: newUser,
    laboratory,
  };
};

/**
 * Retrieves a laboratory profile by its ID.
 * @param {string} id - UUID of the laboratory
 * @returns {Promise<Object>} Laboratory object
 */
const getLaboratoryById = async (id) => {
  const laboratory = await laboratoryRepository.getLaboratoryById(id);
  if (!laboratory) {
    const error = new Error('Laboratory not found');
    error.statusCode = 404;
    throw error;
  }
  return laboratory;
};

/**
 * Approves a laboratory account — only callable by admin.
 * @param {string} id - UUID of the laboratory to approve
 * @returns {Promise<Object>} Updated laboratory object
 */
const approveLaboratory = async (id) => {
  const laboratory = await laboratoryRepository.getLaboratoryById(id);
  if (!laboratory) {
    const error = new Error('Laboratory not found');
    error.statusCode = 404;
    throw error;
  }
  return await laboratoryRepository.approveLaboratory(id);
};

/**
 * Gets all verified laboratories.
 * @returns {Promise<Array>} List of verified laboratories
 */
const getAllVerifiedLaboratories = async () => {
  return await laboratoryRepository.getAllVerifiedLaboratories();
};

module.exports = {
  registerLaboratory,
  getLaboratoryById,
  approveLaboratory,
  getAllVerifiedLaboratories,
};