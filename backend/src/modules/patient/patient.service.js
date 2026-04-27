/**
 * @file    patient.service.js
 * @module  Patient
 * @desc    Business logic for patient profile management.
 *          Sits between the controller and the repository.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientRepository = require('./patient.repository');

/**
 * Retrieves a patient's full profile by their patient UUID.
 * @param {string} id - UUID of the patient (from patients table)
 * @returns {Promise<Object>} The patient profile object
 * @throws {Error} 404 if patient is not found
 */
const getPatientProfile = async (id) => {
  const patient = await patientRepository.getPatientById(id);

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return patient;
};

/**
 * Updates editable fields on a patient profile.
 * @param {string} id   - UUID of the patient record (from patients table)
 * @param {Object} data - Object containing fields to update
 * @returns {Promise<Object>} The updated patient record
 * @throws {Error} 404 if patient is not found
 */
const updatePatientProfile = async (id, data) => {
  const existing = await patientRepository.getPatientById(id);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = {
    full_name:                      data.full_name,
    blood_group:                    data.blood_group,
    emergency_contact_name:         data.emergency_contact_name,
    emergency_contact_phone:        data.emergency_contact_phone,
    emergency_contact_relationship: data.emergency_contact_relationship,
  };

  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
  );

  const updated = await patientRepository.updatePatient(id, filteredData);
  return updated;
};

/**
 * Retrieves all medical records for a patient, newest first.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of medical record objects
 * @throws {Error} 404 if patient is not found
 */
const getMedicalRecords = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const records = await patientRepository.getMedicalRecords(patientId);
  return records;
};

/**
 * Retrieves all allergies for a patient.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of allergy objects (empty array is valid)
 * @throws {Error} 404 if patient is not found
 */
const getAllergies = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const allergies = await patientRepository.getAllergies(patientId);
  return allergies;
};

/**
 * Adds a new allergy record for a patient.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @param {string} allergen  - Name of the allergen
 * @param {string} severity  - Severity: mild / moderate / severe
 * @param {string} notes     - Optional additional notes
 * @returns {Promise<Object>} The newly created allergy record
 * @throws {Error} 400 if allergen or severity is missing
 * @throws {Error} 400 if severity is not a valid value
 * @throws {Error} 404 if patient is not found
 */
const addAllergy = async (patientId, allergen, severity, notes) => {
  // Step 1: Validate required fields
  if (!allergen || !severity) {
    const error = new Error('allergen and severity are required');
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Validate severity is one of the accepted values
  const validSeverities = ['mild', 'moderate', 'severe'];
  if (!validSeverities.includes(severity.toLowerCase())) {
    const error = new Error('severity must be mild, moderate, or severe');
    error.statusCode = 400;
    throw error;
  }

  // Step 3: Confirm the patient exists
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Step 4: Insert the allergy record
  const allergy = await patientRepository.addAllergy(
    patientId,
    allergen,
    severity.toLowerCase(),
    notes
  );
  return allergy;
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getMedicalRecords,
  getAllergies,
  addAllergy,
};