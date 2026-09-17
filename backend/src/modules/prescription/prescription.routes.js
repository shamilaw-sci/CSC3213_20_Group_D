/**
 * @file    prescription.routes.js
 * @module  Prescription
 * @desc    API routes for prescription endpoints.
 * @author  S/21/001
 */

const express = require('express');
const router = express.Router();

const { 
  createPrescriptionController,
  getPrescriptionController,
  verifyPrescriptionController,
  dispenseMedicineController
} = require('./prescription.controller');

const {
  isAuthenticated,
  authorize
} = require('../../middleware/auth');

// POST /api/prescriptions — Create a new prescription
// Only authenticated doctors can issue prescriptions
router.post(
  '/',
  isAuthenticated,
  authorize('doctor'),
  createPrescriptionController
);

// GET /api/prescriptions/verify/:qrValue — Verify prescription by QR code
// Only authenticated pharmacists can verify prescriptions for dispensing
router.get(
  '/verify/:qrValue',
  isAuthenticated,
  authorize('pharmacist'),
  verifyPrescriptionController
);

// GET /api/prescriptions/:id — Get a prescription by ID
router.get(
  '/:id',
  isAuthenticated,
  authorize('patient', 'doctor'),
  getPrescriptionController
);

// POST /api/prescriptions/:id/dispense — Dispense medicines
// Only authenticated pharmacists can dispense medicines
router.post(
  '/:id/dispense',
  isAuthenticated,
  authorize('pharmacist'),
  dispenseMedicineController
);

module.exports = router;
