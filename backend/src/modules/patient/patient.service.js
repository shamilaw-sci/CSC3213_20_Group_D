/**
 * @file    patient.service.js
 * @module  Patient
 * @desc    Business logic for patient profile management.
 * Sits between the controller and the repository.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientRepository = require('./patient.repository');
const { generateAIResponse } = require('../../utils/ai.util');
const { supabase } = require('../../config/supabase');

const PHOTO_BUCKET = 'patient-photos';

/**
 * Retrieves a patient's full profile by their patient UUID.
 * @param {string} id - UUID of the patient (from patients table)
 * @returns {Promise<Object>} The patient profile object
 * @throws {Error} 404 if patient is not found
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
 * @param {string} id   - UUID of the patient record (from patients table)
 * @param {Object} data - Object containing fields to update
 * @returns {Promise<Object>} The updated patient record
 * @throws {Error} 404 if patient is not found
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

  const updated = await patientRepository.updatePatient(id, filteredData);
  return updated;
};

/**
 * Uploads a new profile photo for a patient to Supabase Storage and
 * saves the resulting public URL onto the patient's record.
 * Uses a fixed storage path per patient (no original filename/extension)
 * with upsert enabled, so re-uploading always overwrites the previous
 * photo rather than accumulating orphaned files in the bucket.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @param {Object} file      - Multer file object ({ buffer, mimetype, size })
 * @returns {Promise<Object>} The updated patient record (with new photo_url)
 * @throws {Error} 404 if patient is not found
 * @throws {Error} 400 if no file was provided
 * @throws {Error} 500 if the Supabase Storage upload fails
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

  // Fixed path per patient — upsert overwrites any previous photo,
  // regardless of the original file's extension.
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

  // Cache-bust so the doctor lookup page and patient's own profile
  // don't keep showing a stale browser-cached image after re-upload.
  const photoUrl = `${publicUrlData.publicUrl}?updated=${Date.now()}`;

  const updated = await patientRepository.updatePatientPhoto(patientId, photoUrl);
  return updated;
};

/**
 * Retrieves all medical records for a patient, newest first.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of medical record objects
 * @throws {Error} 404 if patient is not found
 */
const getMedicalRecords = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const records = await patientRepository.getMedicalRecords(patientId);
  return records;
};

/**
 * Retrieves all allergies for a patient.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of allergy objects (empty array is valid)
 * @throws {Error} 404 if patient is not found
 */
const getAllergies = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const allergies = await patientRepository.getAllergies(patientId);
  return allergies;
};

/**
 * Adds a new allergy record for a patient.
 * @param {string} patientId - UUID of the patient (from patients table)
 * @param {string} allergen  - Name of the allergen
 * @param {string} severity  - Severity: mild / moderate / severe
 * @param {string} notes     - Optional additional notes
 * @returns {Promise<Object>} The newly created allergy record
 * @throws {Error} 400 if allergen or severity is missing
 * @throws {Error} 400 if severity is not a valid value
 * @throws {Error} 404 if patient is not found
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

  const allergy = await patientRepository.addAllergy(
    patientId,
    allergen,
    severity.toLowerCase(),
    notes
  );
  return allergy;
};

/**
 * Deletes an allergy record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} allergyId - UUID of the allergy to delete
 * @returns {Promise<void>}
 * @throws {Error} 404 if patient or allergy is not found
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
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of condition objects
 * @throws {Error} 404 if patient is not found
 */
const getConditions = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const conditions = await patientRepository.getConditionsByPatientId(patientId);
  return conditions;
};

/**
 * Adds a new chronic condition record for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} condition - Name of the condition
 * @param {string} diagnosedAt - Date diagnosed
 * @param {string} notes - Optional notes
 * @param {boolean} isPriority - Priority flag
 * @returns {Promise<Object>} The newly created condition record
 * @throws {Error} 400 if condition name is missing
 * @throws {Error} 404 if patient is not found
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

  const newCondition = await patientRepository.addCondition(
    patientId,
    condition,
    diagnosedAt,
    notes,
    isPriority
  );
  return newCondition;
};

/**
 * Deletes a chronic condition record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} conditionId - UUID of the condition to delete
 * @returns {Promise<void>}
 * @throws {Error} 404 if patient or condition is not found
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
 * Retrieves all vaccination records for a patient.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of vaccination objects
 * @throws {Error} 404 if patient is not found
 */
const getVaccinations = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const vaccinations = await patientRepository.getVaccinationsByPatientId(patientId);
  return vaccinations;
};

/**
 * Adds a new vaccination record for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} vaccineName - Name of the vaccine
 * @param {string} dateAdministered - Date it was given
 * @param {string} doseNumber - Dose number/identifier
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} The newly created vaccination record
 * @throws {Error} 400 if required fields are missing
 * @throws {Error} 404 if patient is not found
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

  const newVaccination = await patientRepository.addVaccination(
    patientId,
    vaccineName,
    dateAdministered,
    doseNumber,
    notes
  );
  return newVaccination;
};

/**
 * Deletes a vaccination record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} vaccinationId - UUID of the vaccination to delete
 * @returns {Promise<void>}
 * @throws {Error} 404 if patient or vaccination is not found
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
 * @param {string} patientId - UUID of the patient (from patients table)
 * @returns {Promise<Array>} Array of prescription objects with items array
 * @throws {Error} 404 if patient is not found
 */
const getPatientPrescriptions = async (patientId) => {
  const existing = await patientRepository.getPatientById(patientId);
  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const prescriptions = await patientRepository.getPatientPrescriptions(patientId);
  return prescriptions;
};

/**
 * Retrieves a patient profile using their QR code ID, including their
 * chronic conditions bundled in as a `conditions` array.
 * Throws 404 if no patient is found with that QR code.
 * @param {string} qrCodeId - The qr_code_id value (e.g. "QR-TEST-001")
 * @returns {Promise<Object>} Patient object with a `conditions` array attached
 */
const getPatientByQrCode = async (qrCodeId) => {
  const patient = await patientRepository.getPatientByQrCodeId(qrCodeId);
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const conditions = await patientRepository.getConditionsByPatientId(patient.id);

  return { ...patient, conditions };
};

/**
 * Uses AI to generate a highly precise clinical summary of a patient's medical history.
 * Optimized for extreme brevity, tables, and rapid doctor scannability.
 * Cross-references the patient's known chronic conditions (CARE4U-60) as context
 * for medication classification, without duplicating what the UI's dedicated
 * Chronic Conditions card already displays.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} Object containing the generated summary text
 */
const getPatientHistorySummary = async (patientId) => {
  const records = await getMedicalRecords(patientId);
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
    1. DO NOT include a consultation timeline (the UI already shows this).
    2. DO NOT include allergies or chronic conditions in your output (the UI already shows both of these separately) — but DO use the chronic conditions list below as context for Rule 8.
    3. Use extreme brevity. Fragment sentences are preferred.
    4. Use ONLY information explicitly present in the records. Do not diagnose.
    5. NEVER alter or guess dates.
    6. Records are provided oldest to newest (or mixed order) — read ALL of them
       before writing any section. Do not summarize record-by-record; cross-reference
       first, then output.
    7. If any record contains language like "repeat test", "follow-up in X", "monitor",
       or "recheck", scan all LATER records to see if that action was completed.
       If no later record confirms completion, it is OUTSTANDING and must appear
       in URGENT ALERTS — never silently drop it.
    8. A medication or instruction only belongs in ACTIVE PLAN if it treats an
       ongoing/chronic issue, or if nothing in the records suggests the condition
       it was prescribed for has resolved. Use the KNOWN CHRONIC CONDITIONS list
       below to help decide chronicity — a medication tied to a listed chronic
       condition is ongoing by default. Short-course medication tied to a
       time-limited acute illness (e.g. a several-day infection, a resolved
       injury) that has already run its course is EXCLUDED, even if no record
       explicitly says "resolved."
    9. LATEST LAB RESULTS must be EXHAUSTIVE, not curated: include every distinct
       test/parameter that appears anywhere across all records (e.g. every
       individual FBC component, every TFT component, vitals like BMI/BP if
       recorded as numeric values) — never omit a test just because its result
       is normal. HOWEVER, if the same test/parameter was measured more than
       once across different records, include only its most recent value —
       do not list the same test twice.

    ## REQUIRED OUTPUT FORMAT (Use exactly these 4 headers):

    ### 1. URGENT ALERTS
    - Bullet points of ONLY abnormal labs, unresolved follow-ups (see Rule 7), or
      immediate clinical red flags. (If none, output "- None active").

    ### 2. PATIENT SNAPSHOT
    - One bullet each, only for categories actually present in the records:
      major surgical history; family history relevant to risk (e.g. a strong
      family history of a relevant condition); social history (smoking,
      alcohol, occupation). Do NOT repeat chronic conditions here (see Rule 2).
      Do NOT omit a category just to keep the list short — include every
      category that has documented information, skip only the ones with none.

    ### 3. LATEST LAB RESULTS
    - Format STRICTLY as a Markdown table, following Rule 9 (exhaustive tests, latest value only per test).
    | Test | Result | Status | Date |
    |---|---|---|---|

    ### 4. ACTIVE PLAN
    - Bullet points of medications/instructions that are still ongoing per Rule 8.

    --- KNOWN CHRONIC CONDITIONS ---
    ${formattedConditions}

    --- PAST MEDICAL RECORDS ---
    ${formattedRecords}
  `;

  const summaryText = await generateAIResponse(prompt);
  
  return { summary: summaryText };
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
  getVaccinations,
  addVaccination,
  deleteVaccination,
  getPatientPrescriptions,
  getPatientByQrCode,
  getPatientHistorySummary
};