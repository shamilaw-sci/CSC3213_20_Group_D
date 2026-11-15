/**
 * @file admin.routes.js
 * @module admin
 * @desc Defines administrator-only API routes and their access checks.
 */

const express = require('express');
const router = express.Router();

const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
    getPendingUsersController,
    approveUserController,
    rejectUserController,
    getAllUsersController,
    toggleActiveController,
    getRbacMatrixController,
    getAuditLogsController,
    getDistinctAuditActionsController,
    getEmergencyAccessLogsController,
    getAnalyticsSummaryController,
    searchPatientsController,
    reissueQrCodeController,
    getAllSettingsController,
    updateSettingController,
    getUserCountsByRoleController
} = require('./admin.controller');

// Approval Center — Every route below requires login and the admin role.
router.get('/pending-users', isAuthenticated, authorize('admin'), getPendingUsersController);
router.post('/users/:id/approve', isAuthenticated, authorize('admin'), approveUserController);
router.post('/users/:id/reject', isAuthenticated, authorize('admin'), rejectUserController);

// Account Management — List users and change whether an account is active.
router.get('/users', isAuthenticated, authorize('admin'), getAllUsersController);
router.post('/users/:id/toggle-active', isAuthenticated, authorize('admin'), toggleActiveController);

// RBAC and Audit — Show the static permissions overview and recorded activity.
router.get('/rbac-matrix', isAuthenticated, authorize('admin'), getRbacMatrixController);
router.get('/audit-logs', isAuthenticated, authorize('admin'), getAuditLogsController);
router.get('/audit-logs/actions', isAuthenticated, authorize('admin'), getDistinctAuditActionsController);
router.get('/emergency-access-logs', isAuthenticated, authorize('admin'), getEmergencyAccessLogsController);

// Analytics — Aggregate system activity and user counts by role.
router.get('/analytics', isAuthenticated, authorize('admin'), getAnalyticsSummaryController);
router.get('/analytics/users-by-role', isAuthenticated, authorize('admin'), getUserCountsByRoleController);

// Patient QR Recovery — Find the patient and replace the old QR identifier.
router.get('/patients/search', isAuthenticated, authorize('admin'), searchPatientsController);
router.post('/patients/:patientId/reissue-qr', isAuthenticated, authorize('admin'), reissueQrCodeController);

// System Settings — Read settings or change a specific key.
router.get('/settings', isAuthenticated, authorize('admin'), getAllSettingsController);
router.put('/settings/:key', isAuthenticated, authorize('admin'), updateSettingController);

module.exports = router;