/**
 * @file    interaction.controller.js
 * @module  DrugInteraction
 * @desc    Request handlers for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

const interactionService = require('./interaction.service');
const { logAudit } = require('../../middleware/auditLog');

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

    // Explicit audit log — entityId here is the patient the check ran against,
    // which route-param-based middleware can't capture since patientId arrives
    // in the request body, not the URL.
    const userId = req.session?.user?.id || null;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    logAudit(
      userId,
      'CHECK_DRUG_INTERACTION',
      'patient',
      patientId || null,
      { medicineName, warningCount: warnings.length },
      ipAddress
    );

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