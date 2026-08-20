/**
 * @file    patient.controller.js
 * @module  Patient
 * @desc    HTTP request handlers for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientService = require('./patient.service');
const { logAudit } = require('../../middleware/auditLog');

const getPatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientProfile(id);
    res.status(200).json({ success: true, message: 'Patient profile retrieved', data: patient });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const updatePatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientService.updatePatientProfile(id, req.body);
    res.status(200).json({ success: true, message: 'Patient profile updated', data: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getMedicalRecordsController = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await patientService.getMedicalRecords(id);
    res.status(200).json({ success: true, message: 'Medical records retrieved', data: records });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getAllergiesController = async (req, res) => {
  try {
    const { id } = req.params;
    const allergies = await patientService.getAllergies(id);
    res.status(200).json({ success: true, message: 'Allergies retrieved', data: allergies });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const addAllergyController = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergen, severity, notes } = req.body || {};
    const allergy = await patientService.addAllergy(id, allergen, severity, notes);
    res.status(201).json({ success: true, message: 'Allergy added', data: allergy });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteAllergyController = async (req, res) => {
  try {
    const { id, allergyId } = req.params;
    await patientService.deleteAllergy(id, allergyId);
    res.status(200).json({ success: true, message: 'Allergy deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getConditionsController = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = await patientService.getConditions(id);
    res.status(200).json({ success: true, message: 'Conditions retrieved', data: conditions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const addConditionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, diagnosedAt, notes, isPriority } = req.body || {};
    const newCondition = await patientService.addCondition(id, condition, diagnosedAt, notes, isPriority);
    res.status(201).json({ success: true, message: 'Condition added', data: newCondition });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteConditionController = async (req, res) => {
  try {
    const { id, conditionId } = req.params;
    await patientService.deleteCondition(id, conditionId);
    res.status(200).json({ success: true, message: 'Condition deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getVaccinationsController = async (req, res) => {
  try {
    const { id } = req.params;
    const vaccinations = await patientService.getVaccinations(id);
    res.status(200).json({ success: true, message: 'Vaccinations retrieved', data: vaccinations });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const addVaccinationController = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccineName, dateAdministered, doseNumber, notes } = req.body || {};
    const newVaccination = await patientService.addVaccination(id, vaccineName, dateAdministered, doseNumber, notes);
    res.status(201).json({ success: true, message: 'Vaccination added', data: newVaccination });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Handles POST /api/patients/:id/vaccinations/bulk
 * Saves an array of parsed vaccinations.
 */
const addBulkVaccinationsController = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccinations } = req.body || {}; // expecting { vaccinations: [...] }
    const savedRecords = await patientService.addBulkVaccinations(id, vaccinations);
    res.status(201).json({ success: true, message: 'Batch vaccinations saved', data: savedRecords });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteVaccinationController = async (req, res) => {
  try {
    const { id, vaccinationId } = req.params;
    await patientService.deleteVaccination(id, vaccinationId);
    res.status(200).json({ success: true, message: 'Vaccination deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const extractVaccinationDataController = async (req, res) => {
  try {
    const extractedDataArray = await patientService.extractVaccinationDataFromImage(req.file);
    res.status(200).json({ success: true, message: 'Vaccination data extracted successfully', data: extractedDataArray });
  } catch (error) {
    console.error('extractVaccinationDataController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getPatientPrescriptionsController = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptions = await patientService.getPatientPrescriptions(id);
    res.status(200).json({ success: true, message: 'Prescriptions retrieved', data: prescriptions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getPatientByQrCodeController = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const patient = await patientService.getPatientByQrCode(qrCodeId);
    res.status(200).json({ success: true, message: 'Patient found', data: patient });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getPatientHistorySummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await patientService.getPatientHistorySummary(id);
    res.status(200).json({ success: true, message: 'AI summary generated', data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to generate AI summary' });
  }
};

const uploadPatientPhotoController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientService.uploadPatientPhoto(id, req.file);
    res.status(200).json({ success: true, message: 'Patient photo uploaded', data: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getLabReportsController = async (req, res) => {
  try {
    const { id } = req.params;
    const reports = await patientService.getLabReports(id);
    res.status(200).json({ success: true, message: 'Lab reports retrieved', data: reports });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const markLabReportAsReadController = async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const updated = await patientService.markLabReportAsRead(id, reportId);
    res.status(200).json({ success: true, message: 'Lab report marked as read', data: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const generatePatientChatController = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, language } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const data = await patientService.generatePatientChatResponse(id, message, language);

    // Audit Logging: Log every AI interaction as required by ethical governance
    const userId = req.session?.user?.id || null; // Fallback to patient ID if auth isn't fully wired for this test
    await logAudit(
      userId,
      'AI_CHAT_INTERACTION',
      'patient',
      id,
      { prompt: message, language }, // We omit the full response to save DB space, but log the exact prompt
      req.ip
    );

    res.status(200).json({ success: true, message: 'AI response generated', data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
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
  addBulkVaccinationsController, 
  deleteVaccinationController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientHistorySummaryController,
  uploadPatientPhotoController,
  extractVaccinationDataController,
  getLabReportsController,
  markLabReportAsReadController,
  generatePatientChatController,
};