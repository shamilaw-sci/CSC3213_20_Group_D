/**
 * @file    patient.service.js
 * @module  Services
 * @desc    API calls for the Patient module - mobile.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import api from './api';

/**
 * Fetches the full profile for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} Patient profile object
 */
export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}`);
  return response.data.data;
};

/**
 * Updates editable fields on a patient profile.
 * @param {string} patientId - UUID of the patient
 * @param {Object} data      - Fields to update (full_name, blood_group, emergency_contact_*)
 * @returns {Promise<Object>} Updated patient profile object
 */
export const updatePatientProfile = async (patientId, data) => {
  const response = await api.put(`/api/patients/${patientId}`, data);
  return response.data.data;
};

/**
 * Fetches all allergies for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of allergy objects
 */
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