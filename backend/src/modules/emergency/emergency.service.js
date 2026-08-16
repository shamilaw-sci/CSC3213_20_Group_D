/**
 * @file    emergency.service.js
 * @module  Emergency
 * @desc    Business logic for emergency SOS alerts and access auditing.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const emergencyRepository = require('./emergency.repository');
const { sendEmergencySMS } = require('../../utils/sms.util');

/**
 * Validates and triggers a new emergency SOS alert.
 * Now includes automatic SMS dispatch to the emergency contact.
 */
const triggerSosAlert = async (patientId, latitude, longitude) => {
  if (!patientId) {
    const error = new Error('Patient ID is required to trigger an SOS alert');
    error.statusCode = 400;
    throw error;
  }

  // 1. Log the alert in the database so it appears on the Hospital Dashboard
  const alert = await emergencyRepository.logEmergencyAlert(patientId, latitude, longitude);

  // 2. Fetch the patient's profile to get their emergency contact info
  try {
    const snapshot = await emergencyRepository.getEmergencySnapshot(patientId);
    
    if (snapshot && snapshot.patient && snapshot.patient.emergency_contact_phone) {
      // 3. Dispatch the SMS (Using our Enterprise Mock Pattern)
      await sendEmergencySMS(
        snapshot.patient.emergency_contact_phone,
        snapshot.patient.full_name,
        latitude,
        longitude
      );
    } else {
      console.warn(`[SOS] Could not send SMS: No emergency contact found for patient ${patientId}`);
    }
  } catch (err) {
    console.error('[SOS] Error during SMS dispatch phase:', err.message);
    // We catch this error so the main SOS alert still succeeds even if SMS fails
  }

  return alert;
};

/**
 * Validates and logs a Break-Glass emergency access event.
 */
const logEmergencyAccess = async (patientId, accessedBy, userRole, reason) => {
  if (!patientId || !accessedBy || !userRole || !reason) {
    const error = new Error('Patient ID, accessor ID, role, and reason are required to log emergency access');
    error.statusCode = 400;
    throw error;
  }
  return await emergencyRepository.logEmergencyAccess(patientId, accessedBy, userRole, reason);
};

/**
 * Retrieves the minimalist Break-Glass patient snapshot.
 */
const getEmergencySnapshot = async (patientId) => {
  if (!patientId) {
    const error = new Error('Patient ID is required to retrieve the emergency snapshot');
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await emergencyRepository.getEmergencySnapshot(patientId);
  
  if (!snapshot) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return snapshot;
};

/**
 * Retrieves all active emergency alerts for the dashboard.
 */
const getActiveAlerts = async () => {
  return await emergencyRepository.getActiveAlerts();
};

/**
 * Resolves an active emergency alert.
 */
const resolveEmergencyAlert = async (alertId, resolvedBy) => {
  if (!alertId) {
    const error = new Error('Alert ID is required to resolve an emergency');
    error.statusCode = 400;
    throw error;
  }

  const updatedAlert = await emergencyRepository.resolveEmergencyAlert(alertId, resolvedBy);
  
  if (!updatedAlert) {
    const error = new Error('Emergency alert not found');
    error.statusCode = 404;
    throw error;
  }

  return updatedAlert;
};

module.exports = {
  triggerSosAlert,
  logEmergencyAccess,
  getEmergencySnapshot,
  getActiveAlerts,
  resolveEmergencyAlert
};