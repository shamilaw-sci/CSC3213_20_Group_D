/**
 * @file admin.repository.js
 * @module admin
 * @desc Database queries for admin approval of pending user registrations.
 */

const { pool } = require('../../config/db');

/**
 * Retrieves all users currently pending admin approval.
 * @returns {Promise<Array>} List of pending user rows
 */
const findPendingUsers = async () => {
    const result = await pool.query(
        `SELECT id, email, phone, role, created_at
         FROM users
         WHERE verification_status = 'pending'
         ORDER BY created_at ASC`
    );
    return result.rows;
};

/**
 * Finds a single user by ID.
 * @param {string} userId - UUID of the user
 * @returns {Promise<object|null>} User row or null
 */
const findUserById = async (userId) => {
    const result = await pool.query(
        `SELECT id, email, phone, role, verification_status FROM users WHERE id = $1`,
        [userId]
    );
    return result.rows[0] || null;
};

/**
 * Approves a pending user, setting verification_status to 'approved'.
 * @param {string} userId - UUID of the user
 * @returns {Promise<object>} Updated user row
 */
const approveUser = async (userId) => {
    const result = await pool.query(
        `UPDATE users SET verification_status = 'approved' WHERE id = $1
         RETURNING id, email, role, verification_status`,
        [userId]
    );
    return result.rows[0];
};

/**
 * Rejects a pending user, setting verification_status to 'rejected'.
 * @param {string} userId - UUID of the user
 * @returns {Promise<object>} Updated user row
 */
const rejectUser = async (userId) => {
    const result = await pool.query(
        `UPDATE users SET verification_status = 'rejected' WHERE id = $1
         RETURNING id, email, role, verification_status`,
        [userId]
    );
    return result.rows[0];
};

module.exports = { findPendingUsers, findUserById, approveUser, rejectUser };