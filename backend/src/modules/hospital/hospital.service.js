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

module.exports = {
  getHospitalProfile,
  getHospitalProfileByUserId
};