/**
 * @file    qr.js
 * @module  Utils
 * @desc    Utility function for generating unique QR code values
 *          for prescriptions. Stores only a UUID reference —
 *          never embeds medical data in the QR code.
 * @author  S/21/001
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique QR code value for a prescription.
 * Format: "RX-<uuid>" — this string is stored in the database
 * and encoded into the QR image shown to the patient.
 * @returns {string} A unique QR code string e.g. "RX-550e8400-e29b-41d4-a716-446655440000"
 */
const generatePrescriptionQR = () => {
  const uniqueId = uuidv4();
  return `RX-${uniqueId}`;
};

module.exports = { generatePrescriptionQR };