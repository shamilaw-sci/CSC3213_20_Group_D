/**
 * @file    emergency.service.js
 * @module  Emergency
 * @desc    Business logic for emergency SOS alerts and access auditing.
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

/**
 * Validates and logs a Break-Glass emergency access event.
 * @param {string} patientId - UUID of the patient being accessed
 * @param {string} accessedBy - UUID of the user accessing the record
 * @param {string} userRole - Role of the accessing user
 * @param {string} reason - The stated reason for emergency access
 * @returns {Promise<Object>} The created audit log record
 */
const logEmergencyAccess = async (patientId, accessedBy, userRole, reason) => {
  if (!patientId || !accessedBy || !userRole || !reason) {
    const error = new Error('Patient ID, accessor ID, role, and reason are required to log emergency access');
    error.statusCode = 400;
    throw error;
  }

  // Pass to repository to save to database
  return await emergencyRepository.logEmergencyAccess(patientId, accessedBy, userRole, reason);
};

module.exports = {
  triggerSosAlert,
  logEmergencyAccess
};