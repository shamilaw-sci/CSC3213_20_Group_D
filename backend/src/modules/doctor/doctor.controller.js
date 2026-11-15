/**
 * @file    doctor.controller.js
 * @module  Doctor
 * @desc    Handles doctor API requests and sends responses from doctor services.
 * @author  Tharindu Lakshan (S/21/166)
 */

const doctorService = require('./doctor.service');

/**
 * FEATURE: View Doctor Profile
 * LOGIC: Look up the requested doctor; return their profile or a not-found response.
 */
const getDoctorController = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.getDoctorProfile(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor profile retrieved successfully',
      data: doctor,
    });

  } catch (error) {
    console.error('getDoctorController error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Find Doctors
 * LOGIC: Return the approved doctor list prepared by the service.
 */
const getAllDoctorsController = async (req, res) => {
  try {
    const doctors = await doctorService.getAllDoctors();

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors,
    });

  } catch (error) {
    console.error('getAllDoctorsController error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Edit Doctor Profile
 * LOGIC: Send editable details to the service; report a missing profile or rejected changes.
 */
const updateDoctorController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated =
      await doctorService.updateDoctorProfile(id, data);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: updated,
    });

  } catch (error) {
    console.error('updateDoctorController error:', error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Upload Doctor Photo
 * LOGIC: Pass the uploaded image to the service; return the new profile photo details.
 */
const uploadDoctorPhotoController = async (req, res) => {
  try {
    const { id } = req.params;

    const updated =
      await doctorService.uploadDoctorPhoto(
        id,
        req.file
      );

    res.status(200).json({
      success: true,
      message: 'Doctor photo uploaded',
      data: updated,
    });

  } catch (error) {
    console.error(
      'uploadDoctorPhotoController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: View Weekly Schedule
 * LOGIC: Load the selected doctor's saved working times.
 */
const getDoctorAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;

    const availability =
      await doctorService.getDoctorAvailability(id);

    res.status(200).json({
      success: true,
      message: 'Doctor availability retrieved successfully',
      data: availability,
    });

  } catch (error) {
    console.error(
      'getDoctorAvailabilityController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Edit Weekly Schedule
 * LOGIC: Require a list of time windows; the service checks them before saving.
 */
const updateDoctorAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;
    const { slots } = req.body || {};

    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: 'slots must be an array',
      });
    }

    const updated =
      await doctorService.updateDoctorAvailability(
        id,
        slots
      );

    res.status(200).json({
      success: true,
      message: 'Doctor availability updated successfully',
      data: updated,
    });

  } catch (error) {
    console.error(
      'updateDoctorAvailabilityController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Today's Patient Queue
 * LOGIC: Load the doctor's appointments for today.
 */
const getTodayAppointmentsController = async (req, res) => {
  try {
    const { id } = req.params;

    const appointments =
      await doctorService.getTodayAppointments(id);

    res.status(200).json({
      success: true,
      message: 'Today\'s appointments retrieved successfully',
      data: appointments,
    });

  } catch (error) {
    console.error(
      'getTodayAppointmentsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Dashboard Summary
 * LOGIC: Return today's appointment counts and the next waiting patient.
 */
const getDoctorDashboardStatsController = async (req, res) => {
  try {
    const { id } = req.params;

    const stats =
      await doctorService.getDoctorDashboardStats(id);

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    });

  } catch (error) {
    console.error(
      'getDoctorDashboardStatsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: AI Insights Placeholder
 * LOGIC: Return an empty list; this endpoint does not generate AI insights yet.
 */
const getDoctorAiInsightsController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'AI insights retrieved successfully',
      data: {
        insights: [],
        note: 'No AI-generated insights available yet',
      },
    });

  } catch (error) {
    console.error(
      'getDoctorAiInsightsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Search Doctors
 * LOGIC: Read the specialty and hospital filters and ask the service for matching doctors.
 */
const searchDoctorsController = async (req, res) => {
  try {
    const { specialty, hospital } = req.query;

    const doctors =
      await doctorService.searchDoctors(
        specialty,
        hospital
      );

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors,
    });

  } catch (error) {
    console.error(
      'searchDoctorsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.'
    });
  }
};

/**
 * FEATURE: Find Free Appointment Times
 * LOGIC: Get the next three suggested free slots; this does not reserve a slot.
 */
const getAvailableSlotsController = async (req, res) => {
  try {
    const { id } = req.params;

    const slots =
      await doctorService.getAvailableSlots(id);

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: slots,
    });

  } catch (error) {
    console.error(
      'getAvailableSlotsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.',
    });
  }
};

/**
 * FEATURE: Order Lab Test
 * LOGIC: Pass patient, visit, lab, test type and priority to the service for validation.
 */
const orderLabTestController = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      patientId,
      appointmentId,
      laboratoryId,
      testType,
      priority,
      notes
    } = req.body || {};

    const request =
      await doctorService.orderLabTest({
        patientId,
        doctorId: id,
        appointmentId,
        laboratoryId,
        testType,
        priority,
        notes,
      });

    res.status(201).json({
      success: true,
      message: 'Lab test request created successfully',
      data: request,
    });

  } catch (error) {
    console.error(
      'orderLabTestController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.',
    });
  }
};

/**
 * FEATURE: Choose a Laboratory
 * LOGIC: Return active, verified laboratories for the doctor's order form.
 */
const getActiveLaboratoriesController = async (req, res) => {
  try {
    const laboratories =
      await doctorService.getActiveLaboratories();

    res.status(200).json({
      success: true,
      message: 'Laboratories retrieved successfully',
      data: laboratories,
    });

  } catch (error) {
    console.error(
      'getActiveLaboratoriesController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.',
    });
  }
};

/**
 * FEATURE: New Lab Report Notifications
 * LOGIC: Load finalized lab reports the doctor has not reviewed yet.
 */
const getUnreviewedLabReportsController = async (req, res) => {
  try {
    const { id } = req.params;

    const reports =
      await doctorService.getUnreviewedLabReports(id);

    res.status(200).json({
      success: true,
      message: 'Unreviewed lab reports retrieved successfully',
      data: reports,
    });

  } catch (error) {
    console.error(
      'getUnreviewedLabReportsController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.',
    });
  }
};

/**
 * FEATURE: Review Lab Report
 * LOGIC: Pass the remark and signed-in doctor ID; service checks it before marking reviewed.
 */
const reviewLabReportController = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { remark } = req.body || {};

    const updated =
      await doctorService.reviewLabReport(
        reportId,
        remark,
        req.session.user.profile_id
      );

    res.status(200).json({
      success: true,
      message: 'Lab report marked as reviewed',
      data: updated,
    });

  } catch (error) {
    console.error(
      'reviewLabReportController error:',
      error
    );

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500 ? error.message : 'Care4U could not complete the request. Please try again.',
    });
  }
};

module.exports = {
  getDoctorController,
  getAllDoctorsController,
  searchDoctorsController,
  getAvailableSlotsController,
  updateDoctorController,
  uploadDoctorPhotoController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getTodayAppointmentsController,
  getDoctorDashboardStatsController,
  getDoctorAiInsightsController,
  orderLabTestController,
  getActiveLaboratoriesController,
  getUnreviewedLabReportsController,
  reviewLabReportController,
};