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