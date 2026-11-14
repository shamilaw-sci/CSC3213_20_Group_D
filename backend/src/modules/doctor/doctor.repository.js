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

/** Resolve a doctor profile from the account ID, optionally on a consent transaction.
 * @param {string} userId Account UUID. @param {Object} db Pool or transaction client.
 * @returns {Promise<Object|null>} Linked profile; uniqueness policy remains separately documented.
 */
const getDoctorByUserId = async (userId, db = pool) => {
  const result = await db.query(
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

/**
 * Updates the profile photo URL for a doctor.
 * @param {string} id - Doctor UUID
 * @param {string} photoUrl - Public Supabase Storage photo URL
 * @returns {Promise<Object|null>} Updated doctor profile
 */
const updateDoctorPhoto = async (id, photoUrl) => {
  const result = await pool.query(
    `UPDATE doctors
     SET photo_url = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [photoUrl, id]
  );

  return result.rows[0] || null;
};

const getAllDoctors = async () => {
  const result = await pool.query(
    `SELECT d.*, u.email, u.phone
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.is_verified = true
       AND u.verification_status = 'approved'
       AND u.is_active = true
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
      [
        doctorId,
        slot.day_of_week,
        slot.start_time,
        slot.end_time,
        slot.slot_duration_minutes,
        slot.is_active ?? true
      ]
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

/**
 * Searches for doctors based on name/specialty and hospital.
 * @param {string} specialty - Search term for specialty OR doctor name
 * @param {string} hospitalName - Search term for hospital name
 * @returns {Promise<Array>} List of verified doctors
 */
const searchDoctors = async (specialty, hospitalName) => {
  let query = `
    SELECT d.*, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.is_verified = true
      AND u.verification_status = 'approved'
      AND u.is_active = true
  `;

  const params = [];
  let paramIndex = 1;

  if (specialty) {
    // Search both specialization and doctor name.
    query += ` AND (
      LOWER(d.specialization) LIKE LOWER($${paramIndex})
      OR LOWER(d.full_name) LIKE LOWER($${paramIndex})
    )`;

    params.push(`%${specialty}%`);
    paramIndex++;
  }

  if (hospitalName) {
    query += ` AND LOWER(d.hospital_name) LIKE LOWER($${paramIndex})`;
    params.push(`%${hospitalName}%`);
    paramIndex++;
  }

  query += ` ORDER BY d.full_name ASC`;

  const result = await pool.query(
    query,
    params
  );

  return result.rows;
};

/**
 * Gets the next available appointment slots for a doctor.
 * @param {string} doctorId - UUID of the doctor
 * @param {number} limit    - Number of slots to return
 * @returns {Promise<Array>} List of available slot datetime strings
 */
const getAvailableSlots = async (doctorId, limit = 3, db = pool) => {
  const availabilityResult = await db.query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1 AND is_active = true
     ORDER BY day_of_week ASC`,
    [doctorId]
  );

  const availability = availabilityResult.rows;
  if (availability.length === 0) return [];

  const bookedResult = await db.query(
    `SELECT scheduled_at FROM appointments
     WHERE doctor_id = $1
     AND scheduled_at > NOW()
     AND status NOT IN ('cancelled')
     ORDER BY scheduled_at ASC`,
    [doctorId]
  );

  const bookedTimes = bookedResult.rows.map(r =>
    new Date(r.scheduled_at).toISOString()
  );

  const slots = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 14 && slots.length < limit; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ];

    const dayOfWeek = dayNames[date.getDay()];
    const dayAvailability = availability.find(
      a => a.day_of_week === dayOfWeek
    );

    if (!dayAvailability) continue;

    const [startHour, startMin] =
      dayAvailability.start_time.split(':').map(Number);

    const [endHour, endMin] =
      dayAvailability.end_time.split(':').map(Number);

    const slotDuration =
      dayAvailability.slot_duration_minutes || 30;

    let slotTime = new Date(date);
    slotTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    while (slotTime < endTime && slots.length < limit) {
      if (slotTime > now) {
        const slotISO = slotTime.toISOString();

        if (!bookedTimes.includes(slotISO)) {
          slots.push(slotISO);
        }
      }

      slotTime = new Date(
        slotTime.getTime() + slotDuration * 60000
      );
    }
  }

  return slots;
};

/**
 * Creates a new lab test request from the doctor's side.
 * @param {Object} data - { patientId, doctorId, appointmentId, laboratoryId, testType, priority, notes }
 * @returns {Promise<Object>} The created lab test request row
 */
const createLabTestRequest = async (data) => {
  const {
    patientId,
    doctorId,
    appointmentId,
    laboratoryId,
    testType,
    priority,
    notes
  } = data;

  const result = await pool.query(
    `INSERT INTO lab_test_requests
       (patient_id, doctor_id, appointment_id, laboratory_id, test_type, priority, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
     RETURNING *`,
    [
      patientId,
      doctorId,
      appointmentId || null,
      laboratoryId,
      testType,
      priority,
      notes || null
    ]
  );

  return result.rows[0];
};

/**
 * Gets all active, verified laboratories for the lab-selection dropdown.
 * @returns {Promise<Array>} List of { id, name, available_tests } rows
 */
const getActiveLaboratories = async () => {
  const result = await pool.query(
    `SELECT id, name, available_tests
     FROM laboratories
     WHERE is_active = true AND is_verified = true
     ORDER BY name ASC`
  );

  return result.rows;
};

/**
 * Gets all finalized lab reports for a doctor's ordered tests that the
 * doctor hasn't reviewed yet (drives the dashboard notification badge).
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} List of unreviewed reports with patient/test context
 */
const getUnreviewedLabReports = async (doctorId) => {
  const result = await pool.query(
    `SELECT lr.id, lr.report_url, lr.findings, lr.created_at,
            ltr.test_type, ltr.priority, ltr.patient_id,
            p.full_name AS patient_name
     FROM lab_reports lr
     JOIN lab_test_requests ltr ON lr.lab_request_id = ltr.id
     JOIN patients p ON ltr.patient_id = p.id
     WHERE ltr.doctor_id = $1
       AND lr.is_finalized = true
       AND lr.doctor_reviewed_at IS NULL
     ORDER BY lr.created_at ASC`,
    [doctorId]
  );

  return result.rows;
};

/**
 * Marks a lab report as reviewed by the doctor and saves their remark.
 * @param {string} reportId - UUID of the lab report
 * @param {string} remark - Doctor's short remark on the report
 * @returns {Promise<Object>} The updated lab report row
 */
const reviewLabReport = async (reportId, remark, doctorId) => {
  const result = await pool.query(
    `UPDATE lab_reports lr
     SET doctor_reviewed_at = NOW(),
         doctor_remark = $1,
         updated_at = NOW()
     FROM lab_test_requests ltr
     WHERE lr.id = $2
       AND lr.lab_request_id = ltr.id
       AND ltr.doctor_id = $3
     RETURNING lr.*`,
    [remark, reportId, doctorId]
  );

  return result.rows[0] || null;
};

module.exports = {
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  updateDoctorPhoto,
  getAllDoctors,
  searchDoctors,
  getAvailableSlots,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
  getDoctorDashboardStats,
  createLabTestRequest,
  getActiveLaboratories,
  getUnreviewedLabReports,
  reviewLabReport,
};
