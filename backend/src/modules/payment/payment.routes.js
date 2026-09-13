/**
 * @file    payment.routes.js
 * @module  Payment
 * @desc    API routes for patient sandbox payment endpoints.
 *          All payment operations require an authenticated patient session.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');

const router = express.Router();

const {
  isAuthenticated,
  authorize,
} = require('../../middleware/auth');

const {
  initiatePaymentController,
  confirmPaymentController,
  getPatientPaymentsController,
  getPaymentByIdController,
} = require('./payment.controller');

/**
 * All payment routes in the current Care4U sandbox flow
 * are patient-facing and require an authenticated patient.
 */
router.use(
  isAuthenticated,
  authorize('patient')
);

// POST /api/payments
router.post(
  '/',
  initiatePaymentController
);

// PUT /api/payments/:id/confirm
router.put(
  '/:id/confirm',
  confirmPaymentController
);

// GET /api/payments/patient/:patientId
router.get(
  '/patient/:patientId',
  getPatientPaymentsController
);

// GET /api/payments/:id
router.get(
  '/:id',
  getPaymentByIdController
);

module.exports = router;