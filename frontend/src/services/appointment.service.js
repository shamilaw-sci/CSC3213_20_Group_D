/**
 * @file    appointment.service.js
 * @module  Appointment
 * @desc    Frontend service for the Appointment module.
 * @author  Member 2 (S/21/081)
 */

import api from './api';

export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/api/appointments', appointmentData);
  return response.data.data;
};

export const getPatientAppointments = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}/appointments`);
  return response.data.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.put(`/api/appointments/${appointmentId}/status`, { status });
  return response.data.data;
};