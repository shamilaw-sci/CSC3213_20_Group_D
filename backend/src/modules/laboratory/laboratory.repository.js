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

/**
 * Creates a new lab test request.
 * @param {string} laboratoryId  - UUID of the laboratory
 * @param {string} patientId     - UUID of the patient
 * @param {string} doctorId      - UUID of the requesting doctor
 * @param {string} appointmentId - UUID of the linked appointment
 * @param {string} testType      - Type of test requested
 * @param {string} priority      - normal or urgent
 * @param {string} notes         - Optional notes from doctor
 * @returns {Promise<Object>} The created lab test request row
 */
const createLabTestRequest = async (laboratoryId, patientId, doctorId, appointmentId, testType, priority, notes) => {
  const result = await pool.query(
    `INSERT INTO lab_test_requests
      (laboratory_id, patient_id, doctor_id, appointment_id, test_type, priority, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [laboratoryId, patientId, doctorId, appointmentId, testType, priority || 'normal', notes || null]
  );
  return result.rows[0];
};

/**
 * Gets all test requests for a laboratory.
 * @param {string} laboratoryId - UUID of the laboratory
 * @returns {Promise<Array>} List of test requests with patient info
 */
const getLabRequestsByLaboratory = async (laboratoryId) => {
  const result = await pool.query(
    `SELECT lr.*,
            p.full_name as patient_name,
            d.full_name as doctor_name
     FROM lab_test_requests lr
     LEFT JOIN patients p ON lr.patient_id = p.id
     LEFT JOIN doctors d ON lr.doctor_id = d.id
     WHERE lr.laboratory_id = $1
     ORDER BY 
       CASE WHEN lr.priority = 'urgent' THEN 0 ELSE 1 END,
       lr.created_at DESC`,
    [laboratoryId]
  );
  return result.rows;
};

/**
 * Gets a single lab test request by ID.
 * @param {string} id - UUID of the request
 * @returns {Promise<Object|null>} Lab test request or null
 */
const getLabRequestById = async (id) => {
  const result = await pool.query(
    `SELECT lr.*,
            p.full_name as patient_name,
            d.full_name as doctor_name
     FROM lab_test_requests lr
     LEFT JOIN patients p ON lr.patient_id = p.id
     LEFT JOIN doctors d ON lr.doctor_id = d.id
     WHERE lr.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Updates the status of a lab test request.
 * @param {string} id     - UUID of the request
 * @param {string} status - New status
 * @returns {Promise<Object|null>} Updated request or null
 */
const updateLabRequestStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE lab_test_requests
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createLaboratory,
  getLaboratoryById,
  getLaboratoryByUserId,
  getLaboratoryByLicense,
  approveLaboratory,
  getAllVerifiedLaboratories,
  createLabTestRequest,
  getLabRequestsByLaboratory,
  getLabRequestById,
  updateLabRequestStatus,
};