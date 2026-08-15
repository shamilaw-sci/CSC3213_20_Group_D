/**
 * @file    emergency.service.js
 * @module  Emergency
 * @desc    Business logic for emergency SOS alerts.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const emergencyRepository = require('./emergency.repository');

/**
 * Validates and triggers a new emergency SOS alert.
 * @param {string} patientId - UUID of the patient triggering the SOS
 * @param {number} latitude - GPS latitude (optional)
 * @param {number} longitude - GPS longitude (optional)
 * @returns {Promise<Object>} The created emergency alert record
 */
const triggerSosAlert = async (patientId, latitude, longitude) => {
  if (!patientId) {
    const error = new Error('Patient ID is required to trigger an SOS alert');
    error.statusCode = 400;
    throw error;
  }

  // Pass to repository to save to database
  return await emergencyRepository.logEmergencyAlert(patientId, latitude, longitude);
};

module.exports = {
  triggerSosAlert
};