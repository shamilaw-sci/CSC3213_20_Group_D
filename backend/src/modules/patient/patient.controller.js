/**
 * @file    patient.controller.js
 * @module  Patient
 * @desc    HTTP request handlers for the patient module.
 *          Reads request data, calls the service, and sends the response.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const patientService = require('./patient.service');

/**
 * Handles GET /api/patients/:id
 * Returns the full profile of a single patient.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPatientController = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientProfile(id);

    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: patient,
    });
  } catch (error) {
    console.error('getPatientController error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.statusCode
      ? error.message
      : 'Internal server error';

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  getPatientController,
};