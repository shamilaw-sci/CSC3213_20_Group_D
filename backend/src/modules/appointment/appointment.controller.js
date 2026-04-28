/**
 * @file    appointment.controller.js
 * @module  Appointment
 * @desc    Request handlers for the Appointment module.
 *          Shared module used by Doctor and Patient modules.
 * @author  Tharindu (S/21/166)
 */

const appointmentRepository = require('./appointment.repository');

// Valid appointment statuses
const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

/**
 * Update appointment status.
 * PUT /api/appointments/:id/status
 */
const updateAppointmentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Check appointment exists
    const existing = await appointmentRepository.getAppointmentById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Update status
    const updated = await appointmentRepository.updateAppointmentStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updateAppointmentStatusController error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  updateAppointmentStatusController,
};