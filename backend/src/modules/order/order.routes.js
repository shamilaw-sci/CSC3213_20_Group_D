/**
 * @file    order.routes.js
 * @module  Order
 * @desc    API routes for medicine order and delivery tracking.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
  placeOrderController,
  updateOrderStatusController,
  getPatientOrdersController,
  getPharmacyOrdersController,
  getOrderByIdController,
} = require('./order.controller');

router.post('/', isAuthenticated, authorize('patient', 'admin'), placeOrderController);
router.put('/:id/status', isAuthenticated, authorize('pharmacist', 'admin'), updateOrderStatusController);
router.get('/patient/:patientId', isAuthenticated, authorize('patient', 'admin'), getPatientOrdersController);
router.get('/pharmacy/:pharmacyId', isAuthenticated, authorize('pharmacist', 'admin'), getPharmacyOrdersController);
router.get('/:id', isAuthenticated, getOrderByIdController);

module.exports = router;