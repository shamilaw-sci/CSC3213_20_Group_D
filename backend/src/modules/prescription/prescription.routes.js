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

// POST /api/prescriptions — Create a new prescription
router.post('/', createPrescriptionController);

// GET /api/prescriptions/verify/:qrValue — Verify prescription by QR code
router.get('/verify/:qrValue', verifyPrescriptionController);

// GET /api/prescriptions/:id — Get a prescription by ID
router.get('/:id', getPrescriptionController);

// POST /api/prescriptions/:id/dispense — Dispense medicines
router.post('/:id/dispense', dispenseMedicineController);

module.exports = router;