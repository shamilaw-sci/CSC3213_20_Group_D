/**
 * @file    appointment.repository.js
 * @module  Appointment
 * @desc    Database queries for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

/**
 * Updates the status of an appointment.
 *
 * @param {string} id     - Appointment UUID
 * @param {string} status - New appointment status
 * @returns {Promise<Object|null>}
 */
const updateAppointmentStatus = async (
  id,
  status
) => {
  const result = await pool.query(
    `UPDATE appointments
     SET status     = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [
      status,
      id
    ]
  );

  return result.rows[0] || null;
};

/**
 * Gets a basic appointment record by appointment ID.
 *
 * Existing function preserved because other appointment
 * module functions already depend on this data shape.
 *
 * @param {string} id - Appointment UUID
 * @returns {Promise<Object|null>}
 */
const getAppointmentById = async (
  id
) => {
  const result = await pool.query(
    `SELECT *
     FROM appointments
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Gets the full appointment context required by the
 * doctor consultation workspace.
 *
 * Unlike getAppointmentById(), this query also joins
 * the linked patient and doctor profiles so the
 * consultation page can recover completely using only
 * the appointment ID from the URL.
 *
 * This keeps the consultation page refresh-safe and
 * avoids depending on temporary React navigation state.
 *
 * @param {string} id - Appointment UUID
 * @returns {Promise<Object|null>}
 */
const getConsultationAppointmentById = async (
  id
) => {
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
       a.updated_at,

       p.user_id AS patient_user_id,
       p.full_name AS patient_name,
       p.nic AS patient_nic,
       p.uhi AS patient_uhi,
       p.date_of_birth AS patient_date_of_birth,
       p.gender AS patient_gender,
       p.blood_group AS patient_blood_group,
       p.qr_code_id AS patient_qr_code_id,
       p.photo_url AS patient_photo_url,

       d.user_id AS doctor_user_id,
       d.full_name AS doctor_name,
       d.specialization AS doctor_specialization

     FROM appointments a

     JOIN patients p
       ON a.patient_id = p.id

     JOIN doctors d
       ON a.doctor_id = d.id

     WHERE a.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Finds an active consultation for a specific
 * patient and doctor.
 *
 * This prevents a doctor from accidentally creating
 * multiple simultaneous consultation records for the
 * same patient.
 *
 * Only appointments currently marked in_progress are
 * considered active.
 *
 * If more than one already exists because of old data,
 * the most recently updated appointment is returned.
 *
 * @param {string} patientId - Patient profile UUID
 * @param {string} doctorId  - Doctor profile UUID
 * @returns {Promise<Object|null>}
 */
const getActiveConsultationByPatientAndDoctor =
  async (
    patientId,
    doctorId
  ) => {
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
         a.updated_at,

         p.full_name AS patient_name,
         p.nic AS patient_nic,
         p.uhi AS patient_uhi,
         p.qr_code_id AS patient_qr_code_id,

         d.full_name AS doctor_name,
         d.specialization AS doctor_specialization

       FROM appointments a

       JOIN patients p
         ON a.patient_id = p.id

       JOIN doctors d
         ON a.doctor_id = d.id

       WHERE a.patient_id = $1
         AND a.doctor_id = $2
         AND a.status = 'in_progress'

       ORDER BY
         a.updated_at DESC,
         a.created_at DESC

       LIMIT 1`,
      [
        patientId,
        doctorId
      ]
    );

    return result.rows[0] || null;
  };

/**
 * Creates a consultation medical record.
 *
 * @param {string} appointmentId
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} title
 * @param {string} description
 * @param {boolean} isConfidential
 * @param {string} chiefComplaint
 * @param {string} diagnosis
 * @param {string} treatmentPlan
 * @param {boolean} followUpNeeded
 * @returns {Promise<Object>}
 */
const createConsultationNote = async (
  appointmentId,
  patientId,
  doctorId,
  title,
  description,
  isConfidential,
  chiefComplaint,
  diagnosis,
  treatmentPlan,
  followUpNeeded
) => {
  const result = await pool.query(
    `INSERT INTO medical_records
     (
       patient_id,
       doctor_id,
       appointment_id,
       record_type,
       title,
       description,
       is_confidential,
       chief_complaint,
       diagnosis,
       treatment_plan,
       follow_up_needed
     )
     VALUES
     (
       $1,
       $2,
       $3,
       'consultation',
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       $10
     )
     RETURNING *`,
    [
      patientId,
      doctorId,
      appointmentId,
      title,
      description,
      isConfidential ?? false,
      chiefComplaint,
      diagnosis,
      treatmentPlan,
      followUpNeeded ?? false,
    ]
  );

  return result.rows[0];
};

/**
 * Gets all past consultation notes for a patient,
 * newest first.
 *
 * Used by the doctor to review a patient's
 * consultation history.
 *
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object[]>}
 */
const getConsultationNotesByPatientId = async (
  patientId
) => {
  const result = await pool.query(
    `SELECT *
     FROM medical_records
     WHERE patient_id = $1
       AND record_type = 'consultation'
     ORDER BY created_at DESC`,
    [patientId]
  );

  return result.rows;
};

/**
 * Books a new appointment for a patient with a doctor.
 *
 * New appointments initially use the scheduled status.
 * Doctor walk-in consultations are moved to in_progress
 * immediately by the doctor workflow.
 *
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} scheduledAt
 * @param {string} type
 * @param {string} notes
 * @returns {Promise<Object>}
 */
const bookAppointment = async (
  patientId,
  doctorId,
  scheduledAt,
  type,
  notes
) => {
  const result = await pool.query(
    `INSERT INTO appointments
      (
        patient_id,
        doctor_id,
        scheduled_at,
        status,
        type,
        notes
      )
     VALUES
      (
        $1,
        $2,
        $3,
        'scheduled',
        $4,
        $5
      )
     RETURNING *`,
    [
      patientId,
      doctorId,
      scheduledAt,
      type,
      notes || null
    ]
  );

  return result.rows[0];
};

/**
 * Checks if a doctor already has an appointment
 * at an exact scheduled time.
 *
 * Existing appointment-booking conflict behaviour
 * is preserved.
 *
 * @param {string} doctorId
 * @param {string} scheduledAt
 * @returns {Promise<boolean>}
 */
const checkAppointmentConflict = async (
  doctorId,
  scheduledAt
) => {
  const result = await pool.query(
    `SELECT id
     FROM appointments
     WHERE doctor_id = $1
       AND scheduled_at = $2
       AND status NOT IN ('cancelled')`,
    [
      doctorId,
      scheduledAt
    ]
  );

  return result.rows.length > 0;
};

/**
 * Creates a hospital walk-in OPD appointment.
 *
 * Walk-in patients are already physically present at
 * the hospital, so their appointment starts with the
 * confirmed status rather than scheduled.
 *
 * @param {string} patientId - Patient profile UUID
 * @param {string} doctorId - Assigned doctor profile UUID
 * @param {string|null} notes - Optional reception notes
 * @returns {Promise<Object>} Created appointment
 */
const createHospitalWalkInAppointment = async (
  patientId,
  doctorId,
  notes = null
) => {
  const result = await pool.query(
    `INSERT INTO appointments
      (
        patient_id,
        doctor_id,
        scheduled_at,
        status,
        type,
        notes
      )
     VALUES
      (
        $1,
        $2,
        NOW(),
        'confirmed',
        'opd',
        $3
      )
     RETURNING *`,
    [
      patientId,
      doctorId,
      notes || null
    ]
  );

  return result.rows[0];
};

/**
 * Checks whether the patient already has an active
 * OPD appointment with the selected doctor today.
 *
 * Prevents reception from accidentally placing the
 * same patient into the same doctor's queue twice.
 *
 * @param {string} patientId - Patient profile UUID
 * @param {string} doctorId - Doctor profile UUID
 * @returns {Promise<Object|null>} Existing appointment or null
 */
const getTodayActiveAppointmentByPatientAndDoctor =
  async (
    patientId,
    doctorId
  ) => {
    const result = await pool.query(
      `SELECT
         id,
         patient_id,
         doctor_id,
         scheduled_at,
         status,
         type,
         notes
       FROM appointments
       WHERE patient_id = $1
         AND doctor_id = $2
         AND DATE(scheduled_at) = CURRENT_DATE
         AND status IN (
           'scheduled',
           'confirmed',
           'in_progress'
         )
       ORDER BY scheduled_at DESC
       LIMIT 1`,
      [
        patientId,
        doctorId
      ]
    );

    return result.rows[0] || null;
  };

module.exports = {
  updateAppointmentStatus,
  getAppointmentById,
  getConsultationAppointmentById,

  // Duplicate active consultation protection
  getActiveConsultationByPatientAndDoctor,

  createConsultationNote,
  getConsultationNotesByPatientId,
  bookAppointment,
  createHospitalWalkInAppointment,
  getTodayActiveAppointmentByPatientAndDoctor,
  checkAppointmentConflict
};