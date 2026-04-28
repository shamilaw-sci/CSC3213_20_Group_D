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
  getPrescriptionController
} = require('./prescription.controller');

// POST /api/prescriptions — Create a new prescription
// isAuthenticated and authorize('doctor') will be uncommented when auth is ready
router.post(
  '/',
  // isAuthenticated,
  // authorize('doctor'),
  createPrescriptionController
);

// GET /api/prescriptions/:id — Get a prescription by ID
// isAuthenticated will be uncommented when auth is ready
router.get(
  '/:id',
  // isAuthenticated,
  getPrescriptionController
);

module.exports = router;