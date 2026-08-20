/**
 * @file    interaction.controller.js
 * @module  DrugInteraction
 * @desc    Request handlers for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

const interactionService = require('./interaction.service');

/**
 * Handles POST /api/interactions/check
 * Checks a candidate medicine against a patient's allergies and active prescriptions.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkConflictsController = async (req, res) => {
  try {
    const { patientId, medicineName } = req.body;
    const warnings = await interactionService.checkPrescriptionConflicts(patientId, medicineName);
    res.status(200).json({
      success: true,
      message: warnings.length > 0 ? 'Potential conflicts found' : 'No conflicts found',
      data: { warnings },
    });
  } catch (error) {
    console.error('checkConflictsController error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  checkConflictsController,
};