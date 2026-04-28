/**
 * @file    prescription.routes.js
 * @module  Prescription
 * @desc    API routes for prescription endpoints.
 * @author  S/21/001
 */

const express = require('express');
const router = express.Router();
const { createPrescriptionController } = require('./prescription.controller');

// POST /api/prescriptions — Create a new prescription
// isAuthenticated and authorize('doctor') will be uncommented when auth is ready
router.post(
  '/',
  // isAuthenticated,
  // authorize('doctor'),
  createPrescriptionController
);

module.exports = router;