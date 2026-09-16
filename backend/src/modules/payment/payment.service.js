/**
 * @file    payment.service.js
 * @module  Payment
 * @desc    Business logic for sandbox payment processing,
 *          validation, and authenticated patient ownership.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const paymentRepository =
  require('./payment.repository');

const patientRepository =
  require('../patient/patient.repository');

/**
 * Resolves the authenticated patient's profile.
 *
 * @param {Object} requestingUser - User stored in the authenticated session
 * @returns {Promise<Object>} Patient profile
 */
const resolveAuthenticatedPatient =
  async (
    requestingUser
  ) => {

    if (
      !requestingUser ||
      !requestingUser.id ||
      requestingUser.role !==
        'patient'
    ) {
      const error =
        new Error(
          'Patient authentication is required'
        );

      error.statusCode =
        403;

      throw error;
    }

    const patient =
      await patientRepository
        .getPatientByUserId(
          requestingUser.id
        );

    if (!patient) {
      const error =
        new Error(
          'Patient profile not found'
        );

      error.statusCode =
        404;

      throw error;
    }

    return patient;
  };

/**
 * Initiates a new payment transaction.
 *
 * The patient ID is resolved from the authenticated
 * session. A patient ID supplied by the client is only
 * accepted when it matches the authenticated patient.
 *
 * @param {string|null} requestedPatientId - Optional patient UUID supplied by client
 * @param {number} amount - Payment amount
 * @param {string} paymentType - appointment | lab_test | medicine_delivery
 * @param {string|null} referenceId - UUID of the linked record
 * @param {string|null} paymentMethod - card | cash | online
 * @param {string|null} description - Payment description
 * @param {Object} requestingUser - Authenticated session user
 * @returns {Promise<Object>} Created payment transaction
 */
const initiatePayment =
  async (
    requestedPatientId,
    amount,
    paymentType,
    referenceId,
    paymentMethod,
    description,
    requestingUser
  ) => {

    const patient =
      await resolveAuthenticatedPatient(
        requestingUser
      );

    if (
      requestedPatientId &&
      requestedPatientId !==
        patient.id
    ) {
      const error =
        new Error(
          'You cannot create a payment for another patient'
        );

      error.statusCode =
        403;

      throw error;
    }

    const VALID_TYPES = [
      'appointment',
      'lab_test',
      'medicine_delivery',
    ];

    if (
      !VALID_TYPES.includes(
        paymentType
      )
    ) {
      const error =
        new Error(
          `Invalid payment type. Must be one of: ${VALID_TYPES.join(', ')}`
        );

      error.statusCode =
        400;

      throw error;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <=
        0
    ) {
      const error =
        new Error(
          'Invalid amount. Must be greater than 0'
        );

      error.statusCode =
        400;

      throw error;
    }

    return paymentRepository
      .createPayment(
        patient.id,
        numericAmount,
        paymentType,
        referenceId,
        paymentMethod,
        description
      );
  };

/**
 * Confirms a sandbox payment belonging to the
 * authenticated patient.
 *
 * @param {string} id - UUID of the payment transaction
 * @param {Object} requestingUser - Authenticated session user
 * @returns {Promise<Object>} Updated payment transaction
 */
const confirmPayment =
  async (
    id,
    requestingUser
  ) => {

    const patient =
      await resolveAuthenticatedPatient(
        requestingUser
      );

    const payment =
      await paymentRepository
        .getPaymentById(
          id
        );

    /**
     * Use the same response for missing and non-owned
     * records so another patient's payment cannot be
     * discovered by probing UUIDs.
     */
    if (
      !payment ||
      payment.patient_id !==
        patient.id
    ) {
      const error =
        new Error(
          'Payment transaction not found'
        );

      error.statusCode =
        404;

      throw error;
    }

    if (
      payment.status !==
        'pending'
    ) {
      const error =
        new Error(
          `Payment already ${payment.status}`
        );

      error.statusCode =
        400;

      throw error;
    }

    return paymentRepository
      .confirmPayment(
        id
      );
  };

/**
 * Gets payment history for the authenticated patient.
 *
 * @param {string} requestedPatientId - Patient UUID from the URL
 * @param {Object} requestingUser - Authenticated session user
 * @returns {Promise<Array>} Patient payment transactions
 */
const getPaymentsByPatient =
  async (
    requestedPatientId,
    requestingUser
  ) => {

    const patient =
      await resolveAuthenticatedPatient(
        requestingUser
      );

    if (
      requestedPatientId !==
      patient.id
    ) {
      const error =
        new Error(
          'You do not have permission to view this payment history'
        );

      error.statusCode =
        403;

      throw error;
    }

    return paymentRepository
      .getPaymentsByPatient(
        patient.id
      );
  };

/**
 * Gets an individual payment belonging to the
 * authenticated patient.
 *
 * @param {string} id - UUID of the payment transaction
 * @param {Object} requestingUser - Authenticated session user
 * @returns {Promise<Object>} Payment transaction
 */
const getPaymentById =
  async (
    id,
    requestingUser
  ) => {

    const patient =
      await resolveAuthenticatedPatient(
        requestingUser
      );

    const payment =
      await paymentRepository
        .getPaymentById(
          id
        );

    if (
      !payment ||
      payment.patient_id !==
        patient.id
    ) {
      const error =
        new Error(
          'Payment transaction not found'
        );

      error.statusCode =
        404;

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