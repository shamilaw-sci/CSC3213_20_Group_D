/**
 * @file admin.controller.js
 * @module admin
 * @desc Handles administrator HTTP requests, responses and dashboard data.
 */

const { getPendingUsers, approvePendingUser, rejectPendingUser, getAllUsers, toggleActive, getAuditLogs, getDistinctAuditActions, getEmergencyAccessLogs, getAnalyticsSummary, findPatients, reissueQrCode, getAllSettings, updateSystemSetting, getUserCountsByRole } = require('./admin.service');

/**
 * FEATURE: Pending Approvals
 * LOGIC: Return registrations still waiting for admin approval.
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
 * RBAC Display — Informational role matrix, not a live permission scan.
 * The authorize() middleware on each route is the actual access control.
 * This list needs manual updates when permissions change.
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
        allowedRoles: ['doctor', 'emergency_staff', 'hospital_staff', 'admin'],
        notes: 'Break-glass access is restricted to clinical emergency roles and administrators'
    },
    {
        resourceGroup: 'Emergency — Patient Snapshot',
        allowedRoles: ['doctor', 'emergency_staff', 'hospital_staff', 'admin'],
        notes: 'Break-glass access is restricted to clinical emergency roles and administrators'
    },
    {
        resourceGroup: 'Emergency — Active Alerts',
        allowedRoles: ['doctor', 'emergency_staff', 'hospital_staff', 'admin'],
        notes: 'Break-glass access is restricted to clinical emergency roles and administrators'
    },
    {
        resourceGroup: 'Emergency — Resolve Alert',
        allowedRoles: ['doctor', 'emergency_staff', 'hospital_staff', 'admin'],
        notes: 'Break-glass access is restricted to clinical emergency roles and administrators'
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
 * FEATURE: RBAC Overview
 * LOGIC: Return a manually maintained permissions summary; route middleware enforces access.
 */
const getRbacMatrixController = (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'RBAC matrix retrieved successfully',
        data: RBAC_MATRIX
    });
};

/**
 * FEATURE: Audit Log Search
 * LOGIC: Read filters and pagination from the URL; return matching events and total count.
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
 * FEATURE: Audit Action Filter
 * LOGIC: Return available action names for the audit log dropdown.
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
 * FEATURE: Emergency Access Oversight
 * LOGIC: Show break-the-glass activity with the staff member and patient details.
 */
const getEmergencyAccessLogsController = async (req, res) => {
    try {
        const logs = await getEmergencyAccessLogs();

        return res.status(200).json({
            success: true,
            message: 'Emergency access logs retrieved successfully',
            data: logs
        });

    } catch (error) {
        console.error('getEmergencyAccessLogsController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: Admin Analytics
 * LOGIC: Return aggregate counts without individual patient records.
 */
const getAnalyticsSummaryController = async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();

        return res.status(200).json({
            success: true,
            message: 'Analytics summary retrieved successfully',
            data: summary
        });

    } catch (error) {
        console.error('getAnalyticsSummaryController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: User Role Chart
 * LOGIC: Return a count of accounts in each role.
 */
const getUserCountsByRoleController = async (req, res) => {
    try {
        const counts = await getUserCountsByRole();

        return res.status(200).json({
            success: true,
            message: 'User counts by role retrieved successfully',
            data: counts
        });

    } catch (error) {
        console.error('getUserCountsByRoleController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: Find Patient for QR Reissue
 * LOGIC: Search by patient name or NIC before selecting a record.
 */
const searchPatientsController = async (req, res) => {
    try {
        const { search } = req.query;
        const patients = await findPatients(search);

        return res.status(200).json({
            success: true,
            message: 'Patients retrieved successfully',
            data: patients
        });

    } catch (error) {
        console.error('searchPatientsController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: Reissue Patient QR
 * LOGIC: Use the signed-in admin account to reissue and audit a patient QR identifier.
 */
const reissueQrCodeController = async (req, res) => {
    try {
        const { patientId } = req.params;
        const adminUserId = req.session.user.id;

        const updatedPatient = await reissueQrCode(patientId, adminUserId);

        return res.status(200).json({
            success: true,
            message: 'QR code reissued successfully',
            data: updatedPatient
        });

    } catch (error) {
        console.error('reissueQrCodeController error:', error);

        if (error.message === 'Patient not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: View System Settings
 * LOGIC: Load configurable settings for the admin panel.
 */
const getAllSettingsController = async (req, res) => {
    try {
        const settings = await getAllSettings();

        return res.status(200).json({
            success: true,
            message: 'Settings retrieved successfully',
            data: settings
        });

    } catch (error) {
        console.error('getAllSettingsController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: Change System Setting
 * LOGIC: Reject empty values, then update the selected setting key.
 */
const updateSettingController = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null || value === '') {
            return res.status(400).json({
                success: false,
                message: 'Value is required'
            });
        }

        const updated = await updateSystemSetting(key, value);

        return res.status(200).json({
            success: true,
            message: 'Setting updated successfully',
            data: updated
        });

    } catch (error) {
        console.error('updateSettingController error:', error);

        if (error.message === 'Setting not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * FEATURE: Manage User Accounts
 * LOGIC: Filter accounts by email/phone, role and active status.
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
 * FEATURE: Activate or Deactivate User
 * LOGIC: Switch a user account between active and inactive.
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
 * FEATURE: Approve Registration
 * LOGIC: Approve a pending user, or return an error for invalid account status.
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
 * FEATURE: Reject Registration
 * LOGIC: Require a reason, reject the application and ask the service to send an email.
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

module.exports = { getPendingUsersController, approveUserController, rejectUserController, getAllUsersController, toggleActiveController, getRbacMatrixController, getAuditLogsController, getDistinctAuditActionsController, getEmergencyAccessLogsController, getAnalyticsSummaryController, searchPatientsController, reissueQrCodeController, getAllSettingsController, updateSettingController, getUserCountsByRoleController };