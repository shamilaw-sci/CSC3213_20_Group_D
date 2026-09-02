/**
 * @file    prescription.routes.js
 * @module  Prescription
 * @desc    API routes for prescription endpoints.
 * @author  S/21/001
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const { 
  createPrescriptionController,
  getPrescriptionController,
  verifyPrescriptionController,
  dispenseMedicineController
} = require('./prescription.controller');

// POST /api/prescriptions — Only doctors can issue prescriptions
router.post('/', isAuthenticated, authorize('doctor'), createPrescriptionController);

// GET /api/prescriptions/verify/:qrValue — Pharmacy verification
router.get('/verify/:qrValue', isAuthenticated, authorize('pharmacist', 'doctor', 'admin'), verifyPrescriptionController);

// GET /api/prescriptions/:id — Get details
router.get('/:id', isAuthenticated, getPrescriptionController);

// POST /api/prescriptions/:id/dispense — Pharmacist role-gated fulfillment
router.post('/:id/dispense', isAuthenticated, authorize('pharmacist', 'admin'), dispenseMedicineController);

module.exports = router;