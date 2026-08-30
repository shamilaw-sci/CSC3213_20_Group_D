/**
 * @file admin.service.js
 * @module admin
 * @desc Business logic for admin approval of pending user registrations.
 */

const { sendRejectionEmail } = require('../../utils/email');
const { generatePatientQR } = require('../../utils/qr');
const { pool } = require('../../config/db');
const { findPendingUsers, findUserById, approveUser, rejectUser, findAllUsers, toggleUserActive, findAuditLogs, findDistinctAuditActions, findEmergencyAccessLogs, findAnalyticsSummary, searchPatients, reissuePatientQr, findAllSettings, updateSetting } = require('./admin.repository');

/**
 * Gets all users currently pending admin approval.
 * @returns {Promise<Array>} List of pending users
 */
const getPendingUsers = async () => {
    return await findPendingUsers();
};

/**
 * Gets all users, optionally filtered by search term, role, or active status.
 * @param {object} filters - Optional filters (search, role, status)
 * @returns {Promise<Array>} List of matching users
 */
const getAllUsers = async (filters) => {
    return await findAllUsers(filters);
};

/**
 * Gets paginated, filtered audit log entries.
 * @param {object} filters - Optional filters (email, action, startDate, endDate, page, pageSize)
 * @returns {Promise<object>} { rows, totalCount }
 */
const getAuditLogs = async (filters) => {
    return await findAuditLogs(filters);
};

/**
 * Gets all distinct action types currently present in the audit log,
 * for populating a filter dropdown.
 * @returns {Promise<Array<string>>} List of distinct action strings
 */
const getDistinctAuditActions = async () => {
    return await findDistinctAuditActions();
};

/**
 * Gets all Break-the-Glass emergency access log entries.
 * @returns {Promise<Array>} List of emergency access logs
 */
const getEmergencyAccessLogs = async () => {
    return await findEmergencyAccessLogs();
};

/**
 * Gets anonymized aggregate analytics counts.
 * @returns {Promise<object>} { totalPatients, appointmentsThisMonth, prescriptionsIssued, emergencyOverrides }
 */
const getAnalyticsSummary = async () => {
    return await findAnalyticsSummary();
};

/**
 * Searches for patients by name or NIC.
 * @param {string} search - Search term
 * @returns {Promise<Array>} List of matching patients
 */
const findPatients = async (search) => {
    if (!search) {
        return [];
    }
    return await searchPatients(search);
};

/**
 * Deactivates a patient's current QR code and issues a fresh one,
 * writing an audit log entry for the action.
 * @param {string} patientId - UUID of the patient
 * @param {string} adminUserId - UUID of the admin performing the action
 * @returns {Promise<object>} Updated patient row with new qr_code_id
 */
const reissueQrCode = async (patientId, adminUserId) => {
    const newQrCodeId = generatePatientQR();
    const updatedPatient = await reissuePatientQr(patientId, newQrCodeId);

    if (!updatedPatient) {
        throw new Error('Patient not found');
    }

    await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'REISSUE_PATIENT_QR', 'patient', $2, $3)`,
        [adminUserId, patientId, JSON.stringify({ newQrCodeId })]
    );

    return updatedPatient;
};

/**
 * Gets all system settings.
 * @returns {Promise<Array>} List of settings
 */
const getAllSettings = async () => {
    return await findAllSettings();
};

/**
 * Updates a single system setting's value.
 * @param {string} key - The setting's key
 * @param {string} value - The new value
 * @returns {Promise<object>} Updated setting
 */
const updateSystemSetting = async (key, value) => {
    const updated = await updateSetting(key, value);

    if (!updated) {
        throw new Error('Setting not found');
    }

    return updated;
};

/**
 * Toggles a user's active status (activate/deactivate).
 * @param {string} userId - UUID of the user to toggle
 * @returns {Promise<object>} Updated user row
 */
const toggleActive = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    return await toggleUserActive(userId);
};

/**
 * Approves a pending user's registration.
 * @param {string} userId - UUID of the user to approve
 * @returns {Promise<object>} Updated user row
 */
const approvePendingUser = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.verification_status !== 'pending') {
        throw new Error('User is not pending approval');
    }

    return await approveUser(userId);
};

/**
 * Rejects a pending user's registration and emails them the reason.
 * @param {string} userId - UUID of the user to reject
 * @param {string} reason - Reason for rejection, shown to the applicant
 * @returns {Promise<object>} Updated user row
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

    const emailResult = await sendRejectionEmail(user.email, reason);
    if (!emailResult.success) {
        console.error(`[AdminReject] Failed to email ${user.email}:`, emailResult.error);
    }

    return updatedUser;
};

module.exports = { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive, getAuditLogs, getDistinctAuditActions, getEmergencyAccessLogs, getAnalyticsSummary, findPatients, reissueQrCode, getAllSettings, updateSystemSetting };