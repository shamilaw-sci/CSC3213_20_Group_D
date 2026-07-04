/**
 * @file    patient.service.js
 * @module  Patient
 * @desc    Business logic for patient profile management.
 * Sits between the controller and the repository.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientRepository = require('./patient.repository');
const { generateAIResponse } = require('../../utils/gemini.util');

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
 * Retrieves a patient profile using their QR code ID.
 * Throws 404 if no patient is found with that QR code.
 * @param {string} qrCodeId - The qr_code_id value (e.g. "QR-TEST-001")
 * @returns {Promise<Object>} Patient object
 */
const getPatientByQrCode = async (qrCodeId) => {
  const patient = await patientRepository.getPatientByQrCodeId(qrCodeId);
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  return patient;
};

/**
 * Uses Google Gemini to generate a clinical summary of a patient's entire medical history.
 * Tailored specifically to skip demographics/allergies (handled by UI) and focus purely on clinical timeline.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} Object containing the generated summary text
 */
const getPatientHistorySummary = async (patientId) => {
  // 1. Fetch ONLY the medical records (UI already handles profile and allergies)
  const records = await getMedicalRecords(patientId);

  // 2. Format the records safely
  const formattedRecords = records.length > 0 
    ? records.map(r => `- [${new Date(r.created_at).toLocaleDateString()}] ${r.record_type}: ${r.title}. Notes: ${r.description || 'None'}`).join('\n') 
    : 'No past medical records.';

  // 3. Construct the highly targeted clinical prompt
  const prompt = `
    You are an expert clinical AI assistant for the Care4U healthcare system. 
    Your task is to summarize the following patient's past medical records so a doctor can read it in 15 seconds before starting a consultation.
    
    STRICT RULES:
    1. DO NOT diagnose the patient or suggest treatments.
    2. DO NOT introduce the patient (e.g., "This patient is..."). The UI already shows their name, age, and allergies.
    3. Focus ONLY on synthesizing the clinical history: chronic conditions, recent interventions, and recurring symptoms.
    4. Make it highly scannable. Use Markdown bullet points and **bold** key medical terms or diagnoses.
    5. Keep it under 100 words.

    --- PAST MEDICAL RECORDS ---
    ${formattedRecords}
  `;

  // 4. Call the shared AI utility
  const summaryText = await generateAIResponse(prompt);
  
  return { summary: summaryText };
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getMedicalRecords,
  getAllergies,
  addAllergy,
  deleteAllergy,
  getPatientPrescriptions,
  getPatientByQrCode,
  getPatientHistorySummary
};