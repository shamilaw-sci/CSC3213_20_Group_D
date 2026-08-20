/**
 * @file    payment.service.js
 * @module  Payment
 * @desc    Business logic for payment processing.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const paymentRepository = require('./payment.repository');

/**
 * Initiates a new payment transaction.
 * @param {string} patientId     - UUID of the patient
 * @param {number} amount        - Payment amount
 * @param {string} paymentType   - appointment | lab_test | medicine_delivery
 * @param {string} referenceId   - UUID of the linked record
 * @param {string} paymentMethod - card | cash | online
 * @param {string} description   - Payment description
 * @returns {Promise<Object>} Created payment transaction
 */
const initiatePayment = async (patientId, amount, paymentType, referenceId, paymentMethod, description) => {
  const VALID_TYPES = ['appointment', 'lab_test', 'medicine_delivery'];
  if (!VALID_TYPES.includes(paymentType)) {
    const error = new Error(`Invalid payment type. Must be one of: ${VALID_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (!amount || amount <= 0) {
    const error = new Error('Invalid amount. Must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  return await paymentRepository.createPayment(
    patientId, amount, paymentType, referenceId, paymentMethod, description
  );
};

/**
 * Confirms a payment — simulates sandbox payment success.
 * @param {string} id - UUID of the payment transaction
 * @returns {Promise<Object>} Updated payment transaction
 */
const confirmPayment = async (id) => {
  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) {
    const error = new Error('Payment transaction not found');
    error.statusCode = 404;
    throw error;
  }
  if (payment.status !== 'pending') {
    const error = new Error(`Payment already ${payment.status}`);
    error.statusCode = 400;
    throw error;
  }
  return await paymentRepository.confirmPayment(id);
};

/**
 * Gets all payments for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} List of payment transactions
 */
const getPaymentsByPatient = async (patientId) => {
  return await paymentRepository.getPaymentsByPatient(patientId);
};

/**
 * Gets a single payment by ID.
 * @param {string} id - UUID of the payment
 * @returns {Promise<Object>} Payment transaction
 */
const getPaymentById = async (id) => {
  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) {
    const error = new Error('Payment transaction not found');
    error.statusCode = 404;
    throw error;
  }
  return payment;
};

module.exports = {
  initiatePayment,
  confirmPayment,
  getPaymentsByPatient,
  getPaymentById,
};