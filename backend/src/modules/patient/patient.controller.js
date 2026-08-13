/**
 * @file    patient.controller.js
 * @module  Patient
 * @desc    HTTP request handlers for the patient module.
 * Reads request data, calls the service, and sends responses.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientService = require('./patient.service');

/**
 * Handles GET /api/patients/:id
 * Returns the full profile of a patient by their UUID.
 */
const getPatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientProfile(id);

    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: patient,
    });
  } catch (error) {
    console.error('getPatientController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles PUT /api/patients/:id
 * Updates editable fields on a patient profile.
 */
const updatePatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientService.updatePatientProfile(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updatePatientController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/:id/medical-records
 * Returns all medical records for a patient, newest first.
 */
const getMedicalRecordsController = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await patientService.getMedicalRecords(id);

    res.status(200).json({
      success: true,
      message: 'Medical records retrieved successfully',
      data: records,
    });
  } catch (error) {
    console.error('getMedicalRecordsController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/:id/allergies
 * Returns all allergy records for a patient.
 */
const getAllergiesController = async (req, res) => {
  try {
    const { id } = req.params;
    const allergies = await patientService.getAllergies(id);

    res.status(200).json({
      success: true,
      message: 'Allergies retrieved successfully',
      data: allergies,
    });
  } catch (error) {
    console.error('getAllergiesController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles POST /api/patients/:id/allergies
 * Adds a new allergy record for a patient.
 * Body: { allergen, severity, notes (optional) }
 */
const addAllergyController = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergen, severity, notes } = req.body || {};

    const allergy = await patientService.addAllergy(id, allergen, severity, notes);

    res.status(201).json({
      success: true,
      message: 'Allergy added successfully',
      data: allergy,
    });
  } catch (error) {
    console.error('addAllergyController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles DELETE /api/patients/:id/allergies/:allergyId
 * Deletes a specific allergy record for a patient.
 */
const deleteAllergyController = async (req, res) => {
  try {
    const { id, allergyId } = req.params;
    await patientService.deleteAllergy(id, allergyId);

    res.status(200).json({
      success: true,
      message: 'Allergy deleted successfully',
    });
  } catch (error) {
    console.error('deleteAllergyController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/:id/conditions
 * Returns all chronic conditions for a patient.
 */
const getConditionsController = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = await patientService.getConditions(id);

    res.status(200).json({
      success: true,
      message: 'Conditions retrieved successfully',
      data: conditions,
    });
  } catch (error) {
    console.error('getConditionsController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles POST /api/patients/:id/conditions
 * Adds a new chronic condition record for a patient.
 * Body: { condition, diagnosedAt, notes, isPriority }
 */
const addConditionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, diagnosedAt, notes, isPriority } = req.body || {};

    const newCondition = await patientService.addCondition(
      id,
      condition,
      diagnosedAt,
      notes,
      isPriority
    );

    res.status(201).json({
      success: true,
      message: 'Condition added successfully',
      data: newCondition,
    });
  } catch (error) {
    console.error('addConditionController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles DELETE /api/patients/:id/conditions/:conditionId
 * Deletes a specific chronic condition record for a patient.
 */
const deleteConditionController = async (req, res) => {
  try {
    const { id, conditionId } = req.params;
    await patientService.deleteCondition(id, conditionId);

    res.status(200).json({
      success: true,
      message: 'Condition deleted successfully',
    });
  } catch (error) {
    console.error('deleteConditionController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/:id/vaccinations
 * Returns all vaccination records for a patient.
 */
const getVaccinationsController = async (req, res) => {
  try {
    const { id } = req.params;
    const vaccinations = await patientService.getVaccinations(id);

    res.status(200).json({
      success: true,
      message: 'Vaccinations retrieved successfully',
      data: vaccinations,
    });
  } catch (error) {
    console.error('getVaccinationsController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles POST /api/patients/:id/vaccinations
 * Adds a new vaccination record for a patient.
 * Body: { vaccineName, dateAdministered, doseNumber, notes }
 */
const addVaccinationController = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccineName, dateAdministered, doseNumber, notes } = req.body || {};

    const newVaccination = await patientService.addVaccination(
      id,
      vaccineName,
      dateAdministered,
      doseNumber,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Vaccination added successfully',
      data: newVaccination,
    });
  } catch (error) {
    console.error('addVaccinationController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles DELETE /api/patients/:id/vaccinations/:vaccinationId
 * Deletes a specific vaccination record for a patient.
 */
const deleteVaccinationController = async (req, res) => {
  try {
    const { id, vaccinationId } = req.params;
    await patientService.deleteVaccination(id, vaccinationId);

    res.status(200).json({
      success: true,
      message: 'Vaccination deleted successfully',
    });
  } catch (error) {
    console.error('deleteVaccinationController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/:id/prescriptions
 * Returns all prescriptions for a patient with their medicine items.
 */
const getPatientPrescriptionsController = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptions = await patientService.getPatientPrescriptions(id);

    res.status(200).json({
      success: true,
      message: 'Prescriptions retrieved successfully',
      data: prescriptions,
    });
  } catch (error) {
    console.error('getPatientPrescriptionsController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles GET /api/patients/qr/:qrCodeId
 * Returns a patient's full profile looked up by their QR code ID.
 */
const getPatientByQrCodeController = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const patient = await patientService.getPatientByQrCode(qrCodeId);
    res.status(200).json({
      success: true,
      message: 'Patient found',
      data: patient,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles generating an AI summary of the patient's history.
 */
const getPatientHistorySummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await patientService.getPatientHistorySummary(id);
    res.status(200).json({
      success: true,
      message: 'AI summary generated successfully',
      data,
    });
  } catch (error) {
    console.error('getPatientHistorySummaryController Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate AI summary',
    });
  }
};

/**
 * Handles POST /api/patients/:id/photo
 * Uploads a new profile photo for a patient. Expects a multipart/form-data
 * body with a single file field named "photo" (handled by multer upstream).
 */
const uploadPatientPhotoController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientService.uploadPatientPhoto(id, req.file);

    res.status(200).json({
      success: true,
      message: 'Patient photo uploaded successfully',
      data: updated,
    });
  } catch (error) {
    console.error('uploadPatientPhotoController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

/**
 * Handles POST /api/patients/:id/vaccinations/scan
 * Uploads an image of a vaccination card and extracts data using AI.
 * Does NOT save to the database — only returns the parsed JSON.
 */
const extractVaccinationDataController = async (req, res) => {
  try {
    // req.file is populated by the multer upload middleware
    const extractedData = await patientService.extractVaccinationDataFromImage(req.file);

    res.status(200).json({
      success: true,
      message: 'Vaccination data extracted successfully',
      data: extractedData,
    });
  } catch (error) {
    console.error('extractVaccinationDataController error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
  }
};

module.exports = {
  getPatientController,
  updatePatientController,
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
  getPatientHistorySummaryController,
  uploadPatientPhotoController,
  extractVaccinationDataController // Exporting the new AI extraction controller
};