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
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
} = require('./patient.controller');

// const { isAuthenticated } = require('../../middleware/auth');        // Uncomment when auth is ready
// const { authorize } = require('../../middleware/rbac');              // Uncomment when auth is ready

/**
 * GET /api/patients/qr/:qrCodeId
 * Returns a patient profile looked up by their QR code ID.
 * IMPORTANT: This route must stay before /:id — otherwise Express
 * will treat the word "qr" as a UUID and route to the wrong controller.
 */
router.get(
  '/qr/:qrCodeId',
  // isAuthenticated,               // Uncomment when auth is ready
  // authorize('doctor', 'admin'),  // Uncomment when auth is ready
  getPatientByQrCodeController
);

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

/**
 * GET /api/patients/:id/prescriptions
 * Returns all prescriptions for a patient with their medicine items.
 */
router.get(
  '/:id/prescriptions',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getPatientPrescriptionsController
);

module.exports = router;