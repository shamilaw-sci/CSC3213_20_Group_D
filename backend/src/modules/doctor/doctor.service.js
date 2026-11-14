/**
 * @file    doctor.service.js
 * @module  Doctor
 * @desc    Business logic for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorRepository = require('./doctor.repository');
const appointmentRepository = require('../appointment/appointment.repository');
const { supabase } = require('../../config/supabase');

const PRIORITY_LEVELS = ['routine', 'urgent', 'stat'];

const PHOTO_BUCKET = 'doctor-photos';

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

/**
 * Uploads a new profile photo for a doctor to Supabase Storage.
 */
const uploadDoctorPhoto = async (doctorId, file) => {
  if (!file) {
    const error = new Error('No photo file was provided');
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    const error = new Error('Photo uploads are unavailable. Please try again later.');
    error.statusCode = 503;
    throw error;
  }

  const existing = await doctorRepository.getDoctorById(doctorId);

  if (!existing) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  const storagePath = `${doctorId}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error(
      'Supabase Storage doctor photo upload error:',
      uploadError
    );

    const error = new Error(
      'Failed to upload photo to storage'
    );

    error.statusCode = 500;
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(storagePath);

  const photoUrl =
    `${publicUrlData.publicUrl}?updated=${Date.now()}`;

  return await doctorRepository.updateDoctorPhoto(
    doctorId,
    photoUrl
  );
};

const getDoctorAvailability = async (doctorId) => {
  const availability =
    await doctorRepository.getDoctorAvailability(doctorId);

  return availability;
};

const updateDoctorAvailability = async (doctorId, slots) => {
  const updated =
    await doctorRepository.updateDoctorAvailability(
      doctorId,
      slots
    );

  return updated;
};

const getTodayAppointments = async (doctorId) => {
  const appointments =
    await doctorRepository.getTodayAppointments(doctorId);

  return appointments;
};

const getDoctorDashboardStats = async (doctorId) => {
  const stats =
    await doctorRepository.getDoctorDashboardStats(doctorId);

  return stats;
};

/**
 * Searches for doctors by specialty and/or hospital name.
 * @param {string} specialty    - Optional specialty filter
 * @param {string} hospitalName - Optional hospital name filter
 * @returns {Promise<Array>} List of matching doctors
 */
const searchDoctors = async (specialty, hospitalName) => {
  return await doctorRepository.searchDoctors(
    specialty,
    hospitalName
  );
};

/**
 * Gets the next available appointment slots for a doctor.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} List of next 3 available slot times
 */
const getAvailableSlots = async (doctorId) => {
  const doctor =
    await doctorRepository.getDoctorById(doctorId);

  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  return await doctorRepository.getAvailableSlots(
    doctorId,
    3
  );
};

/**
 * Creates a new lab test request from the doctor's side, after validating
 * the required fields, the priority level, and that the chosen laboratory
 * is real and currently active.
 * @param {Object} data - { patientId, doctorId, appointmentId, laboratoryId, testType, priority, notes }
 * @returns {Promise<Object>} The created lab test request
 */
const orderLabTest = async (data) => {
  const {
    patientId,
    doctorId,
    appointmentId,
    laboratoryId,
    testType
  } = data;

  if (
    !patientId ||
    !doctorId ||
    !appointmentId ||
    !laboratoryId ||
    !testType ||
    !testType.trim()
  ) {
    const error = new Error(
      'Validation failed: patientId, doctorId, appointmentId, laboratoryId and testType are required'
    );

    error.statusCode = 400;
    throw error;
  }

  const appointment =
    await appointmentRepository.getAppointmentById(appointmentId);

  if (
    !appointment ||
    appointment.status !== 'in_progress' ||
    String(appointment.patient_id) !== String(patientId) ||
    String(appointment.doctor_id) !== String(doctorId)
  ) {
    const error = new Error(
      'Lab tests can only be ordered during your active patient consultation'
    );
    error.statusCode = 403;
    throw error;
  }

  const priority =
    (data.priority || 'routine').toLowerCase();

  if (!PRIORITY_LEVELS.includes(priority)) {
    const error = new Error(
      `Validation failed: priority must be one of ${PRIORITY_LEVELS.join(', ')}`
    );

    error.statusCode = 400;
    throw error;
  }

  const laboratories =
    await doctorRepository.getActiveLaboratories();

  const laboratoryExists =
    laboratories.some(
      lab => lab.id === laboratoryId
    );

  if (!laboratoryExists) {
    const error = new Error(
      'Selected laboratory was not found or is not currently active'
    );

    error.statusCode = 404;
    throw error;
  }

  return await doctorRepository.createLabTestRequest({
    patientId,
    doctorId,
    appointmentId,
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

/**
 * Gets all finalized lab reports the doctor hasn't reviewed yet.
 * @param {string} doctorId - UUID of the doctor
 * @returns {Promise<Array>} List of unreviewed reports
 */
const getUnreviewedLabReports = async (doctorId) => {
  return await doctorRepository.getUnreviewedLabReports(
    doctorId
  );
};

/**
 * Marks a lab report as reviewed and saves the doctor's remark, after
 * validating a remark was actually provided and the report exists.
 * @param {string} reportId - UUID of the lab report
 * @param {string} remark - Doctor's short remark on the report
 * @returns {Promise<Object>} The updated lab report
 */
const reviewLabReport = async (reportId, remark, doctorId) => {
  if (!reportId) {
    const error = new Error(
      'Validation failed: reportId is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (!remark || !remark.trim()) {
    const error = new Error(
      'Validation failed: a remark is required to mark a report as reviewed'
    );

    error.statusCode = 400;
    throw error;
  }

  const updated =
    await doctorRepository.reviewLabReport(
      reportId,
      remark.trim(),
      doctorId
    );

  if (!updated) {
    const error = new Error('Lab report not found');
    error.statusCode = 404;
    throw error;
  }

  return updated;
};

module.exports = {
  getDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getAvailableSlots,
  updateDoctorProfile,
  uploadDoctorPhoto,
  getDoctorAvailability,
  updateDoctorAvailability,
  getTodayAppointments,
  getDoctorDashboardStats,
  orderLabTest,
  getActiveLaboratories,
  getUnreviewedLabReports,
  reviewLabReport,
};
