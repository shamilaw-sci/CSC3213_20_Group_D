/**
 * @file    patient.routes.js
 * @module  Patient
 * @desc    Express route definitions for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

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
  getMedicalDevicesController,
  addMedicalDeviceController,
  deleteMedicalDeviceController,
  getHealthBackgroundController,
  addHealthBackgroundController,
  deleteHealthBackgroundController,
  getFamilyHistoryController,
  addFamilyHistoryController,
  deleteFamilyHistoryController,
  getVaccinationsController,
  addVaccinationController,
  addBulkVaccinationsController,
  deleteVaccinationController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientByNicController,
  getPatientHistorySummaryController,
  extractVaccinationDataController,
  getLabReportsController,
  markLabReportAsReadController,
  getPatientAppointmentsController,
  generatePatientChatController,
} = require('./patient.controller');

const consentController =
  require('./consent.controller');

const {
  upload
} = require('../../middleware/upload');

const {
  isAuthenticated,
  authorize
} = require('../../middleware/auth');

/* =========================================================
   PATIENT LOOKUP
========================================================= */

/**
 * GET /api/patients/qr/:qrCodeId
 * Retrieves a patient using their Care4U QR identity code.
 */
router.get(
  '/qr/:qrCodeId',
  getPatientByQrCodeController
);

/**
 * GET /api/patients/nic/:nic
 * Staff fallback lookup using patient NIC.
 *
 * Must appear before the generic /:id route.
 * Only authenticated pharmacists and doctors
 * can perform NIC lookup.
 */
router.get(
  '/nic/:nic',
  isAuthenticated,
  authorize(
    'pharmacist',
    'doctor'
  ),
  getPatientByNicController
);

/* =========================================================
   PATIENT PROFILE
========================================================= */

router.get(
  '/:id',
  getPatientController
);

router.put(
  '/:id',
  updatePatientController
);

router.post(
  '/:id/photo',
  upload.single('photo'),
  uploadPatientPhotoController
);

/* =========================================================
   PRIVACY & CONSENT
========================================================= */

/**
 * GET /api/patients/:id/consent
 *
 * Only the authenticated patient may read their
 * own privacy settings.
 */
router.get(
  '/:id/consent',
  isAuthenticated,
  authorize('patient'),
  consentController.getConsent
);

/**
 * PUT /api/patients/:id/consent
 *
 * Only the authenticated patient may modify their
 * own privacy settings.
 */
router.put(
  '/:id/consent',
  isAuthenticated,
  authorize('patient'),
  consentController.updateConsent
);

/**
 * POST /api/patients/:id/consent/access/request
 *
 * Doctor requests an OTP from the patient during
 * an active consultation.
 */
router.post(
  '/:id/consent/access/request',
  isAuthenticated,
  authorize('doctor'),
  consentController.requestConsentAccess
);

/**
 * POST /api/patients/:id/consent/access/verify
 *
 * Doctor verifies the OTP supplied by the patient.
 */
router.post(
  '/:id/consent/access/verify',
  isAuthenticated,
  authorize('doctor'),
  consentController.verifyConsentAccess
);

/**
 * GET /api/patients/:id/consent/access/status
 *
 * Returns temporary access status for the current
 * doctor consultation.
 */
router.get(
  '/:id/consent/access/status',
  isAuthenticated,
  authorize('doctor'),
  consentController.getConsentAccessStatus
);

/* =========================================================
   MEDICAL RECORDS
========================================================= */

/**
 * GET /api/patients/:id/medical-records
 *
 * Medical records are available only to authenticated
 * patients and doctors.
 *
 * Doctors may supply appointmentId as a query parameter
 * so temporary OTP consent access can be evaluated for
 * the current consultation.
 */
router.get(
  '/:id/medical-records',
  isAuthenticated,
  authorize(
    'patient',
    'doctor'
  ),
  getMedicalRecordsController
);

/* =========================================================
   ALLERGIES
========================================================= */

router.get(
  '/:id/allergies',
  getAllergiesController
);

router.post(
  '/:id/allergies',
  addAllergyController
);

router.delete(
  '/:id/allergies/:allergyId',
  deleteAllergyController
);

/* =========================================================
   CHRONIC CONDITIONS
========================================================= */

router.get(
  '/:id/conditions',
  getConditionsController
);

router.post(
  '/:id/conditions',
  addConditionController
);

router.delete(
  '/:id/conditions/:conditionId',
  deleteConditionController
);

/* =========================================================
   MEDICAL DEVICES
========================================================= */

/**
 * GET /api/patients/:id/medical-devices
 * Retrieves active medical devices and implants.
 * The owning patient and authenticated doctors
 * have read-only access.
 */
router.get(
  '/:id/medical-devices',
  isAuthenticated,
  authorize(
    'patient',
    'doctor'
  ),
  getMedicalDevicesController
);

/**
 * POST /api/patients/:id/medical-devices
 * Adds a new medical device or implant to the
 * authenticated patient's own profile.
 */
router.post(
  '/:id/medical-devices',
  isAuthenticated,
  authorize('patient'),
  addMedicalDeviceController
);

/**
 * DELETE /api/patients/:id/medical-devices/:deviceId
 * Removes a medical device from the authenticated
 * patient's own active profile.
 */
router.delete(
  '/:id/medical-devices/:deviceId',
  isAuthenticated,
  authorize('patient'),
  deleteMedicalDeviceController
);

/* =========================================================
   IMPORTANT MEDICAL BACKGROUND
========================================================= */

/**
 * GET /api/patients/:id/health-background
 * Retrieves active important medical background records.
 * The owning patient and authenticated doctors
 * have read-only access.
 */
router.get(
  '/:id/health-background',
  isAuthenticated,
  authorize(
    'patient',
    'doctor'
  ),
  getHealthBackgroundController
);

/**
 * POST /api/patients/:id/health-background
 * Adds an important medical background record
 * to the authenticated patient's own profile.
 */
router.post(
  '/:id/health-background',
  isAuthenticated,
  authorize('patient'),
  addHealthBackgroundController
);

/**
 * DELETE /api/patients/:id/health-background/:backgroundId
 * Removes an important medical background record
 * from the authenticated patient's own active profile.
 */
router.delete(
  '/:id/health-background/:backgroundId',
  isAuthenticated,
  authorize('patient'),
  deleteHealthBackgroundController
);

/* =========================================================
   FAMILY MEDICAL HISTORY
========================================================= */

/**
 * GET /api/patients/:id/family-history
 * Retrieves active family medical history records.
 * The owning patient and authenticated doctors
 * have read-only access.
 */
router.get(
  '/:id/family-history',
  isAuthenticated,
  authorize(
    'patient',
    'doctor'
  ),
  getFamilyHistoryController
);

/**
 * POST /api/patients/:id/family-history
 * Adds a family medical history record to the
 * authenticated patient's own profile.
 */
router.post(
  '/:id/family-history',
  isAuthenticated,
  authorize('patient'),
  addFamilyHistoryController
);

/**
 * DELETE /api/patients/:id/family-history/:familyHistoryId
 * Removes a family medical history record from the
 * authenticated patient's active profile.
 */
router.delete(
  '/:id/family-history/:familyHistoryId',
  isAuthenticated,
  authorize('patient'),
  deleteFamilyHistoryController
);

/* =========================================================
   VACCINATIONS
========================================================= */

/**
 * AI Scan Route
 * Must appear before generic vaccination routes.
 */
router.post(
  '/:id/vaccinations/scan',
  upload.single('image'),
  extractVaccinationDataController
);

/**
 * Bulk Insert Route
 */
router.post(
  '/:id/vaccinations/bulk',
  addBulkVaccinationsController
);

router.get(
  '/:id/vaccinations',
  getVaccinationsController
);

router.post(
  '/:id/vaccinations',
  addVaccinationController
);

router.delete(
  '/:id/vaccinations/:vaccinationId',
  deleteVaccinationController
);

/* =========================================================
   PRESCRIPTIONS
========================================================= */

router.get(
  '/:id/prescriptions',
  getPatientPrescriptionsController
);

/* =========================================================
   HISTORY SUMMARY
========================================================= */

/**
 * GET /api/patients/:id/summary
 *
 * AI history summaries are available only to
 * authenticated patients and doctors.
 *
 * During a doctor consultation, appointmentId may be
 * supplied so the summary follows the same temporary
 * consent access rules as medical records.
 */
router.get(
  '/:id/summary',
  isAuthenticated,
  authorize(
    'patient',
    'doctor'
  ),
  getPatientHistorySummaryController
);

/* =========================================================
   LAB REPORTS
========================================================= */

router.get(
  '/:id/lab-reports',
  getLabReportsController
);

router.put(
  '/:id/lab-reports/:reportId/read',
  markLabReportAsReadController
);

/* =========================================================
   APPOINTMENTS
========================================================= */

router.get(
  '/:id/appointments',
  getPatientAppointmentsController
);

/* =========================================================
   PATIENT AI CHAT
========================================================= */

/**
 * Rate limiter for AI Chat.
 * Max 500 requests per minute per IP.
 */
const chatRateLimiter =
  rateLimit({
    windowMs:
      1 * 60 * 1000,

    max:
      500,

    message: {
      success: false,
      message:
        'Too many messages sent. Please wait a minute.'
    }
  });

/**
 * POST /api/patients/:id/chat
 */
router.post(
  '/:id/chat',
  chatRateLimiter,
  generatePatientChatController
);

module.exports = router;