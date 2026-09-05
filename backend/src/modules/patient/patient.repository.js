/**
 * @file    patient.repository.js
 * @module  Patient
 * @desc    Database query functions for the Patient module.
 *          All direct SQL interactions for patient data live here.
 * @author  Wasana Karunanayaka (S/21/081)
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
      p.photo_url,
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
      p.photo_url,
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
 * Updates only the photo_url field on a patient record.
 * Kept as its own function (rather than folded into updatePatient)
 * since photo uploads go through a dedicated multipart endpoint,
 * not the general profile-edit JSON body.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} photoUrl  - Public URL of the uploaded photo in Supabase Storage
 * @returns {Promise<Object|null>} Updated patient row or null
 */
async function updatePatientPhoto(patientId, photoUrl) {
  const result = await pool.query(
    `UPDATE patients
    SET photo_url = $1
    WHERE id = $2
    RETURNING *`,
    [photoUrl, patientId]
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
      mr.chief_complaint,
      mr.diagnosis,
      mr.treatment_plan,
      mr.follow_up_needed,
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
 * Fetches all chronic condition records for a patient, ordered so
 * priority-flagged conditions surface first, then newest first.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @returns {Promise<Array>} Array of condition rows (empty array if none)
 */
async function getConditionsByPatientId(patientId) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      condition,
      diagnosed_at,
      notes,
      is_priority,
      created_at
    FROM patient_conditions
    WHERE patient_id = $1
    ORDER BY is_priority DESC, created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Inserts a new chronic condition record for a patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} condition - Name of the condition
 * @param {string} diagnosedAt - Date string for when it was diagnosed
 * @param {string|null} notes - Optional additional notes
 * @param {boolean} isPriority - Whether this is a priority/severe condition
 * @returns {Promise<Object>} The newly created condition row
 */
async function addCondition(patientId, condition, diagnosedAt, notes, isPriority) {
  const result = await pool.query(
    `INSERT INTO patient_conditions (id, patient_id, condition, diagnosed_at, notes, is_priority, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [patientId, condition, diagnosedAt || null, notes || null, Boolean(isPriority)]
  );
  return result.rows[0];
}

/**
 * Deletes a chronic condition record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} conditionId - UUID of the condition (patient_conditions.id)
 * @returns {Promise<boolean>} True if a row was deleted, false otherwise
 */
async function deleteCondition(patientId, conditionId) {
  const result = await pool.query(
    `DELETE FROM patient_conditions 
     WHERE id = $1 AND patient_id = $2
     RETURNING id`,
    [conditionId, patientId]
  );
  return result.rowCount > 0;
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
 * Deletes an allergy record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} allergyId - UUID of the allergy (patient_allergies.id)
 * @returns {Promise<boolean>} True if a row was deleted, false otherwise
 */
async function deleteAllergy(patientId, allergyId) {
  const result = await pool.query(
    `DELETE FROM patient_allergies 
     WHERE id = $1 AND patient_id = $2
     RETURNING id`,
    [allergyId, patientId]
  );
  return result.rowCount > 0;
}

/**
 * Fetches all vaccination records for a patient, ordered by date administered newest first.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @returns {Promise<Array>} Array of vaccination rows (empty array if none)
 */
async function getVaccinationsByPatientId(patientId) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      vaccine_name,
      date_administered,
      dose_number,
      notes,
      created_at
    FROM vaccinations
    WHERE patient_id = $1
    ORDER BY date_administered DESC, created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Inserts a new vaccination record for a patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} vaccineName - Name of the vaccine (e.g. "BCG", "MMR")
 * @param {string} dateAdministered - Date string (YYYY-MM-DD)
 * @param {string|null} doseNumber - Dose identifier/number (e.g. "Dose 1", "Booster")
 * @param {string|null} notes - Optional additional notes
 * @returns {Promise<Object>} The newly created vaccination row
 */
async function addVaccination(patientId, vaccineName, dateAdministered, doseNumber, notes) {
  const result = await pool.query(
    `INSERT INTO vaccinations (id, patient_id, vaccine_name, date_administered, dose_number, notes, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [patientId, vaccineName, dateAdministered, doseNumber || null, notes || null]
  );
  return result.rows[0];
}

/**
 * Deletes a vaccination record belonging to a specific patient.
 * @param {string} patientId - UUID of the patient (patients.id)
 * @param {string} vaccinationId - UUID of the vaccination (vaccinations.id)
 * @returns {Promise<boolean>} True if a row was deleted, false otherwise
 */
async function deleteVaccination(patientId, vaccinationId) {
  const result = await pool.query(
    `DELETE FROM vaccinations 
     WHERE id = $1 AND patient_id = $2
     RETURNING id`,
    [vaccinationId, patientId]
  );
  return result.rowCount > 0;
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
          'id',                  pi.id,
          'medicine_name',       pi.medicine_name,
          'dosage',              pi.dosage,
          'frequency',           pi.frequency,
          'duration_days',       pi.duration_days,
          'quantity_prescribed', pi.quantity_prescribed,
          'quantity_dispensed',  pi.quantity_dispensed,
          'special_notes',       pi.special_notes
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
      p.photo_url,
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

/**
 * Fetches all completed laboratory reports for a patient, ordered newest first.
 * Joins with lab_test_requests to get test details, and laboratories for the lab name.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of lab report rows (empty array if none)
 */
async function getLabReports(patientId) {
  const result = await pool.query(
    `SELECT 
      lr.id,
      lr.findings,
      lr.report_url,
      lr.created_at,
      lr.is_read,  -- Add this line
      ltr.test_type,
      ltr.status,
      l.name AS lab_name,
      d.full_name AS doctor_name
    FROM lab_reports lr
    JOIN lab_test_requests ltr ON lr.lab_request_id = ltr.id
    JOIN laboratories l ON lr.laboratory_id = l.id
    LEFT JOIN doctors d ON ltr.doctor_id = d.id
    WHERE lr.patient_id = $1
    ORDER BY lr.created_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Marks a specific lab report as read by the patient and logs the view time.
 * @param {string} patientId - UUID of the patient
 * @param {string} reportId - UUID of the lab report
 * @returns {Promise<Object|null>} The updated report row or null
 */
async function markLabReportAsRead(patientId, reportId) {
  const result = await pool.query(
    `UPDATE lab_reports
     SET is_read = true, viewed_at = NOW()
     WHERE id = $1 AND patient_id = $2
     RETURNING *`,
    [reportId, patientId]
  );
  return result.rows[0] || null;
}

/**
 * Fetches all appointments for a patient, including the doctor's name.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of appointment rows
 */
async function getPatientAppointments(patientId) {
  const result = await pool.query(
    `SELECT 
      a.id,
      a.patient_id,
      a.doctor_id,
      a.scheduled_at,
      a.status,
      a.type,
      a.notes,
      a.created_at,
      d.full_name AS doctor_name,
      d.specialization AS doctor_specialization
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = $1
    ORDER BY a.scheduled_at DESC`,
    [patientId]
  );
  return result.rows;
}

/**
 * Fetches a patient record by their NIC.
 * Used by pharmacy staff as a fallback patient lookup method
 * when a QR code cannot be scanned or is unavailable.
 *
 * @param {string} nic - Patient NIC number
 * @returns {Promise<Object|null>} Patient row or null if not found
 */
async function getPatientByNic(nic) {
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
      p.photo_url,
      p.created_at,
      p.full_name,
      u.email,
      u.phone,
      u.is_verified,
      u.role
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE UPPER(TRIM(p.nic)) = UPPER(TRIM($1))
    LIMIT 1`,
    [nic]
  );

  return result.rows[0] || null;
}


module.exports = {
  getPatientById,
  getPatientByUserId,
  updatePatient,
  updatePatientPhoto,
  getMedicalRecords,
  getAllergies,
  getConditionsByPatientId,
  addCondition,
  deleteCondition,
  addAllergy,
  deleteAllergy,
  getVaccinationsByPatientId,
  addVaccination,
  deleteVaccination,
  getPatientPrescriptions,
  getPatientByQrCodeId,
  getLabReports,
  markLabReportAsRead,
  getPatientAppointments,
  getPatientByNic,
};