/**
 * @file    doctor.controller.js
 * @module  Doctor
 * @desc    Request handlers for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const doctorService = require('./doctor.service');

/**
 * Get a doctor profile by ID.
 * GET /api/doctors/:id
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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all verified doctors.
 * GET /api/doctors
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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update a doctor profile by ID.
 * PUT /api/doctors/:id
 */
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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getDoctorController,
  getAllDoctorsController,
  updateDoctorController,
};