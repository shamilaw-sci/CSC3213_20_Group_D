/**
 * @file admin.controller.js
 * @module admin
 * @desc Handles HTTP requests and responses for admin approval actions.
 */

const { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive } = require('./admin.service');

/**
 * Handles GET /api/admin/pending-users
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getPendingUsersController = async (req, res) => {
    try {
        const users = await getPendingUsers();

        return res.status(200).json({
            success: true,
            message: 'Pending users retrieved successfully',
            data: users
        });

    } catch (error) {
        console.error('getPendingUsersController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles GET /api/admin/users
 * Supports optional query params: search, role, status ('active'/'inactive')
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAllUsersController = async (req, res) => {
    try {
        const { search, role, status } = req.query;

        const users = await getAllUsers({ search, role, status });

        return res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users
        });

    } catch (error) {
        console.error('getAllUsersController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles POST /api/admin/users/:id/toggle-active
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const toggleActiveController = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await toggleActive(id);

        return res.status(200).json({
            success: true,
            message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
            data: user
        });

    } catch (error) {
        console.error('toggleActiveController error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles POST /api/admin/users/:id/approve
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const approveUserController = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await approvePendingUser(id);

        return res.status(200).json({
            success: true,
            message: 'User approved successfully',
            data: user
        });

    } catch (error) {
        console.error('approveUserController error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        if (error.message === 'User is not pending approval') {
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles POST /api/admin/users/:id/reject
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const rejectUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const user = await rejectPendingUser(id, reason);

        return res.status(200).json({
            success: true,
            message: 'User rejected successfully',
            data: user
        });

    } catch (error) {
        console.error('rejectUserController error:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        if (error.message === 'User is not pending approval') {
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = { getPendingUsersController, approveUserController, rejectUserController, getAllUsersController, toggleActiveController };