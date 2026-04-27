/**
 * @file    patient.routes.js
 * @module  Patient
 * @desc    Express route definitions for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { getPatientController } = require('./patient.controller');

// const { isAuthenticated } = require('../../middleware/auth');        // Uncomment when auth is ready
// const { authorize } = require('../../middleware/rbac');              // Uncomment when auth is ready

/**
 * GET /api/patients/:id
 * Returns the profile of a patient by their UUID.
 * Auth middleware is commented out until Member 1 finishes auth module.
 */
router.get(
  '/:id',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getPatientController
);

module.exports = router;