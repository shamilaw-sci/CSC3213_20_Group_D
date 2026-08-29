/**
 * @file admin.controller.js
 * @module admin
 * @desc Handles HTTP requests and responses for admin approval actions.
 */

const { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive, getAuditLogs, getDistinctAuditActions } = require('./admin.service');

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
 * Static RBAC matrix, manually maintained from the actual authorize()
 * calls across the codebase (see each module's *.routes.js). This is a
 * transparency/demo view, not a live scan - if a route's authorize()
 * call changes, this list must be updated to match.
 * Last verified against codebase: see CARE4U-251.
 */
const RBAC_MATRIX = [
    {
        resourceGroup: 'Admin (all /api/admin/* routes)',
        allowedRoles: ['admin'],
        notes: 'Approval center, account management, RBAC panel'
    },
    {
        resourceGroup: 'Emergency — SOS Trigger',
        allowedRoles: ['patient'],
        notes: null
    },
    {
        resourceGroup: 'Emergency — Access Logs',
        allowedRoles: ['doctor', 'emergency', 'admin'],
        notes: "'emergency' role is defined in code but not currently assigned to any real account"
    },
    {
        resourceGroup: 'Emergency — Patient Snapshot',
        allowedRoles: ['doctor', 'emergency', 'admin'],
        notes: "'emergency' role is defined in code but not currently assigned to any real account"
    },
    {
        resourceGroup: 'Emergency — Active Alerts',
        allowedRoles: ['doctor', 'emergency', 'admin'],
        notes: "'emergency' role is defined in code but not currently assigned to any real account"
    },
    {
        resourceGroup: 'Emergency — Resolve Alert',
        allowedRoles: ['doctor', 'emergency', 'admin'],
        notes: "'emergency' role is defined in code but not currently assigned to any real account"
    },
    {
        resourceGroup: 'Auth — Register/Login/Forgot Password',
        allowedRoles: ['public'],
        notes: 'No authentication required by design'
    },
    {
        resourceGroup: 'Patients, Doctors, Appointments, Prescriptions, Pharmacies, Laboratories, Orders, Interactions',
        allowedRoles: ['any authenticated user'],
        notes: 'Requires login, but no role-specific restriction currently enforced'
    }
];

/**
 * Handles GET /api/admin/rbac-matrix
 * Returns a static, manually-maintained matrix of which roles can access
 * which resource groups, based on the codebase's actual authorize() calls.
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getRbacMatrixController = (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'RBAC matrix retrieved successfully',
        data: RBAC_MATRIX
    });
};

/**
 * Handles GET /api/admin/audit-logs
 * Supports optional query params: email, action, startDate, endDate, page, pageSize
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAuditLogsController = async (req, res) => {
    try {
        const { email, action, startDate, endDate, page, pageSize } = req.query;

        const result = await getAuditLogs({
            email,
            action,
            startDate,
            endDate,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });

        return res.status(200).json({
            success: true,
            message: 'Audit logs retrieved successfully',
            data: result.rows,
            pagination: {
                totalCount: result.totalCount,
                page: page ? parseInt(page, 10) : 1,
                pageSize: pageSize ? parseInt(pageSize, 10) : 25
            }
        });

    } catch (error) {
        console.error('getAuditLogsController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles GET /api/admin/audit-logs/actions
 * Returns the distinct list of action types for the filter dropdown.
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getDistinctAuditActionsController = async (req, res) => {
    try {
        const actions = await getDistinctAuditActions();

        return res.status(200).json({
            success: true,
            message: 'Distinct actions retrieved successfully',
            data: actions
        });

    } catch (error) {
        console.error('getDistinctAuditActionsController error:', error);
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

module.exports = { getPendingUsersController, approveUserController, rejectUserController, getAllUsersController, toggleActiveController, getRbacMatrixController, getAuditLogsController, getDistinctAuditActionsController };