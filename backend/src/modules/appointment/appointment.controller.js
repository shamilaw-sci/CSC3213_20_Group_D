/**
 * @file    appointment.controller.js
 * @module  Appointment
 * @desc    Request handlers for the Appointment module.
 * @author  Tharindu (S/21/166)
 */

const appointmentRepository = require('./appointment.repository');

const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const updateAppointmentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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

    const existing = await appointmentRepository.getAppointmentById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const updated = await appointmentRepository.updateAppointmentStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updateAppointmentStatusController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addConsultationNotesController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_confidential } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'title and description are required',
      });
    }

    const appointment = await appointmentRepository.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const note = await appointmentRepository.createConsultationNote(
      id,
      appointment.patient_id,
      appointment.doctor_id,
      title,
      description,
      is_confidential
    );

    res.status(201).json({
      success: true,
      message: 'Consultation notes added successfully',
      data: note,
    });
  } catch (error) {
    console.error('addConsultationNotesController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  updateAppointmentStatusController,
  addConsultationNotesController,
};