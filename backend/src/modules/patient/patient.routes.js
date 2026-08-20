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

const { upload } = require('../../middleware/upload');

router.get('/qr/:qrCodeId', getPatientByQrCodeController);
router.get('/:id', getPatientController);
router.put('/:id', updatePatientController);
router.post('/:id/photo', upload.single('photo'), uploadPatientPhotoController);
router.get('/:id/medical-records', getMedicalRecordsController);
router.get('/:id/allergies', getAllergiesController);
router.post('/:id/allergies', addAllergyController);
router.delete('/:id/allergies/:allergyId', deleteAllergyController);
router.get('/:id/conditions', getConditionsController);
router.post('/:id/conditions', addConditionController);
router.delete('/:id/conditions/:conditionId', deleteConditionController);

// AI Scan Route (Must be before generic /:vaccinationId)
router.post('/:id/vaccinations/scan', upload.single('image'), extractVaccinationDataController);

// Bulk Insert Route (Must be before generic /:vaccinationId)
router.post('/:id/vaccinations/bulk', addBulkVaccinationsController);

router.get('/:id/vaccinations', getVaccinationsController);
router.post('/:id/vaccinations', addVaccinationController);
router.delete('/:id/vaccinations/:vaccinationId', deleteVaccinationController);

router.get('/:id/prescriptions', getPatientPrescriptionsController);
router.get('/:id/summary', getPatientHistorySummaryController);

// Lab Reports Route
router.get('/:id/lab-reports', getLabReportsController);
router.put('/:id/lab-reports/:reportId/read', markLabReportAsReadController);

router.get('/:id/appointments', getPatientAppointmentsController);

module.exports = router;