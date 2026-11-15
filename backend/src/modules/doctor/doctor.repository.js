/**
 * @file    doctor.repository.js
 * @module  Doctor
 * @desc    Reads and saves doctor, appointment and lab information in PostgreSQL.
 * @author  Tharindu Lakshan (S/21/166)
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

/**
 * FEATURE: Find Doctor From Login Account
 * LOGIC: Match the logged-in account to its doctor profile; allow a shared database
 *        transaction when provided.
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

/**
 * FEATURE: Save Only Editable Doctor Details
 * LOGIC: Update allowed profile fields while leaving unspecified ones unchanged; an
 *        explicitly supplied years-of-experience value can clear it.
 */
const updateDoctor = async (id, data) => {
  const { specialization, qualifications, years_experience, hospital_name } = data;
  const result = await pool.query(
    `UPDATE doctors
     SET specialization   = COALESCE($1, specialization),
         qualifications   = COALESCE($2, qualifications),
         years_experience = CASE WHEN $6::boolean THEN $3::integer ELSE years_experience END,
         hospital_name    = COALESCE($4, hospital_name),
         updated_at       = NOW()
     WHERE id = $5
     RETURNING *`,
    [specialization, qualifications, years_experience, hospital_name, id, Object.hasOwn(data, 'years_experience')]
  );
  return result.rows[0] || null;
};

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

/**
 * FEATURE: Only Show Approved Doctors
 * LOGIC: Include doctors only when their profiles are verified and their user accounts are
 *        approved and active.
 */
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

const getDoctorAvailability = async (doctorId, db = pool) => {
  const result = await db.query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1
     ORDER BY day_of_week ASC`,
    [doctorId]
  );
  return result.rows;
};

/**
 * FEATURE: Safely Replace Weekly Schedule
 * LOGIC: Start a transaction and lock the doctor row; replace all time windows, then commit
 *        together. On any failure, roll back so the old schedule remains.
 */
const updateDoctorAvailability = async (doctorId, slots) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doctor = await client.query('SELECT id FROM doctors WHERE id = $1 FOR UPDATE', [doctorId]);
    if (!doctor.rows.length) throw Object.assign(new Error('Doctor not found'), { statusCode: 404 });
    await client.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);
    for (const slot of slots) {
      await client.query(`INSERT INTO doctor_availability
        (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [doctorId, slot.day_of_week, slot.start_time, slot.end_time, slot.slot_duration_minutes, slot.is_active]);
    }
    const result = await getDoctorAvailability(doctorId, client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
};

/**
 * FEATURE: Today's Appointment Queue
 * LOGIC: Read this doctor's appointments for the database's current date and sort them by
 *        appointment time.
 */
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

/**
 * FEATURE: Doctor Dashboard Numbers
 * LOGIC: Count today's completed, in-progress and waiting appointments; choose the first
 *        scheduled or confirmed patient as next.
 */
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
  const pending = appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length;
  const nextPatient = appointments.find(a => ['scheduled', 'confirmed'].includes(a.status)) || null;

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
 * FEATURE: Search Approved Doctors
 * LOGIC: Match doctor name/specialty and optional hospital with partial text; exclude
 *        unverified, unapproved or inactive accounts.
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
 * FEATURE: Find the Next Three Free Appointment Slots
 * LOGIC: Check the doctor's working windows across the next 14 days; skip past, already
 *        booked and invalid times. These are suggestions, not guaranteed reservations.
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

    // Legacy malformed schedules must never cause a backwards/infinite public slot loop.
    if (!Number.isInteger(Number(slotDuration)) || Number(slotDuration) <= 0 || !Number.isFinite(endTime.getTime()) || !Number.isFinite(slotTime.getTime())) continue;
    while (slotTime.getTime() + Number(slotDuration) * 60000 <= endTime.getTime() && slots.length < limit) {
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
 * FEATURE: Save Lab Test Request
 * LOGIC: Create the lab request with a pending status after service validation.
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
 * FEATURE: Available Laboratories
 * LOGIC: Show only laboratories that are both active and verified.
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
 * FEATURE: Unreviewed Lab Report Alerts
 * LOGIC: Find finalized reports for tests ordered by this doctor that have no review
 *        timestamp.
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
 * FEATURE: Mark Report Reviewed by Its Doctor
 * LOGIC: Save the review time and remark only when the report is finalized and belongs to
 *        this doctor's lab order.
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
       AND lr.is_finalized = true
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