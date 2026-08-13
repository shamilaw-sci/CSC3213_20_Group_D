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
  uploadPatientPhotoController,
  getMedicalRecordsController,
  getAllergiesController,
  addAllergyController,
  deleteAllergyController,
  getConditionsController,
  addConditionController,
  deleteConditionController,
  getVaccinationsController,
  addVaccinationController,
  deleteVaccinationController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientHistorySummaryController
} = require('./patient.controller');

const { upload } = require('../../middleware/upload');

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
 * POST /api/patients/:id/photo
 * Uploads/replaces a patient's profile photo. Multipart form field: "photo".
 */
router.post(
  '/:id/photo',
  upload.single('photo'),
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  uploadPatientPhotoController
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
 * DELETE /api/patients/:id/allergies/:allergyId
 * Removes an allergy record for a patient.
 */
router.delete(
  '/:id/allergies/:allergyId',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  deleteAllergyController
);

/**
 * GET /api/patients/:id/conditions
 * Returns all chronic condition records for a patient.
 */
router.get(
  '/:id/conditions',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getConditionsController
);

/**
 * POST /api/patients/:id/conditions
 * Adds a new chronic condition record for a patient.
 * Body: { condition, diagnosedAt, notes, isPriority }
 */
router.post(
  '/:id/conditions',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  addConditionController
);

/**
 * DELETE /api/patients/:id/conditions/:conditionId
 * Removes a chronic condition record for a patient.
 */
router.delete(
  '/:id/conditions/:conditionId',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  deleteConditionController
);

/**
 * GET /api/patients/:id/vaccinations
 * Returns all vaccination records for a patient.
 */
router.get(
  '/:id/vaccinations',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  getVaccinationsController
);

/**
 * POST /api/patients/:id/vaccinations
 * Adds a new vaccination record for a patient.
 * Body: { vaccineName, dateAdministered, doseNumber, notes }
 */
router.post(
  '/:id/vaccinations',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  addVaccinationController
);

/**
 * DELETE /api/patients/:id/vaccinations/:vaccinationId
 * Removes a vaccination record for a patient.
 */
router.delete(
  '/:id/vaccinations/:vaccinationId',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('patient', 'doctor'),  // Uncomment when auth is ready
  deleteVaccinationController
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

/**
 * GET /api/patients/:id/summary
 * Generates an AI summary of the patient's entire medical history.
 */
router.get(
  '/:id/summary',
  // isAuthenticated,                 // Uncomment when auth is ready
  // authorize('doctor'),             // Usually only doctors need this feature
  getPatientHistorySummaryController
);

module.exports = router;