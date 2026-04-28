/**
 * @file    prescription.controller.js
 * @module  Prescription
 * @desc    HTTP request handlers for prescription endpoints.
 * @author  S/21/001
 */

const prescriptionService = require('./prescription.service');

/**
 * Handles POST /api/prescriptions
 * Creates a new prescription issued by a doctor.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPrescriptionController = async (req, res) => {
  try {
    const currentUser = req.session?.user || { id: 'test-doctor-uuid', role: 'doctor' };

    const { patientId, appointmentId, items, notes } = req.body;

    if (!patientId || !appointmentId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: patientId, appointmentId and items are required'
      });
    }

    const prescription = await prescriptionService.createPrescription(
      currentUser.id,
      patientId,
      appointmentId,
      items,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });

  } catch (error) {
    console.error('createPrescriptionController error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = { createPrescriptionController };