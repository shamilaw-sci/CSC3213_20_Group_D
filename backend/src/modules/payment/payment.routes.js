/**
 * @file    payment.routes.js
 * @module  Payment
 * @desc    API routes for payment endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const {
  initiatePaymentController,
  confirmPaymentController,
  getPatientPaymentsController,
  getPaymentByIdController,
} = require('./payment.controller');

// POST /api/payments — Initiate a new payment
router.post('/', initiatePaymentController);

// PUT /api/payments/:id/confirm — Confirm a sandbox payment
router.put('/:id/confirm', confirmPaymentController);

// GET /api/payments/patient/:patientId — Get patient payment history
router.get('/patient/:patientId', getPatientPaymentsController);

// GET /api/payments/:id — Get payment by ID
router.get('/:id', getPaymentByIdController);

module.exports = router;