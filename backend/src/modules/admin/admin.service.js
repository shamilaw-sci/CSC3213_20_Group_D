/**
 * @file admin.service.js
 * @module admin
 * @desc Checks administrator actions and coordinates database and email work.
 */

const { sendRejectionEmail } = require('../../utils/email');
const { generatePatientQR } = require('../../utils/qr');
const { pool } = require('../../config/db');
const { findPendingUsers, findUserById, approveUser, rejectUser, findAllUsers, toggleUserActive, findAuditLogs, findDistinctAuditActions, findEmergencyAccessLogs, findAnalyticsSummary, searchPatients, reissuePatientQr, findAllSettings, updateSetting, findUserCountsByRole } = require('./admin.repository');

/**
 * FEATURE: Pending Approvals
 * LOGIC: Get registrations waiting for review.
 */
const getPendingUsers = async () => {
    return await findPendingUsers();
};

/**
 * FEATURE: User Management
 * LOGIC: Forward the account filters to the database query.
 */
const getAllUsers = async (filters) => {
    return await findAllUsers(filters);
};

/**
 * FEATURE: Audit Log History
 * LOGIC: Load filtered log entries and total count for pagination.
 */
const getAuditLogs = async (filters) => {
    return await findAuditLogs(filters);
};

/**
 * FEATURE: Audit Log Actions
 * LOGIC: List recorded action names for the filter control.
 */
const getDistinctAuditActions = async () => {
    return await findDistinctAuditActions();
};

/**
 * FEATURE: Emergency Access History
 * LOGIC: Load recorded break-the-glass access events.
 */
const getEmergencyAccessLogs = async () => {
    return await findEmergencyAccessLogs();
};

/**
 * FEATURE: System Activity Counts
 * LOGIC: Return high-level totals without patient-by-patient analytics.
 */
const getAnalyticsSummary = async () => {
    return await findAnalyticsSummary();
};

/**
 * FEATURE: Users by Role
 * LOGIC: Count registered accounts per role.
 */
const getUserCountsByRole = async () => {
    return await findUserCountsByRole();
};

/**
 * FEATURE: Search Patients
 * LOGIC: Return an empty list for a blank search; otherwise query by name or NIC.
 */
const findPatients = async (search) => {
    if (!search) {
        return [];
    }
    return await searchPatients(search);
};

/**
 * FEATURE: Replace Patient QR
 * LOGIC: Generate a new QR ID, overwrite the old ID, then record the action in audit logs.
 */
const reissueQrCode = async (patientId, adminUserId) => {
    // Generate a replacement identifier instead of exposing medical data inside the QR code.
    const newQrCodeId = generatePatientQR();
    const updatedPatient = await reissuePatientQr(patientId, newQrCodeId);

    if (!updatedPatient) {
        throw new Error('Patient not found');
    }

    // Log the admin action after the QR update; this is not one database transaction.
    await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'REISSUE_PATIENT_QR', 'patient', $2, $3)`,
        [adminUserId, patientId, JSON.stringify({ newQrCodeId })]
    );

    return updatedPatient;
};

/**
 * FEATURE: System Settings
 * LOGIC: Load the current settings.
 */
const getAllSettings = async () => {
    return await findAllSettings();
};

/**
 * FEATURE: Update Setting
 * LOGIC: Save the key/value and report when the key does not exist.
 */
const updateSystemSetting = async (key, value) => {
    const updated = await updateSetting(key, value);

    if (!updated) {
        throw new Error('Setting not found');
    }

    return updated;
};

/**
 * FEATURE: Change Account Activity
 * LOGIC: Check the account exists before reversing its active flag.
 */
const toggleActive = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    return await toggleUserActive(userId);
};

/**
 * FEATURE: Approve Pending Registration
 * LOGIC: Allow approval only while the account has pending verification status.
 */
const approvePendingUser = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Approval/rejection is limited to pending accounts; already reviewed registrations are
    // refused.
    if (user.verification_status !== 'pending') {
        throw new Error('User is not pending approval');
    }

    return await approveUser(userId);
};

/**
 * FEATURE: Reject Pending Registration
 * LOGIC: Require pending status; reject first, then email the reason. Log email failures.
 */
const rejectPendingUser = async (userId, reason) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.verification_status !== 'pending') {
        throw new Error('User is not pending approval');
    }

    const updatedUser = await rejectUser(userId);

    // Rejection remains saved even if email delivery fails.
    const emailResult = await sendRejectionEmail(user.email, reason);
    if (!emailResult.success) {
        console.error(`[AdminReject] Failed to email ${user.email}:`, emailResult.error);
    }

    return updatedUser;
};

module.exports = { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive, getAuditLogs, getDistinctAuditActions, getEmergencyAccessLogs, getAnalyticsSummary, findPatients, reissueQrCode, getAllSettings, updateSystemSetting, getUserCountsByRole };