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

module.exports = {
  getPatientProfile,
};