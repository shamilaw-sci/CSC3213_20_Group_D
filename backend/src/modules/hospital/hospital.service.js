/**
 * @file    hospital.service.js
 * @module  Hospital
 * @desc    Business logic for retrieving hospital profiles and
 *          validating hospital staff access to hospital data.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const hospitalRepository = require('./hospital.repository');

/**
 * Retrieves a hospital profile using its hospital ID.
 *
 * @param {string} hospitalId - UUID of the hospital profile
 * @returns {Promise<Object>} Hospital profile
 */
const getHospitalProfile = async (hospitalId) => {
  if (!hospitalId) {
    const error = new Error('Hospital ID is required');
    error.statusCode = 400;
    throw error;
  }

  const hospital =
    await hospitalRepository.getHospitalById(hospitalId);

  if (!hospital) {
    const error = new Error('Hospital not found');
    error.statusCode = 404;
    throw error;
  }

  if (!hospital.is_active) {
    const error = new Error('Hospital account is inactive');
    error.statusCode = 403;
    throw error;
  }

  return hospital;
};

/**
 * Retrieves the hospital profile linked to an authenticated
 * hospital staff user account.
 *
 * @param {string} userId - UUID of the authenticated user
 * @returns {Promise<Object>} Hospital profile
 */
const getHospitalProfileByUserId = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.statusCode = 400;
    throw error;
  }

  const hospital =
    await hospitalRepository.getHospitalByUserId(userId);

  if (!hospital) {
    const error = new Error(
      'Hospital profile not found for this user'
    );
    error.statusCode = 404;
    throw error;
  }

  if (!hospital.is_active) {
    const error = new Error('Hospital account is inactive');
    error.statusCode = 403;
    throw error;
  }

  return hospital;
};

/**
 * Retrieves today's hospital-wide OPD appointments
 * for the hospital linked to the authenticated staff user.
 *
 * @param {string} userId - UUID of the authenticated hospital staff user
 * @returns {Promise<Array>} Today's OPD appointments
 */
const getTodayOpdAppointments = async (
  userId
) => {
  const hospital =
    await getHospitalProfileByUserId(
      userId
    );

  return await hospitalRepository
    .getTodayOpdAppointments(
      hospital.name
    );
};

/**
 * Checks a patient into today's OPD queue.
 *
 * Only scheduled appointments belonging to doctors
 * attached to the authenticated staff member's hospital
 * can be checked in.
 *
 * @param {string} userId - UUID of hospital staff user
 * @param {string} appointmentId - UUID of appointment
 * @returns {Promise<Object>} Updated appointment
 */
const checkInOpdAppointment = async (
  userId,
  appointmentId
) => {
  if (!appointmentId) {
    const error =
      new Error(
        'Appointment ID is required'
      );

    error.statusCode = 400;
    throw error;
  }

  const hospital =
    await getHospitalProfileByUserId(
      userId
    );

  const appointment =
    await hospitalRepository
      .getTodayOpdAppointmentById(
        appointmentId,
        hospital.name
      );

  if (!appointment) {
    const error =
      new Error(
        'OPD appointment not found for this hospital today'
      );

    error.statusCode = 404;
    throw error;
  }

  if (
    appointment.status !==
    'scheduled'
  ) {
    const error =
      new Error(
        'Only scheduled appointments can be checked in'
      );

    error.statusCode = 409;
    throw error;
  }

  const updated =
    await hospitalRepository
      .checkInOpdAppointment(
        appointmentId
      );

  if (!updated) {
    const error =
      new Error(
        'Appointment could not be checked in'
      );

    error.statusCode = 409;
    throw error;
  }

  return updated;
};

module.exports = {
  getHospitalProfile,
  getHospitalProfileByUserId,
  getTodayOpdAppointments,
  checkInOpdAppointment
};