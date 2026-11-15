/**
 * @file    emergency.controller.js
 * @module  Emergency
 * @desc    HTTP request handlers for emergency alerts and access auditing.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const emergencyService = require('./emergency.service');

const BREAK_GLASS_WINDOW_MS = 5 * 60 * 1000;

/** Wrap session.save in a Promise so emergency access is persisted before returning success. */
const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

/**
 * FEATURE: Save patient SOS alert
 * LOGIC: Read location from the request but patient identity from the login session; saving the alert does
 * not confirm outside help.
 */
const triggerSosController = async (req, res) => {
  try {
    const {
      latitude,
      longitude
    } = req.body;

    // Never trust a patient ID from the phone for SOS; use the authenticated session profile.
    const finalPatientId =
      req.session?.user?.profile_id;

    const alert =
      await emergencyService.triggerSosAlert(
        finalPatientId,
        latitude,
        longitude
      );

    res.status(201).json({
      success: true,
      message:
        'SOS alert saved to the hospital dashboard. Contact notification is not confirmed.',
      data: alert
    });

  } catch (error) {
    console.error(
      'triggerSosController error:',
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Internal server error'
    });
  }
};

/**
 * FEATURE: Log break-the-glass access
 * LOGIC: Record the authenticated staff member, patient and reason; then save a five-minute grant in that
 * session.
 */
const logEmergencyAccessController =
  async (req, res) => {
    try {
      const {
        patientId,
        reason
      } = req.body;

      const accessedBy =
        req.session?.user?.id;

      const userRole =
        req.session?.user?.role;

      const staffName =
        req.session?.user?.full_name ||
        'Authorized Medical Staff';

      if (
        !accessedBy ||
        !userRole
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Unauthorized: Session user information is missing'
        });
      }

      const accessLog =
        await emergencyService.logEmergencyAccess(
          patientId,
          accessedBy,
          userRole,
          reason,
          staffName
        );

      /*
       * Allow this specific patient snapshot to be viewed
       * for five minutes after successful audited access.
       */
      req.session.emergencyAccess = {
        patientId,
        expiresAt:
          Date.now() +
          BREAK_GLASS_WINDOW_MS
      };

      await saveSession(req);

      res.status(201).json({
        success: true,
        message:
          'Emergency access logged successfully',
        data: accessLog
      });

    } catch (error) {
      console.error(
        'logEmergencyAccessController error:',
        error
      );

      res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          'Internal server error'
      });
    }
  };

/**
 * FEATURE: View emergency patient snapshot
 * LOGIC: Require a grant for this exact patient whose five-minute expiry is still in the future; otherwise
 * return 403.
 */
const getEmergencySnapshotController =
  async (req, res) => {
    try {
      const {
        patientId
      } = req.params;

      const accessGrant =
        req.session?.emergencyAccess;

      const hasValidGrant =
        accessGrant &&
        accessGrant.patientId ===
          patientId &&
        Number(
          accessGrant.expiresAt
        ) > Date.now();

      // A missing, mismatched or expired grant must not return emergency medical information.
      if (!hasValidGrant) {
        return res.status(403).json({
          success: false,
          message:
            'Break-Glass authorization is required before viewing this emergency snapshot'
        });
      }

      const snapshot =
        await emergencyService.getEmergencySnapshot(
          patientId
        );

      res.status(200).json({
        success: true,
        message:
          'Emergency patient snapshot retrieved successfully',
        data: snapshot
      });

    } catch (error) {
      console.error(
        'getEmergencySnapshotController error:',
        error
      );

      res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          'Internal server error'
      });
    }
  };

/**
 * FEATURE: Read active hospital SOS alerts
 * LOGIC: Ask the service for current alerts; return an error response if retrieval fails.
 */
const getActiveAlertsController =
  async (req, res) => {
    try {
      const alerts =
        await emergencyService.getActiveAlerts();

      res.status(200).json({
        success: true,
        message:
          'Active emergency alerts retrieved successfully',
        data: alerts
      });

    } catch (error) {
      console.error(
        'getActiveAlertsController error:',
        error
      );

      res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          'Internal server error'
      });
    }
  };

/**
 * FEATURE: Resolve hospital alert
 * LOGIC: Pass the alert and staff IDs to the service; marking a dashboard alert resolved does not dispatch
 * an ambulance.
 */
const resolveAlertController =
  async (req, res) => {
    try {
      const {
        alertId
      } = req.params;

      const resolvedBy =
        req.session?.user?.id;

      const resolvedAlert =
        await emergencyService.resolveEmergencyAlert(
          alertId,
          resolvedBy
        );

      res.status(200).json({
        success: true,
        message:
          'Emergency alert resolved successfully',
        data: resolvedAlert
      });

    } catch (error) {
      console.error(
        'resolveAlertController error:',
        error
      );

      res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          'Internal server error'
      });
    }
  };

module.exports = {
  triggerSosController,
  logEmergencyAccessController,
  getEmergencySnapshotController,
  getActiveAlertsController,
  resolveAlertController
};
