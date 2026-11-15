/**
 * @file    appointment.service.js
 * @module  Appointment
 * @desc    Mobile service for managing appointments.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import api from './api';

/**
 * FEATURE: Request an OPD booking
 * LOGIC: Send the supplied booking and return its appointment; backend session/slot rules remain authoritative.
 * Rescheduling screens make a separate cancellation request after this succeeds.
 */
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