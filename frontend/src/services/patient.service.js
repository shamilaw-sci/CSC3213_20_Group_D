/**
 * @file    patient.service.js
 * @module  Services
 * @desc    Frontend service functions for the Patient module.
 * Calls the Care4U backend patient API endpoints.
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

/**
 * Uploads a new profile photo for a patient.
 * Sends the file as multipart/form-data under field name "photo",
 * overriding the default JSON Content-Type set on the shared `api` instance.
 * @param {string} patientId - UUID of the patient
 * @param {File}   file      - The image file selected by the user (from an <input type="file">)
 * @returns {Promise<Object>} The updated patient data object (includes new photo_url)
 */
export const uploadPatientPhoto = async (patientId, file) => {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await api.post(`/api/patients/${patientId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Fetches all medical records for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of medical record objects
 */
export const getMedicalRecords = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/medical-records`);
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Fetches all prescriptions with medicine items for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of prescription objects, each with an items array
 */
export const getPatientPrescriptions = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/prescriptions`);
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Fetches a patient profile by their QR code ID.
 * Used by the doctor-facing QR lookup page.
 * @param {string} qrCodeId - The qr_code_id value (e.g. "QR-TEST-001")
 * @returns {Promise<Object>} The patient data object
 */
export const getPatientByQrCode = async (qrCodeId) => {
  const response = await api.get(`/api/patients/qr/${qrCodeId}`);
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Fetches all allergy records for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of allergy objects
 */
export const getAllergies = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/allergies`);
  return response.data.data;   // unwrap { success, message, data }
};

/**
 * Adds a new allergy for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} allergen - Name of the allergen
 * @param {string} severity - mild, moderate, or severe
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} The created allergy object
 */
export const addAllergy = async (patientId, allergen, severity, notes) => {
  const response = await api.post(`/api/patients/${patientId}/allergies`, {
    allergen,
    severity,
    notes
  });
  return response.data.data;
};

/**
 * Deletes an allergy record for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} allergyId - UUID of the allergy
 * @returns {Promise<Object>} The success response object
 */
export const deleteAllergy = async (patientId, allergyId) => {
  const response = await api.delete(`/api/patients/${patientId}/allergies/${allergyId}`);
  return response.data; 
};

/**
 * Fetches all chronic condition records for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of condition objects
 */
export const getConditions = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/conditions`);
  return response.data.data;
};

/**
 * Adds a new chronic condition for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} condition - Name of the condition
 * @param {string} diagnosedAt - Date diagnosed (ISO string)
 * @param {string} notes - Optional notes
 * @param {boolean} isPriority - Whether this is a priority condition
 * @returns {Promise<Object>} The created condition object
 */
export const addCondition = async (patientId, condition, diagnosedAt, notes, isPriority) => {
  const response = await api.post(`/api/patients/${patientId}/conditions`, {
    condition,
    diagnosedAt,
    notes,
    isPriority
  });
  return response.data.data;
};

/**
 * Deletes a chronic condition record for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} conditionId - UUID of the condition
 * @returns {Promise<Object>} The success response object
 */
export const deleteCondition = async (patientId, conditionId) => {
  const response = await api.delete(`/api/patients/${patientId}/conditions/${conditionId}`);
  return response.data;
};

/**
 * Fetches an AI-generated clinical summary of a patient's medical history.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} Object containing the { summary } string
 */
export const getPatientHistorySummary = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/summary`);
  return response.data.data;
};