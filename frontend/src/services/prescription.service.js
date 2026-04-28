/**
 * @file    prescription.service.js
 * @module  Services
 * @desc    API calls for prescription module.
 * @author  S/21/001
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

export const verifyPrescriptionByQR = async (qrValue) => {
  const response = await api.get(`/api/prescriptions/verify/${qrValue}`);
  return response.data;
};