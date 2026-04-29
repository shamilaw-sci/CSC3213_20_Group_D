/**
 * @file    appointment.repository.js
 * @module  Appointment
 * @desc    Database queries for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

const updateAppointmentStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE appointments
     SET status     = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

const getAppointmentById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM appointments WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createConsultationNote = async (appointmentId, patientId, doctorId, title, description, isConfidential) => {
  const result = await pool.query(
    `INSERT INTO medical_records 
     (patient_id, doctor_id, appointment_id, record_type, title, description, is_confidential)
     VALUES ($1, $2, $3, 'consultation', $4, $5, $6)
     RETURNING *`,
    [patientId, doctorId, appointmentId, title, description, isConfidential ?? false]
  );
  return result.rows[0];
};

/**
 * Books a new appointment for a patient with a doctor.
 * @param {string} patientId   - UUID of the patient
 * @param {string} doctorId    - UUID of the doctor
 * @param {string} scheduledAt - ISO timestamp for the appointment
 * @param {string} type        - Appointment type (e.g. 'consultation')
 * @param {string} notes       - Optional notes
 * @returns {Promise<Object>} The created appointment row
 */
const bookAppointment = async (patientId, doctorId, scheduledAt, type, notes) => {
  const result = await pool.query(
    `INSERT INTO appointments
      (patient_id, doctor_id, scheduled_at, status, type, notes)
     VALUES ($1, $2, $3, 'scheduled', $4, $5)
     RETURNING *`,
    [patientId, doctorId, scheduledAt, type, notes || null]
  );
  return result.rows[0];
};

/**
 * Checks if a doctor already has an appointment at a given time.
 * @param {string} doctorId    - UUID of the doctor
 * @param {string} scheduledAt - ISO timestamp to check
 * @returns {Promise<boolean>} True if conflict exists
 */
const checkAppointmentConflict = async (doctorId, scheduledAt) => {
  const result = await pool.query(
    `SELECT id FROM appointments
     WHERE doctor_id = $1
     AND scheduled_at = $2
     AND status NOT IN ('cancelled')`,
    [doctorId, scheduledAt]
  );
  return result.rows.length > 0;
};

module.exports = {
  updateAppointmentStatus,
  getAppointmentById,
  createConsultationNote,
  bookAppointment,
  checkAppointmentConflict
};