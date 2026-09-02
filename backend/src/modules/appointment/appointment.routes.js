/**
 * @file    appointment.routes.js
 * @module  Appointment
 * @desc    Route definitions for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
  updateAppointmentStatusController,
  addConsultationNotesController,
  getPatientConsultationNotesController,
  bookAppointmentController,
  summarizeNotesController
} = require('./appointment.controller');
const { auditMiddleware } = require('../../middleware/auditLog');

// POST /api/appointments — Book a new appointment (Patient or Staff)
router.post('/', isAuthenticated, bookAppointmentController);

// GET /api/appointments/patients/:patientId/notes — doctor views a patient's past consultation notes
router.get(
  '/patients/:patientId/notes',
  isAuthenticated,
  authorize('doctor', 'admin'),
  auditMiddleware('VIEW_CONSULTATION_NOTES', 'appointment'),
  getPatientConsultationNotesController
);

// PUT /api/appointments/:id/status — update appointment status
router.put(
  '/:id/status',
  isAuthenticated,
  auditMiddleware('UPDATE_APPOINTMENT_STATUS', 'appointment'),
  updateAppointmentStatusController
);

// POST /api/appointments/:id/notes — add consultation notes (Doctor only)
router.post(
  '/:id/notes',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('ADD_CONSULTATION_NOTES', 'appointment'),
  addConsultationNotesController
);

// POST /api/appointments/:id/summarize-notes — AI-generate a structured draft
router.post('/:id/summarize-notes', isAuthenticated, authorize('doctor'), summarizeNotesController);

module.exports = router;