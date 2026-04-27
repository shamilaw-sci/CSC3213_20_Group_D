/**
 * @file    patient.service.js
 * @module  Services
 * @desc    Frontend service functions for the Patient module.
 *          Calls the Care4U backend patient API endpoints.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * Fetches a patient profile by patient UUID.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} The patient data object
 */
export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}`);
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Updates editable fields on a patient profile.
 * @param {string} patientId - UUID of the patient
 * @param {Object} data      - Fields to update (full_name, blood_group, etc.)
 * @returns {Promise<Object>} The updated patient data object
 */
export const updatePatientProfile = async (patientId, data) => {
  const response = await api.put(`/api/patients/${patientId}`, data);
  return response.data.data;   // unwrap { success, message, data }
};