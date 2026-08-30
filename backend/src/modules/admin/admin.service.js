/**
 * @file admin.service.js
 * @module admin
 * @desc Business logic for admin approval of pending user registrations.
 */

const { sendRejectionEmail } = require('../../utils/email');
const { findPendingUsers, findUserById, approveUser, rejectUser, findAllUsers, toggleUserActive, findAuditLogs, findDistinctAuditActions, findEmergencyAccessLogs, findAnalyticsSummary } = require('./admin.repository');

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

module.exports = { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive, getAuditLogs, getDistinctAuditActions, getEmergencyAccessLogs, getAnalyticsSummary };