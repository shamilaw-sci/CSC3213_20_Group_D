/**
 * @file    doctor.service.js
 * @module  Doctor
 * @desc    Business logic for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorRepository = require('./doctor.repository');

const PRIORITY_LEVELS = ['routine', 'urgent', 'stat'];

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

/**
 * Gets the next available appointment slots for a doctor.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} List of next 3 available slot times
 */
const getAvailableSlots = async (doctorId) => {
  const doctor = await doctorRepository.getDoctorById(doctorId);
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }
  return await doctorRepository.getAvailableSlots(doctorId, 3);
};

/**
 * Creates a new lab test request from the doctor's side, after validating
 * the required fields, the priority level, and that the chosen laboratory
 * is real and currently active.
 * @param {Object} data - { patientId, doctorId, appointmentId, laboratoryId, testType, priority, notes }
 * @returns {Promise<Object>} The created lab test request
 */
const orderLabTest = async (data) => {
  const { patientId, doctorId, laboratoryId, testType } = data;

  if (!patientId || !doctorId || !laboratoryId || !testType || !testType.trim()) {
    const error = new Error('Validation failed: patientId, doctorId, laboratoryId and testType are required');
    error.statusCode = 400;
    throw error;
  }

  const priority = (data.priority || 'routine').toLowerCase();
  if (!PRIORITY_LEVELS.includes(priority)) {
    const error = new Error(`Validation failed: priority must be one of ${PRIORITY_LEVELS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const laboratories = await doctorRepository.getActiveLaboratories();
  const laboratoryExists = laboratories.some((lab) => lab.id === laboratoryId);
  if (!laboratoryExists) {
    const error = new Error('Selected laboratory was not found or is not currently active');
    error.statusCode = 404;
    throw error;
  }

  return await doctorRepository.createLabTestRequest({
    patientId,
    doctorId,
    appointmentId: data.appointmentId,
    laboratoryId,
    testType: testType.trim(),
    priority,
    notes: data.notes,
  });
};

/**
 * Gets all active laboratories for the lab-selection dropdown.
 * @returns {Promise<Array>} List of active laboratories
 */
const getActiveLaboratories = async () => {
  return await doctorRepository.getActiveLaboratories();
};

module.exports = {
  getDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getAvailableSlots,
  updateDoctorProfile,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
  getDoctorDashboardStats,
  orderLabTest,
  getActiveLaboratories,
};