/**
 * @file    order.service.js
 * @module  Order
 * @desc    Business logic for medicine orders and delivery tracking.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const orderRepository = require('./order.repository');

const VALID_STATUSES = ['placed','accepted','packed','out_for_delivery','delivered','cancelled'];

const placeOrder = async (patientId, pharmacyId, prescriptionId, deliveryAddress, totalAmount, notes) => {
  if (!deliveryAddress) {
    const error = new Error('Delivery address is required');
    error.statusCode = 400;
    throw error;
  }
  return await orderRepository.createOrder(patientId, pharmacyId, prescriptionId, deliveryAddress, totalAmount, notes);
};

const updateOrderStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  const order = await orderRepository.getOrderById(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  return await orderRepository.updateOrderStatus(id, status);
};

const getOrdersByPatient = async (patientId) => {
  return await orderRepository.getOrdersByPatient(patientId);
};

const getOrdersByPharmacy = async (pharmacyId) => {
  return await orderRepository.getOrdersByPharmacy(pharmacyId);
};

const getOrderById = async (id) => {
  const order = await orderRepository.getOrderById(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  return order;
};

module.exports = {
  placeOrder,
  updateOrderStatus,
  getOrdersByPatient,
  getOrdersByPharmacy,
  getOrderById,
};