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
 * Checks if a prescription is expired and updates status in DB if so.
 * @param {Object} prescription - Prescription object from database
 * @returns {Promise<Object>} Updated prescription with correct status
 */
const isPrescriptionExpired = async (prescription) => {
  if (prescription.status === 'expired') return prescription;

  const now = new Date();
  const expiresAt = new Date(prescription.expires_at);

  if (expiresAt < now) {
    await prescriptionRepository.updatePrescriptionStatus(prescription.id, 'expired');
    prescription.status = 'expired';
  }

  return prescription;
};

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
 * Also checks and updates expiry status automatically.
 * @param {string} id - UUID of the prescription
 * @returns {Promise<Object|null>} Prescription object with items, or null if not found
 */
const getPrescriptionById = async (id) => {
  const prescription = await prescriptionRepository.getPrescriptionById(id);
  if (!prescription) return null;

  // Automatically check and update expiry
  const checkedPrescription = await isPrescriptionExpired(prescription);
  return checkedPrescription;
};

/**
 * Verifies a prescription by its QR code value.
 * Also checks and updates expiry status automatically.
 * @param {string} qrValue - The QR code string (e.g. "RX-uuid")
 * @returns {Promise<Object|null>} Prescription object with items, or null if not found
 */
const verifyPrescriptionByQR = async (qrValue) => {
  const prescription = await prescriptionRepository.getPrescriptionByQrCode(qrValue);
  if (!prescription) return null;

  // Automatically check and update expiry
  const checkedPrescription = await isPrescriptionExpired(prescription);
  return checkedPrescription;
};

/**
 * Dispenses medicines from a prescription.
 * Updates quantity dispensed and prescription status.
 * @param {string} prescriptionId - UUID of the prescription
 * @param {Array}  dispenseItems  - Array of { prescriptionItemId, quantityDispensed }
 * @returns {Promise<Object>} Updated prescription with new status
 */
const dispenseMedicine = async (prescriptionId, dispenseItems) => {
  // Step 1: Get the current prescription
  const prescription = await prescriptionRepository.getPrescriptionById(prescriptionId);
  if (!prescription) return null;

  // Step 2: Check if prescription is expired
  if (prescription.status === 'expired') {
    throw new Error('Cannot dispense — prescription is expired');
  }

  // Step 3: Dispense each item
  for (const dispenseItem of dispenseItems) {
    // Find the matching item in the prescription
    const existingItem = prescription.items.find(
      item => item.id === dispenseItem.prescriptionItemId
    );

    if (!existingItem) {
      throw new Error(`Item ${dispenseItem.prescriptionItemId} not found in prescription`);
    }

    // Check cannot over-dispense
    const totalAfterDispense = existingItem.quantity_dispensed + dispenseItem.quantityDispensed;
    if (totalAfterDispense > existingItem.quantity_prescribed) {
      throw new Error(`Cannot dispense more than prescribed for ${existingItem.medicine_name}`);
    }

    // Update quantity dispensed
    await prescriptionRepository.updateQuantityDispensed(
      dispenseItem.prescriptionItemId,
      dispenseItem.quantityDispensed
    );
  }

  // Step 4: Get updated prescription
  const updatedPrescription = await prescriptionRepository.getPrescriptionById(prescriptionId);

  // Step 5: Check if all items are fully dispensed
  const allDispensed = updatedPrescription.items.every(
    item => item.quantity_dispensed >= item.quantity_prescribed
  );

  const someDispensed = updatedPrescription.items.some(
    item => item.quantity_dispensed > 0
  );

  // Step 6: Update prescription status
  let newStatus = prescription.status;
  if (allDispensed) {
    newStatus = 'completed';
  } else if (someDispensed) {
    newStatus = 'partially_filled';
  }

  await prescriptionRepository.updatePrescriptionStatus(prescriptionId, newStatus);
  updatedPrescription.status = newStatus;

  return updatedPrescription;
};

module.exports = { 
  createPrescription, 
  getPrescriptionById, 
  verifyPrescriptionByQR,
  dispenseMedicine
};