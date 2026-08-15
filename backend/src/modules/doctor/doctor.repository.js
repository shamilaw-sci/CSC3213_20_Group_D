/**
 * @file    doctor.repository.js
 * @module  Doctor
 * @desc    Database queries for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

const getDoctorById = async (id) => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone, u.role
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getDoctorByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone, u.role
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const updateDoctor = async (id, data) => {
  const { specialization, qualifications, years_experience, hospital_name } = data;
  const result = await pool.query(
    `UPDATE doctors
     SET specialization   = COALESCE($1, specialization),
         qualifications   = COALESCE($2, qualifications),
         years_experience = COALESCE($3, years_experience),
         hospital_name    = COALESCE($4, hospital_name),
         updated_at       = NOW()
     WHERE id = $5
     RETURNING *`,
    [specialization, qualifications, years_experience, hospital_name, id]
  );
  return result.rows[0] || null;
};

const getAllDoctors = async () => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.is_verified = true
     ORDER BY d.created_at DESC`
  );
  return result.rows;
};

const getDoctorAvailability = async (doctorId) => {
  const result = await pool.query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1
     ORDER BY day_of_week ASC`,
    [doctorId]
  );
  return result.rows;
};

const updateDoctorAvailability = async (doctorId, slots) => {
  await pool.query(
    `DELETE FROM doctor_availability WHERE doctor_id = $1`,
    [doctorId]
  );
  for (const slot of slots) {
    await pool.query(
      `INSERT INTO doctor_availability 
       (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [doctorId, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration_minutes, slot.is_active ?? true]
    );
  }
  return getDoctorAvailability(doctorId);
};

const getTodayAppointments = async (doctorId) => {
  const result = await pool.query(
    `SELECT 
       a.id,
       a.patient_id,
       a.scheduled_at,
       a.status,
       a.type,
       a.notes,
       p.full_name AS patient_name,
       p.id AS patient_uuid
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.doctor_id = $1
       AND DATE(a.scheduled_at) = CURRENT_DATE
     ORDER BY a.scheduled_at ASC`,
    [doctorId]
  );
  return result.rows;
};

const getDoctorDashboardStats = async (doctorId) => {
  const result = await pool.query(
    `SELECT 
       a.id,
       a.patient_id,
       a.scheduled_at,
       a.status,
       a.type,
       p.full_name AS patient_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.doctor_id = $1
       AND DATE(a.scheduled_at) = CURRENT_DATE
     ORDER BY a.scheduled_at ASC`,
    [doctorId]
  );

  const appointments = result.rows;
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const inProgress = appointments.filter(a => a.status === 'in_progress').length;
  const pending = appointments.filter(a => a.status === 'scheduled').length;
  const nextPatient = appointments.find(a => a.status === 'scheduled') || null;

  return {
    total,
    completed,
    inProgress,
    pending,
    nextPatient: nextPatient
      ? {
          id: nextPatient.id,
          patient_name: nextPatient.patient_name,
          scheduled_at: nextPatient.scheduled_at,
          type: nextPatient.type,
        }
      : null,
  };
};

const searchDoctors = async (specialty, hospitalName) => {
  let query = `
    SELECT d.*, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.is_verified = true
  `;

  const params = [];
  let paramIndex = 1;

  if (specialty) {
    query += ` AND LOWER(d.specialization) LIKE LOWER($${paramIndex})`;
    params.push(`%${specialty}%`);
    paramIndex++;
  }

  if (hospitalName) {
    query += ` AND LOWER(d.hospital_name) LIKE LOWER($${paramIndex})`;
    params.push(`%${hospitalName}%`);
    paramIndex++;
  }

  query += ` ORDER BY d.full_name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = {
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  getAllDoctors,
  searchDoctors,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
  getDoctorDashboardStats,
};