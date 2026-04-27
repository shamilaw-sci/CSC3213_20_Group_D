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
 * @throws {Error} If patient is not found
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
 * @throws {Error} If patient is not found
 */
const updatePatientProfile = async (id, data) => {
  // Step 1: Check the patient exists before trying to update
  const existing = await patientRepository.getPatientById(id);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Step 2: Only allow safe, editable fields through — never let
  // sensitive fields like user_id or qr_code_id be overwritten
  const allowedFields = {
    full_name:                      data.full_name,
    blood_group:                    data.blood_group,
    emergency_contact_name:         data.emergency_contact_name,
    emergency_contact_phone:        data.emergency_contact_phone,
    emergency_contact_relationship: data.emergency_contact_relationship,
  };

  // Step 3: Strip out any keys where the value is undefined
  // (fields the caller didn't send) so we don't overwrite with null
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
  );

  // Step 4: Perform the update
  const updated = await patientRepository.updatePatient(id, filteredData);
  return updated;
};

/**
 * Retrieves all medical records for a patient, newest first.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of medical record objects
 * @throws {Error} If patient is not found
 */
const getMedicalRecords = async (patientId) => {
  // First confirm the patient actually exists
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Returns empty array if patient exists but has no records yet — that is fine
  const records = await patientRepository.getMedicalRecords(patientId);
  return records;
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getMedicalRecords,
};