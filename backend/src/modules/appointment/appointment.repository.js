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

module.exports = {
  updateAppointmentStatus,
  getAppointmentById,
  createConsultationNote,
};