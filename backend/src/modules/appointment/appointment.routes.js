/**
 * @file    appointment.routes.js
 * @module  Appointment
 * @desc    Route definitions for the Appointment module.
 *          Shared module used by Doctor and Patient modules.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const {
  updateAppointmentStatusController,
} = require('./appointment.controller');

// PUT /api/appointments/:id/status — update appointment status
router.put('/:id/status', updateAppointmentStatusController);

module.exports = router;