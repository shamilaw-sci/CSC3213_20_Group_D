/**
 * @file patient.repository.js
 * @module Patient
 * @desc Database query functions for the Patient module.
 *       All direct SQL interactions for patient data live here.
 * @author Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Fetches a patient record by their patient table ID,
 * joined with the users table for full profile data.
 * @param {string} id - UUID of the patient (patients.id)
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientById(id) {
  const result = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.nic,
      p.uhi,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.emergency_contact_relationship,
      p.qr_code_id,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Fetches a patient record by their linked user ID.
 * @param {string} userId - UUID from the users table (users.id)
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientByUserId(userId) {
  const result = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.nic,
      p.uhi,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.emergency_contact_relationship,
      p.qr_code_id,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Updates editable fields on a patient record.
 * Only the fields passed in `data` will be updated.
 * @param {string} id - UUID of the patient (patients.id)
 * @param {Object} data - Fields to update
 * @returns {Promise<Object|null>} Updated patient row or null
 */
async function updatePatient(id, data) {
  const {
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
  } = data;

  const result = await pool.query(
    `UPDATE patients
    SET
      blood_group = COALESCE($1, blood_group),
      emergency_contact_name = COALESCE($2, emergency_contact_name),
      emergency_contact_phone = COALESCE($3, emergency_contact_phone),
      emergency_contact_relationship = COALESCE($4, emergency_contact_relationship)
    WHERE id = $5
    RETURNING *`,
    [
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      id,
    ]
  );
  return result.rows[0] || null;
}

/**
 * Fetches all medical records for a patient, ordered newest first.
 * Joins with the doctors table to include the doctor's name.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @returns {Promise<Array>} Array of medical record rows (empty array if none)
 */
async function getMedicalRecords(patientId) {
  const result = await pool.query(
    `SELECT
      mr.id,
      mr.patient_id,
      mr.doctor_id,
      mr.appointment_id,
      mr.record_type,
      mr.title,
      mr.description,
      mr.is_confidential,
      mr.created_at,
      d.full_name AS doctor_name,
      d.specialization AS doctor_specialization
    FROM medical_records mr
    LEFT JOIN doctors d ON mr.doctor_id = d.id
    WHERE mr.patient_id = $1
    ORDER BY mr.created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Fetches all allergy records for a patient, ordered newest first.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @returns {Promise<Array>} Array of allergy rows (empty array if none)
 */
async function getAllergies(patientId) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      allergen,
      severity,
      notes,
      created_at
    FROM patient_allergies
    WHERE patient_id = $1
    ORDER BY created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Inserts a new allergy record for a patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} allergen  - Name of the allergen (e.g. Penicillin)
 * @param {string} severity  - Severity level: mild / moderate / severe
 * @param {string|null} notes - Optional additional notes
 * @returns {Promise<Object>} The newly created allergy row
 */
async function addAllergy(patientId, allergen, severity, notes) {
  const result = await pool.query(
    `INSERT INTO patient_allergies (id, patient_id, allergen, severity, notes, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
    RETURNING *`,
    [patientId, allergen, severity, notes || null]
  );
  return result.rows[0];
}

/**
 * Fetches all prescriptions for a patient with their medicine items,
 * ordered newest first. Uses JSON_AGG to bundle all items per prescription
 * into a single array so each prescription appears as one object.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @returns {Promise<Array>} Array of prescription objects (empty array if none)
 */
async function getPatientPrescriptions(patientId) {
  const result = await pool.query(
    `SELECT
      pr.id,
      pr.patient_id,
      pr.doctor_id,
      pr.appointment_id,
      pr.qr_code_value,
      pr.status,
      pr.expires_at,
      pr.notes,
      pr.created_at,
      pr.updated_at,
      d.full_name       AS doctor_name,
      d.specialization  AS doctor_specialization,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',                   pi.id,
          'medicine_name',        pi.medicine_name,
          'dosage',               pi.dosage,
          'frequency',            pi.frequency,
          'duration_days',        pi.duration_days,
          'quantity_prescribed',  pi.quantity_prescribed,
          'quantity_dispensed',   pi.quantity_dispensed,
          'special_notes',        pi.special_notes
        ) ORDER BY pi.medicine_name
      ) AS items
    FROM prescriptions pr
    LEFT JOIN doctors d  ON pr.doctor_id = d.id
    LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
    WHERE pr.patient_id = $1
    GROUP BY
      pr.id,
      pr.patient_id,
      pr.doctor_id,
      pr.appointment_id,
      pr.qr_code_value,
      pr.status,
      pr.expires_at,
      pr.notes,
      pr.created_at,
      pr.updated_at,
      d.full_name,
      d.specialization
    ORDER BY pr.created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Fetches a patient record by their QR code ID.
 * Used by the doctor-facing QR lookup endpoint.
 * @param {string} qrCodeId - The qr_code_id value (e.g. "QR-TEST-001")
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientByQrCodeId(qrCodeId) {
  const result = await pool.query(
    `SELECT 
      p.id,
      p.user_id,
      p.nic,
      p.uhi,
      p.date_of_birth,
      p.gender,
      p.blood_group,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.emergency_contact_relationship,
      p.qr_code_id,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.qr_code_id = $1`,
    [qrCodeId]
  );
  return result.rows[0] || null;
}

module.exports = {
  getPatientById,
  getPatientByUserId,
  updatePatient,
  getMedicalRecords,
  getAllergies,
  addAllergy,
  getPatientPrescriptions,
  getPatientByQrCodeId,
};