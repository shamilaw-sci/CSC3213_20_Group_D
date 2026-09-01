/**
 * @file    appointment.controller.js
 * @module  Appointment
 * @desc    Request handlers for the Appointment module.
 * @author  Tharindu (S/21/166) & Wasana Karunanayaka (S/21/081)
 */

const appointmentRepository = require('./appointment.repository');
const patientRepository = require('../patient/patient.repository');
const doctorRepository = require('../doctor/doctor.repository');

const { generateAIResponse } = require('../../utils/ai.util');
const { logAudit } = require('../../middleware/auditLog');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../../utils/email');

const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const summarizeSessionCounts = new Map();
const MAX_SUMMARIZE_CALLS_PER_SESSION = 15;

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

    // --- NEW: SIMULATED EMAIL LOGIC ---
    if (status === 'cancelled') {
      try {
        const patientData = await patientRepository.getPatientById(existing.patient_id);
        if (patientData && patientData.email) {
          sendAppointmentCancellation(patientData.email, patientData.full_name);
          console.log(`[Email] Cancellation sent to ${patientData.email}`);
        }
      } catch (emailErr) {
        console.error("[Email] Failed to send cancellation:", emailErr);
      }
    }
    // ------------------------------------

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
 * Handles GET /api/appointments/patients/:patientId/notes
 * Returns all past consultation notes for a patient, newest first.
 * Lets the doctor review what was recorded in previous visits.
 */
const getPatientConsultationNotesController = async (req, res) => {
  try {
    const { patientId } = req.params;

    const notes = await appointmentRepository.getConsultationNotesByPatientId(patientId);

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('getPatientConsultationNotesController error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const summarizeNotesController = async (req, res) => {
  try {
    const { id } = req.params;
    const { observations } = req.body;

    if (!observations || observations.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please type at least a short note before summarizing.',
      });
    }

    const appointment = await appointmentRepository.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const sessionKey = req.session?.user?.id || req.ip;
    const callCount = summarizeSessionCounts.get(sessionKey) || 0;
    if (callCount >= MAX_SUMMARIZE_CALLS_PER_SESSION) {
      return res.status(429).json({
        success: false,
        message: 'AI summary limit reached for this session. Please fill the fields manually.',
      });
    }

    const prompt = `You are helping a doctor structure their consultation notes. Based on the following free-text observations, return ONLY a valid JSON object (no markdown, no explanation) with exactly these keys: "chief_complaint" (string), "diagnosis" (string), "treatment_plan" (string), "follow_up_needed" (boolean).

Observations:
"""${observations}"""

Respond with JSON only.`;

    const aiText = await generateAIResponse(prompt);

    let parsed;
    try {
      const cleaned = aiText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('summarizeNotesController parse error:', parseError.message);
      return res.status(200).json({
        success: false,
        message: "Couldn't generate a summary right now. Please fill the fields manually.",
        data: null,
      });
    }

    summarizeSessionCounts.set(sessionKey, callCount + 1);

    await logAudit(
      req.session?.user?.id || null,
      'AI_SUMMARIZE_NOTES',
      'appointment',
      id,
      { observationsLength: observations.length },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'AI summary generated. Please review before saving.',
      data: {
        chief_complaint: parsed.chief_complaint || '',
        diagnosis: parsed.diagnosis || '',
        treatment_plan: parsed.treatment_plan || '',
        follow_up_needed: !!parsed.follow_up_needed,
      },
    });
  } catch (error) {
    console.error('summarizeNotesController error:', error);
    res.status(500).json({
      success: false,
      message: "Couldn't generate a summary right now. Please fill the fields manually.",
    });
  }
};

/**
 * Handles POST /api/appointments
 * Books a new appointment (supports both Patient self-booking and Doctor walk-in).
 */
const bookAppointmentController = async (req, res) => {
  try {
    const currentUser = req.session?.user || { id: '006761d1-8279-440e-a786-a492df7abd53', role: 'patient' };
    let { patientId, doctorId, scheduledAt, type, notes } = req.body;

    // Route logic based on role
    if (currentUser.role?.toLowerCase() === 'doctor') {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: patientId is required when a doctor initiates a visit',
        });
      }
      doctorId = currentUser.profile_id || doctorId || currentUser.id;
    } else {
      patientId = currentUser.profile_id || patientId || currentUser.id;
    }

    if (!doctorId || !scheduledAt || !type) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: doctorId, scheduledAt and type are required'
      });
    }

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

    // --- NEW: SIMULATED EMAIL LOGIC ---
    try {
      const [patientData, doctorData] = await Promise.all([
        patientRepository.getPatientById(patientId),
        doctorRepository.getDoctorById(doctorId)
      ]);

      if (patientData && patientData.email && doctorData) {
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true
        }).format(new Date(scheduledAt));

        // Asynchronous, fire-and-forget
        sendAppointmentConfirmation(patientData.email, patientData.full_name, doctorData.full_name, formattedDate);
        console.log(`[Email] Confirmation sent to ${patientData.email}`);
      }
    } catch (emailErr) {
      console.error("[Email] Failed to send confirmation:", emailErr);
    }
    // ------------------------------------

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
  getPatientConsultationNotesController,
  bookAppointmentController,
  summarizeNotesController
};