/**
 * @file    patient.routes.js
 * @module  Patient
 * @desc    Express route definitions for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');

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
  addBulkVaccinationsController,
  deleteVaccinationController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientHistorySummaryController,
  extractVaccinationDataController,
  getLabReportsController,
  markLabReportAsReadController,
  getPatientAppointmentsController,
} = require('./patient.controller');

// Import the new Consent Controller (Epic 8.12)
const consentController = require('./consent.controller');
const { upload } = require('../../middleware/upload');

// Staff-facing route (Requires Auth + Specific Roles)
router.get('/qr/:qrCodeId', isAuthenticated, authorize('doctor', 'pharmacist', 'hospital_staff', 'admin', 'emergency'), getPatientByQrCodeController);

// Patient & Staff-facing routes (Requires Auth)
router.get('/:id', isAuthenticated, getPatientController);
router.put('/:id', isAuthenticated, updatePatientController);
router.post('/:id/photo', isAuthenticated, upload.single('photo'), uploadPatientPhotoController);

// Privacy & Consent Settings Routes
router.get('/:id/consent', isAuthenticated, consentController.getConsent);
router.put('/:id/consent', isAuthenticated, consentController.updateConsent);

router.get('/:id/medical-records', isAuthenticated, getMedicalRecordsController);
router.get('/:id/allergies', isAuthenticated, getAllergiesController);
router.post('/:id/allergies', isAuthenticated, addAllergyController);
router.delete('/:id/allergies/:allergyId', isAuthenticated, deleteAllergyController);
router.get('/:id/conditions', isAuthenticated, getConditionsController);
router.post('/:id/conditions', isAuthenticated, addConditionController);
router.delete('/:id/conditions/:conditionId', isAuthenticated, deleteConditionController);

// AI Scan Route (Must be before generic /:vaccinationId)
router.post('/:id/vaccinations/scan', isAuthenticated, upload.single('image'), extractVaccinationDataController);

// Bulk Insert Route (Must be before generic /:vaccinationId)
router.post('/:id/vaccinations/bulk', isAuthenticated, addBulkVaccinationsController);

router.get('/:id/vaccinations', isAuthenticated, getVaccinationsController);
router.post('/:id/vaccinations', isAuthenticated, addVaccinationController);
router.delete('/:id/vaccinations/:vaccinationId', isAuthenticated, deleteVaccinationController);

router.get('/:id/prescriptions', isAuthenticated, getPatientPrescriptionsController);
router.get('/:id/summary', isAuthenticated, getPatientHistorySummaryController);

// Lab Reports Route
router.get('/:id/lab-reports', isAuthenticated, getLabReportsController);
router.put('/:id/lab-reports/:reportId/read', isAuthenticated, markLabReportAsReadController);

router.get('/:id/appointments', isAuthenticated, getPatientAppointmentsController);

module.exports = router;