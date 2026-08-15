/**
 * @file    pharmacy.routes.js
 * @module  Pharmacy
 * @desc    API routes for pharmacy registration,
 *          approval, profile, and dashboard endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const {
  registerPharmacyController,
  getPharmacyController,
  approvePharmacyController,
  getPharmacyDashboardController,
} = require('./pharmacy.controller');

// POST /api/pharmacies/register — Register a new pharmacy (public)
router.post('/register', registerPharmacyController);

// GET /api/pharmacies/:id/dashboard — Get pharmacy dashboard stats
router.get('/:id/dashboard', getPharmacyDashboardController);

// GET /api/pharmacies/:id — Get pharmacy profile
router.get('/:id', getPharmacyController);

// PUT /api/pharmacies/:id/approve — Approve a pharmacy (admin only)
router.put('/:id/approve', approvePharmacyController);

module.exports = router;