/**
 * @file    prescription.repository.js
 * @module  Prescription
 * @desc    Database queries for prescription creation, retrieval,
 *          QR verification, status updates, and dispensing records.
 * @author  S/21/001
 */

const { pool } = require('../../config/db');

/**
 * Inserts a new prescription record into the database.
 * @param {string} patientId      - UUID of the patient
 * @param {string} doctorId       - UUID of the issuing doctor
 * @param {string} appointmentId  - UUID of the linked appointment
 * @param {string} qrCodeValue    - Generated QR string (e.g. "RX-uuid")
 * @param {string} expiresAt      - Expiry timestamp (30 days from now)
 * @param {string} notes          - Optional notes from doctor
 * @returns {Promise<Object>} The newly created prescription row
 */
const createPrescription = async (
  patientId,
  doctorId,
  appointmentId,
  qrCodeValue,
  expiresAt,
  notes
) => {
  // Use SQL parameters for values so user-supplied text is not inserted into query strings.
  const result = await pool.query(
    `INSERT INTO prescriptions 
      (
        patient_id,
        doctor_id,
        appointment_id,
        qr_code_value,
        status,
        expires_at,
        notes
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        'active',
        $5,
        $6
      )
     RETURNING *`,
    [
      patientId,
      doctorId,
      appointmentId,
      qrCodeValue,
      expiresAt,
      notes
    ]
  );

  return result.rows[0];
};

/**
 * Batch inserts all medicine items for a prescription.
 * @param {string} prescriptionId - UUID of the parent prescription
 * @param {Array}  items          - Array of medicine objects
 * @returns {Promise<Array>} All inserted prescription item rows
 */
const createPrescriptionItems = async (
  prescriptionId,
  items
) => {
  const insertedItems = [];

  // Each medicine is a separate INSERT; the current creation flow does not wrap all rows in one transaction.
  for (const item of items) {
    const result = await pool.query(
      `INSERT INTO prescription_items
        (
          prescription_id,
          medicine_name,
          dosage,
          frequency,
          duration_days,
          quantity_prescribed,
          quantity_dispensed,
          special_notes
        )
       VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          0,
          $7
        )
       RETURNING *`,
      [
        prescriptionId,
        item.medicine_name,
        item.dosage,
        item.frequency,
        item.duration_days,
        item.quantity_prescribed,
        item.special_notes || null
      ]
    );

    insertedItems.push(
      result.rows[0]
    );
  }

  return insertedItems;
};

/**
 * Retrieves a prescription and all its medicine items by prescription ID.
 * @param {string} id - UUID of the prescription
 * @returns {Promise<Object|null>} Prescription object with items array, or null if not found
 */
const getPrescriptionById = async (id, db = pool) => {
  // The optional database client lets dispensing read within the same locked transaction.
  const prescriptionResult = await db.query(
    `SELECT *
     FROM prescriptions
     WHERE id = $1`,
    [id]
  );

  if (
    prescriptionResult.rows.length === 0
  ) {
    return null;
  }

  const prescription =
    prescriptionResult.rows[0];

  const itemsResult =
    await db.query(
      `SELECT *
       FROM prescription_items
       WHERE prescription_id = $1`,
      [id]
    );

  prescription.items =
    itemsResult.rows;

  return prescription;
};

/**
 * Retrieves a prescription and its items by QR code value.
 * Used by pharmacists when scanning a patient's prescription QR code.
 * @param {string} qrValue - The QR code string (e.g. "RX-uuid")
 * @returns {Promise<Object|null>} Prescription object with items array, or null if not found
 */
const getPrescriptionByQrCode = async (
  qrValue
) => {
  // Look up only the matching QR reference before loading its medicine rows.
  const prescriptionResult =
    await pool.query(
      `SELECT *
       FROM prescriptions
       WHERE qr_code_value = $1`,
      [qrValue]
    );

  if (
    prescriptionResult.rows.length === 0
  ) {
    return null;
  }

  const prescription =
    prescriptionResult.rows[0];

  const itemsResult =
    await pool.query(
      `SELECT *
       FROM prescription_items
       WHERE prescription_id = $1`,
      [prescription.id]
    );

  prescription.items =
    itemsResult.rows;

  return prescription;
};

/**
 * Updates the status of a prescription.
 * @param {string} id     - UUID of the prescription
 * @param {string} status - New status: 'active', 'expired', 'completed', 'partially_filled'
 * @returns {Promise<Object|null>} Updated prescription row, or null if not found
 */
const updatePrescriptionStatus = async (
  id,
  status,
  db = pool
) => {
  // Update the prescription status using the same transaction client when dispensing.
  const result = await db.query(
    `UPDATE prescriptions
     SET status = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [
      status,
      id
    ]
  );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
};

/**
 * Updates the quantity dispensed for a prescription item.
 * @param {string} prescriptionItemId - UUID of the prescription item
 * @param {number} quantityDispensed  - Amount being dispensed
 * @returns {Promise<Object|null>} Updated prescription item row
 */
const updateQuantityDispensed = async (
  prescriptionItemId,
  quantityDispensed,
  db = pool
) => {
  // The WHERE condition also prevents dispensing beyond the prescribed quantity.
  const result = await db.query(
    `UPDATE prescription_items
     SET quantity_dispensed =
         quantity_dispensed + $1
     WHERE id = $2
       AND quantity_dispensed + $1 <= quantity_prescribed
     RETURNING *`,
    [
      quantityDispensed,
      prescriptionItemId
    ]
  );

  if (
    result.rows.length === 0
  ) {
    return null;
  }

  return result.rows[0];
};

/**
 * Records a dispensing action performed by a pharmacy.
 *
 * This does not replace quantity_dispensed in prescription_items.
 * It creates a history record linking the prescription to the
 * pharmacy that performed the dispensing action.
 *
 * @param {string} prescriptionId - UUID of the prescription
 * @param {string} pharmacyId     - UUID of the pharmacy
 * @returns {Promise<Object>} Newly created dispensing record
 */
const recordDispensing = async (
  prescriptionId,
  pharmacyId,
  db = pool
) => {
  const result = await db.query(
    `INSERT INTO prescription_dispensing
      (
        prescription_id,
        pharmacy_id
      )
     VALUES
      (
        $1,
        $2
      )
     RETURNING *`,
    [
      prescriptionId,
      pharmacyId
    ]
  );

  return result.rows[0];
};

/**
 * Dispensing Lock: serialize dispensing requests for the same prescription.
 * Return false when the prescription row does not exist.
 */
const lockPrescription = async (id, db) => {
  const result = await db.query(
    'SELECT id FROM prescriptions WHERE id = $1 FOR UPDATE',
    [id]
  );
  return result.rows.length > 0;
};

module.exports = {
  createPrescription,
  createPrescriptionItems,
  getPrescriptionById,
  getPrescriptionByQrCode,
  updatePrescriptionStatus,
  updateQuantityDispensed,
  recordDispensing,
  lockPrescription
};
