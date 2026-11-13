/**
 * @file    laboratory.controller.js
 * @module  Laboratory
 * @desc    HTTP request handlers for laboratory endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const laboratoryService = require('./laboratory.service');

/**
 * Handles POST /api/laboratories/register
 * Registers a new laboratory with a linked user account.
 * Unexpected failures use public wording; expected business errors retain their status/message.
 * @returns {Promise<void>} Acknowledged application or public failure response.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerLaboratoryController = async (req, res) => {
  try {
    const { email, password, phone, name, license_number, address, available_tests } = req.body;

    if (!email || !password || !phone || !name || !license_number || !address) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: email, password, phone, name, license_number and address are all required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: password must be at least 8 characters',
      });
    }

    const result = await laboratoryService.registerLaboratory(
      email,
      password,
      phone,
      name,
      license_number,
      address,
      available_tests || []
    );

    res.status(201).json({
      success: true,
      message: 'Laboratory registered successfully. Awaiting admin approval before you can log in.',
      data: result,
    });

  } catch (error) {
    console.error('registerLaboratoryController error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status >= 500
        ? 'Registration could not be completed. Please try again.'
        : (error.message || 'Registration could not be completed. Please try again.'),
    });
  }
};

/**
 * Handles GET /api/laboratories/:id
 * Retrieves a laboratory profile by ID.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLaboratoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const laboratory = await laboratoryService.getLaboratoryById(id);

    res.status(200).json({
      success: true,
      message: 'Laboratory profile retrieved successfully',
      data: laboratory,
    });

  } catch (error) {
    console.error('getLaboratoryController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles PUT /api/laboratories/:id/approve
 * Approves a laboratory account — admin only.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveLaboratoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const laboratory = await laboratoryService.approveLaboratory(id);

    res.status(200).json({
      success: true,
      message: 'Laboratory approved successfully',
      data: laboratory,
    });

  } catch (error) {
    console.error('approveLaboratoryController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles GET /api/laboratories
 * Gets all verified laboratories.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllLaboratoriesController = async (req, res) => {
  try {
    const laboratories = await laboratoryService.getAllVerifiedLaboratories();

    res.status(200).json({
      success: true,
      message: 'Laboratories retrieved successfully',
      data: laboratories,
    });

  } catch (error) {
    console.error('getAllLaboratoriesController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles GET /api/laboratories/:id/requests
 * Gets all test requests for a laboratory.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLabRequestsController = async (req, res) => {
  try {
    const { id } = req.params;
    const requests = await laboratoryService.getLabRequestsByLaboratory(id);

    res.status(200).json({
      success: true,
      message: 'Lab test requests retrieved successfully',
      data: requests,
    });

  } catch (error) {
    console.error('getLabRequestsController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles PUT /api/lab-requests/:id/status
 * Updates the status of a lab test request.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateLabRequestStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: status is required',
      });
    }

    const updated = await laboratoryService.updateLabRequestStatus(
      id,
      status,
      req.session.user.profile_id
    );

    res.status(200).json({
      success: true,
      message: 'Lab test request status updated successfully',
      data: updated,
    });

  } catch (error) {
    console.error('updateLabRequestStatusController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles POST /api/laboratories/requests/:id/report
 * Uploads a lab report for a completed test request.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadLabReportController = async (req, res) => {
  try {
    const { id } = req.params;
    const { findings, report_url } = req.body;

    if (!findings) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: findings are required',
      });
    }

    const report = await laboratoryService.uploadLabReport(
      id,
      findings,
      report_url,
      req.session.user.profile_id
    );

    res.status(201).json({
      success: true,
      message: 'Lab report uploaded successfully',
      data: report,
    });

  } catch (error) {
    console.error('uploadLabReportController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Handles GET /api/laboratories/patient/:patientId/reports
 * Gets all lab reports for a patient.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPatientLabReportsController = async (req, res) => {
  try {
    const { patientId } = req.params;
    const reports = await laboratoryService.getLabReportsByPatient(patientId);

    res.status(200).json({
      success: true,
      message: 'Lab reports retrieved successfully',
      data: reports,
    });

  } catch (error) {
    console.error('getPatientLabReportsController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  registerLaboratoryController,
  getLaboratoryController,
  approveLaboratoryController,
  getAllLaboratoriesController,
  getLabRequestsController,
  updateLabRequestStatusController,
  uploadLabReportController,
  getPatientLabReportsController,
};
