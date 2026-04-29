/**
 * @file    patient.service.js
 * @module  Services
 * @desc    API calls for the Patient module - mobile.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import api from './api';

export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}`);
  return response.data.data;
};

export const getPatientAllergies = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/allergies`);
  return response.data.data;
};

/**
 * Fetches all medical records for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of medical record objects
 */
export const getMedicalRecords = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/medical-records`);
  return response.data.data;
};