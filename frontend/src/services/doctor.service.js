/**
 * @file    doctor.service.js
 * @module  Doctor / Patient
 * @desc    Frontend service for doctor-related API calls.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * FEATURE: Search doctor specialty and hospital
 * LOGIC: Encode nonempty filters as URL parameters and return the server result; no client-side filtering runs here.
 */
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

// Available times are a snapshot; the booking endpoint must recheck the chosen slot.
export const getAvailableSlots = async (id) => {
  const response = await api.get(
    `/api/doctors/${id}/slots`
  );

  return response.data.data;
};

/**
 * Uploads a doctor's profile photo.
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
