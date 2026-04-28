/**
 * @file    prescription.service.js
 * @module  Prescription
 * @desc    Business logic for prescription creation, expiry checking,
 *          and QR code generation.
 * @author  S/21/001
 */

const prescriptionRepository = require('./prescription.repository');
const { generatePrescriptionQR } = require('../../utils/qr');

/**
 * Creates a new digital prescription with QR code and medicine items.
 * @param {string} doctorId       - UUID of the issuing doctor
 * @param {string} patientId      - UUID of the patient
 * @param {string} appointmentId  - UUID of the linked appointment
 * @param {Array}  items          - Array of medicine objects
 * @param {string} notes          - Optional notes from doctor
 * @returns {Promise<Object>} The created prescription with all items
 */
const createPrescription = async (doctorId, patientId, appointmentId, items, notes) => {
  // Step 1: Generate unique QR code value
  const qrCodeValue = generatePrescriptionQR();

  // Step 2: Set expiry to 30 days from now
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Step 3: Insert prescription into database
  const prescription = await prescriptionRepository.createPrescription(
    patientId,
    doctorId,
    appointmentId,
    qrCodeValue,
    expiresAt,
    notes || null
  );

  // Step 4: Insert all medicine items
  const prescriptionItems = await prescriptionRepository.createPrescriptionItems(
    prescription.id,
    items
  );

  // Step 5: Return full prescription object with items
  return {
    ...prescription,
    items: prescriptionItems
  };
};

/**
 * Retrieves a prescription by ID with all its medicine items.
 * @param {string} id - UUID of the prescription
 * @returns {Promise<Object|null>} Prescription object with items, or null if not found
 */
const getPrescriptionById = async (id) => {
  const prescription = await prescriptionRepository.getPrescriptionById(id);
  return prescription;
};

/**
 * Verifies a prescription by its QR code value.
 * Called when a pharmacist scans a patient's QR code.
 * @param {string} qrValue - The QR code string (e.g. "RX-uuid")
 * @returns {Promise<Object|null>} Prescription object with items, or null if not found
 */
const verifyPrescriptionByQR = async (qrValue) => {
  const prescription = await prescriptionRepository.getPrescriptionByQrCode(qrValue);
  return prescription;
};

module.exports = { createPrescription, getPrescriptionById, verifyPrescriptionByQR };