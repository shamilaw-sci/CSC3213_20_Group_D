/**
 * @file    order.repository.js
 * @module  Order
 * @desc    Database queries for medicine orders and delivery tracking.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../../config/db');

const createOrder = async (patientId, pharmacyId, prescriptionId, deliveryAddress, totalAmount, notes) => {
  const result = await pool.query(
    `INSERT INTO medicine_orders
      (patient_id, pharmacy_id, prescription_id, delivery_address, total_amount, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [patientId, pharmacyId, prescriptionId || null, deliveryAddress, totalAmount || null, notes || null]
  );
  return result.rows[0];
};

const getOrderById = async (id) => {
  const result = await pool.query(
    `SELECT o.*, ph.name as pharmacy_name
     FROM medicine_orders o
     JOIN pharmacies ph ON o.pharmacy_id = ph.id
     WHERE o.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getOrdersByPatient = async (patientId) => {
  const result = await pool.query(
    `SELECT o.*, ph.name as pharmacy_name
     FROM medicine_orders o
     JOIN pharmacies ph ON o.pharmacy_id = ph.id
     WHERE o.patient_id = $1
     ORDER BY o.created_at DESC`,
    [patientId]
  );
  return result.rows;
};

const getOrdersByPharmacy = async (pharmacyId) => {
  const result = await pool.query(
    `SELECT o.*, p.full_name as patient_name
     FROM medicine_orders o
     JOIN patients p ON o.patient_id = p.id
     WHERE o.pharmacy_id = $1
     ORDER BY o.created_at DESC`,
    [pharmacyId]
  );
  return result.rows;
};

const updateOrderStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE medicine_orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByPatient,
  getOrdersByPharmacy,
  updateOrderStatus,
};