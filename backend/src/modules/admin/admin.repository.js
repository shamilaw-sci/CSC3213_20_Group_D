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
 * Retrieves all Break-the-Glass emergency access log entries, joined
 * with users (for the accessing staff member's email/role) and patients
 * (for the patient's name), ordered most recent first.
 * @returns {Promise<Array>} List of emergency access log rows
 */
const findEmergencyAccessLogs = async () => {
    const result = await pool.query(
        `SELECT eal.id, eal.reason, eal.created_at,
                eal.accessed_by, staff.email AS staff_email, eal.user_role,
                eal.patient_id, p.full_name AS patient_name
         FROM emergency_access_logs eal
         LEFT JOIN users staff ON eal.accessed_by = staff.id
         LEFT JOIN patients p ON eal.patient_id = p.id
         ORDER BY eal.created_at DESC`
    );
    return result.rows;
};

/**
 * Retrieves anonymized aggregate analytics counts. No per-patient or
 * per-user identifiable data is returned - only totals, per the
 * charter's "no personally identifiable data in analytics" rule.
 * @returns {Promise<object>} { totalPatients, appointmentsThisMonth, prescriptionsIssued, emergencyOverrides }
 */
const findAnalyticsSummary = async () => {
    const totalPatientsResult = await pool.query(`SELECT COUNT(*) FROM patients`);

    const appointmentsThisMonthResult = await pool.query(
        `SELECT COUNT(*) FROM appointments
         WHERE date_trunc('month', scheduled_at) = date_trunc('month', CURRENT_DATE)`
    );

    const prescriptionsIssuedResult = await pool.query(`SELECT COUNT(*) FROM prescriptions`);

    const emergencyOverridesResult = await pool.query(`SELECT COUNT(*) FROM emergency_access_logs`);

    return {
        totalPatients: parseInt(totalPatientsResult.rows[0].count, 10),
        appointmentsThisMonth: parseInt(appointmentsThisMonthResult.rows[0].count, 10),
        prescriptionsIssued: parseInt(prescriptionsIssuedResult.rows[0].count, 10),
        emergencyOverrides: parseInt(emergencyOverridesResult.rows[0].count, 10)
    };
};

/**
 * Searches for patients by name or NIC, for the admin QR reissue screen.
 * @param {string} search - Matches against full_name or nic
 * @returns {Promise<Array>} List of matching patient rows
 */
const searchPatients = async (search) => {
    const result = await pool.query(
        `SELECT id, full_name, nic, qr_code_id
         FROM patients
         WHERE full_name ILIKE $1 OR nic ILIKE $1
         ORDER BY full_name ASC
         LIMIT 20`,
        [`%${search}%`]
    );
    return result.rows;
};

/**
 * Overwrites a patient's qr_code_id with a freshly generated value.
 * The old QR code is not retained anywhere, so any lookup using it
 * fails instantly (no matching row exists).
 * @param {string} patientId - UUID of the patient
 * @param {string} newQrCodeId - The newly generated QR code value
 * @returns {Promise<object>} Updated patient row
 */
const reissuePatientQr = async (patientId, newQrCodeId) => {
    const result = await pool.query(
        `UPDATE patients SET qr_code_id = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, qr_code_id`,
        [patientId, newQrCodeId]
    );
    return result.rows[0];
};

/**
 * Retrieves all system settings.
 * @returns {Promise<Array>} List of setting rows
 */
const findAllSettings = async () => {
    const result = await pool.query(
        `SELECT key, value, description, updated_at FROM system_settings ORDER BY key ASC`
    );
    return result.rows;
};

/**
 * Updates a single system setting's value by key.
 * @param {string} key - The setting's key
 * @param {string} value - The new value
 * @returns {Promise<object|null>} Updated setting row, or null if key doesn't exist
 */
const updateSetting = async (key, value) => {
    const result = await pool.query(
        `UPDATE system_settings SET value = $2, updated_at = NOW()
         WHERE key = $1
         RETURNING key, value, description, updated_at`,
        [key, value]
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

module.exports = { findPendingUsers, findUserById, approveUser, rejectUser, findAllUsers, toggleUserActive, findAuditLogs, findDistinctAuditActions, findEmergencyAccessLogs, findAnalyticsSummary, searchPatients, reissuePatientQr, findAllSettings, updateSetting };