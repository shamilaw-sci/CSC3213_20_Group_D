/**
 * @file    pharmacy.routes.js
 * @module  Pharmacy
 * @desc    API routes for pharmacy registration,
 *          approval, profile, dashboard, and dispensing history endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express =
  require('express');

const router =
  express.Router();

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

/**
 * Ensures a pharmacist can only access
 * the pharmacy profile linked to their session.
 */
const authorizeOwnPharmacy = (
  req,
  res,
  next
) => {
  const sessionPharmacyId =
    req.session?.user?.profile_id;

  const requestedPharmacyId =
    req.params.id;

  if (
    !sessionPharmacyId ||
    sessionPharmacyId !==
      requestedPharmacyId
  ) {
    return res.status(403).json({
      success: false,
      message:
        'You are not authorized to access this pharmacy'
    });
  }

  next();
};

// POST /api/pharmacies/register
// Public pharmacy registration
router.post(
  '/register',
  registerPharmacyController
);

// GET /api/pharmacies/:id/dashboard
router.get(
  '/:id/dashboard',
  isAuthenticated,
  authorize(
    'pharmacist'
  ),
  authorizeOwnPharmacy,
  getPharmacyDashboardController
);

// GET /api/pharmacies/:id/dispensing-history
router.get(
  '/:id/dispensing-history',
  isAuthenticated,
  authorize(
    'pharmacist'
  ),
  authorizeOwnPharmacy,
  getDispensingHistoryController
);

// GET /api/pharmacies/:id
router.get(
  '/:id',
  isAuthenticated,
  authorize(
    'pharmacist'
  ),
  authorizeOwnPharmacy,
  getPharmacyController
);

// PUT /api/pharmacies/:id
router.put(
  '/:id',
  isAuthenticated,
  authorize(
    'pharmacist'
  ),
  authorizeOwnPharmacy,
  updatePharmacyProfileController
);

// PUT /api/pharmacies/:id/approve
// Admin approval only
router.put(
  '/:id/approve',
  isAuthenticated,
  authorize(
    'admin'
  ),
  approvePharmacyController
);

module.exports = router;