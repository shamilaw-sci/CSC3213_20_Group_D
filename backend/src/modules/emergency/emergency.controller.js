/**
 * @file    emergency.controller.js
 * @module  Emergency
 * @desc    HTTP request handlers for emergency alerts and access auditing.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const emergencyService = require('./emergency.service');

const triggerSosController = async (req, res) => {
  try {
    const { patientId, latitude, longitude } = req.body;
    
    // Fallback to session user ID if patientId isn't explicitly provided in the body
    const finalPatientId = patientId || req.session?.user?.profile_id;

    const alert = await emergencyService.triggerSosAlert(finalPatientId, latitude, longitude);

    res.status(201).json({
      success: true,
      message: 'SOS alert triggered and location logged successfully',
      data: alert
    });
  } catch (error) {
    console.error('triggerSosController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const logEmergencyAccessController = async (req, res) => {
  try {
    const { patientId, reason } = req.body;
    
    // Securely pull the accessor's ID and role from their session
    const accessedBy = req.session?.user?.id;
    const userRole = req.session?.user?.role;

    if (!accessedBy || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Session user information is missing'
      });
    }

    const accessLog = await emergencyService.logEmergencyAccess(patientId, accessedBy, userRole, reason);

    res.status(201).json({
      success: true,
      message: 'Emergency access logged successfully',
      data: accessLog
    });
  } catch (error) {
    console.error('logEmergencyAccessController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getEmergencySnapshotController = async (req, res) => {
  try {
    const { patientId } = req.params;
    const snapshot = await emergencyService.getEmergencySnapshot(patientId);

    res.status(200).json({
      success: true,
      message: 'Emergency patient snapshot retrieved successfully',
      data: snapshot
    });
  } catch (error) {
    console.error('getEmergencySnapshotController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  triggerSosController,
  logEmergencyAccessController,
  getEmergencySnapshotController
};