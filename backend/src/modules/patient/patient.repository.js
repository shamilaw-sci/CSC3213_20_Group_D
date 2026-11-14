/**
 * @file    patient.repository.js
 * @module  Patient
 * @desc    Reads and updates patient information in PostgreSQL.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * FEATURE: Find patient profile
 * LOGIC: Join patient details with account details; patients without linked accounts can still be found.
 */
async function getPatientById(id, db = pool) {
  const result = await db.query(
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
    LEFT JOIN users u
      ON p.user_id = u.id
    WHERE p.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Fetches a patient record by their linked user ID.
 */
async function getPatientByUserId(userId, db = pool) {
  const result = await db.query(
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
 * FEATURE: Save approved profile changes
 * LOGIC: Update only the fields supplied after the service checks them.
 */
async function updatePatient(id, data) {
  // Only service-validated editable columns can enter this fixed SQL statement.
  const { full_name, blood_group, emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship } = data;
  const result = await pool.query(
    `UPDATE patients SET
      full_name = COALESCE($1, full_name),
      blood_group = COALESCE($2, blood_group),
      emergency_contact_name = COALESCE($3, emergency_contact_name),
      emergency_contact_phone = COALESCE($4, emergency_contact_phone),
      emergency_contact_relationship = COALESCE($5, emergency_contact_relationship),
      updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [full_name, blood_group, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, id]
  );
  return result.rows[0] || null;
}

/**
 * FEATURE: Save new profile photo address
 * LOGIC: Update the patient photo link in the database after storage upload.
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
 * FEATURE: Load medical history
 * LOGIC: Read patient records from the database; the service decides which are visible to a doctor.
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
 */
async function addCondition(
  patientId,
  condition,
  diagnosedAt,
  notes,
  isPriority
) {
  const result = await pool.query(
    `INSERT INTO patient_conditions
      (
        id,
        patient_id,
        condition,
        diagnosed_at,
        notes,
        is_priority,
        created_at
      )
     VALUES
      (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW()
      )
     RETURNING *`,
    [
      patientId,
      condition,
      diagnosedAt || null,
      notes || null,
      Boolean(isPriority)
    ]
  );

  return result.rows[0];
}

/**
 * Deletes a chronic condition record belonging to a specific patient.
 */
async function deleteCondition(
  patientId,
  conditionId
) {
  const result = await pool.query(
    `DELETE FROM patient_conditions 
     WHERE id = $1
       AND patient_id = $2
     RETURNING id`,
    [
      conditionId,
      patientId
    ]
  );

  return result.rowCount > 0;
}

/**
 * Fetches all active medical devices and implants for a patient.
 * Emergency-relevant devices are ordered first.
 */
async function getMedicalDevicesByPatientId(
  patientId
) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      device_name,
      device_type,
      notes,
      is_active,
      is_emergency_relevant,
      implanted_at,
      created_at,
      updated_at
    FROM patient_medical_devices
    WHERE patient_id = $1
      AND is_active = true
    ORDER BY
      is_emergency_relevant DESC,
      implanted_at DESC NULLS LAST,
      created_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Inserts a medical device or implant record for a patient.
 */
async function addMedicalDevice(
  patientId,
  deviceName,
  deviceType,
  implantedAt,
  notes,
  isEmergencyRelevant
) {
  const result = await pool.query(
    `INSERT INTO patient_medical_devices
      (
        patient_id,
        device_name,
        device_type,
        implanted_at,
        notes,
        is_active,
        is_emergency_relevant
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        true,
        $6
      )
     RETURNING *`,
    [
      patientId,
      deviceName,
      deviceType || null,
      implantedAt || null,
      notes || null,
      Boolean(isEmergencyRelevant)
    ]
  );

  return result.rows[0];
}

/**
 * FEATURE: Remove device from active profile
 * LOGIC: Mark the device inactive instead of deleting its history.
 */
async function deleteMedicalDevice(
  patientId,
  deviceId
) {
  const result = await pool.query(
    `UPDATE patient_medical_devices
     SET
       is_active = false,
       updated_at = NOW()
     WHERE id = $1
       AND patient_id = $2
       AND is_active = true
     RETURNING id`,
    [
      deviceId,
      patientId
    ]
  );

  return result.rowCount > 0;
}

/**
 * Inserts a new allergy record for a patient.
 */
async function addAllergy(
  patientId,
  allergen,
  severity,
  notes
) {
  const result = await pool.query(
    `INSERT INTO patient_allergies
      (
        id,
        patient_id,
        allergen,
        severity,
        notes,
        created_at
      )
     VALUES
      (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        NOW()
      )
     RETURNING *`,
    [
      patientId,
      allergen,
      severity,
      notes || null
    ]
  );

  return result.rows[0];
}

/**
 * FEATURE: Delete own allergy
 * LOGIC: Delete only the allergy matching both its ID and the patient ID.
 */
async function deleteAllergy(
  patientId,
  allergyId
) {
  const result = await pool.query(
    `DELETE FROM patient_allergies 
     WHERE id = $1
       AND patient_id = $2
     RETURNING id`,
    [
      allergyId,
      patientId
    ]
  );

  return result.rowCount > 0;
}

/**
 * Fetches all vaccination records for a patient, ordered by date administered newest first.
 */
async function getVaccinationsByPatientId(
  patientId
) {
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
    ORDER BY
      date_administered DESC,
      created_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Inserts a new vaccination record for a patient.
 */
async function addVaccination(
  patientId,
  vaccineName,
  dateAdministered,
  doseNumber,
  notes
) {
  const result = await pool.query(
    `INSERT INTO vaccinations
      (
        id,
        patient_id,
        vaccine_name,
        date_administered,
        dose_number,
        notes,
        created_at
      )
     VALUES
      (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW()
      )
     RETURNING *`,
    [
      patientId,
      vaccineName,
      dateAdministered,
      doseNumber || null,
      notes || null
    ]
  );

  return result.rows[0];
}

/**
 * Deletes a vaccination record belonging to a specific patient.
 */
async function deleteVaccination(
  patientId,
  vaccinationId
) {
  const result = await pool.query(
    `DELETE FROM vaccinations 
     WHERE id = $1
       AND patient_id = $2
     RETURNING id`,
    [
      vaccinationId,
      patientId
    ]
  );

  return result.rowCount > 0;
}

/**
 * FEATURE: Show patient medicines
 * LOGIC: Fetch prescription details together with their medicine items.
 */
async function getPatientPrescriptions(
  patientId
) {
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
    LEFT JOIN doctors d
      ON pr.doctor_id = d.id
    LEFT JOIN prescription_items pi
      ON pi.prescription_id = pr.id
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
 * FEATURE: Patient QR lookup
 * LOGIC: Look up a patient using their stored QR identity.
 */
async function getPatientByQrCodeId(
  qrCodeId
) {
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
    LEFT JOIN users u
      ON p.user_id = u.id
    WHERE p.qr_code_id = $1`,
    [qrCodeId]
  );

  return result.rows[0] || null;
}

/**
 * FEATURE: View laboratory results
 * LOGIC: Load the patient's completed laboratory reports.
 */
async function getLabReports(
  patientId
) {
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
    JOIN lab_test_requests ltr
      ON lr.lab_request_id = ltr.id
    JOIN laboratories l
      ON lr.laboratory_id = l.id
    LEFT JOIN doctors d
      ON ltr.doctor_id = d.id
    WHERE lr.patient_id = $1
    ORDER BY lr.created_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * FEATURE: Mark report as read
 * LOGIC: Update only the report belonging to this patient.
 */
async function markLabReportAsRead(
  patientId,
  reportId
) {
  const result = await pool.query(
    `UPDATE lab_reports
     SET
       is_read = true,
       viewed_at = NOW()
     WHERE id = $1
       AND patient_id = $2
     RETURNING *`,
    [
      reportId,
      patientId
    ]
  );

  return result.rows[0] || null;
}

/**
 * Fetches all appointments for a patient, including the doctor's name.
 */
async function getPatientAppointments(
  patientId
) {
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
    JOIN doctors d
      ON a.doctor_id = d.id
    WHERE a.patient_id = $1
    ORDER BY a.scheduled_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * FEATURE: Fallback patient lookup
 * LOGIC: Find a patient using the supplied NIC when a QR card is unavailable.
 */
async function getPatientByNic(
  nic
) {
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
    LEFT JOIN users u
      ON p.user_id = u.id
    WHERE UPPER(TRIM(p.nic)) =
          UPPER(TRIM($1))
    LIMIT 1`,
    [nic]
  );

  return result.rows[0] || null;
}

/**
 * Fetches all active important medical background records for a patient.
 * Emergency-relevant records are ordered first.
 */
async function getHealthBackgroundByPatientId(
  patientId
) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      background_type,
      title,
      event_date,
      notes,
      is_emergency_relevant,
      is_active,
      created_at,
      updated_at
    FROM patient_health_background
    WHERE patient_id = $1
      AND is_active = true
    ORDER BY
      is_emergency_relevant DESC,
      event_date DESC NULLS LAST,
      created_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Inserts an important medical background record for a patient.
 */
async function addHealthBackground(
  patientId,
  backgroundType,
  title,
  eventDate,
  notes,
  isEmergencyRelevant
) {
  const result = await pool.query(
    `INSERT INTO patient_health_background
      (
        patient_id,
        background_type,
        title,
        event_date,
        notes,
        is_emergency_relevant,
        is_active
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        true
      )
     RETURNING *`,
    [
      patientId,
      backgroundType,
      title,
      eventDate || null,
      notes || null,
      Boolean(isEmergencyRelevant)
    ]
  );

  return result.rows[0];
}

/**
 * FEATURE: Remove medical background
 * LOGIC: Mark the record inactive instead of deleting its history.
 */
async function deleteHealthBackground(
  patientId,
  backgroundId
) {
  const result = await pool.query(
    `UPDATE patient_health_background
     SET
       is_active = false,
       updated_at = NOW()
     WHERE id = $1
       AND patient_id = $2
       AND is_active = true
     RETURNING id`,
    [
      backgroundId,
      patientId
    ]
  );

  return result.rowCount > 0;
}

/**
 * Fetches all active family medical history records for a patient.
 * Emergency-relevant records are ordered first.
 */
async function getFamilyHistoryByPatientId(
  patientId
) {
  const result = await pool.query(
    `SELECT
      id,
      patient_id,
      relation,
      condition,
      notes,
      is_emergency_relevant,
      is_active,
      created_at,
      updated_at
    FROM patient_family_history
    WHERE patient_id = $1
      AND is_active = true
    ORDER BY
      is_emergency_relevant DESC,
      created_at DESC`,
    [patientId]
  );

  return result.rows;
}

/**
 * Inserts a family medical history record for a patient.
 */
async function addFamilyHistory(
  patientId,
  relation,
  condition,
  notes,
  isEmergencyRelevant
) {
  const result = await pool.query(
    `INSERT INTO patient_family_history
      (
        patient_id,
        relation,
        condition,
        notes,
        is_emergency_relevant,
        is_active
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        true
      )
     RETURNING *`,
    [
      patientId,
      relation,
      condition,
      notes || null,
      Boolean(
        isEmergencyRelevant
      )
    ]
  );

  return result.rows[0];
}

/**
 * FEATURE: Remove family history
 * LOGIC: Mark the record inactive instead of deleting its history.
 */
async function deleteFamilyHistory(
  patientId,
  familyHistoryId
) {
  const result = await pool.query(
    `UPDATE patient_family_history
     SET
       is_active = false,
       updated_at = NOW()
     WHERE id = $1
       AND patient_id = $2
       AND is_active = true
     RETURNING id`,
    [
      familyHistoryId,
      patientId
    ]
  );

  return result.rowCount > 0;
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
  getMedicalDevicesByPatientId,
  addMedicalDevice,
  deleteMedicalDevice,
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
  getHealthBackgroundByPatientId,
  addHealthBackground,
  deleteHealthBackground,
  getFamilyHistoryByPatientId,
  addFamilyHistory,
  deleteFamilyHistory,
};
