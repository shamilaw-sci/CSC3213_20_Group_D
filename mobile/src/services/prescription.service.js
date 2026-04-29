/**
 * @file    prescription.service.js
 * @module  Services
 * @desc    API calls for prescription module on mobile.
 * @author  S/21/001
 */

import api from './api';

/**
 * Gets all prescriptions for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} List of prescriptions with items
 */
export const getPatientPrescriptions = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/prescriptions`);
  return response.data.data;
};

/**
 * Gets a single prescription by ID.
 * @param {string} id - UUID of the prescription
 * @returns {Promise<Object>} Prescription with items
 */
export const getPrescriptionById = async (id) => {
  const response = await api.get(`/api/prescriptions/${id}`);
  return response.data.data;
};