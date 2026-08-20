/**
 * @file    appointment.service.js
 * @module  Appointment
 * @desc    Frontend service for the Appointment module.
 */

import api from './api';

export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/api/appointments', appointmentData);
  return response.data.data;
};