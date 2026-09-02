/**
 * @file    doctor.routes.js
 * @module  Doctor
 * @desc    Route definitions for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
  getDoctorController,
  getAllDoctorsController,
  searchDoctorsController,
  getAvailableSlotsController,
  updateDoctorController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getTodayAppointmentsController,
  getDoctorDashboardStatsController,
  getDoctorAiInsightsController,
  orderLabTestController,
  getActiveLaboratoriesController,
  getUnreviewedLabReportsController,
  reviewLabReportController,
} = require('./doctor.controller');
const { auditMiddleware } = require('../../middleware/auditLog');

// Public lookup routes (used during booking or browsing doctors)
router.get('/', getAllDoctorsController);
router.get('/search', searchDoctorsController);
router.get('/:id/slots', getAvailableSlotsController);
router.get('/laboratories', isAuthenticated, getActiveLaboratoriesController);

// Doctor profile & schedule
router.get('/:id', auditMiddleware('VIEW_DOCTOR_PROFILE', 'doctor'), getDoctorController);
router.put('/:id', isAuthenticated, authorize('doctor', 'admin'), auditMiddleware('UPDATE_DOCTOR_PROFILE', 'doctor'), updateDoctorController);
router.get('/:id/availability', getDoctorAvailabilityController);
router.put('/:id/availability', isAuthenticated, authorize('doctor', 'admin'), auditMiddleware('UPDATE_DOCTOR_AVAILABILITY', 'doctor'), updateDoctorAvailabilityController);

// Doctor dashboard & queue
router.get('/:id/appointments/today', isAuthenticated, authorize('doctor', 'admin'), auditMiddleware('VIEW_APPOINTMENT_QUEUE', 'doctor'), getTodayAppointmentsController);
router.get('/:id/dashboard-stats', isAuthenticated, authorize('doctor', 'admin'), auditMiddleware('VIEW_DASHBOARD_STATS', 'doctor'), getDoctorDashboardStatsController);
router.get('/:id/ai-insights', isAuthenticated, authorize('doctor'), auditMiddleware('VIEW_AI_INSIGHTS', 'doctor'), getDoctorAiInsightsController);

// Lab test management
router.post('/:id/lab-test-requests', isAuthenticated, authorize('doctor'), auditMiddleware('ORDER_LAB_TEST', 'doctor'), orderLabTestController);
router.get('/:id/unreviewed-lab-reports', isAuthenticated, authorize('doctor'), auditMiddleware('VIEW_UNREVIEWED_LAB_REPORTS', 'doctor'), getUnreviewedLabReportsController);
router.put('/lab-reports/:reportId/review', isAuthenticated, authorize('doctor'), auditMiddleware('REVIEW_LAB_REPORT', 'doctor'), reviewLabReportController);

module.exports = router;