/**
 * @file    patient.routes.js
 * @module  Patient
 * @desc    Express route definitions for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { getPatientController, updatePatientController } = require('./patient.controller');

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

/**
 * PUT /api/patients/:id
 * Updates editable fields on a patient profile.
 * Auth middleware is commented out until Member 1 finishes auth module.
 */
router.put(
  '/:id',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  updatePatientController
);

module.exports = router;