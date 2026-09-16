/**
 * @file    pharmacy.repository.js
 * @module  Pharmacy
 * @desc    Database queries for pharmacy registration,
 *          verification, profile management,
 *          dashboard statistics, and dispensing history.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new pharmacy record in the database.
 * New pharmacies are created as unverified until admin approval.
 * @param {string} userId        - UUID of the linked user account
 * @param {string} name          - Pharmacy name
 * @param {string} licenseNumber - Official pharmacy license number
 * @param {string} address       - Physical address
 * @param {string} phone         - Contact phone number
 * @returns {Promise<Object>} The newly created pharmacy row
 */
const createPharmacy = async (
  userId,
  name,
  licenseNumber,
  address,
  phone
) => {
  const result = await pool.query(
    `INSERT INTO pharmacies
      (
        user_id,
        name,
        license_number,
        address,
        phone,
        is_verified,
        is_active
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        false,
        true
      )
     RETURNING *`,
    [
      userId,
      name,
      licenseNumber,
      address,
      phone
    ]
  );

  return result.rows[0];
};

/**
 * Finds a pharmacy by its ID.
 * @param {string} id - UUID of the pharmacy
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyById = async (id) => {
  const result = await pool.query(
    `SELECT *
     FROM pharmacies
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Finds a pharmacy by its linked user ID.
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT *
     FROM pharmacies
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Finds a pharmacy by its license number.
 * Used to check for duplicate registrations.
 * @param {string} licenseNumber - License number to check
 * @returns {Promise<Object|null>} Pharmacy row or null
 */
const getPharmacyByLicense = async (
  licenseNumber
) => {
  const result = await pool.query(
    `SELECT *
     FROM pharmacies
     WHERE license_number = $1`,
    [licenseNumber]
  );

  return result.rows[0] || null;
};

/**
 * Approves a pharmacy by setting is_verified to true.
 * @param {string} id - UUID of the pharmacy
 * @returns {Promise<Object|null>} Updated pharmacy row or null
 */
const approvePharmacy = async (id) => {
  const result = await pool.query(
    `UPDATE pharmacies
     SET is_verified = true,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Updates editable pharmacy profile fields.
 * License number and verification status are intentionally not editable here.
 * @param {string} pharmacyId - UUID of the pharmacy
 * @param {Object} updates - Editable pharmacy fields
 * @returns {Promise<Object|null>} Updated pharmacy row or null
 */
const updatePharmacyProfile = async (
  pharmacyId,
  updates
) => {
  const {
    name,
    address,
    phone
  } = updates;

  const result = await pool.query(
    `UPDATE pharmacies
     SET
       name = COALESCE($1, name),
       address = COALESCE($2, address),
       phone = COALESCE($3, phone),
       updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [
      name ?? null,
      address ?? null,
      phone ?? null,
      pharmacyId
    ]
  );

  return result.rows[0] || null;
};

/**
 * Gets dashboard statistics for a pharmacy.
 *
 * The statistics are filtered using prescription_dispensing records
 * so that each pharmacy only sees its own dispensing activity.
 *
 * @param {string} pharmacyId - UUID of the pharmacy
 * @returns {Promise<Object>} Dashboard stats object
 */
const getPharmacyDashboardStats = async (
  pharmacyId
) => {
  /**
   * Get number of dispensing records created today
   * for this pharmacy.
   */
  const todayResult = await pool.query(
    `SELECT COUNT(*) AS count
     FROM prescription_dispensing pd
     WHERE pd.pharmacy_id = $1
       AND DATE(pd.created_at) = CURRENT_DATE`,
    [pharmacyId]
  );

  /**
   * Get number of dispensing records created this month
   * for this pharmacy.
   */
  const monthResult = await pool.query(
    `SELECT COUNT(*) AS count
     FROM prescription_dispensing pd
     WHERE pd.pharmacy_id = $1
       AND DATE_TRUNC('month', pd.created_at) =
           DATE_TRUNC('month', CURRENT_DATE)`,
    [pharmacyId]
  );

  /**
   * Count prescriptions that currently remain partially filled
   * and have been dispensed by this pharmacy.
   */
  const partialResult = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS count
     FROM prescriptions p
     JOIN prescription_dispensing pd
       ON pd.prescription_id = p.id
     WHERE pd.pharmacy_id = $1
       AND p.status = 'partially_filled'`,
    [pharmacyId]
  );

  /**
   * Count prescriptions that have been completed
   * and were dispensed by this pharmacy.
   */
  const completedResult = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS count
     FROM prescriptions p
     JOIN prescription_dispensing pd
       ON pd.prescription_id = p.id
     WHERE pd.pharmacy_id = $1
       AND p.status = 'completed'`,
    [pharmacyId]
  );

  /**
   * Get five most recent prescriptions dispensed
   * by this pharmacy.
   */
  const recentResult = await pool.query(
    `SELECT DISTINCT ON (p.id)
       p.id,
       p.qr_code_value,
       p.status,
       p.expires_at,
       p.created_at,
       p.notes,
       pd.created_at AS dispensed_at
     FROM prescriptions p
     JOIN prescription_dispensing pd
       ON pd.prescription_id = p.id
     WHERE pd.pharmacy_id = $1
     ORDER BY
       p.id,
       pd.created_at DESC`,
    [pharmacyId]
  );

  /**
   * DISTINCT ON groups by prescription first.
   * Sort those latest records again so the dashboard
   * displays the newest dispensing activity first.
   */
  const recentPrescriptions =
    recentResult.rows
      .sort(
        (a, b) =>
          new Date(b.dispensed_at) -
          new Date(a.dispensed_at)
      )
      .slice(0, 5);

  return {
    todayDispensed: parseInt(
      todayResult.rows[0].count,
      10
    ),

    thisMonthDispensed: parseInt(
      monthResult.rows[0].count,
      10
    ),

    partiallyFilled: parseInt(
      partialResult.rows[0].count,
      10
    ),

    completedPrescriptions: parseInt(
      completedResult.rows[0].count,
      10
    ),

    recentPrescriptions
  };
};

/**
 * Gets dispensing history for a pharmacy.
 *
 * Returns prescriptions previously dispensed by the pharmacy,
 * together with patient and doctor information where available.
 *
 * @param {string} pharmacyId - UUID of the pharmacy
 * @returns {Promise<Array>} Dispensing history rows
 */
const getDispensingHistory = async (
  pharmacyId
) => {
  const result = await pool.query(
    `SELECT
       pd.id AS dispensing_id,
       pd.prescription_id,
       pd.created_at AS dispensed_at,

       p.qr_code_value,
       p.status,
       p.created_at AS prescription_created_at,
       p.expires_at,
       p.notes,

       patient.id AS patient_id,
       patient.full_name AS patient_name,

       doctor.id AS doctor_id,
       doctor.full_name AS doctor_name

     FROM prescription_dispensing pd

     JOIN prescriptions p
       ON pd.prescription_id = p.id

     LEFT JOIN patients patient
       ON p.patient_id = patient.id

     LEFT JOIN doctors doctor
       ON p.doctor_id = doctor.id

     WHERE pd.pharmacy_id = $1

     ORDER BY pd.created_at DESC`,
    [pharmacyId]
  );

  return result.rows;
};

/**
 * Gets a single dispensing record by ID.
 * Used when displaying detailed dispensing history.
 *
 * @param {string} dispensingId - UUID of the dispensing record
 * @returns {Promise<Object|null>} Dispensing record or null
 */
const getDispensingRecordById = async (
  dispensingId
) => {
  const result = await pool.query(
    `SELECT
       pd.*,

       p.qr_code_value,
       p.status,
       p.expires_at,
       p.notes,

       patient.full_name AS patient_name,
       doctor.full_name AS doctor_name

     FROM prescription_dispensing pd

     JOIN prescriptions p
       ON pd.prescription_id = p.id

     LEFT JOIN patients patient
       ON p.patient_id = patient.id

     LEFT JOIN doctors doctor
       ON p.doctor_id = doctor.id

     WHERE pd.id = $1`,
    [dispensingId]
  );

  return result.rows[0] || null;
};

module.exports = {
  createPharmacy,
  getPharmacyById,
  getPharmacyByUserId,
  getPharmacyByLicense,
  approvePharmacy,
  updatePharmacyProfile,
  getPharmacyDashboardStats,
  getDispensingHistory,
  getDispensingRecordById,
};