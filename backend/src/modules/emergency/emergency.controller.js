/**
 * @file    emergency.controller.js
 * @module  Emergency
 * @desc    HTTP request handlers for emergency alerts and access auditing.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const emergencyService = require('./emergency.service');

const BREAK_GLASS_WINDOW_MS = 5 * 60 * 1000;

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

const triggerSosController = async (req, res) => {
  try {
    const {
      patientId,
      latitude,
      longitude
    } = req.body;

    const finalPatientId =
      patientId ||
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
        'SOS alert triggered and location logged successfully',
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