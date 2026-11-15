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

// Define allowed next states; completed and cancelled requests cannot be reopened here.
const VALID_STATUS_TRANSITIONS = {
  pending: ['sample_collected', 'cancelled'],
  sample_collected: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

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
const registerLaboratory = async (
  email,
  password,
  phone,
  name,
  licenseNumber,
  address,
  availableTests
) => {
  // Step 1: Check if license number already exists
  // Refuse duplicate laboratory license numbers before account creation.
  const existingLicense =
    await laboratoryRepository.getLaboratoryByLicense(
      licenseNumber
    );

  // Only the laboratory assigned to this test request can change its state.
  if (existingLicense) {
    const error = new Error(
      'A laboratory with this license number already exists'
    );
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Check if email already exists
  const existingUser = await pool.query(
    `SELECT id
     FROM users
     WHERE email = $1`,
    [email]
  );

  // A laboratory cannot finalize a test requested from another laboratory.
  if (existingUser.rows.length > 0) {
    const error = new Error(
      'An account with this email already exists'
    );
    error.statusCode = 400;
    throw error;
  }

  // Step 3: Hash the password
  // Hash the account password before storing it; the new staff account still requires approval.
  const passwordHash =
    await bcrypt.hash(password, 12);

  // Step 4: Create user account with the canonical laboratory role.
  // The account is created as pending so it appears in the
  // admin approval queue, matching the doctor/pharmacist flow.
  const userResult = await pool.query(
    `INSERT INTO users
       (
         email,
         phone,
         password_hash,
         role,
         is_verified,
         is_active,
         verification_status
       )
     VALUES
       (
         $1,
         $2,
         $3,
         'lab_technician',
         true,
         true,
         'pending'
       )
     RETURNING
       id,
       email,
       role,
       is_verified,
       is_active,
       verification_status`,
    [
      email,
      phone,
      passwordHash
    ]
  );

  const newUser =
    userResult.rows[0];

  // Step 5: Create the laboratory record
  // The login account and laboratory profile are created in separate database operations.
  const laboratory =
    await laboratoryRepository.createLaboratory(
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
  const laboratory =
    await laboratoryRepository.getLaboratoryById(id);

  if (!laboratory) {
    const error =
      new Error('Laboratory not found');

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
  const laboratory =
    await laboratoryRepository.getLaboratoryById(id);

  if (!laboratory) {
    const error =
      new Error('Laboratory not found');

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
  const laboratory =
    await laboratoryRepository.getLaboratoryById(
      laboratoryId
    );

  if (!laboratory) {
    const error =
      new Error('Laboratory not found');

    error.statusCode = 404;
    throw error;
  }

  return await laboratoryRepository.getLabRequestsByLaboratory(
    laboratoryId
  );
};

/**
 * Updates the status of a lab test request.
 * @param {string} id     - UUID of the request
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated request
 */
const updateLabRequestStatus = async (
  id,
  status,
  laboratoryId
) => {
  const VALID_STATUSES = [
    'pending',
    'sample_collected',
    'in_progress',
    'completed',
    'cancelled'
  ];

  // Reject unknown status values before checking which state changes are allowed.
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    );

    error.statusCode = 400;
    throw error;
  }

  const request =
    await laboratoryRepository.getLabRequestById(id);

  if (!request) {
    const error =
      new Error('Lab test request not found');

    error.statusCode = 404;
    throw error;
  }

  if (
    !laboratoryId ||
    String(request.laboratory_id) !== String(laboratoryId)
  ) {
    const error = new Error(
      'You cannot update a request assigned to another laboratory'
    );
    error.statusCode = 403;
    throw error;
  }

  // Reject invalid state jumps, such as pending directly to completed.
  if (!VALID_STATUS_TRANSITIONS[request.status]?.includes(status)) {
    const error = new Error(
      `Cannot change lab request status from ${request.status} to ${status}`
    );
    error.statusCode = 409;
    throw error;
  }

  return await laboratoryRepository.updateLabRequestStatus(
    id,
    status
  );
};

/**
 * Uploads a lab report for a completed test request.
 * Also sends email notifications to doctor and patient.
 * @param {string} labRequestId - UUID of the lab test request
 * @param {string} findings     - Text findings from the lab
 * @param {string} reportUrl    - URL of the uploaded report
 * @returns {Promise<Object>} The created lab report
 */
const uploadLabReport = async (
  labRequestId,
  findings,
  reportUrl,
  laboratoryId
) => {
  // Step 1: Get the lab request with patient and doctor info
  const request =
    await laboratoryRepository.getLabRequestById(
      labRequestId
    );

  if (!request) {
    const error =
      new Error('Lab test request not found');

    error.statusCode = 404;
    throw error;
  }


  if (
    !laboratoryId ||
    String(request.laboratory_id) !== String(laboratoryId)
  ) {
    const error = new Error(
      'You cannot upload a report for another laboratory'
    );
    error.statusCode = 403;
    throw error;
  }

  // Reports are accepted only for requests in an allowed late-stage status.
  if (!['in_progress', 'completed'].includes(request.status)) {
    const error = new Error(
      'A report can only be uploaded for a test that is in progress or completed'
    );
    error.statusCode = 409;
    throw error;
  }

  // Step 2: Check if report already exists
  // Check for a previous report before calling the transaction that checks again under a row lock.
  const existingReport =
    await laboratoryRepository.getLabReportByRequestId(
      labRequestId
    );

  if (existingReport) {
    const error = new Error(
      'A report has already been uploaded for this request'
    );

    error.statusCode = 400;
    throw error;
  }

  // Step 3: Get laboratory details
  const laboratory =
    await laboratoryRepository.getLaboratoryById(
      request.laboratory_id
    );

  // Step 4: Create the report
  // Save findings and an optional report URL; this endpoint does not upload a PDF file.
  const report =
    await laboratoryRepository.createLabReportAndCompleteRequest(
      labRequestId,
      request.laboratory_id,
      reportUrl,
      findings
  );

  // Email is attempted after saving; failures are logged and do not undo the finalized report.
  // Step 6: Send email notifications (non-blocking — don't fail if email fails)
  try {
    const {
      sendLabReportNotification
    } = require('../../utils/email');

    // Get patient email
    const { pool } =
      require('../../config/db');

    const patientResult =
      await pool.query(
        `SELECT
           u.email,
           p.full_name
         FROM patients p
         JOIN users u
           ON p.user_id = u.id
         WHERE p.id = $1`,
        [request.patient_id]
      );

    // Notify the patient email found through the patient account; no doctor email is sent in this block.
    if (
      patientResult.rows.length > 0
    ) {
      const patient =
        patientResult.rows[0];

      await sendLabReportNotification(
        patient.email,
        patient.full_name,
        request.test_type,
        laboratory.name,
        findings
      );
    }

  } catch (emailErr) {
    // Log but don't fail the request if email fails
    console.error(
      'Lab report notification email failed:',
      emailErr.message
    );
  }

  return report;
};

/**
 * Gets all lab reports for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} List of lab reports
 */
const getLabReportsByPatient = async (
  patientId
) => {
  return await laboratoryRepository.getLabReportsByPatient(
    patientId
  );
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
