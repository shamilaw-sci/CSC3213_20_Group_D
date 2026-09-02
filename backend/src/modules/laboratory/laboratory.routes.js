/**
 * @file    laboratory.routes.js
 * @module  Laboratory
 * @desc    API routes for laboratory registration,
 *          approval, profile, test requests and reports.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
  registerLaboratoryController,
  getLaboratoryController,
  approveLaboratoryController,
  getAllLaboratoriesController,
  getLabRequestsController,
  updateLabRequestStatusController,
  uploadLabReportController,
  getPatientLabReportsController,
} = require('./laboratory.controller');

// GET /api/laboratories — Get all verified laboratories
router.get('/', isAuthenticated, getAllLaboratoriesController);

// POST /api/laboratories/register — Register a new laboratory (public)
router.post('/register', registerLaboratoryController);

// GET /api/laboratories/patient/:patientId/reports — Get patient lab reports
router.get('/patient/:patientId/reports', isAuthenticated, getPatientLabReportsController);

// GET /api/laboratories/:id — Get laboratory profile
router.get('/:id', isAuthenticated, getLaboratoryController);

// PUT /api/laboratories/:id/approve — Approve a laboratory (admin only)
router.put('/:id/approve', isAuthenticated, authorize('admin'), approveLaboratoryController);

// GET /api/laboratories/:id/requests — Get all test requests for a lab
router.get('/:id/requests', isAuthenticated, authorize('lab_technician', 'admin'), getLabRequestsController);

// PUT /api/laboratories/requests/:id/status — Update lab request status
router.put('/requests/:id/status', isAuthenticated, authorize('lab_technician', 'admin'), updateLabRequestStatusController);

// POST /api/laboratories/requests/:id/report — Upload lab report
router.post('/requests/:id/report', isAuthenticated, authorize('lab_technician', 'admin'), uploadLabReportController);

module.exports = router;