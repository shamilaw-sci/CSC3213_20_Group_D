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

router.post('/', placeOrderController);
router.put('/:id/status', updateOrderStatusController);
router.get('/patient/:patientId', getPatientOrdersController);
router.get('/pharmacy/:pharmacyId', getPharmacyOrdersController);
router.get('/:id', getOrderByIdController);

module.exports = router;