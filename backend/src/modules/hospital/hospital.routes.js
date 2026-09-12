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
  getHospitalProfileController
} = require('./hospital.controller');

const {
  isAuthenticated,
  authorize
} = require('../../middleware/auth');

const router = express.Router();

/**
 * GET /api/hospitals/me
 * Retrieves the hospital profile linked to the authenticated
 * hospital staff account.
 */
router.get(
  '/me',
  isAuthenticated,
  authorize('hospital_staff'),
  getMyHospitalProfileController
);

/**
 * GET /api/hospitals/:id
 * Retrieves a hospital profile by hospital ID.
 */
router.get(
  '/:id',
  isAuthenticated,
  authorize('hospital_staff'),
  getHospitalProfileController
);

module.exports = router;