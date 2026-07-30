/**
 * @file    appointment.service.js
 * @module  Appointment
 * @desc    Frontend service for the Appointment module.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const bookAppointment = async (appointmentData) => {
  const response = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(appointmentData), // Added this line to send the data!
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to book appointment');
  }
  return data.data;
};