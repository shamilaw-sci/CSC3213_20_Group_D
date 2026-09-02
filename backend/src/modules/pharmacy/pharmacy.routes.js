/**
 * @file    pharmacy.routes.js
 * @module  Pharmacy
 * @desc    API routes for pharmacy registration,
 *          approval, profile, and dashboard endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
  registerPharmacyController,
  getPharmacyController,
  approvePharmacyController,
  getPharmacyDashboardController,
} = require('./pharmacy.controller');

// POST /api/pharmacies/register — Register a new pharmacy (public)
router.post('/register', registerPharmacyController);

// GET /api/pharmacies/:id/dashboard — Get pharmacy dashboard stats
router.get('/:id/dashboard', isAuthenticated, authorize('pharmacist', 'admin'), getPharmacyDashboardController);

// GET /api/pharmacies/:id — Get pharmacy profile
router.get('/:id', isAuthenticated, getPharmacyController);

// PUT /api/pharmacies/:id/approve — Approve a pharmacy (admin only)
router.put('/:id/approve', isAuthenticated, authorize('admin'), approvePharmacyController);

module.exports = router;