/**
 * @file    hospital.routes.js
 * @module  Hospital
 * @desc    Route definitions for authenticated hospital profile,
 *          OPD, assisted patient registration, and walk-in operations.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express =
  require('express');

const {
  getMyHospitalProfileController,
  getTodayOpdAppointmentsController,
  getHospitalDoctorsController,
  checkInOpdAppointmentController,
  assignWalkInPatientController,
  registerAssistedPatientController,
  getHospitalProfileController
} = require('./hospital.controller');

const {
  isAuthenticated,
  authorize,
  authorizeOwnProfile
} = require('../../middleware/auth');

const router =
  express.Router();

/**
 * GET /api/hospitals/me
 */
router.get(
  '/me',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  getMyHospitalProfileController
);

/**
 * GET /api/hospitals/opd/today
 */
router.get(
  '/opd/today',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  getTodayOpdAppointmentsController
);

/**
 * GET /api/hospitals/opd/doctors
 */
router.get(
  '/opd/doctors',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  getHospitalDoctorsController
);

/**
 * POST /api/hospitals/opd/walk-in
 */
router.post(
  '/opd/walk-in',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  assignWalkInPatientController
);

/**
 * PATCH /api/hospitals/opd/:appointmentId/check-in
 */
router.patch(
  '/opd/:appointmentId/check-in',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  checkInOpdAppointmentController
);

/**
 * POST /api/hospitals/patients/register-assisted
 */
router.post(
  '/patients/register-assisted',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  registerAssistedPatientController
);

/**
 * GET /api/hospitals/:id
 *
 * Keep this generic parameterized route after all
 * specific hospital routes.
 */
router.get(
  '/:id',
  isAuthenticated,
  authorize(
    'hospital_staff'
  ),
  authorizeOwnProfile(),
  getHospitalProfileController
);

module.exports = router;
