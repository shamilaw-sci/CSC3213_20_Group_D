/**
 * @file    appointment.repository.js
 * @module  Appointment
 * @desc    Database queries for the Appointment module.
 *          Shared module used by Doctor and Patient modules.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

/**
 * Update the status of an appointment.
 * @param {string} id     - UUID of the appointment
 * @param {string} status - New status value
 * @returns {Promise<Object|null>} Updated appointment or null
 */
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

/**
 * Get an appointment by ID.
 * @param {string} id - UUID of the appointment
 * @returns {Promise<Object|null>} Appointment or null
 */
const getAppointmentById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM appointments WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  updateAppointmentStatus,
  getAppointmentById,
};