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
 * Retrieves all users, optionally filtered by search term, role, and
 * active status.
 * @param {object} filters - Optional filters
 * @param {string} [filters.search] - Matches against email or phone
 * @param {string} [filters.role] - Exact role match
 * @param {string} [filters.status] - 'active' or 'inactive'
 * @returns {Promise<Array>} List of matching user rows
 */
const findAllUsers = async (filters = {}) => {
    const { search, role, status } = filters;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
        conditions.push(`(email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }

    if (role) {
        conditions.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
    }

    if (status === 'active') {
        conditions.push(`is_active = true`);
    } else if (status === 'inactive') {
        conditions.push(`is_active = false`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
        `SELECT id, email, phone, role, is_active, verification_status, created_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC`,
        values
    );
    return result.rows;
};

/**
 * Toggles a user's is_active flag.
 * @param {string} userId - UUID of the user
 * @returns {Promise<object>} Updated user row
 */
const toggleUserActive = async (userId) => {
    const result = await pool.query(
        `UPDATE users SET is_active = NOT is_active WHERE id = $1
         RETURNING id, email, role, is_active`,
        [userId]
    );
    return result.rows[0];
};

/**
 * Retrieves audit log entries, paginated and optionally filtered by
 * user email, action type, and date range. Joined against users via
 * LEFT JOIN since user_id can be null (unauthenticated requests are
 * still logged).
 * @param {object} filters - Optional filters
 * @param {string} [filters.email] - Matches against the acting user's email
 * @param {string} [filters.action] - Exact action match
 * @param {string} [filters.startDate] - ISO date string, inclusive lower bound
 * @param {string} [filters.endDate] - ISO date string, inclusive upper bound
 * @param {number} [filters.page] - Page number, 1-indexed (default 1)
 * @param {number} [filters.pageSize] - Rows per page (default 25)
 * @returns {Promise<object>} { rows, totalCount }
 */
const findAuditLogs = async (filters = {}) => {
    const { email, action, startDate, endDate, page = 1, pageSize = 25 } = filters;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (email) {
        conditions.push(`u.email ILIKE $${paramIndex}`);
        values.push(`%${email}%`);
        paramIndex++;
    }

    if (action) {
        conditions.push(`al.action = $${paramIndex}`);
        values.push(action);
        paramIndex++;
    }

    if (startDate) {
        conditions.push(`al.created_at >= $${paramIndex}`);
        values.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        conditions.push(`al.created_at <= $${paramIndex}`);
        values.push(endDate);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const countResult = await pool.query(
        `SELECT COUNT(*) FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}`,
        values
    );

    const dataResult = await pool.query(
        `SELECT al.id, al.user_id, u.email, al.action, al.entity_type,
                al.entity_id, al.details, al.ip_address, al.created_at
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, pageSize, offset]
    );

    return {
        rows: dataResult.rows,
        totalCount: parseInt(countResult.rows[0].count, 10)
    };
};

/**
 * Retrieves all distinct action values from audit_logs, for populating
 * a filter dropdown.
 * @returns {Promise<Array<string>>} List of distinct action strings
 */
const findDistinctAuditActions = async () => {
    const result = await pool.query(
        `SELECT DISTINCT action FROM audit_logs ORDER BY action`
    );
    return result.rows.map(row => row.action);
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

module.exports = { findPendingUsers, findUserById, approveUser, rejectUser, findAllUsers, toggleUserActive, findAuditLogs, findDistinctAuditActions };