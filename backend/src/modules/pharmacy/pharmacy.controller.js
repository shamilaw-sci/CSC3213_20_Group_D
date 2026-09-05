/**
 * @file    pharmacy.controller.js
 * @module  Pharmacy
 * @desc    HTTP request handlers for pharmacy endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const pharmacyService = require('./pharmacy.service');

/**
 * Handles POST /api/pharmacies/register
 * Registers a new pharmacy with a linked user account.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerPharmacyController = async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      name,
      license_number,
      address
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !phone ||
      !name ||
      !license_number ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Validation failed: email, password, phone, name, license_number and address are all required',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'Validation failed: password must be at least 8 characters',
      });
    }

    const result =
      await pharmacyService.registerPharmacy(
        email,
        password,
        phone,
        name,
        license_number,
        address
      );

    res.status(201).json({
      success: true,
      message:
        'Pharmacy registered successfully. Awaiting admin approval before you can log in.',
      data: result,
    });

  } catch (error) {
    console.error(
      'registerPharmacyController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

/**
 * Handles GET /api/pharmacies/:id
 * Retrieves a pharmacy profile by ID.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPharmacyController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const pharmacy =
      await pharmacyService.getPharmacyById(
        id
      );

    res.status(200).json({
      success: true,
      message:
        'Pharmacy profile retrieved successfully',
      data: pharmacy,
    });

  } catch (error) {
    console.error(
      'getPharmacyController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

/**
 * Handles PUT /api/pharmacies/:id/approve
 * Approves a pharmacy account — admin only.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approvePharmacyController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const pharmacy =
      await pharmacyService.approvePharmacy(
        id
      );

    res.status(200).json({
      success: true,
      message:
        'Pharmacy approved successfully',
      data: pharmacy,
    });

  } catch (error) {
    console.error(
      'approvePharmacyController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

/**
 * Handles GET /api/pharmacies/:id/dashboard
 * Returns dashboard stats for a pharmacy.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPharmacyDashboardController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const dashboard =
      await pharmacyService.getPharmacyDashboard(
        id
      );

    res.status(200).json({
      success: true,
      message:
        'Pharmacy dashboard retrieved successfully',
      data: dashboard,
    });

  } catch (error) {
    console.error(
      'getPharmacyDashboardController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

/**
 * Handles PUT /api/pharmacies/:id
 * Updates editable pharmacy profile information.
 *
 * Editable fields:
 * - name
 * - address
 * - phone
 *
 * License number and verification status cannot be changed here.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePharmacyProfileController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      address,
      phone
    } = req.body;

    const updatedPharmacy =
      await pharmacyService.updatePharmacyProfile(
        id,
        {
          name,
          address,
          phone
        }
      );

    res.status(200).json({
      success: true,
      message:
        'Pharmacy profile updated successfully',
      data: updatedPharmacy,
    });

  } catch (error) {
    console.error(
      'updatePharmacyProfileController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

/**
 * Handles GET /api/pharmacies/:id/dispensing-history
 * Retrieves dispensing history for a pharmacy.
 *
 * Returns prescriptions dispensed by the selected pharmacy,
 * ordered by most recent dispensing activity.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDispensingHistoryController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const history =
      await pharmacyService.getDispensingHistory(
        id
      );

    res.status(200).json({
      success: true,
      message:
        'Dispensing history retrieved successfully',
      data: history,
    });

  } catch (error) {
    console.error(
      'getDispensingHistoryController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error',
    });
  }
};

module.exports = {
  registerPharmacyController,
  getPharmacyController,
  approvePharmacyController,
  getPharmacyDashboardController,
  updatePharmacyProfileController,
  getDispensingHistoryController,
};