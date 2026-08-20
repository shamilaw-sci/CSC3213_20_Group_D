/**
 * @file    doctor.service.js
 * @module  Services
 * @desc    Frontend service for doctor-related API calls.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * Searches for verified doctors by specialty and/or hospital.
 * @param {string} specialty - Specialty to filter by
 * @param {string} hospital - Hospital name to filter by
 * @returns {Promise<Array>} List of doctors
 */
export const searchDoctors = async (specialty = '', hospital = '') => {
  const params = new URLSearchParams();
  if (specialty) params.append('specialty', specialty);
  if (hospital) params.append('hospital', hospital);
  
  const response = await api.get(`/api/doctors/search?${params.toString()}`);
  return response.data.data;
};