/**
 * @file    payment.controller.js
 * @module  Payment
 * @desc    HTTP request handlers for sandbox payment endpoints.
 *          Uses the authenticated session user for payment ownership.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const paymentService =
  require('./payment.service');

/**
 * Handles POST /api/payments.
 * Initiates a sandbox payment belonging to the
 * currently authenticated patient.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} HTTP response
 */
const initiatePaymentController =
  async (
    req,
    res
  ) => {
    try {

      const {
        amount,
        payment_type,
        reference_id,
        payment_method,
        description,
        patient_id,
      } = req.body || {};

      if (
        !amount ||
        !payment_type
      ) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            'Validation failed: amount and payment_type are required',
        });
      }

      const payment =
        await paymentService
          .initiatePayment(
            patient_id,
            amount,
            payment_type,
            reference_id,
            payment_method,
            description,
            req.session?.user
          );

      return res.status(
        201
      ).json({
        success: true,
        message:
          'Payment initiated successfully',
        data: {
          ...payment,
          sandbox: true,
          sandbox_message:
            'This is a sandbox payment — no real money is charged',
        },
      });

    } catch (error) {

      console.error(
        'initiatePaymentController error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error',
      });
    }
  };

/**
 * Handles PUT /api/payments/:id/confirm.
 * Confirms a sandbox payment only when it belongs
 * to the currently authenticated patient.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} HTTP response
 */
const confirmPaymentController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const payment =
        await paymentService
          .confirmPayment(
            id,
            req.session?.user
          );

      return res.status(
        200
      ).json({
        success: true,
        message:
          'Payment confirmed successfully',
        data: {
          ...payment,
          sandbox: true,
          sandbox_message:
            'This is a sandbox payment — no real money was charged',
        },
      });

    } catch (error) {

      console.error(
        'confirmPaymentController error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error',
      });
    }
  };

/**
 * Handles GET /api/payments/patient/:patientId.
 * Returns payment history only when the URL patient ID
 * belongs to the currently authenticated patient.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} HTTP response
 */
const getPatientPaymentsController =
  async (
    req,
    res
  ) => {
    try {

      const {
        patientId
      } = req.params;

      const payments =
        await paymentService
          .getPaymentsByPatient(
            patientId,
            req.session?.user
          );

      return res.status(
        200
      ).json({
        success: true,
        message:
          'Payment history retrieved successfully',
        data:
          payments,
      });

    } catch (error) {

      console.error(
        'getPatientPaymentsController error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error',
      });
    }
  };

/**
 * Handles GET /api/payments/:id.
 * Returns an individual payment only when it belongs
 * to the currently authenticated patient.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} HTTP response
 */
const getPaymentByIdController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const payment =
        await paymentService
          .getPaymentById(
            id,
            req.session?.user
          );

      return res.status(
        200
      ).json({
        success: true,
        message:
          'Payment retrieved successfully',
        data:
          payment,
      });

    } catch (error) {

      console.error(
        'getPaymentByIdController error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error',
      });
    }
  };

module.exports = {
  initiatePaymentController,
  confirmPaymentController,
  getPatientPaymentsController,
  getPaymentByIdController,
};