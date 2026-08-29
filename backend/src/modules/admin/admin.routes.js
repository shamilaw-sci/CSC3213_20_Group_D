/**
 * @file admin.routes.js
 * @module admin
 * @desc Route definitions for admin approval endpoints. All routes require
 *       an authenticated user with the 'admin' role.
 */

const express = require('express');
const router = express.Router();

const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
    getPendingUsersController,
    approveUserController,
    rejectUserController,
    getAllUsersController,
    toggleActiveController
} = require('./admin.controller');

router.get('/pending-users', isAuthenticated, authorize('admin'), getPendingUsersController);
router.post('/users/:id/approve', isAuthenticated, authorize('admin'), approveUserController);
router.post('/users/:id/reject', isAuthenticated, authorize('admin'), rejectUserController);
router.get('/users', isAuthenticated, authorize('admin'), getAllUsersController);
router.post('/users/:id/toggle-active', isAuthenticated, authorize('admin'), toggleActiveController);

module.exports = router;