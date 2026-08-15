/**
 * @file    doctor.service.js
 * @module  Doctor
 * @desc    Business logic for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorRepository = require('./doctor.repository');

const getDoctorProfile = async (id) => {
  const doctor = await doctorRepository.getDoctorById(id);
  return doctor;
};

const getAllDoctors = async () => {
  const doctors = await doctorRepository.getAllDoctors();
  return doctors;
};

const updateDoctorProfile = async (id, data) => {
  const updated = await doctorRepository.updateDoctor(id, data);
  return updated;
};

const getDoctorAvailability = async (doctorId) => {
  const availability = await doctorRepository.getDoctorAvailability(doctorId);
  return availability;
};

const updateDoctorAvailability = async (doctorId, slots) => {
  const updated = await doctorRepository.updateDoctorAvailability(doctorId, slots);
  return updated;
};

const getTodayAppointments = async (doctorId) => {
  const appointments = await doctorRepository.getTodayAppointments(doctorId);
  return appointments;
};

const getDoctorDashboardStats = async (doctorId) => {
  const stats = await doctorRepository.getDoctorDashboardStats(doctorId);
  return stats;
};

/**
 * Searches for doctors by specialty and/or hospital name.
 * @param {string} specialty    - Optional specialty filter
 * @param {string} hospitalName - Optional hospital name filter
 * @returns {Promise<Array>} List of matching doctors
 */
const searchDoctors = async (specialty, hospitalName) => {
  return await doctorRepository.searchDoctors(specialty, hospitalName);
};

module.exports = {
  getDoctorProfile,
  getAllDoctors,
  searchDoctors,
  updateDoctorProfile,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
  getDoctorDashboardStats,
};