/**
 * @file    doctor.routes.js
 * @module  Doctor
 * @desc    Defines doctor API addresses and applies login, role, ownership and audit checks.
 * @author  Tharindu Lakshan (S/21/166)
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
  authorizeOwnProfile,
} = require('../../middleware/auth');

const { auditMiddleware } = require('../../middleware/auditLog');
const { upload } = require('../../middleware/upload');

// Find doctors — Public list includes only verified doctors with active, approved accounts.
router.get('/', getAllDoctorsController);

// Search Doctors — Public search by specialty/name and hospital.
router.get('/search', searchDoctorsController);

// Lab selection — A signed-in doctor can list active, verified laboratories.
// Keep this fixed path before /:id so it is not mistaken for a doctor ID.
router.get(
  '/laboratories',
  isAuthenticated,
  authorize('doctor'),
  getActiveLaboratoriesController
);

// Review Lab Report — Doctor login required; record the review in the audit log.
// Keep this fixed prefix before /:id.
router.put(
  '/lab-reports/:reportId/review',
  isAuthenticated,
  authorize('doctor'),
  auditMiddleware('REVIEW_LAB_REPORT', 'doctor'),
  reviewLabReportController
);

// Available Appointment Slots — Public endpoint suggests the next three free times.
router.get('/:id/slots', getAvailableSlotsController);

// Doctor Profile — Public read; record the lookup in the audit log.
router.get(
  '/:id',
  auditMiddleware('VIEW_DOCTOR_PROFILE', 'doctor'),
  getDoctorController
);

// Edit Doctor Profile — Only the signed-in doctor can edit their own profile.
router.put(
  '/:id',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('UPDATE_DOCTOR_PROFILE', 'doctor'),
  updateDoctorController
);

// Upload Doctor Photo — Check login, role, profile ownership and image upload before saving.
router.put(
  '/:id/photo',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  upload.single('photo'),
  auditMiddleware('UPDATE_DOCTOR_PROFILE_PHOTO', 'doctor'),
  uploadDoctorPhotoController
);

// View Doctor Availability — Public schedule lookup used for booking.
router.get(
  '/:id/availability',
  getDoctorAvailabilityController
);

// Edit Doctor Availability — Only the matching doctor can update their weekly schedule.
router.put(
  '/:id/availability',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('UPDATE_DOCTOR_AVAILABILITY', 'doctor'),
  updateDoctorAvailabilityController
);

// Today's Appointment Queue — Only the matching doctor can view today's patient list.
router.get(
  '/:id/appointments/today',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('VIEW_APPOINTMENT_QUEUE', 'doctor'),
  getTodayAppointmentsController
);

// Doctor Dashboard — Only the matching doctor can view appointment totals and next patient.
router.get(
  '/:id/dashboard-stats',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('VIEW_DASHBOARD_STATS', 'doctor'),
  getDoctorDashboardStatsController
);

// AI Insights — Protected route currently returns an empty placeholder, not real AI advice.
router.get(
  '/:id/ai-insights',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('VIEW_AI_INSIGHTS', 'doctor'),
  getDoctorAiInsightsController
);

// Order Lab Test — Only the matching doctor can request a test during an active consultation.
router.post(
  '/:id/lab-test-requests',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('ORDER_LAB_TEST', 'doctor'),
  orderLabTestController
);

// Unreviewed Lab Reports — Only the matching doctor can see reports awaiting review.
router.get(
  '/:id/unreviewed-lab-reports',
  isAuthenticated,
  authorize('doctor'),
  authorizeOwnProfile(),
  auditMiddleware('VIEW_UNREVIEWED_LAB_REPORTS', 'doctor'),
  getUnreviewedLabReportsController
);

module.exports = router;