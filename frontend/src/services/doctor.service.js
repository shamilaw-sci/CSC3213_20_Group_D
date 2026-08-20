/**
 * @file    doctor.service.js
 * @module  Services
 * @desc    Frontend service for doctor-related API calls.
 * @author  Member 2 (S/21/081)
 */

import api from './api';

export const searchDoctors = async (specialty = '', hospital = '') => {
  const params = new URLSearchParams();
  if (specialty) params.append('specialty', specialty);
  if (hospital) params.append('hospital', hospital);
  
  const response = await api.get(`/api/doctors/search?${params.toString()}`);
  return response.data.data;
};

export const getDoctorProfile = async (id) => {
  const response = await api.get(`/api/doctors/${id}`);
  return response.data.data;
};

export const getAvailableSlots = async (id) => {
  const response = await api.get(`/api/doctors/${id}/slots`);
  return response.data.data;
};