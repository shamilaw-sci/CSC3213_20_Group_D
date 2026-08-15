/**
 * @file    emergency.controller.js
 * @module  Emergency
 * @desc    HTTP request handlers for emergency alerts.
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

module.exports = {
  triggerSosController
};