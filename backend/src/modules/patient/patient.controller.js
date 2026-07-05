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
    const { allergen, severity, notes } = req.body;

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

module.exports = {
  getPatientController,
  updatePatientController,
  getMedicalRecordsController,
  getAllergiesController,
  addAllergyController,
  deleteAllergyController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientHistorySummaryController,
  uploadPatientPhotoController
};