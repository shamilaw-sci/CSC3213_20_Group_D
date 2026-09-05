/**
 * @file    pharmacy.routes.js
 * @module  Pharmacy
 * @desc    API routes for pharmacy registration,
 *          approval, profile, dashboard, and dispensing history endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();

const {
  registerPharmacyController,
  getPharmacyController,
  approvePharmacyController,
  getPharmacyDashboardController,
  updatePharmacyProfileController,
  getDispensingHistoryController,
} = require('./pharmacy.controller');

const {
  isAuthenticated,
  authorize
} = require('../../middleware/auth');

// POST /api/pharmacies/register — Register a new pharmacy (public)
router.post(
  '/register',
  registerPharmacyController
);

// GET /api/pharmacies/:id/dashboard — Get pharmacy dashboard stats
// Only authenticated pharmacists can access the pharmacy dashboard
router.get(
  '/:id/dashboard',
  isAuthenticated,
  authorize('pharmacist'),
  getPharmacyDashboardController
);

// GET /api/pharmacies/:id/dispensing-history — Get pharmacy dispensing history
// Only authenticated pharmacists can view dispensing history
router.get(
  '/:id/dispensing-history',
  isAuthenticated,
  authorize('pharmacist'),
  getDispensingHistoryController
);

// GET /api/pharmacies/:id — Get pharmacy profile
// Only authenticated pharmacists can view the pharmacy profile
router.get(
  '/:id',
  isAuthenticated,
  authorize('pharmacist'),
  getPharmacyController
);

// PUT /api/pharmacies/:id — Update pharmacy profile
// Only authenticated pharmacists can update their pharmacy profile
router.put(
  '/:id',
  isAuthenticated,
  authorize('pharmacist'),
  updatePharmacyProfileController
);

// PUT /api/pharmacies/:id/approve — Approve a pharmacy (admin only)
router.put(
  '/:id/approve',
  isAuthenticated,
  authorize('admin'),
  approvePharmacyController
);

module.exports = router;