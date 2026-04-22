/**
 * @file    doctor.service.js
 * @module  Doctor
 * @desc    Business logic for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorRepository = require('./doctor.repository');

/**
 * Get a doctor's full profile by doctor ID.
 * @param {string} id - UUID of the doctor
 * @returns {Promise<Object>} Doctor profile object
 */
const getDoctorProfile = async (id) => {
  const doctor = await doctorRepository.getDoctorById(id);
  return doctor;
};

/**
 * Get all verified doctors.
 * @returns {Promise<Array>} Array of doctors
 */
const getAllDoctors = async () => {
  const doctors = await doctorRepository.getAllDoctors();
  return doctors;
};

module.exports = {
  getDoctorProfile,
  getAllDoctors,
};