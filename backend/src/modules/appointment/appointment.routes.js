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
  bookAppointmentController,
  summarizeNotesController
} = require('./appointment.controller');

// POST /api/appointments — Book a new appointment
router.post('/', bookAppointmentController);

// PUT /api/appointments/:id/status — update appointment status
router.put('/:id/status', updateAppointmentStatusController);

// POST /api/appointments/:id/notes — add consultation notes
router.post('/:id/notes', addConsultationNotesController);

// POST /api/appointments/:id/summarize-notes — AI-generate a structured draft from free-text observations
router.post('/:id/summarize-notes', summarizeNotesController);

module.exports = router; 