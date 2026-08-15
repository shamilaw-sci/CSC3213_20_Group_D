/**
 * @file    doctor.routes.js
 * @module  Doctor
 * @desc    Route definitions for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const {
  getDoctorController,
  getAllDoctorsController,
  searchDoctorsController,
  updateDoctorController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getTodayAppointmentsController,
  getDoctorDashboardStatsController,
  getDoctorAiInsightsController,
} = require('./doctor.controller');
const { auditMiddleware } = require('../../middleware/auditLog');

// GET /api/doctors — get all verified doctors
router.get('/', getAllDoctorsController);

// GET /api/doctors/search — search doctors by specialty and hospital
router.get('/search', searchDoctorsController);

// GET /api/doctors/:id — get doctor profile by ID
router.get('/:id', auditMiddleware('VIEW_DOCTOR_PROFILE', 'doctor'), getDoctorController);

// PUT /api/doctors/:id — update doctor profile
router.put('/:id', auditMiddleware('UPDATE_DOCTOR_PROFILE', 'doctor'), updateDoctorController);

// GET /api/doctors/:id/availability — get doctor availability
router.get('/:id/availability', getDoctorAvailabilityController);

// PUT /api/doctors/:id/availability — update doctor availability
router.put('/:id/availability', auditMiddleware('UPDATE_DOCTOR_AVAILABILITY', 'doctor'), updateDoctorAvailabilityController);

// GET /api/doctors/:id/appointments/today — get today's queue
router.get('/:id/appointments/today', auditMiddleware('VIEW_APPOINTMENT_QUEUE', 'doctor'), getTodayAppointmentsController);

// GET /api/doctors/:id/dashboard-stats — get dashboard summary stats
router.get('/:id/dashboard-stats', auditMiddleware('VIEW_DASHBOARD_STATS', 'doctor'), getDoctorDashboardStatsController);

// GET /api/doctors/:id/ai-insights — get AI insights (placeholder until Epic 9.5)
router.get('/:id/ai-insights', auditMiddleware('VIEW_AI_INSIGHTS', 'doctor'), getDoctorAiInsightsController);

module.exports = router;