/**
 * @file    patient.routes.js
 * @module  Patient
 * @desc    Express route definitions for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const {
  getPatientController,
  updatePatientController,
  getMedicalRecordsController,
  getAllergiesController,
  addAllergyController,
} = require('./patient.controller');

// const { isAuthenticated } = require('../../middleware/auth');        // Uncomment when auth is ready
// const { authorize } = require('../../middleware/rbac');              // Uncomment when auth is ready

/**
 * GET /api/patients/:id
 * Returns the profile of a patient by their UUID.
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
 */
router.put(
  '/:id',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  updatePatientController
);

/**
 * GET /api/patients/:id/medical-records
 * Returns all medical records for a patient, newest first.
 */
router.get(
  '/:id/medical-records',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getMedicalRecordsController
);

/**
 * GET /api/patients/:id/allergies
 * Returns all allergy records for a patient.
 */
router.get(
  '/:id/allergies',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getAllergiesController
);

/**
 * POST /api/patients/:id/allergies
 * Adds a new allergy record for a patient.
 * Body: { allergen, severity, notes (optional) }
 */
router.post(
  '/:id/allergies',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  addAllergyController
);

module.exports = router;