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

/**
 * Gets all test requests for a laboratory.
 * @param {string} laboratoryId - UUID of the laboratory
 * @returns {Promise<Array>} List of test requests
 */
const getLabRequestsByLaboratory = async (laboratoryId) => {
  const laboratory = await laboratoryRepository.getLaboratoryById(laboratoryId);
  if (!laboratory) {
    const error = new Error('Laboratory not found');
    error.statusCode = 404;
    throw error;
  }
  return await laboratoryRepository.getLabRequestsByLaboratory(laboratoryId);
};

/**
 * Updates the status of a lab test request.
 * @param {string} id     - UUID of the request
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated request
 */
const updateLabRequestStatus = async (id, status) => {
  const VALID_STATUSES = ['pending', 'sample_collected', 'in_progress', 'completed', 'cancelled'];
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  const request = await laboratoryRepository.getLabRequestById(id);
  if (!request) {
    const error = new Error('Lab test request not found');
    error.statusCode = 404;
    throw error;
  }
  return await laboratoryRepository.updateLabRequestStatus(id, status);
};

/**
 * Uploads a lab report for a completed test request.
 * @param {string} labRequestId - UUID of the lab test request
 * @param {string} findings     - Text findings from the lab
 * @param {string} reportUrl    - URL of the uploaded report
 * @returns {Promise<Object>} The created lab report
 */
const uploadLabReport = async (labRequestId, findings, reportUrl) => {
  // Step 1: Get the lab request
  const request = await laboratoryRepository.getLabRequestById(labRequestId);
  if (!request) {
    const error = new Error('Lab test request not found');
    error.statusCode = 404;
    throw error;
  }

  // Step 2: Check if report already exists
  const existingReport = await laboratoryRepository.getLabReportByRequestId(labRequestId);
  if (existingReport) {
    const error = new Error('A report has already been uploaded for this request');
    error.statusCode = 400;
    throw error;
  }

  // Step 3: Create the report
  const report = await laboratoryRepository.createLabReport(
    labRequestId,
    request.laboratory_id,
    request.patient_id,
    reportUrl,
    findings
  );

  // Step 4: Update request status to completed
  await laboratoryRepository.updateLabRequestStatus(labRequestId, 'completed');

  return report;
};

/**
 * Gets all lab reports for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} List of lab reports
 */
const getLabReportsByPatient = async (patientId) => {
  return await laboratoryRepository.getLabReportsByPatient(patientId);
};

module.exports = {
  registerLaboratory,
  getLaboratoryById,
  approveLaboratory,
  getAllVerifiedLaboratories,
  getLabRequestsByLaboratory,
  updateLabRequestStatus,
  uploadLabReport,
  getLabReportsByPatient,
};