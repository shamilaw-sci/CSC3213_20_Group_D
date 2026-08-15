/**
 * @file    pharmacy.routes.js
 * @module  Pharmacy
 * @desc    API routes for pharmacy registration,
 *          approval, and profile endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const {
  registerPharmacyController,
  getPharmacyController,
  approvePharmacyController,
} = require('./pharmacy.controller');

// POST /api/pharmacies/register — Register a new pharmacy (public)
router.post('/register', registerPharmacyController);

// GET /api/pharmacies/:id — Get pharmacy profile
// isAuthenticated will be uncommented when auth is integrated
router.get('/:id', getPharmacyController);

// PUT /api/pharmacies/:id/approve — Approve a pharmacy (admin only)
// isAuthenticated and authorize('admin') will be uncommented when auth is integrated
router.put('/:id/approve', approvePharmacyController);

module.exports = router;