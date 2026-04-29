/**
 * @file    appointment.routes.js
 * @module  Appointment
 * @desc    Route definitions for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const {
  updateAppointmentStatusController,
  addConsultationNotesController,
} = require('./appointment.controller');

// PUT /api/appointments/:id/status — update appointment status
router.put('/:id/status', updateAppointmentStatusController);

// POST /api/appointments/:id/notes — add consultation notes
router.post('/:id/notes', addConsultationNotesController);

module.exports = router; 