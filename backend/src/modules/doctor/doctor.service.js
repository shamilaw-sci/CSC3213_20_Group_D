/**
 * @file    doctor.service.js
 * @module  Doctor
 * @desc    Checks doctor profile changes, schedules, lab orders and report reviews.
 * @author  Tharindu Lakshan (S/21/166)
 */

const doctorRepository = require('./doctor.repository');
const appointmentRepository = require('../appointment/appointment.repository');
const { supabase } = require('../../config/supabase');

const PRIORITY_LEVELS = ['routine', 'urgent', 'stat'];

const PHOTO_BUCKET = 'doctor-photos';

/**
 * Doctor Profile: read the requested doctor profile through the repository.
 */
const getDoctorProfile = async (id) => {
  const doctor = await doctorRepository.getDoctorById(id);
  return doctor;
};

/**
 * Doctor Directory: return the approved, active doctors selected by the repository.
 */
const getAllDoctors = async () => {
  const doctors = await doctorRepository.getAllDoctors();
  return doctors;
};

/**
 * FEATURE: Safe Doctor Profile Editing
 * LOGIC: Accept only approved profile fields; check text lengths and nonnegative whole
 *        years. Identity and approval fields cannot be edited here.
 */
const updateDoctorProfile = async (id, data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw Object.assign(new Error('Profile changes must be an object'), { statusCode: 400 });
  }
  // Only whitelisted fields enter the update; the browser cannot change identity or approval
  // status.
  const clean = {};
  for (const [field, limit] of Object.entries({ specialization: 100, qualifications: 20000, hospital_name: 255 })) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== 'string' || data[field].trim().length > limit || (field === 'specialization' && !data[field].trim())) {
      throw Object.assign(new Error(`Enter a valid ${field.replaceAll('_', ' ')}`), { statusCode: 400 });
    }
    clean[field] = data[field].trim();
  }
  if (data.years_experience !== undefined) {
    const years = data.years_experience === '' || data.years_experience === null ? null : Number(data.years_experience);
    if (years !== null && (!Number.isSafeInteger(years) || years < 0 || years > 2147483647)) {
      throw Object.assign(new Error('Years of experience must be a nonnegative whole number'), { statusCode: 400 });
    }
    clean.years_experience = years;
  }
  if (!Object.keys(clean).length) throw Object.assign(new Error('No editable changes were supplied'), { statusCode: 400 });
  return doctorRepository.updateDoctor(id, clean);
};

/**
 * FEATURE: Upload Doctor Photo
 * LOGIC: Require an image, working storage and an existing doctor; upload the file, then
 *        save its public URL. A timestamp refreshes the displayed image.
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

  // Store one photo per doctor using upsert; the updated URL refreshes the browser cache.
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

/**
 * Weekly Schedule: load the doctor's saved availability windows for the profile page.
 */
const getDoctorAvailability = async (doctorId) => {
  const availability =
    await doctorRepository.getDoctorAvailability(doctorId);

  return availability;
};

/**
 * FEATURE: Validate Weekly Availability
 * LOGIC: Allow at most one time window per weekday; start must be before end and the slot
 *        duration must fit. Pass the checked schedule to the repository for all-or-nothing
 *        saving.
 */
const updateDoctorAvailability = async (doctorId, slots) => {
  // A set catches repeated weekdays before replacing the saved schedule.
  const days = new Set();
  /**
   * Convert HH:MM or HH:MM:SS to minutes so start/end times can be compared.
   */
  const time = value => {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) return NaN;
    const [h,m,seconds=0] = value.split(':').map(Number); return h * 60 + m + seconds / 60;
  };
  if (!Array.isArray(slots) || slots.length > 7) throw Object.assign(new Error('Provide up to seven availability windows'), { statusCode: 400 });
  // Reject invalid windows or durations here; the repository then saves all valid days
  // together.
  const clean = slots.map(slot => {
    if (!slot || typeof slot !== 'object' || !['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(slot.day_of_week) || days.has(slot.day_of_week)) {
      throw Object.assign(new Error('Choose each weekday at most once'), { statusCode: 400 });
    }
    days.add(slot.day_of_week);
    const start = time(slot.start_time), end = time(slot.end_time), duration = Number(slot.slot_duration_minutes ?? 30);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || !Number.isInteger(duration) || duration < 1 || duration > end - start || (slot.is_active !== undefined && typeof slot.is_active !== 'boolean')) {
      throw Object.assign(new Error('Choose valid start/end times and a positive slot duration that fits the window'), { statusCode: 400 });
    }
    return { day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time, slot_duration_minutes: duration, is_active: slot.is_active ?? true };
  });
  return doctorRepository.updateDoctorAvailability(doctorId, clean);
};

/**
 * Daily Queue: load only this doctor's appointments for today.
 */
const getTodayAppointments = async (doctorId) => {
  const appointments =
    await doctorRepository.getTodayAppointments(doctorId);

  return appointments;
};

/**
 * Doctor Dashboard: read appointment counts and the next waiting patient.
 */
const getDoctorDashboardStats = async (doctorId) => {
  const stats =
    await doctorRepository.getDoctorDashboardStats(doctorId);

  return stats;
};

/**
 * Doctor Search: pass specialty and hospital filters to the database search.
 */
const searchDoctors = async (specialty, hospitalName) => {
  return await doctorRepository.searchDoctors(
    specialty,
    hospitalName
  );
};

/**
 * FEATURE: Suggest Appointment Slots
 * LOGIC: Reject an unknown doctor; ask the repository for the next three currently unbooked
 *        times. Booking itself is checked separately.
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
    30
  );
};

/**
 * FEATURE: Order a Lab Test During Consultation
 * LOGIC: Require a matching in-progress appointment for this doctor and patient; check test
 *        details, routine/urgent/stat priority and an active verified laboratory before
 *        creating the request.
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
    typeof testType !== 'string' ||
    !testType.trim()
  ) {
    const error = new Error(
      'Validation failed: patientId, doctorId, appointmentId, laboratoryId and testType are required'
    );

    error.statusCode = 400;
    throw error;
  }

  // Match the active appointment, patient AND doctor before accepting a laboratory order.
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

  if (data.priority !== undefined && typeof data.priority !== 'string') throw Object.assign(new Error('Choose a valid priority'), { statusCode: 400 });
  const priority =
    (data.priority || 'routine').toLowerCase();

  if (!PRIORITY_LEVELS.includes(priority)) {
    const error = new Error(
      `Validation failed: priority must be one of ${PRIORITY_LEVELS.join(', ')}`
    );

    error.statusCode = 400;
    throw error;
  }

  // A lab order may target only a laboratory currently approved and active.
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
 * Laboratory Selector: list verified, active laboratories available for test orders.
 */
const getActiveLaboratories = async () => {
  return await doctorRepository.getActiveLaboratories();
};

/**
 * Lab Review Alerts: load finalized results ordered by this doctor that remain unreviewed.
 */
const getUnreviewedLabReports = async (doctorId) => {
  return await doctorRepository.getUnreviewedLabReports(
    doctorId
  );
};

/**
 * FEATURE: Review Lab Report With Remark
 * LOGIC: Require a nonempty remark; repository updates only a finalized report ordered by
 *        this doctor. If no matching report is updated, return not found.
 */
const reviewLabReport = async (reportId, remark, doctorId) => {
  if (!reportId) {
    const error = new Error(
      'Validation failed: reportId is required'
    );

    error.statusCode = 400;
    throw error;
  }

  if (typeof remark !== 'string' || !remark.trim()) {
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
