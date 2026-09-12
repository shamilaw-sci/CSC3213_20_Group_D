/**
 * @file    patient.service.js
 * @module  Patient
 * @desc    Business logic for patient profile management.
 *          Sits between the controller and the repository.
 *          Doctor privacy and consent enforcement added in CARE4U-284 (Epic 8.12).
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientRepository = require('./patient.repository');
const consentRepository = require('./consent.repository'); // Import for Epic 8.12 Privacy Checks
const { generateAIResponse, generateAIVisionResponse } = require('../../utils/ai.util');
const { supabase } = require('../../config/supabase');

const PHOTO_BUCKET = 'patient-photos';

/**
 * Retrieves a patient's full profile by their patient UUID.
 */
const getPatientProfile = async (id) => {
  const patient = await patientRepository.getPatientById(id);
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return patient;
};

/**
 * Updates editable fields on a patient profile.
 */
const updatePatientProfile = async (id, data) => {
  const existing = await patientRepository.getPatientById(id);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = {
    full_name:                      data.full_name,
    blood_group:                    data.blood_group,
    emergency_contact_name:         data.emergency_contact_name,
    emergency_contact_phone:        data.emergency_contact_phone,
    emergency_contact_relationship: data.emergency_contact_relationship,
  };

  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
  );

  return await patientRepository.updatePatient(id, filteredData);
};

/**
 * Uploads a new profile photo for a patient to Supabase Storage.
 */
const uploadPatientPhoto = async (patientId, file) => {
  if (!file) {
    const error = new Error('No photo file was provided');
    error.statusCode = 400;
    throw error;
  }

  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const storagePath = `${patientId}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    const error = new Error('Failed to upload photo to storage');
    error.statusCode = 500;
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(storagePath);

  const photoUrl = `${publicUrlData.publicUrl}?updated=${Date.now()}`;
  return await patientRepository.updatePatientPhoto(patientId, photoUrl);
};

/**
 * Retrieves all medical records for a patient.
 * EPIC 8.12: Enforces Privacy & Consent Locks if the requester is a doctor.
 * Features Smart Keyword Filtering across the entire record.
 */
const getMedicalRecords = async (patientId, requestingUser) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  
  // 1. Fetch all records from the database
  const records = await patientRepository.getMedicalRecords(patientId);

  // 2. OWNER BYPASS: If the user requesting the records IS the patient themselves, 
  // NEVER hide the records. This fixes testing cookie mix-ups!
  if (requestingUser && requestingUser.id === existing.user_id) {
    return records;
  }

  // 3. PRIVACY ENFORCEMENT LOGIC
  // If the requester is a doctor (and NOT the patient themselves), enforce the locks.
  if (requestingUser && requestingUser.role?.toLowerCase() === 'doctor') {
    const consentSettings = await consentRepository.getConsentSettings(patientId);
    
    // Convert locked categories to lowercase for easy matching
    const lockedCategories = (consentSettings.locked_categories || []).map(cat => cat.toLowerCase());
    
    // Smart Filter: Hide the record if the locked keyword appears anywhere in the text
    const allowedRecords = records.filter(record => {
      const searchText = `${record.record_type} ${record.title} ${record.description} ${record.chief_complaint} ${record.diagnosis}`.toLowerCase();
      
      const hasLockedKeyword = lockedCategories.some(lockedCat => searchText.includes(lockedCat));
      
      // Only return the record if it DOES NOT contain a locked keyword
      return !hasLockedKeyword;
    });
    
    return allowedRecords;
  }

  // If it's anyone else (like a system admin), they see everything.
  return records;
};

/**
 * Retrieves all allergies for a patient.
 */
const getAllergies = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return await patientRepository.getAllergies(patientId);
};

/**
 * Adds a new allergy record for a patient.
 */
const addAllergy = async (patientId, allergen, severity, notes) => {
  if (!allergen || !severity) {
    const error = new Error('allergen and severity are required');
    error.statusCode = 400;
    throw error;
  }

  const validSeverities = ['mild', 'moderate', 'severe'];
  if (!validSeverities.includes(severity.toLowerCase())) {
    const error = new Error('severity must be mild, moderate, or severe');
    error.statusCode = 400;
    throw error;
  }

  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return await patientRepository.addAllergy(patientId, allergen, severity.toLowerCase(), notes);
};

/**
 * Deletes an allergy record belonging to a specific patient.
 */
const deleteAllergy = async (patientId, allergyId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await patientRepository.deleteAllergy(patientId, allergyId);
  if (!deleted) {
    const error = new Error('Allergy not found or does not belong to this patient');
    error.statusCode = 404;
    throw error;
  }
};

/**
 * Retrieves all chronic conditions for a patient.
 */
const getConditions = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return await patientRepository.getConditionsByPatientId(patientId);
};

/**
 * Adds a new chronic condition record for a patient.
 */
const addCondition = async (patientId, condition, diagnosedAt, notes, isPriority) => {
  if (!condition) {
    const error = new Error('condition name is required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return await patientRepository.addCondition(patientId, condition, diagnosedAt, notes, isPriority);
};

/**
 * Deletes a chronic condition record belonging to a specific patient.
 */
const deleteCondition = async (patientId, conditionId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await patientRepository.deleteCondition(patientId, conditionId);
  if (!deleted) {
    const error = new Error('Condition not found or does not belong to this patient');
    error.statusCode = 404;
    throw error;
  }
};

/**
 * Ensures that a medical-device management request is being
 * performed by the patient who owns the requested profile.
 */
const ensurePatientOwnsMedicalDeviceData = (patientId, requestingUser) => {
  if (!requestingUser) {
    const error = new Error('Authentication is required');
    error.statusCode = 401;
    throw error;
  }

  if (
    requestingUser.role !== 'patient' ||
    String(requestingUser.profile_id) !== String(patientId)
  ) {
    const error = new Error('You can only manage medical devices on your own patient profile');
    error.statusCode = 403;
    throw error;
  }
};

/**
 * Retrieves all active medical devices and implants for a patient.
 */
const getMedicalDevices = async (
  patientId,
  requestingUser
) => {
  ensurePatientOwnsMedicalDeviceData(
    patientId,
    requestingUser
  );

  const existing =
    await patientRepository.getPatientById(
      patientId
    );

  if (!existing) {
    const error =
      new Error('Patient not found');

    error.statusCode = 404;
    throw error;
  }

  return await patientRepository
    .getMedicalDevicesByPatientId(
      patientId
    );
};

/**
 * Adds a medical device or implant to a patient's profile.
 */
const addMedicalDevice = async (
  patientId,
  deviceName,
  deviceType,
  implantedAt,
  notes,
  isEmergencyRelevant,
  requestingUser
) => {
  ensurePatientOwnsMedicalDeviceData(
    patientId,
    requestingUser
  );

  if (
    !deviceName ||
    !deviceName.trim()
  ) {
    const error =
      new Error('Device name is required');

    error.statusCode = 400;
    throw error;
  }

  const normalizedDeviceName =
    deviceName.trim();

  if (
    normalizedDeviceName.length > 150
  ) {
    const error =
      new Error('Device name must be 150 characters or fewer');

    error.statusCode = 400;
    throw error;
  }

  const normalizedDeviceType =
    deviceType?.trim() || null;

  if (
    normalizedDeviceType &&
    normalizedDeviceType.length > 100
  ) {
    const error =
      new Error('Device type must be 100 characters or fewer');

    error.statusCode = 400;
    throw error;
  }

  let normalizedImplantedAt = null;

  if (implantedAt) {
    const implantedDate =
      new Date(implantedAt);

    if (
      Number.isNaN(
        implantedDate.getTime()
      )
    ) {
      const error =
        new Error('Implanted date is invalid');

      error.statusCode = 400;
      throw error;
    }

    const today =
      new Date();

    today.setHours(
      23,
      59,
      59,
      999
    );

    if (
      implantedDate > today
    ) {
      const error =
        new Error('Implanted date cannot be in the future');

      error.statusCode = 400;
      throw error;
    }

    normalizedImplantedAt =
      implantedAt;
  }

  const existing =
    await patientRepository.getPatientById(
      patientId
    );

  if (!existing) {
    const error =
      new Error('Patient not found');

    error.statusCode = 404;
    throw error;
  }

  const emergencyRelevant =
    isEmergencyRelevant === undefined
      ? true
      : Boolean(
          isEmergencyRelevant
        );

  return await patientRepository
    .addMedicalDevice(
      patientId,
      normalizedDeviceName,
      normalizedDeviceType,
      normalizedImplantedAt,
      notes?.trim() || null,
      emergencyRelevant
    );
};

/**
 * Removes a medical device or implant from a patient's
 * active profile while preserving the historical row.
 */
const deleteMedicalDevice = async (
  patientId,
  deviceId,
  requestingUser
) => {
  ensurePatientOwnsMedicalDeviceData(
    patientId,
    requestingUser
  );

  if (!deviceId) {
    const error =
      new Error('Medical device ID is required');

    error.statusCode = 400;
    throw error;
  }

  const existing =
    await patientRepository.getPatientById(
      patientId
    );

  if (!existing) {
    const error =
      new Error('Patient not found');

    error.statusCode = 404;
    throw error;
  }

  const deleted =
    await patientRepository.deleteMedicalDevice(
      patientId,
      deviceId
    );

  if (!deleted) {
    const error =
      new Error(
        'Medical device not found or does not belong to this patient'
      );

    error.statusCode = 404;
    throw error;
  }
};

/**
 * Retrieves all vaccination records for a patient.
 */
const getVaccinations = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return await patientRepository.getVaccinationsByPatientId(patientId);
};

/**
 * Adds a new vaccination record for a patient.
 */
const addVaccination = async (patientId, vaccineName, dateAdministered, doseNumber, notes) => {
  if (!vaccineName || !dateAdministered) {
    const error = new Error('vaccineName and dateAdministered are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return await patientRepository.addVaccination(patientId, vaccineName, dateAdministered, doseNumber, notes);
};

/**
 * Adds MULTIPLE vaccination records for a patient (Bulk Insert).
 * Loops over the array and relies on the existing addVaccination repository method.
 */
const addBulkVaccinations = async (patientId, vaccinationsArray) => {
  if (!Array.isArray(vaccinationsArray) || vaccinationsArray.length === 0) {
    const error = new Error('A valid array of vaccinations is required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Execute all insertions concurrently
  const insertedRecords = await Promise.all(
    vaccinationsArray.map(async (vac) => {
      // Skip empty/invalid rows from the UI
      if (!vac.vaccineName || !vac.dateAdministered) return null;
      return await patientRepository.addVaccination(
        patientId,
        vac.vaccineName,
        vac.dateAdministered,
        vac.doseNumber,
        vac.notes
      );
    })
  );

  // Filter out any nulls (skipped rows)
  return insertedRecords.filter(record => record !== null);
};

/**
 * Deletes a vaccination record belonging to a specific patient.
 */
const deleteVaccination = async (patientId, vaccinationId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await patientRepository.deleteVaccination(patientId, vaccinationId);
  if (!deleted) {
    const error = new Error('Vaccination not found or does not belong to this patient');
    error.statusCode = 404;
    throw error;
  }
};

/**
 * Retrieves all prescriptions for a patient with their medicine items.
 */
const getPatientPrescriptions = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return await patientRepository.getPatientPrescriptions(patientId);
};

/**
 * Retrieves a patient profile using their QR code ID, including conditions.
 */
const getPatientByQrCode = async (qrCodeId) => {
  const patient = await patientRepository.getPatientByQrCodeId(qrCodeId);
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const conditions = await patientRepository.getConditionsByPatientId(patient.id);

  return {
    ...patient,
    conditions
  };
};

/**
 * Retrieves a patient profile using their NIC.
 * Used by pharmacy staff as a fallback lookup method
 * when a patient QR code is unavailable.
 *
 * @param {string} nic - Patient NIC number
 * @returns {Promise<Object>} Patient profile
 */
const getPatientByNic = async (nic) => {
  if (!nic || !nic.trim()) {
    const error = new Error(
      'NIC is required'
    );

    error.statusCode = 400;
    throw error;
  }

  const patient =
    await patientRepository.getPatientByNic(
      nic.trim()
    );

  if (!patient) {
    const error =
      new Error('Patient not found');

    error.statusCode = 404;
    throw error;
  }

  return patient;
};

/**
 * Uses AI to generate a highly precise clinical summary of a patient's medical history.
 * EPIC 8.12: Now respects privacy locks by passing the requesting user to getMedicalRecords.
 */
const getPatientHistorySummary = async (patientId, requestingUser) => {
  // Pass the requestingUser down! The AI will now only summarize ALLOWED records.
  const records = await getMedicalRecords(patientId, requestingUser);
  const conditions = await patientRepository.getConditionsByPatientId(patientId);

  const formattedRecords = records.length > 0 
    ? records.map(r => {
        const recordDate = new Date(r.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        return `[DATE: ${recordDate}] | TYPE: ${r.record_type} | TITLE: ${r.title} | DETAILS: ${r.description || 'None'}`;
      }).join('\n')
    : 'No past medical records found.';

  const formattedConditions = conditions.length > 0
    ? conditions.map(c => {
        const diagnosedDate = c.diagnosed_at
          ? new Date(c.diagnosed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Unknown date';
        return `[CONDITION: ${c.condition}] | DIAGNOSED: ${diagnosedDate} | PRIORITY: ${c.is_priority ? 'Yes' : 'No'} | NOTES: ${c.notes || 'None'}`;
      }).join('\n')
    : 'No chronic conditions recorded.';

  const prompt = `
    You are a clinical UI assistant. Provide a lightning-fast, ultra-concise summary for a doctor who has 30 seconds before a patient walks in.

    ## STRICT UX & ACCURACY RULES:
    1. DO NOT include a consultation timeline.
    2. DO NOT include allergies or chronic conditions in your output.
    3. Use extreme brevity. Fragment sentences are preferred.
    4. Use ONLY information explicitly present in the records. Do not diagnose.
    5. NEVER alter or guess dates.
    6. Records are provided oldest to newest. Read ALL of them before writing any section.
    7. If any record contains follow-up instructions, check later records. If not completed, list in URGENT ALERTS.
    8. A medication belongs in ACTIVE PLAN if it treats an ongoing/chronic issue.
    9. LATEST LAB RESULTS must be EXHAUSTIVE, not curated.

    ## REQUIRED OUTPUT FORMAT (Use exactly these 4 headers):
    ### 1. URGENT ALERTS
    - Bullet points of unresolved follow-ups or red flags.

    ### 2. PATIENT SNAPSHOT
    - Major surgical history, family history, social history.

    ### 3. LATEST LAB RESULTS
    | Test | Result | Status | Date |
    |---|---|---|---|

    ### 4. ACTIVE PLAN
    - Ongoing medications/instructions.

    --- KNOWN CHRONIC CONDITIONS ---
    ${formattedConditions}

    --- PAST MEDICAL RECORDS ---
    ${formattedRecords}
  `;

  const summaryText = await generateAIResponse(prompt);
  return { summary: summaryText };
};

/**
 * Extracts multiple vaccination details from an uploaded CHDR image using AI Vision.
 * Instructs the AI to return strictly formatted JSON array.
 */
const extractVaccinationDataFromImage = async (file) => {
  if (!file) {
    const error = new Error('No image file was provided for scanning');
    error.statusCode = 400;
    throw error;
  }

  const prompt = `
    You are a highly accurate medical data extraction assistant.
    Analyze this image of a vaccination card (often a Sri Lankan CHDR).
    Extract ALL vaccinations that have actually been administered.
    
    ## STRICT RULES:
    1. Look for the "GIVEN ON" or "Administered" column/dates. IGNORE "DUE ON" dates or rows with empty "GIVEN ON" dates.
    2. "vaccineName" should be the standard medical name listed in the row (e.g., "BCG", "OPV/HBV", "DTPw"). Combine them if they share a date.
    3. "dateAdministered" MUST be formatted exactly as YYYY-MM-DD. Convert hand-written dates (e.g., 21/10/09 becomes 2009-10-21). If the year is ambiguous (e.g., '10'), assume 2010. 
    4. "doseNumber" should indicate the age/stage if mentioned (e.g., "Birth", "6 weeks", "10 weeks", "Booster") or leave as "".
    5. Return ONLY a valid JSON ARRAY. Do not include markdown formatting like \`\`\`json or any conversational text.
    
    ## EXPECTED JSON FORMAT:
    [
      {
        "vaccineName": "BCG",
        "dateAdministered": "2009-10-21",
        "doseNumber": "Birth"
      },
      {
        "vaccineName": "OPV / HBV",
        "dateAdministered": "2009-10-21",
        "doseNumber": "Birth"
      }
    ]
  `;

  try {
    const aiResponseText = await generateAIVisionResponse(prompt, file.buffer, file.mimetype);
    
    // Clean the response just in case Gemini stubbornly adds markdown fences despite our instructions
    const cleanedText = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let extractedData = JSON.parse(cleanedText);
    
    // Ensure it always returns an array even if the AI found only 1 record
    if (!Array.isArray(extractedData)) {
      extractedData = [extractedData];
    }
    
    return extractedData;
  } catch (err) {
    console.error('AI Extraction parsing error:', err);
    const error = new Error('Failed to extract recognizable data from the image. Please enter manually.');
    error.statusCode = 500;
    throw error;
  }
};

/**
 * Retrieves all completed laboratory reports for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>}
 */
const getLabReports = async (patientId) => {
  // Ensure the patient exists before querying for their reports
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  
  return await patientRepository.getLabReports(patientId);
};

/**
 * Marks a lab report as read.
 * @param {string} patientId - UUID of the patient
 * @param {string} reportId - UUID of the lab report
 * @returns {Promise<Object>}
 */
const markLabReportAsRead = async (patientId, reportId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  
  const updatedReport = await patientRepository.markLabReportAsRead(patientId, reportId);
  if (!updatedReport) {
    const error = new Error('Lab report not found or does not belong to this patient');
    error.statusCode = 404;
    throw error;
  }
  
  return updatedReport;
};

const getPatientAppointments = async (patientId) => {
  return await patientRepository.getPatientAppointments(patientId);
};

/**
 * Generates a safe, non-diagnostic AI response for the patient chat assistant.
 * Incorporates strict system guardrails against medical diagnosis.
 * @param {string} patientId - UUID of the patient
 * @param {string} message - The user's input message
 * @param {string} language - 'English' or 'Sinhala'
 * @returns {Promise<Object>}
 */
const generatePatientChatResponse = async (patientId, message, language = 'English') => {
  // 1. Verify patient exists
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Define strict AI guardrails
  const systemPrompt = `
    You are Care4U's AI Patient Assistant.
    
    STRICT GUARDRAILS:
    1. YOU MUST NEVER DIAGNOSE MEDICAL CONDITIONS OR PRESCRIBE MEDICATION.
    2. If the user asks for a medical diagnosis, politely refuse and advise them to book an appointment with a doctor through the Care4U app.
    3. You may provide general, widely accepted first-aid advice for minor issues, but always remind the user that this is not professional medical advice.
    4. You can help the user navigate the Care4U app (e.g., finding medical records, prescriptions, booking appointments).
    5. You must respond entirely in ${language}. Keep responses concise, friendly, and highly readable.
    
    Patient's Message: "${message}"
  `;

  // 3. Call the centralized AI utility
  const responseText = await generateAIResponse(systemPrompt);
  
  return { reply: responseText };
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  uploadPatientPhoto,
  getMedicalRecords,
  getAllergies,
  addAllergy,
  deleteAllergy,
  getConditions,
  addCondition,
  deleteCondition,
  getMedicalDevices,
  addMedicalDevice,
  deleteMedicalDevice,
  getVaccinations,
  addVaccination,
  addBulkVaccinations,
  deleteVaccination,
  getPatientPrescriptions,
  getPatientByQrCode,
  getPatientByNic,
  getPatientHistorySummary,
  extractVaccinationDataFromImage,
  getLabReports,
  markLabReportAsRead,
  getPatientAppointments,
  generatePatientChatResponse,
};