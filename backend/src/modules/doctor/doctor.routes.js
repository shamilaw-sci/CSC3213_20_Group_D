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
  getAvailableSlotsController,
  updateDoctorController,
  uploadDoctorPhotoController,
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

const {
  isAuthenticated,
  authorize,
} = require('../../middleware/auth');

const { auditMiddleware } = require('../../middleware/auditLog');
const { upload } = require('../../middleware/upload');

// GET /api/doctors — get all verified doctors
router.get('/', getAllDoctorsController);

// GET /api/doctors/search — search doctors by specialty and hospital
router.get('/search', searchDoctorsController);

// GET /api/doctors/laboratories — get active laboratories for the lab-order dropdown
// Must come before GET /:id, otherwise Express treats "laboratories" as a doctor ID
router.get(
  '/laboratories',
  isAuthenticated,
  authorize('doctor'),
  getActiveLaboratoriesController
);

// PUT /api/doctors/lab-reports/:reportId/review — doctor marks a lab report as reviewed
// Must come before PUT /:id, otherwise Express treats "lab-reports" as a doctor ID
router.put(
  '/lab-reports/:reportId/review',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('REVIEW_LAB_REPORT', 'doctor'),
  reviewLabReportController
);

// GET /api/doctors/:id/slots — get next 3 available appointment slots
router.get('/:id/slots', getAvailableSlotsController);

// GET /api/doctors/:id — get doctor profile by ID
router.get(
  '/:id',
  auditMiddleware('VIEW_DOCTOR_PROFILE', 'doctor'),
  getDoctorController
);

// PUT /api/doctors/:id — update doctor profile
router.put(
  '/:id',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('UPDATE_DOCTOR_PROFILE', 'doctor'),
  updateDoctorController
);

// PUT /api/doctors/:id/photo — upload doctor profile photo
router.put(
  '/:id/photo',
  isAuthenticated,
  authorize('doctor'),
  upload.single('photo'),
  auditMiddleware('UPDATE_DOCTOR_PROFILE_PHOTO', 'doctor'),
  uploadDoctorPhotoController
);

// GET /api/doctors/:id/availability — get doctor availability
router.get(
  '/:id/availability',
  getDoctorAvailabilityController
);

// PUT /api/doctors/:id/availability — update doctor availability
router.put(
  '/:id/availability',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('UPDATE_DOCTOR_AVAILABILITY', 'doctor'),
  updateDoctorAvailabilityController
);

// GET /api/doctors/:id/appointments/today — get today's queue
router.get(
  '/:id/appointments/today',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('VIEW_APPOINTMENT_QUEUE', 'doctor'),
  getTodayAppointmentsController
);

// GET /api/doctors/:id/dashboard-stats — get dashboard summary stats
router.get(
  '/:id/dashboard-stats',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('VIEW_DASHBOARD_STATS', 'doctor'),
  getDoctorDashboardStatsController
);

// GET /api/doctors/:id/ai-insights — get AI insights (placeholder until Epic 9.5)
router.get(
  '/:id/ai-insights',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('VIEW_AI_INSIGHTS', 'doctor'),
  getDoctorAiInsightsController
);

// POST /api/doctors/:id/lab-test-requests — doctor orders a new lab test
router.post(
  '/:id/lab-test-requests',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('ORDER_LAB_TEST', 'doctor'),
  orderLabTestController
);

// GET /api/doctors/:id/unreviewed-lab-reports — finalized lab reports awaiting doctor review
router.get(
  '/:id/unreviewed-lab-reports',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('VIEW_UNREVIEWED_LAB_REPORTS', 'doctor'),
  getUnreviewedLabReportsController
);

module.exports = router;
