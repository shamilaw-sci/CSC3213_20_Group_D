/**
 * @file    hospital.routes.js
 * @module  Hospital
 * @desc    Route definitions for authenticated hospital profile
 *          operations within the Care4U Hospital Portal.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');

const {
  getMyHospitalProfileController,
  getTodayOpdAppointmentsController,
  checkInOpdAppointmentController,
  getHospitalProfileController
} = require('./hospital.controller');

const {
  isAuthenticated,
  authorize
} = require('../../middleware/auth');

const router = express.Router();

/**
 * GET /api/hospitals/me
 */
router.get(
  '/me',
  isAuthenticated,
  authorize('hospital_staff'),
  getMyHospitalProfileController
);

/**
 * GET /api/hospitals/opd/today
 */
router.get(
  '/opd/today',
  isAuthenticated,
  authorize('hospital_staff'),
  getTodayOpdAppointmentsController
);

/**
 * PATCH /api/hospitals/opd/:appointmentId/check-in
 */
router.patch(
  '/opd/:appointmentId/check-in',
  isAuthenticated,
  authorize('hospital_staff'),
  checkInOpdAppointmentController
);

/**
 * GET /api/hospitals/:id
 */
router.get(
  '/:id',
  isAuthenticated,
  authorize('hospital_staff'),
  getHospitalProfileController
);

module.exports = router;