/**
 * @file    doctor.service.js
 * @module  Services
 * @desc    Frontend service for doctor-related API calls.
 * @author  Member 2 (S/21/081)
 */

import api from './api';

export const searchDoctors = async (
  specialty = '',
  hospital = ''
) => {
  const params = new URLSearchParams();

  if (specialty) {
    params.append('specialty', specialty);
  }

  if (hospital) {
    params.append('hospital', hospital);
  }
  
  const response = await api.get(
    `/api/doctors/search?${params.toString()}`
  );

  return response.data.data;
};

export const getDoctorProfile = async (id) => {
  const response = await api.get(
    `/api/doctors/${id}`
  );

  return response.data.data;
};

export const getAvailableSlots = async (id) => {
  const response = await api.get(
    `/api/doctors/${id}/slots`
  );

  return response.data.data;
};

/**
 * Uploads a doctor's profile photo.
 * @param {string} id - Doctor profile UUID
 * @param {File} file - Selected image file
 * @returns {Promise<Object>} Updated doctor profile
 */
export const uploadDoctorPhoto = async (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await api.put(
    `/api/doctors/${id}/photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
};