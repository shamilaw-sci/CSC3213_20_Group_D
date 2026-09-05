/**
 * @file    appointment.routes.js
 * @module  Appointment
 * @desc    Route definitions for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const express =
  require('express');

const router =
  express.Router();

const {
  updateAppointmentStatusController,
  addConsultationNotesController,
  getPatientConsultationNotesController,
  getActiveConsultationController,
  getConsultationAppointmentController,
  bookAppointmentController,
  summarizeNotesController
} = require('./appointment.controller');

const {
  auditMiddleware
} = require('../../middleware/auditLog');

/**
 * POST /api/appointments
 *
 * Books an appointment.
 *
 * For doctor-initiated walk-ins, the controller also
 * checks whether an active consultation already exists
 * before creating another appointment.
 */
router.post(
  '/',
  bookAppointmentController
);

/**
 * GET /api/appointments/active?patientId=...
 *
 * Checks whether the currently authenticated doctor
 * already has an in-progress consultation with the
 * supplied patient.
 *
 * This route must appear before generic parameterized
 * appointment routes.
 */
router.get(
  '/active',
  auditMiddleware(
    'CHECK_ACTIVE_CONSULTATION',
    'appointment'
  ),
  getActiveConsultationController
);

/**
 * GET /api/appointments/patients/:patientId/notes
 *
 * Doctor views a patient's past consultation notes.
 */
router.get(
  '/patients/:patientId/notes',
  auditMiddleware(
    'VIEW_CONSULTATION_NOTES',
    'appointment'
  ),
  getPatientConsultationNotesController
);

/**
 * GET /api/appointments/:id/consultation
 *
 * Loads the complete refresh-safe consultation
 * workspace context.
 *
 * Authentication and doctor authorization are checked
 * inside getConsultationAppointmentController.
 */
router.get(
  '/:id/consultation',
  auditMiddleware(
    'VIEW_CONSULTATION_WORKSPACE',
    'appointment'
  ),
  getConsultationAppointmentController
);

/**
 * PUT /api/appointments/:id/status
 *
 * Updates an appointment status.
 */
router.put(
  '/:id/status',
  auditMiddleware(
    'UPDATE_APPOINTMENT_STATUS',
    'appointment'
  ),
  updateAppointmentStatusController
);

/**
 * POST /api/appointments/:id/notes
 *
 * Adds structured consultation notes to an appointment.
 */
router.post(
  '/:id/notes',
  auditMiddleware(
    'ADD_CONSULTATION_NOTES',
    'appointment'
  ),
  addConsultationNotesController
);

/**
 * POST /api/appointments/:id/summarize-notes
 *
 * AI-generates structured consultation fields from
 * the doctor's free-text observations.
 */
router.post(
  '/:id/summarize-notes',
  summarizeNotesController
);

module.exports =
  router;