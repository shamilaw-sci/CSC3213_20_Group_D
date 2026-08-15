/**
 * @file    doctor.controller.js
 * @module  Doctor
 * @desc    Request handlers for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorService = require('./doctor.service');

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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateDoctorController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await doctorService.updateDoctorProfile(id, data);
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getDoctorAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await doctorService.getDoctorAvailability(id);
    res.status(200).json({
      success: true,
      message: 'Doctor availability retrieved successfully',
      data: availability,
    });
  } catch (error) {
    console.error('getDoctorAvailabilityController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateDoctorAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: 'slots must be an array',
      });
    }
    const updated = await doctorService.updateDoctorAvailability(id, slots);
    res.status(200).json({
      success: true,
      message: 'Doctor availability updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updateDoctorAvailabilityController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTodayAppointmentsController = async (req, res) => {
  try {
    const { id } = req.params;
    const appointments = await doctorService.getTodayAppointments(id);
    res.status(200).json({
      success: true,
      message: 'Today\'s appointments retrieved successfully',
      data: appointments,
    });
  } catch (error) {
    console.error('getTodayAppointmentsController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getDoctorDashboardStatsController = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await doctorService.getDoctorDashboardStats(id);
    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('getDoctorDashboardStatsController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
    console.error('getDoctorAiInsightsController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Handles GET /api/doctors/search
 * Searches for doctors by specialty and/or hospital name.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchDoctorsController = async (req, res) => {
  try {
    const { specialty, hospital } = req.query;
    const doctors = await doctorService.searchDoctors(specialty, hospital);

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors,
    });

  } catch (error) {
    console.error('searchDoctorsController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Handles GET /api/doctors/:id/slots
 * Returns next 3 available appointment slots for a doctor.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAvailableSlotsController = async (req, res) => {
  try {
    const { id } = req.params;
    const slots = await doctorService.getAvailableSlots(id);

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: slots,
    });

  } catch (error) {
    console.error('getAvailableSlotsController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  getDoctorController,
  getAllDoctorsController,
  searchDoctorsController,
  getAvailableSlotsController,
  updateDoctorController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getTodayAppointmentsController,
  getDoctorDashboardStatsController,
  getDoctorAiInsightsController,
};