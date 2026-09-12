/**
 * @file    patient.controller.js
 * @module  Patient
 * @desc    HTTP request handlers for the patient module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientService = require('./patient.service');
const { logAudit } = require('../../middleware/auditLog');
const { generateAIResponse } = require('../../utils/ai.util');

const getPatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientProfile(id);
    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved',
      data: patient
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const updatePatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientService.updatePatientProfile(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Patient profile updated',
      data: updated
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getMedicalRecordsController = async (req, res) => {
  try {
    const { id } = req.params;

    // Fallback: If auth middleware is missing, catch the role from the query string
    const user = req.session?.user || req.user || {
      role: req.query.role
    };

    // Pass the user to the service so it knows WHO is asking
    const records = await patientService.getMedicalRecords(id, user);

    res.status(200).json({
      success: true,
      message: 'Medical records retrieved',
      data: records
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getAllergiesController = async (req, res) => {
  try {
    const { id } = req.params;
    const allergies = await patientService.getAllergies(id);

    res.status(200).json({
      success: true,
      message: 'Allergies retrieved',
      data: allergies
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const addAllergyController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      allergen,
      severity,
      notes
    } = req.body || {};

    const allergy = await patientService.addAllergy(
      id,
      allergen,
      severity,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Allergy added',
      data: allergy
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deleteAllergyController = async (req, res) => {
  try {
    const {
      id,
      allergyId
    } = req.params;

    await patientService.deleteAllergy(
      id,
      allergyId
    );

    res.status(200).json({
      success: true,
      message: 'Allergy deleted successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getConditionsController = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = await patientService.getConditions(id);

    res.status(200).json({
      success: true,
      message: 'Conditions retrieved',
      data: conditions
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const addConditionController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      condition,
      diagnosedAt,
      notes,
      isPriority
    } = req.body || {};

    const newCondition = await patientService.addCondition(
      id,
      condition,
      diagnosedAt,
      notes,
      isPriority
    );

    res.status(201).json({
      success: true,
      message: 'Condition added',
      data: newCondition
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deleteConditionController = async (req, res) => {
  try {
    const {
      id,
      conditionId
    } = req.params;

    await patientService.deleteCondition(
      id,
      conditionId
    );

    res.status(200).json({
      success: true,
      message: 'Condition deleted successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Retrieves all active medical devices and implants
 * belonging to the authenticated patient.
 */
const getMedicalDevicesController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session?.user;

    const devices = await patientService.getMedicalDevices(
      id,
      user
    );

    res.status(200).json({
      success: true,
      message: 'Medical devices retrieved',
      data: devices
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Adds a medical device or implant to the
 * authenticated patient's profile.
 */
const addMedicalDeviceController = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      deviceName,
      deviceType,
      implantedAt,
      notes,
      isEmergencyRelevant
    } = req.body || {};

    const user = req.session?.user;

    const device = await patientService.addMedicalDevice(
      id,
      deviceName,
      deviceType,
      implantedAt,
      notes,
      isEmergencyRelevant,
      user
    );

    res.status(201).json({
      success: true,
      message: 'Medical device added successfully',
      data: device
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Removes a medical device from the patient's
 * active profile while preserving its database history.
 */
const deleteMedicalDeviceController = async (req, res) => {
  try {
    const {
      id,
      deviceId
    } = req.params;

    const user = req.session?.user;

    await patientService.deleteMedicalDevice(
      id,
      deviceId,
      user
    );

    res.status(200).json({
      success: true,
      message: 'Medical device removed successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getVaccinationsController = async (req, res) => {
  try {
    const { id } = req.params;
    const vaccinations = await patientService.getVaccinations(id);

    res.status(200).json({
      success: true,
      message: 'Vaccinations retrieved',
      data: vaccinations
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const addVaccinationController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vaccineName,
      dateAdministered,
      doseNumber,
      notes
    } = req.body || {};

    const newVaccination = await patientService.addVaccination(
      id,
      vaccineName,
      dateAdministered,
      doseNumber,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Vaccination added',
      data: newVaccination
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const addBulkVaccinationsController = async (req, res) => {
  try {
    const { id } = req.params;
    const { vaccinations } = req.body || {};

    const savedRecords = await patientService.addBulkVaccinations(
      id,
      vaccinations
    );

    res.status(201).json({
      success: true,
      message: 'Batch vaccinations saved',
      data: savedRecords
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const deleteVaccinationController = async (req, res) => {
  try {
    const {
      id,
      vaccinationId
    } = req.params;

    await patientService.deleteVaccination(
      id,
      vaccinationId
    );

    res.status(200).json({
      success: true,
      message: 'Vaccination deleted successfully'
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const extractVaccinationDataController = async (req, res) => {
  try {
    const extractedDataArray =
      await patientService.extractVaccinationDataFromImage(
        req.file
      );

    res.status(200).json({
      success: true,
      message: 'Vaccination data extracted successfully',
      data: extractedDataArray
    });
  } catch (error) {
    console.error(
      'extractVaccinationDataController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getPatientPrescriptionsController = async (req, res) => {
  try {
    const { id } = req.params;

    const prescriptions =
      await patientService.getPatientPrescriptions(id);

    res.status(200).json({
      success: true,
      message: 'Prescriptions retrieved',
      data: prescriptions
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getPatientByQrCodeController = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const patient =
      await patientService.getPatientByQrCode(
        qrCodeId
      );

    res.status(200).json({
      success: true,
      message: 'Patient found',
      data: patient
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Handles GET /api/patients/nic/:nic
 * Retrieves a patient profile using their NIC.
 * Intended for pharmacy staff fallback lookup when
 * a patient QR code is unavailable.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPatientByNicController = async (req, res) => {
  try {
    const { nic } = req.params;

    const patient =
      await patientService.getPatientByNic(
        nic
      );

    res.status(200).json({
      success: true,
      message: 'Patient found',
      data: patient
    });

  } catch (error) {
    console.error(
      'getPatientByNicController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error'
    });
  }
};

const getPatientHistorySummaryController = async (req, res) => {
  try {
    const { id } = req.params;

    // Fallback: Catch the role from the query string
    const user =
      req.session?.user ||
      req.user ||
      {
        role: req.query.role
      };

    // Pass the user down so the AI respects privacy locks
    const data =
      await patientService.getPatientHistorySummary(
        id,
        user
      );

    res.status(200).json({
      success: true,
      message: 'AI summary generated',
      data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        'Failed to generate AI summary'
    });
  }
};

const uploadPatientPhotoController = async (req, res) => {
  try {
    const { id } = req.params;

    const updated =
      await patientService.uploadPatientPhoto(
        id,
        req.file
      );

    res.status(200).json({
      success: true,
      message: 'Patient photo uploaded',
      data: updated
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getLabReportsController = async (req, res) => {
  try {
    const { id } = req.params;

    const reports =
      await patientService.getLabReports(id);

    res.status(200).json({
      success: true,
      message: 'Lab reports retrieved',
      data: reports
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const markLabReportAsReadController = async (req, res) => {
  try {
    const {
      id,
      reportId
    } = req.params;

    const updated =
      await patientService.markLabReportAsRead(
        id,
        reportId
      );

    res.status(200).json({
      success: true,
      message: 'Lab report marked as read',
      data: updated
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getPatientAppointmentsController = async (req, res) => {
  try {
    const { id } = req.params;

    const appointments =
      await patientService.getPatientAppointments(id);

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved',
      data: appointments
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Context-Aware AI Chat Controller (RAG Architecture)
 * Injects deeply-nested DB data and chat history directly into the prompt!
 */
const generatePatientChatController = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract history from the request body
    const {
      message,
      language = 'English',
      history = []
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // 1. Fetch ALL relevant patient data concurrently
    const [
      patientProfile,
      prescriptions,
      conditions,
      allergies
    ] = await Promise.all([
      patientService.getPatientProfile(id).catch(() => ({})),
      patientService.getPatientPrescriptions(id).catch(() => []),
      patientService.getConditions(id).catch(() => []),
      patientService.getAllergies(id).catch(() => [])
    ]);

    // 2. Extract Name and Age
    const name =
      patientProfile.full_name ||
      patientProfile.firstName ||
      'Patient';

    let age = 'Unknown';

    if (patientProfile.date_of_birth) {
      const birthYear =
        new Date(
          patientProfile.date_of_birth
        ).getFullYear();

      age =
        new Date().getFullYear() -
        birthYear;
    }

    // 3. Extract Nested Data arrays
    let activeMeds = 'None recorded';

    if (prescriptions.length > 0) {
      const allMeds = [];

      prescriptions.forEach(p => {
        if (
          p.items &&
          p.items.length > 0
        ) {
          p.items.forEach(item => {
            if (item.medicine_name) {
              allMeds.push(
                item.medicine_name
              );
            }
          });
        }
      });

      if (allMeds.length > 0) {
        activeMeds =
          allMeds.join(', ');
      }
    }

    const chronicConditions =
      conditions.length > 0
        ? conditions
            .map(
              c =>
                c.condition ||
                'Unknown Condition'
            )
            .join(', ')
        : 'None recorded';

    const knownAllergies =
      allergies.length > 0
        ? allergies
            .map(
              a =>
                a.allergen ||
                'Unknown Allergen'
            )
            .join(', ')
        : 'None recorded';

    // 4. Format Previous Chat History
    let historyContext = '';

    if (
      history &&
      history.length > 0
    ) {
      historyContext =
        '\n--- PREVIOUS CONVERSATION HISTORY ---\n';

      history.forEach(msg => {
        // Map 'user' to Patient, and 'ai' to AI Assistant
        const speaker =
          msg.role === 'user'
            ? 'Patient'
            : 'AI Assistant';

        historyContext +=
          `${speaker}: ${msg.content}\n`;
      });
    }

    // 5. Build the System Prompt
    const systemPrompt = `
      You are the Care4U AI Medical Assistant. 
      You are talking directly to a patient on the Care4U app.

      --- PATIENT'S MEDICAL PROFILE ---
      Name: ${name}
      Age: ${age}
      Gender: ${patientProfile.gender || 'Unknown'}
      Active Prescriptions: ${activeMeds}
      Chronic Conditions: ${chronicConditions}
      Known Allergies: ${knownAllergies}
      ${historyContext}
      
      --- STRICT GUARDRAILS ---
      1. Address the patient by their first name (${name.split(' ')[0]}) to be friendly.
      2. If they ask about their medications or health, refer strictly to the profile above.
      3. NEVER diagnose a new condition or prescribe actual medication.
      4. Use markdown tables for formatting data when helpful.
      5. NEVER use HTML tags like <br> in your response. Use standard sentences instead.
      6. Always respond in this language: ${language}.

      --- CURRENT PATIENT MESSAGE ---
      "${message}"
    `;

    // 6. Send to AI
    const reply =
      await generateAIResponse(
        systemPrompt
      );

    // 7. Log interaction
    const userId =
      req.session?.user?.id ||
      null;

    await logAudit(
      userId,
      'AI_CHAT_INTERACTION',
      'patient',
      id,
      {
        prompt: message,
        language
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'AI response generated',
      data: {
        reply
      }
    });

  } catch (error) {
    console.error(
      'Error generating AI response:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response'
    });
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
  getMedicalDevicesController,
  addMedicalDeviceController,
  deleteMedicalDeviceController,
  getVaccinationsController,
  addVaccinationController,
  addBulkVaccinationsController,
  deleteVaccinationController,
  getPatientPrescriptionsController,
  getPatientByQrCodeController,
  getPatientByNicController,
  getPatientHistorySummaryController,
  uploadPatientPhotoController,
  extractVaccinationDataController,
  getLabReportsController,
  markLabReportAsReadController,
  getPatientAppointmentsController,
  generatePatientChatController,
};