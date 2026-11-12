/**
 * @file    prescription.service.js
 * @module  Prescription
 * @desc    Business logic for prescription creation, expiry checking,
 *          QR code generation, and medicine dispensing.
 * @author  S/21/001
 */

const prescriptionRepository = require('./prescription.repository');
const { pool } = require('../../config/db');
const appointmentRepository = require('../appointment/appointment.repository');
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
    await prescriptionRepository.updatePrescriptionStatus(
      prescription.id,
      'expired'
    );

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
const createPrescription = async (
  doctorId,
  patientId,
  appointmentId,
  items,
  notes
) => {
  const appointment =
    await appointmentRepository.getAppointmentById(appointmentId);

  if (
    !appointment ||
    appointment.status !== 'in_progress' ||
    String(appointment.doctor_id) !== String(doctorId) ||
    String(appointment.patient_id) !== String(patientId)
  ) {
    const error = new Error(
      'Prescriptions can only be issued during your active patient consultation'
    );
    error.statusCode = 403;
    throw error;
  }

  // Step 1: Generate unique QR code value
  const qrCodeValue = generatePrescriptionQR();

  // Step 2: Set expiry to 30 days from now
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );

  // Step 3: Insert prescription into database
  const prescription =
    await prescriptionRepository.createPrescription(
      patientId,
      doctorId,
      appointmentId,
      qrCodeValue,
      expiresAt,
      notes || null
    );

  // Step 4: Insert all medicine items
  const prescriptionItems =
    await prescriptionRepository.createPrescriptionItems(
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
  const prescription =
    await prescriptionRepository.getPrescriptionById(id);

  if (!prescription) return null;

  // Automatically check and update expiry
  const checkedPrescription =
    await isPrescriptionExpired(prescription);

  return checkedPrescription;
};

/**
 * Verifies a prescription by its QR code value.
 * Also checks and updates expiry status automatically.
 * @param {string} qrValue - The QR code string (e.g. "RX-uuid")
 * @returns {Promise<Object|null>} Prescription object with items, or null if not found
 */
const verifyPrescriptionByQR = async (qrValue) => {
  const prescription =
    await prescriptionRepository.getPrescriptionByQrCode(
      qrValue
    );

  if (!prescription) return null;

  // Automatically check and update expiry
  const checkedPrescription =
    await isPrescriptionExpired(prescription);

  return checkedPrescription;
};

/**
 * Dispenses medicines from a prescription.
 * Updates quantity dispensed and prescription status.
 * Also records which pharmacy performed the dispensing action.
 *
 * @param {string} prescriptionId - UUID of the prescription
 * @param {Array}  dispenseItems   - Array of { prescriptionItemId, quantityDispensed }
 * @param {string} pharmacyId      - UUID of the pharmacy performing the dispensing
 * @returns {Promise<Object>} Updated prescription with new status
 */
const dispenseMedicine = async (
  prescriptionId,
  dispenseItems,
  pharmacyId
) => {
  // Step 1: Validate pharmacy ID
  if (!pharmacyId) {
    const error = new Error(
      'Pharmacy information is required to dispense medicines'
    );
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!await prescriptionRepository.lockPrescription(prescriptionId, client)) {
      await client.query('ROLLBACK');
      return null;
    }

  // Step 2: Get the current prescription
  const prescription =
    await prescriptionRepository.getPrescriptionById(
      prescriptionId,
      client
    );

  if (!prescription) {
    return null;
  }

  // Step 3: Check and update expiry status before dispensing
  const checkedPrescription = prescription;

  if (
    checkedPrescription.status === 'expired' ||
    new Date(checkedPrescription.expires_at) < new Date()
  ) {
    const error = new Error(
      'Cannot dispense — prescription is expired'
    );

    error.statusCode = 400;
    throw error;
  }

  // Prevent an already completed prescription from being dispensed again
  if (checkedPrescription.status === 'completed') {
    const error = new Error(
      'Cannot dispense — prescription has already been fully dispensed'
    );

    error.statusCode = 400;
    throw error;
  }

  // Step 4: Validate dispense items
  if (
    !Array.isArray(dispenseItems) ||
    dispenseItems.length === 0
  ) {
    const error = new Error(
      'At least one medicine must be selected for dispensing'
    );

    error.statusCode = 400;
    throw error;
  }

  // Step 5: Validate all requested quantities before changing the database
  const requestedIds = new Set();
  for (const dispenseItem of dispenseItems) {
    if (requestedIds.has(dispenseItem.prescriptionItemId)) {
      const error = new Error('A medicine item may be selected only once');
      error.statusCode = 400;
      throw error;
    }
    requestedIds.add(dispenseItem.prescriptionItemId);
    // Find the matching item in the prescription
    const existingItem =
      checkedPrescription.items.find(
        item =>
          item.id ===
          dispenseItem.prescriptionItemId
      );

    if (!existingItem) {
      const error = new Error(
        `Item ${dispenseItem.prescriptionItemId} not found in prescription`
      );

      error.statusCode = 400;
      throw error;
    }

    const quantityDispensed =
      Number(dispenseItem.quantityDispensed);

    // Quantity must be a valid positive number
    if (
      !Number.isInteger(quantityDispensed) ||
      quantityDispensed <= 0
    ) {
      const error = new Error(
        `Invalid dispensing quantity for ${existingItem.medicine_name}`
      );

      error.statusCode = 400;
      throw error;
    }

    // Check cannot over-dispense
    const totalAfterDispense =
      existingItem.quantity_dispensed +
      quantityDispensed;

    if (
      totalAfterDispense >
      existingItem.quantity_prescribed
    ) {
      const error = new Error(
        `Cannot dispense more than prescribed for ${existingItem.medicine_name}`
      );

      error.statusCode = 400;
      throw error;
    }
  }

  // Step 6: Dispense each item
  for (const dispenseItem of dispenseItems) {
    const updatedItem = await prescriptionRepository.updateQuantityDispensed(
      dispenseItem.prescriptionItemId,
      Number(dispenseItem.quantityDispensed),
      client
    );
    if (!updatedItem) {
      const error = new Error('Dispensing quantity exceeds the remaining balance');
      error.statusCode = 409;
      throw error;
    }
  }

  // Step 7: Get updated prescription
  const updatedPrescription =
    await prescriptionRepository.getPrescriptionById(
      prescriptionId,
      client
    );

  // Step 8: Check if all items are fully dispensed
  const allDispensed =
    updatedPrescription.items.every(
      item =>
        item.quantity_dispensed >=
        item.quantity_prescribed
    );

  const someDispensed =
    updatedPrescription.items.some(
      item => item.quantity_dispensed > 0
    );

  // Step 9: Update prescription status
  let newStatus =
    checkedPrescription.status;

  if (allDispensed) {
    newStatus = 'completed';
  } else if (someDispensed) {
    newStatus = 'partially_filled';
  }

  await prescriptionRepository.updatePrescriptionStatus(
    prescriptionId,
    newStatus,
    client
  );

  updatedPrescription.status =
    newStatus;

  // Step 10: Record which pharmacy performed this dispensing action
  await prescriptionRepository.recordDispensing(
    prescriptionId,
    pharmacyId,
    client
  );

  // Step 11: Return updated prescription
  await client.query('COMMIT');
  return updatedPrescription;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  verifyPrescriptionByQR,
  dispenseMedicine
};
