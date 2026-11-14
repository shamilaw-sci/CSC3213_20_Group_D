/**
 * @file    prescription.service.js
 * @module  Prescription
 * @desc    API calls for prescription module.
 * @author  Pamudika Abayarathna (S/21/001)
 */

import api from './api';

export const createPrescription = async (prescriptionData) => {
  const response = await api.post('/api/prescriptions', prescriptionData);
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await api.get(`/api/prescriptions/${id}`);
  return response.data;
};

/**
 * FEATURE: Verify a prescription reference
 * LOGIC: Send the QR value to the verification endpoint and return its complete response envelope.
 * The server checks pharmacist access and prescription validity; this call does not dispense medicine.
 */
export const verifyPrescriptionByQR = async (qrValue) => {
  const response = await api.get(`/api/prescriptions/verify/${qrValue}`);
  return response.data;
};