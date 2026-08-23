/**
 * @file    doctor.service.js
 * @module  Services
 * @desc    Frontend service for the Doctor module (mobile).
 *          Supports doctor profile viewing, doctor search, and slot availability.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * Fetches a doctor's profile by ID.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Object>} The doctor profile data
 */
export const getDoctorProfile = async (doctorId) => {
  const response = await api.get(`/api/doctors/${doctorId}`);
  return response.data.data;
};

/**
 * Searches for doctors based on specialty and hospital.
 * @param {Object} params - { specialty, hospitalName }
 * @returns {Promise<Array>} List of doctors
 */
export const searchDoctors = async (params) => {
  const response = await api.get('/api/doctors/search', { params });
  return response.data.data;
};

/**
 * Gets available appointment slots for a doctor.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} List of available slot datetime strings
 */
export const getAvailableSlots = async (doctorId) => {
  const response = await api.get(`/api/doctors/${doctorId}/slots`);
  return response.data.data;
};