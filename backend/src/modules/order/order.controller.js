/**
 * @file    order.controller.js
 * @module  Order
 * @desc    HTTP request handlers for medicine order endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const orderService = require('./order.service');

const placeOrderController = async (req, res) => {
  try {
    const { patient_id, pharmacy_id, prescription_id, delivery_address, total_amount, notes } = req.body;
    if (!patient_id || !pharmacy_id || !delivery_address) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: patient_id, pharmacy_id and delivery_address are required',
      });
    }
    const order = await orderService.placeOrder(patient_id, pharmacy_id, prescription_id, delivery_address, total_amount, notes);
    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    console.error('placeOrderController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const order = await orderService.updateOrderStatus(id, status);
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    console.error('updateOrderStatusController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getPatientOrdersController = async (req, res) => {
  try {
    const { patientId } = req.params;
    const orders = await orderService.getOrdersByPatient(patientId);
    res.status(200).json({ success: true, message: 'Orders retrieved successfully', data: orders });
  } catch (error) {
    console.error('getPatientOrdersController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getPharmacyOrdersController = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const orders = await orderService.getOrdersByPharmacy(pharmacyId);
    res.status(200).json({ success: true, message: 'Orders retrieved successfully', data: orders });
  } catch (error) {
    console.error('getPharmacyOrdersController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getOrderByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    res.status(200).json({ success: true, message: 'Order retrieved successfully', data: order });
  } catch (error) {
    console.error('getOrderByIdController error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  placeOrderController,
  updateOrderStatusController,
  getPatientOrdersController,
  getPharmacyOrdersController,
  getOrderByIdController,
};