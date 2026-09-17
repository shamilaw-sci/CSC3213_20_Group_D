/**
 * @file    order.service.js
 * @module  Order
 * @desc    Business logic for medicine orders and delivery tracking.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const orderRepository = require('./order.repository');

const VALID_STATUSES = ['placed','accepted','packed','out_for_delivery','delivered','cancelled'];

const VALID_STATUS_TRANSITIONS = {
  placed: ['accepted', 'cancelled'],
  accepted: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

const placeOrder = async (patientId, pharmacyId, prescriptionId, deliveryAddress, totalAmount, notes, requestingUser) => {
  if (!deliveryAddress) {
    const error = new Error('Delivery address is required');
    error.statusCode = 400;
    throw error;
  }
  if (
    requestingUser?.role !== 'patient' ||
    String(requestingUser.profile_id) !== String(patientId)
  ) {
    const error = new Error('You cannot place an order for another patient');
    error.statusCode = 403;
    throw error;
  }
  return await orderRepository.createOrder(patientId, pharmacyId, prescriptionId, deliveryAddress, totalAmount, notes);
};

const updateOrderStatus = async (id, status, requestingUser) => {
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
  if (
    requestingUser?.role !== 'pharmacist' ||
    String(requestingUser.profile_id) !== String(order.pharmacy_id)
  ) {
    const error = new Error('You cannot update an order assigned to another pharmacy');
    error.statusCode = 403;
    throw error;
  }
  if (!VALID_STATUS_TRANSITIONS[order.status]?.includes(status)) {
    const error = new Error(
      `Cannot change order status from ${order.status} to ${status}`
    );
    error.statusCode = 409;
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

const getOrderById = async (id, requestingUser) => {
  const order = await orderRepository.getOrderById(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  const ownsOrder =
    requestingUser?.role === 'patient'
      ? String(requestingUser.profile_id) === String(order.patient_id)
      : requestingUser?.role === 'pharmacist' &&
        String(requestingUser.profile_id) === String(order.pharmacy_id);

  if (!ownsOrder) {
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
