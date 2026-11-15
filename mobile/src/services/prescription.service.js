/**
 * @file    prescription.service.js
 * @module  Prescription
 * @desc    API calls for prescription module on mobile.
 * @author  Pamudika Abayarathna (S/21/001)
 */

import api from './api';

/**
 * FEATURE: Load patient prescription details
 * LOGIC: Return the server list with its medicine items. Expiry, status filters and QR presentation
 * are calculated by the prescription screen; dispensing authorization remains on the backend.
 */
export const getPatientPrescriptions = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/prescriptions`);
  return response.data.data;
};

/**
 * Gets a single prescription by ID.
 */
export const getPrescriptionById = async (id) => {
  const response = await api.get(`/api/prescriptions/${id}`);
  return response.data.data;
};