/**
 * @file    interaction.service.js
 * @module  Services
 * @desc    API calls for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

import api from './api';

/**
 * Checks a candidate medicine against a patient's allergies and active prescriptions.
 * @param {string} patientId - UUID of the patient
 * @param {string} medicineName - Full medicine name being prescribed
 * @returns {Promise<Array>} List of warning objects (empty if no conflicts)
 */
export const checkDrugInteractions = async (
  patientId,
  medicineName,
  appointmentId
) => {
  const response = await api.post('/api/interactions/check', {
    patientId,
    medicineName,
    appointmentId,
  });
  return response.data.data.warnings;
};
