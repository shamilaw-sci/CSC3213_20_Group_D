/**
 * @file    doctor.service.js
 * @module  Services
 * @desc    Minimal frontend service for the Doctor module (mobile).
 *          Currently only supports viewing the logged-in doctor's own
 *          profile - full doctor dashboard is a separate, larger piece
 *          of work outside this scope.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
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
