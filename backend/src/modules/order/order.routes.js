/**
 * @file    order.routes.js
 * @module  Order
 * @desc    API routes for medicine order and delivery tracking.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const {
  placeOrderController,
  updateOrderStatusController,
  getPatientOrdersController,
  getPharmacyOrdersController,
  getOrderByIdController,
} = require('./order.controller');
const {
  isAuthenticated,
  authorize,
  authorizeOwnProfile,
} = require('../../middleware/auth');

router.post('/', isAuthenticated, authorize('patient'), placeOrderController);
router.put('/:id/status', isAuthenticated, authorize('pharmacist'), updateOrderStatusController);
router.get(
  '/patient/:patientId',
  isAuthenticated,
  authorize('patient'),
  authorizeOwnProfile('patientId'),
  getPatientOrdersController
);
router.get(
  '/pharmacy/:pharmacyId',
  isAuthenticated,
  authorize('pharmacist'),
  authorizeOwnProfile('pharmacyId'),
  getPharmacyOrdersController
);
router.get(
  '/:id',
  isAuthenticated,
  authorize('patient', 'pharmacist'),
  getOrderByIdController
);

module.exports = router;
