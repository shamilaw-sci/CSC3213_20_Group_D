/**
 * @file    doctor.service.js
 * @module  Doctor / Patient
 * @desc    Frontend service for the Doctor module (mobile).
 * Supports doctor profile viewing, doctor search, and slot availability.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * Fetches a doctor's profile by ID.
 */
export const getDoctorProfile = async (doctorId) => {
  const response = await api.get(`/api/doctors/${doctorId}`);
  return response.data.data;
};

/**
 * Searches for doctors based on specialty and hospital.
 */
export const searchDoctors = async (params) => {
  const response = await api.get('/api/doctors/search', { params });
  return response.data.data;
};

/**
 * Gets a snapshot of available appointment times. Selecting a displayed slot does not reserve it;
 * the booking endpoint rechecks availability and conflicts.
 */
export const getAvailableSlots = async (doctorId) => {
  const response = await api.get(`/api/doctors/${doctorId}/slots`);
  return response.data.data;
};