/**
 * @file    payment.repository.js
 * @module  Payment
 * @desc    Database queries for payment transactions.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new payment transaction.
 * @param {string} patientId     - UUID of the patient
 * @param {number} amount        - Payment amount
 * @param {string} paymentType   - appointment | lab_test | medicine_delivery
 * @param {string} referenceId   - UUID of the linked record
 * @param {string} paymentMethod - card | cash | online
 * @param {string} description   - Payment description
 * @returns {Promise<Object>} Created payment transaction
 */
const createPayment = async (patientId, amount, paymentType, referenceId, paymentMethod, description) => {
  const result = await pool.query(
    `INSERT INTO payment_transactions
      (patient_id, amount, payment_type, reference_id, payment_method, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [patientId, amount, paymentType, referenceId || null, paymentMethod || 'card', description || null]
  );
  return result.rows[0];
};

/**
 * Confirms a payment by updating status to success.
 * @param {string} id - UUID of the payment transaction
 * @returns {Promise<Object|null>} Updated payment transaction
 */
const confirmPayment = async (id) => {
  const result = await pool.query(
    `UPDATE payment_transactions
     SET status = 'success', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Fails a payment by updating status to failed.
 * @param {string} id - UUID of the payment transaction
 * @returns {Promise<Object|null>} Updated payment transaction
 */
const failPayment = async (id) => {
  const result = await pool.query(
    `UPDATE payment_transactions
     SET status = 'failed', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Gets all payment transactions for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} List of payment transactions
 */
const getPaymentsByPatient = async (patientId) => {
  const result = await pool.query(
    `SELECT * FROM payment_transactions
     WHERE patient_id = $1
     ORDER BY created_at DESC`,
    [patientId]
  );
  return result.rows;
};

/**
 * Gets a single payment transaction by ID.
 * @param {string} id - UUID of the payment transaction
 * @returns {Promise<Object|null>} Payment transaction or null
 */
const getPaymentById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM payment_transactions WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createPayment,
  confirmPayment,
  failPayment,
  getPaymentsByPatient,
  getPaymentById,
};