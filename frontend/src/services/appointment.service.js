/**
 * @file    appointment.service.js
 * @module  Appointment
 * @desc    Frontend service for the Appointment module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * FEATURE: Request an appointment booking
 * LOGIC: Send the supplied booking and return the created or reused appointment.
 * The backend resolves session ownership and slot conflicts; errors propagate to the page.
 */
export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/api/appointments', appointmentData);
  return response.data.data;
};

export const getPatientAppointments = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/appointments`);
  return response.data.data;
};

// Cancellation is a status request; the server checks ownership and allowed transitions.
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.put(`/api/appointments/${appointmentId}/status`, { status });
  return response.data.data;
};
