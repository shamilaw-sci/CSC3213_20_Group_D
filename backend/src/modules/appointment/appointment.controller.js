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
    const {
      title,
      description,
      is_confidential,
      chief_complaint,
      diagnosis,
      treatment_plan,
      follow_up_needed,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'title and description are required',
      });
    }

    if (!chief_complaint || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'chief_complaint and diagnosis are required',
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
      is_confidential,
      chief_complaint,
      diagnosis,
      treatment_plan,
      follow_up_needed
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

/**
 * Handles POST /api/appointments
 * Books a new appointment (supports both Patient self-booking and Doctor walk-in).
 */
const bookAppointmentController = async (req, res) => {
  try {
    const currentUser = req.session?.user || { id: 'test-patient-uuid', role: 'patient' };
    let { patientId, doctorId, scheduledAt, type, notes } = req.body;

    // Route logic based on role, explicitly prioritizing the session's profile_id
    if (currentUser.role?.toLowerCase() === 'doctor') {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: patientId is required when a doctor initiates a visit',
        });
      }
      doctorId = currentUser.profile_id || doctorId || currentUser.id;
    } else {
      patientId = currentUser.profile_id || currentUser.id;
    }

    if (!doctorId || !scheduledAt || !type) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: doctorId, scheduledAt and type are required'
      });
    }

    // Check for conflicts
    const conflict = await appointmentRepository.checkAppointmentConflict(
      doctorId,
      scheduledAt
    );

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked for the selected doctor'
      });
    }

    const appointment = await appointmentRepository.bookAppointment(
      patientId,
      doctorId,
      scheduledAt,
      type,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });

  } catch (error) {
    console.error('bookAppointmentController error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  updateAppointmentStatusController,
  addConsultationNotesController,
  bookAppointmentController
};