/**
 * @file    hospital.controller.js
 * @module  Hospital
 * @desc    Handles HTTP requests and responses for authenticated
 *          hospital profile operations.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const {
  getHospitalProfile,
  getHospitalProfileByUserId
} = require('./hospital.service');

/**
 * Handles GET /api/hospitals/me
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} JSON response
 */
const getMyHospitalProfileController = async (req, res) => {
  try {
    const userId =
      req.session?.user?.id;

    const hospital =
      await getHospitalProfileByUserId(userId);

    return res.status(200).json({
      success: true,
      message: 'Hospital profile retrieved successfully',
      data: hospital
    });

  } catch (error) {
    console.error(
      'getMyHospitalProfileController error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : 'Internal server error'
    });
  }
};

/**
 * Handles GET /api/hospitals/:id
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<Object>} JSON response
 */
const getHospitalProfileController = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital =
      await getHospitalProfile(id);

    return res.status(200).json({
      success: true,
      message: 'Hospital profile retrieved successfully',
      data: hospital
    });

  } catch (error) {
    console.error(
      'getHospitalProfileController error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : 'Internal server error'
    });
  }
};

module.exports = {
  getMyHospitalProfileController,
  getHospitalProfileController
};