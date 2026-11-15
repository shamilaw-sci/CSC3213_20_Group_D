/**
 * @file admin.repository.js
 * @module admin
 * @desc Reads and updates admin-controlled information in PostgreSQL.
 */

const { pool } = require('../../config/db');

/**
 * FEATURE: Pending Approval Query
 * LOGIC: Show pending accounts, oldest applications first.
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
 * FEATURE: User Lookup
 * LOGIC: Find the account and its current verification state.
 */
const findUserById = async (userId) => {
    const result = await pool.query(
        `SELECT id, email, phone, role, verification_status
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
};

/**
 * FEATURE: Filtered User List
 * LOGIC: Combine optional email/phone, role and active-state conditions with SQL parameters.
 */
const findAllUsers = async (filters = {}) => {
    const { search, role, status } = filters;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
        conditions.push(
            `(email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`
        );

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

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

    const result = await pool.query(
        `SELECT
            id,
            email,
            phone,
            role,
            is_active,
            verification_status,
            created_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC`,
        values
    );

    return result.rows;
};

/**
 * FEATURE: Toggle Active Account
 * LOGIC: Flip is_active in the database and return the new status.
 */
const toggleUserActive = async (userId) => {
    const result = await pool.query(
        `UPDATE users
         SET is_active = NOT is_active
         WHERE id = $1
         RETURNING id, email, role, is_active`,
        [userId]
    );

    return result.rows[0];
};

/**
 * FEATURE: Filtered Audit History
 * LOGIC: Apply the same filters to the total count and the newest-first result page.
 */
const findAuditLogs = async (filters = {}) => {
    const {
        email,
        action,
        startDate,
        endDate,
        page = 1,
        pageSize = 25
    } = filters;

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

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

    const offset = (page - 1) * pageSize;

    const countResult = await pool.query(
        `SELECT COUNT(*)
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}`,
        values
    );

    const dataResult = await pool.query(
        `SELECT
            al.id,
            al.user_id,
            u.email,
            al.action,
            al.entity_type,
            al.entity_id,
            al.details,
            al.ip_address,
            al.created_at
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramIndex}
         OFFSET $${paramIndex + 1}`,
        [...values, pageSize, offset]
    );

    return {
        rows: dataResult.rows,
        totalCount: parseInt(
            countResult.rows[0].count,
            10
        )
    };
};

/**
 * FEATURE: Audit Action Names
 * LOGIC: Return unique recorded action types in alphabetical order.
 */
const findDistinctAuditActions = async () => {
    const result = await pool.query(
        `SELECT DISTINCT action
         FROM audit_logs
         ORDER BY action`
    );

    return result.rows.map(
        row => row.action
    );
};

/**
 * FEATURE: Break-the-Glass Audit
 * LOGIC: Include staff and patient names where available; keep logs even if a join is missing.
 */
const findEmergencyAccessLogs = async () => {
    const result = await pool.query(
        `SELECT
            eal.id,
            eal.reason,
            eal.created_at,
            eal.accessed_by,
            staff.email AS staff_email,
            eal.user_role,
            eal.patient_id,
            p.full_name AS patient_name
         FROM emergency_access_logs eal
         LEFT JOIN users staff
            ON eal.accessed_by = staff.id
         LEFT JOIN patients p
            ON eal.patient_id = p.id
         ORDER BY eal.created_at DESC`
    );

    return result.rows;
};

/**
 * FEATURE: Privacy-Safe Analytics Totals
 * LOGIC: Count patients, monthly appointments, prescriptions and emergency overrides.
 */
const findAnalyticsSummary = async () => {
    const totalPatientsResult =
        await pool.query(
            `SELECT COUNT(*) FROM patients`
        );

    const appointmentsThisMonthResult =
        await pool.query(
            `SELECT COUNT(*)
             FROM appointments
             WHERE date_trunc('month', scheduled_at) =
                   date_trunc('month', CURRENT_DATE)`
        );

    const prescriptionsIssuedResult =
        await pool.query(
            `SELECT COUNT(*) FROM prescriptions`
        );

    const emergencyOverridesResult =
        await pool.query(
            `SELECT COUNT(*)
             FROM emergency_access_logs`
        );

    return {
        totalPatients: parseInt(
            totalPatientsResult.rows[0].count,
            10
        ),

        appointmentsThisMonth: parseInt(
            appointmentsThisMonthResult.rows[0].count,
            10
        ),

        prescriptionsIssued: parseInt(
            prescriptionsIssuedResult.rows[0].count,
            10
        ),

        emergencyOverrides: parseInt(
            emergencyOverridesResult.rows[0].count,
            10
        )
    };
};

/**
 * FEATURE: Account Role Distribution
 * LOGIC: Group accounts by role for the admin chart.
 */
const findUserCountsByRole = async () => {
    const result = await pool.query(
        `SELECT role, COUNT(*) as count
         FROM users
         GROUP BY role
         ORDER BY role ASC`
    );

    return result.rows.map(
        row => ({
            role: row.role,
            count: parseInt(
                row.count,
                10
            )
        })
    );
};

/**
 * FEATURE: Patient QR Search
 * LOGIC: Match a patient name or NIC and limit results to 20 records.
 */
const searchPatients = async (search) => {
    const result = await pool.query(
        `SELECT id, full_name, nic, qr_code_id
         FROM patients
         WHERE full_name ILIKE $1
            OR nic ILIKE $1
         ORDER BY full_name ASC
         LIMIT 20`,
        [`%${search}%`]
    );

    return result.rows;
};

/**
 * FEATURE: Invalidate Previous Patient QR
 * LOGIC: Overwrite qr_code_id so lookups using the old identifier no longer match.
 */
const reissuePatientQr = async (
    patientId,
    newQrCodeId
) => {
    const result = await pool.query(
        `UPDATE patients
         SET qr_code_id = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, qr_code_id`,
        [
            patientId,
            newQrCodeId
        ]
    );

    return result.rows[0];
};

/**
 * FEATURE: System Setting List
 * LOGIC: Return current settings in key order.
 */
const findAllSettings = async () => {
    const result = await pool.query(
        `SELECT
            key,
            value,
            description,
            updated_at
         FROM system_settings
         ORDER BY key ASC`
    );

    return result.rows;
};

/**
 * FEATURE: Save System Setting
 * LOGIC: Update a known key and record its modification time.
 */
const updateSetting = async (
    key,
    value
) => {
    const result = await pool.query(
        `UPDATE system_settings
         SET value = $2,
             updated_at = NOW()
         WHERE key = $1
         RETURNING
            key,
            value,
            description,
            updated_at`,
        [
            key,
            value
        ]
    );

    return result.rows[0] || null;
};

/**
 * FEATURE: Approve User and Profile
 * LOGIC: In one transaction, approve the account and verify its doctor/pharmacy/lab profile.
 */
const approveUser = async (userId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            `UPDATE users
             SET verification_status = 'approved'
             WHERE id = $1
             RETURNING
                id,
                email,
                role,
                verification_status`,
            [userId]
        );

        const updatedUser =
            userResult.rows[0];

        if (!updatedUser) {
            await client.query('ROLLBACK');
            return null;
        }

        const role =
            updatedUser.role?.toLowerCase();

        // Match the approved/rejected account state with its role-specific profile.
        if (role === 'doctor') {
            await client.query(
                `UPDATE doctors
                 SET is_verified = true,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        if (role === 'pharmacist') {
            await client.query(
                `UPDATE pharmacies
                 SET is_verified = true,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        if (role === 'lab_technician') {
            await client.query(
                `UPDATE laboratories
                 SET is_verified = true,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        await client.query('COMMIT');

        return updatedUser;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
};

/**
 * FEATURE: Reject User and Profile
 * LOGIC: In one transaction, reject the account and clear its clinical/provider verification flag.
 */
const rejectUser = async (userId) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            `UPDATE users
             SET verification_status = 'rejected'
             WHERE id = $1
             RETURNING
                id,
                email,
                role,
                verification_status`,
            [userId]
        );

        const updatedUser =
            userResult.rows[0];

        if (!updatedUser) {
            await client.query('ROLLBACK');
            return null;
        }

        const role =
            updatedUser.role?.toLowerCase();

        if (role === 'doctor') {
            await client.query(
                `UPDATE doctors
                 SET is_verified = false,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        if (role === 'pharmacist') {
            await client.query(
                `UPDATE pharmacies
                 SET is_verified = false,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        if (role === 'lab_technician') {
            await client.query(
                `UPDATE laboratories
                 SET is_verified = false,
                     updated_at = NOW()
                 WHERE user_id = $1`,
                [userId]
            );
        }

        await client.query('COMMIT');

        return updatedUser;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
};

module.exports = {
    findPendingUsers,
    findUserById,
    approveUser,
    rejectUser,
    findAllUsers,
    toggleUserActive,
    findAuditLogs,
    findDistinctAuditActions,
    findEmergencyAccessLogs,
    findAnalyticsSummary,
    searchPatients,
    reissuePatientQr,
    findAllSettings,
    updateSetting,
    findUserCountsByRole
};