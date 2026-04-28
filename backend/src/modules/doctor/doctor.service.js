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

module.exports = {
  getDoctorProfile,
  getAllDoctors,
  updateDoctorProfile,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
};