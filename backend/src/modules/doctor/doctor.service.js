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

/**
 * Update a doctor's profile.
 * @param {string} id   - UUID of the doctor
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated doctor object
 */
const updateDoctorProfile = async (id, data) => {
  const updated = await doctorRepository.updateDoctor(id, data);
  return updated;
};

/**
 * Get doctor availability schedule.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} Availability slots
 */
const getDoctorAvailability = async (doctorId) => {
  const availability = await doctorRepository.getDoctorAvailability(doctorId);
  return availability;
};

/**
 * Update doctor availability schedule.
 * @param {string} doctorId - UUID of the doctor
 * @param {Array}  slots    - Array of availability slot objects
 * @returns {Promise<Array>} Updated availability slots
 */
const updateDoctorAvailability = async (doctorId, slots) => {
  const updated = await doctorRepository.updateDoctorAvailability(doctorId, slots);
  return updated;
};

module.exports = {
  getDoctorProfile,
  getAllDoctors,
  updateDoctorProfile,
  getDoctorAvailability,
  updateDoctorAvailability,
};