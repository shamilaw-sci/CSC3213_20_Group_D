/**
 * @file    prescription.controller.js
 * @module  Prescription
 * @desc    HTTP request handlers for prescription endpoints.
 * @author  S/21/001
 */

const prescriptionService = require('./prescription.service');
const pharmacyRepository = require('../pharmacy/pharmacy.repository');

/**
 * Handles POST /api/prescriptions
 * Creates a new prescription issued by a doctor.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPrescriptionController = async (req, res) => {
  try {
    const currentUser = req.user;

    const { patientId, appointmentId, items, notes } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: patientId, appointmentId and items are required'
      });
    }

    const prescription = await prescriptionService.createPrescription(
      currentUser.profile_id || currentUser.id,
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

/**
 * Handles GET /api/prescriptions/:id
 * Retrieves a prescription and its medicine items by ID.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPrescriptionController = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription =
      await prescriptionService.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription retrieved successfully',
      data: prescription
    });

  } catch (error) {
    console.error('getPrescriptionController error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handles GET /api/prescriptions/verify/:qrValue
 * Verifies a prescription by QR code value for pharmacy use.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPrescriptionController = async (req, res) => {
  try {
    const { qrValue } = req.params;

    const prescription =
      await prescriptionService.verifyPrescriptionByQR(
        qrValue
      );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found — invalid QR code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription verified successfully',
      data: prescription
    });

  } catch (error) {
    console.error('verifyPrescriptionController error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handles POST /api/prescriptions/:id/dispense
 * Records medicine dispensing by a pharmacist.
 *
 * The pharmacy ID is resolved from the logged-in pharmacist's
 * user account instead of trusting a pharmacy ID sent from
 * the frontend.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const dispenseMedicineController = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispenseItems } = req.body;

    const currentUserId = req.session?.user?.id;

    if (
      !dispenseItems ||
      !Array.isArray(dispenseItems) ||
      dispenseItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: dispenseItems array is required'
      });
    }

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const pharmacy =
      await pharmacyRepository.getPharmacyByUserId(
        currentUserId
      );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy profile not found for this account'
      });
    }

    if (!pharmacy.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Pharmacy is not verified'
      });
    }

    if (!pharmacy.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Pharmacy account is inactive'
      });
    }

    const updatedPrescription =
      await prescriptionService.dispenseMedicine(
        id,
        dispenseItems,
        pharmacy.id
      );

    if (!updatedPrescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine dispensed successfully',
      data: updatedPrescription
    });

  } catch (error) {
    console.error(
      'dispenseMedicineController error:',
      error
    );

    res.status(error.statusCode || 400).json({
      success: false,
      message:
        error.message ||
        'Internal server error'
    });
  }
};

module.exports = {
  createPrescriptionController,
  getPrescriptionController,
  verifyPrescriptionController,
  dispenseMedicineController
};