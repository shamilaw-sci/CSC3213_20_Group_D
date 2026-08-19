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

export const updatePatientProfile = async (patientId, data) => {
  const response = await api.put(`/api/patients/${patientId}`, data);
  return response.data.data;
};

export const getPatientAllergies = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/allergies`);
  return response.data.data;
};

export const getMedicalRecords = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/medical-records`);
  return response.data.data;
};

export const addAllergy = async (patientId, allergen, severity, notes) => {
  const response = await api.post(`/api/patients/${patientId}/allergies`, { allergen, severity, notes });
  return response.data.data;
};

export const deleteAllergy = async (patientId, allergyId) => {
  const response = await api.delete(`/api/patients/${patientId}/allergies/${allergyId}`);
  return response.data;
};

export const getConditions = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/conditions`);
  return response.data.data;
};

export const addCondition = async (patientId, condition, diagnosedAt, notes, isPriority) => {
  const response = await api.post(`/api/patients/${patientId}/conditions`, {
    condition,
    diagnosedAt,
    notes,
    isPriority
  });
  return response.data.data;
};

export const deleteCondition = async (patientId, conditionId) => {
  const response = await api.delete(`/api/patients/${patientId}/conditions/${conditionId}`);
  return response.data;
};

export const getVaccinations = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/vaccinations`);
  return response.data.data;
};

export const addVaccination = async (patientId, vaccineName, dateAdministered, doseNumber, notes) => {
  const response = await api.post(`/api/patients/${patientId}/vaccinations`, {
    vaccineName,
    dateAdministered,
    doseNumber,
    notes
  });
  return response.data.data;
};

export const addBulkVaccinations = async (patientId, vaccinations) => {
  const response = await api.post(`/api/patients/${patientId}/vaccinations/bulk`, { vaccinations });
  return response.data.data;
};

export const deleteVaccination = async (patientId, vaccinationId) => {
  const response = await api.delete(`/api/patients/${patientId}/vaccinations/${vaccinationId}`);
  return response.data;
};

/**
 * Uploads an image of a vaccination card and returns AI-extracted details.
 * Specifically formatted for React Native's implementation of FormData.
 */
export const scanVaccinationCard = async (patientId, imageUri, mimeType) => {
  const formData = new FormData();
  
  formData.append('image', {
    uri: imageUri,
    type: mimeType || 'image/jpeg',
    name: 'scan.jpg' // A generic name is required for RN to parse it as a file
  });

  const response = await api.post(`/api/patients/${patientId}/vaccinations/scan`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data; 
};

/**
 * Fetches all completed lab reports for a patient.
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getLabReports = async (patientId) => {
  try {
    const response = await api.get(`/api/patients/${patientId}/lab-reports`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lab reports');
    }
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};