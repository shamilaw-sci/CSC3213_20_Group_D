/**
 * @file    hospital.repository.js
 * @module  Hospital
 * @desc    Database queries for hospital profiles and hospital
 *          staff account lookups.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Retrieves a hospital profile using the linked user account ID.
 *
 * @param {string} userId - UUID of the hospital staff user
 * @returns {Promise<Object|null>} Hospital profile or null
 */
const getHospitalByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
        id,
        user_id,
        name,
        type,
        location,
        departments,
        is_verified,
        is_active,
        created_at
     FROM hospitals
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Retrieves a hospital profile using its hospital ID.
 *
 * @param {string} hospitalId - UUID of the hospital profile
 * @returns {Promise<Object|null>} Hospital profile or null
 */
const getHospitalById = async (hospitalId) => {
  const result = await pool.query(
    `SELECT
        id,
        user_id,
        name,
        type,
        location,
        departments,
        is_verified,
        is_active,
        created_at
     FROM hospitals
     WHERE id = $1`,
    [hospitalId]
  );

  return result.rows[0] || null;
};

/**
 * Retrieves today's OPD appointment queue across all
 * doctors attached to the specified hospital.
 *
 * @param {string} hospitalName - Registered hospital name
 * @returns {Promise<Array>} Today's hospital-wide appointments
 */
const getTodayOpdAppointments = async (
  hospitalName
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

        p.full_name AS patient_name,
        p.nic AS patient_nic,

        d.full_name AS doctor_name,
        d.specialization

     FROM appointments a

     JOIN patients p
       ON p.id = a.patient_id

     JOIN doctors d
       ON d.id = a.doctor_id

     WHERE DATE(a.scheduled_at) = CURRENT_DATE
       AND LOWER(TRIM(d.hospital_name)) =
           LOWER(TRIM($1))

     ORDER BY
       a.scheduled_at ASC,
       p.full_name ASC`,
    [hospitalName]
  );

  return result.rows;
};

/**
 * Retrieves one of today's OPD appointments while
 * confirming that its doctor belongs to the hospital.
 *
 * @param {string} appointmentId - UUID of the appointment
 * @param {string} hospitalName - Registered hospital name
 * @returns {Promise<Object|null>} Appointment or null
 */
const getTodayOpdAppointmentById = async (
  appointmentId,
  hospitalName
) => {
  const result = await pool.query(
    `SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.scheduled_at,
        a.status,
        a.type,

        p.full_name AS patient_name,

        d.full_name AS doctor_name,
        d.specialization

     FROM appointments a

     JOIN patients p
       ON p.id = a.patient_id

     JOIN doctors d
       ON d.id = a.doctor_id

     WHERE a.id = $1
       AND DATE(a.scheduled_at) = CURRENT_DATE
       AND LOWER(TRIM(d.hospital_name)) =
           LOWER(TRIM($2))

     LIMIT 1`,
    [
      appointmentId,
      hospitalName
    ]
  );

  return result.rows[0] || null;
};

/**
 * Marks a scheduled OPD appointment as confirmed,
 * representing patient check-in at reception.
 *
 * @param {string} appointmentId - UUID of the appointment
 * @returns {Promise<Object|null>} Updated appointment or null
 */
const checkInOpdAppointment = async (
  appointmentId
) => {
  const result = await pool.query(
    `UPDATE appointments
     SET status = 'confirmed'
     WHERE id = $1
       AND status = 'scheduled'
     RETURNING
       id,
       patient_id,
       doctor_id,
       scheduled_at,
       status,
       type`,
    [appointmentId]
  );

  return result.rows[0] || null;
};

/**
 * Finds an existing patient using their NIC.
 *
 * Used by hospital-assisted registration to avoid
 * creating duplicate patient profiles.
 *
 * @param {string} nic - Patient National Identity Card number
 * @returns {Promise<Object|null>} Existing patient or null
 */
const findPatientByNic = async (
  nic
) => {
  if (!nic) {
    return null;
  }

  const result =
    await pool.query(
      `SELECT
          id,
          user_id,
          full_name,
          nic,
          date_of_birth,
          gender,
          blood_group,
          qr_code_id
       FROM patients
       WHERE nic = $1
       LIMIT 1`,
      [nic]
    );

  return result.rows[0] || null;
};

/**
 * Creates a hospital-assisted patient profile.
 *
 * Hospital-assisted patients do not require a Care4U
 * login account, so user_id remains NULL.
 *
 * @param {Object} patientData - Patient registration details
 * @returns {Promise<Object>} Created patient profile
 */
const createAssistedPatient = async (
  patientData
) => {
  const {
    fullName,
    nic,
    dateOfBirth,
    gender,
    bloodGroup,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
    qrCodeId
  } = patientData;

  const result =
    await pool.query(
      `INSERT INTO patients
        (
          user_id,
          full_name,
          nic,
          date_of_birth,
          gender,
          blood_group,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          qr_code_id
        )
       VALUES
        (
          NULL,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
       RETURNING
          id,
          user_id,
          full_name,
          nic,
          uhi,
          date_of_birth,
          gender,
          blood_group,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          qr_code_id,
          created_at`,
      [
        fullName,
        nic || null,
        dateOfBirth,
        gender || null,
        bloodGroup || null,
        emergencyContactName || null,
        emergencyContactPhone || null,
        emergencyContactRelationship || null,
        qrCodeId
      ]
    );

  return result.rows[0];
};

module.exports = {
  getHospitalByUserId,
  getHospitalById,
  getTodayOpdAppointments,
  getTodayOpdAppointmentById,
  checkInOpdAppointment,
  findPatientByNic,
  createAssistedPatient
};