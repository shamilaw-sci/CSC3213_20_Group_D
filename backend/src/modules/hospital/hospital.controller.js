/**
 * @file    hospital.controller.js
 * @module  Hospital
 * @desc    Handles HTTP requests and responses for authenticated
 *          hospital profile, OPD, and assisted patient operations.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const {
  getHospitalProfile,
  getHospitalProfileByUserId,
  getTodayOpdAppointments,
  checkInOpdAppointment,
  registerAssistedPatient
} = require('./hospital.service');

/**
 * Handles GET /api/hospitals/me
 */
const getMyHospitalProfileController = async (
  req,
  res
) => {
  try {
    const userId =
      req.session?.user?.id;

    const hospital =
      await getHospitalProfileByUserId(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        'Hospital profile retrieved successfully',
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
 * Handles GET /api/hospitals/opd/today
 */
const getTodayOpdAppointmentsController = async (
  req,
  res
) => {
  try {
    const userId =
      req.session?.user?.id;

    const appointments =
      await getTodayOpdAppointments(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        'Today\'s OPD appointments retrieved successfully',
      data: appointments
    });

  } catch (error) {
    console.error(
      'getTodayOpdAppointmentsController error:',
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
 * Handles PATCH /api/hospitals/opd/:appointmentId/check-in
 */
const checkInOpdAppointmentController = async (
  req,
  res
) => {
  try {
    const userId =
      req.session?.user?.id;

    const {
      appointmentId
    } = req.params;

    const appointment =
      await checkInOpdAppointment(
        userId,
        appointmentId
      );

    return res.status(200).json({
      success: true,
      message:
        'Patient checked in successfully',
      data: appointment
    });

  } catch (error) {
    console.error(
      'checkInOpdAppointmentController error:',
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
 * Handles POST /api/hospitals/patients/register-assisted
 *
 * Creates a Care4U patient profile without requiring
 * the patient to create or use a login account.
 */
const registerAssistedPatientController = async (
  req,
  res
) => {
  try {
    const userId =
      req.session?.user?.id;

    const patient =
      await registerAssistedPatient(
        userId,
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        'Patient registered successfully through hospital-assisted registration',
      data: patient
    });

  } catch (error) {
    console.error(
      'registerAssistedPatientController error:',
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
 */
const getHospitalProfileController = async (
  req,
  res
) => {
  try {
    const {
      id
    } = req.params;

    const hospital =
      await getHospitalProfile(
        id
      );

    return res.status(200).json({
      success: true,
      message:
        'Hospital profile retrieved successfully',
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
  getTodayOpdAppointmentsController,
  checkInOpdAppointmentController,
  registerAssistedPatientController,
  getHospitalProfileController
};