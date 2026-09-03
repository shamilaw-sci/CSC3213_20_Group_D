/**
 * @file    payment.controller.js
 * @module  Payment
 * @desc    HTTP request handlers for payment endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const paymentService = require('./payment.service');

/**
 * Handles POST /api/payments
 * Initiates a new payment transaction.
 */
const initiatePaymentController = async (req, res) => {
  try {
    const currentUser = req.user;
    const { amount, payment_type, reference_id, payment_method, description } = req.body;

    if (!amount || !payment_type) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: amount and payment_type are required',
      });
    }

    const patientId = req.body.patient_id;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patient_id is required' });
    }
    
    const payment = await paymentService.initiatePayment(
      patientId,
      amount,
      payment_type,
      reference_id,
      payment_method,
      description
    );

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        ...payment,
        sandbox: true,
        sandbox_message: 'This is a sandbox payment — no real money is charged',
      },
    });

  } catch (error) {
    console.error('initiatePaymentController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles PUT /api/payments/:id/confirm
 * Confirms a sandbox payment.
 */
const confirmPaymentController = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.confirmPayment(id);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        ...payment,
        sandbox: true,
        sandbox_message: 'This is a sandbox payment — no real money was charged',
      },
    });

  } catch (error) {
    console.error('confirmPaymentController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles GET /api/payments/patient/:patientId
 * Gets all payments for a patient.
 */
const getPatientPaymentsController = async (req, res) => {
  try {
    const { patientId } = req.params;
    const payments = await paymentService.getPaymentsByPatient(patientId);

    res.status(200).json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: payments,
    });

  } catch (error) {
    console.error('getPatientPaymentsController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles GET /api/payments/:id
 * Gets a single payment by ID.
 */
const getPaymentByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    });

  } catch (error) {
    console.error('getPaymentByIdController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  initiatePaymentController,
  confirmPaymentController,
  getPatientPaymentsController,
  getPaymentByIdController,
};