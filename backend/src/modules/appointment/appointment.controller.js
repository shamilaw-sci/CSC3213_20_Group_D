/**
 * @file    appointment.controller.js
 * @module  Appointment
 * @desc    Request handlers for the Appointment module.
 * @author  Tharindu (S/21/166) & Wasana Karunanayaka (S/21/081)
 */

const appointmentRepository =
  require('./appointment.repository');

const patientRepository =
  require('../patient/patient.repository');

const patientService =
  require('../patient/patient.service');

const doctorRepository =
  require('../doctor/doctor.repository');

const {
  generateAIResponse
} = require('../../utils/ai.util');

const {
  logAudit
} = require('../../middleware/auditLog');

const {
  sendAppointmentConfirmation,
  sendAppointmentCancellation
} = require('../../utils/email');

const VALID_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
];

const VALID_STATUS_TRANSITIONS = {
  scheduled: ['confirmed', 'in_progress', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Temporary in-memory protection for AI note
 * structuring requests within one backend process.
 */
const summarizeSessionCounts =
  new Map();

const MAX_SUMMARIZE_CALLS_PER_SESSION =
  15;

/**
 * Resolves the authenticated doctor's profile ID.
 *
 * Care4U sessions contain the linked doctor profile in profile_id.
 *
 * @param {Object} currentUser
 * @returns {string|null}
 */
const resolveDoctorProfileId = (
  currentUser
) => {
  if (!currentUser) {
    return null;
  }

  return currentUser.profile_id || null;
};

/**
 * Updates the status of an existing appointment.
 */
const updateAppointmentStatusController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        status
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            'status is required',
        });
      }

      if (
        !VALID_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `status must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }

      const existing =
        await appointmentRepository
          .getAppointmentById(
            id
          );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            'Appointment not found',
        });
      }

      const currentUser = req.session.user;
      // Use the authenticated profile IDs, not an arbitrary appointment ID, to confirm
      // ownership.
      const isOwningDoctor =
        currentUser.role === 'doctor' &&
        String(existing.doctor_id) === String(currentUser.profile_id);
      const isOwningPatient =
        currentUser.role === 'patient' &&
        String(existing.patient_id) === String(currentUser.profile_id);

      if (!isOwningDoctor && !isOwningPatient) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this appointment.'
        });
      }

      // Patients can cancel their own bookings but cannot start or complete consultations.
      if (isOwningPatient && status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Patients may only cancel their own appointments.'
        });
      }

      // The transition table rejects invalid status jumps, including reopening completed
      // visits.
      if (
        !VALID_STATUS_TRANSITIONS[existing.status]?.includes(status)
      ) {
        return res.status(409).json({
          success: false,
          message: `Cannot change appointment status from ${existing.status} to ${status}.`
        });
      }

      const updated =
        await appointmentRepository
          .updateAppointmentStatus(
            id,
            status
          );

      /* =====================================================
         SIMULATED EMAIL - CANCELLATION
      ====================================================== */

      if (
        status ===
        'cancelled'
      ) {
        try {

          const patientData =
            await patientRepository
              .getPatientById(
                existing.patient_id
              );

          if (
            patientData &&
            patientData.email
          ) {

            sendAppointmentCancellation(
              patientData.email,
              patientData.full_name
            );

          }

        } catch (emailErr) {

          console.error(
            '[Email] Failed to send cancellation:',
            emailErr
          );
        }
      }

      res.status(200).json({
        success: true,
        message:
          'Appointment status updated successfully',
        data:
          updated,
      });

    } catch (error) {

      console.error(
        'updateAppointmentStatusController error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Internal server error'
      });
    }
  };

/**
 * Adds consultation notes to an appointment.
 */
const addConsultationNotesController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        title,
        description,
        is_confidential,
        chief_complaint,
        diagnosis,
        treatment_plan,
        follow_up_needed,
      } = req.body;

      if (
        !title ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          message:
            'title and description are required',
        });
      }

      if (
        !chief_complaint ||
        !diagnosis
      ) {
        return res.status(400).json({
          success: false,
          message:
            'chief_complaint and diagnosis are required',
        });
      }

      const appointment =
        await appointmentRepository
          .getAppointmentById(
            id
          );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            'Appointment not found',
        });
      }

      const doctorProfileId = req.session?.user?.profile_id;

      if (
        !doctorProfileId ||
        String(appointment.doctor_id) !== String(doctorProfileId)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to add notes to this appointment.'
        });
      }

      // Clinical notes are accepted only while the assigned doctor is consulting.
      if (appointment.status !== 'in_progress') {
        return res.status(409).json({
          success: false,
          message: 'Consultation notes can only be added during an active consultation.'
        });
      }

      const note =
        await appointmentRepository
          .createConsultationNote(
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
        message:
          'Consultation notes added successfully',
        data:
          note,
      });

    } catch (error) {

      console.error(
        'addConsultationNotesController error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Internal server error'
      });
    }
  };

/**
 * Handles GET /api/appointments/patients/:patientId/notes
 *
 * Returns all past consultation notes for a patient,
 * newest first.
 */
const getPatientConsultationNotesController =
  async (
    req,
    res
  ) => {
    try {

      const {
        patientId
      } = req.params;

      const doctorProfileId = req.session?.user?.profile_id;

      if (!doctorProfileId) {
        return res.status(403).json({
          success: false,
          message: 'Doctor profile could not be resolved.'
        });
      }

      const activeAppointment =
        await appointmentRepository
          .getTodayActiveAppointmentByPatientAndDoctor(
            patientId,
            doctorProfileId
          );

      if (!activeAppointment) {
        return res.status(403).json({
          success: false,
          message: 'Patient notes are available only during your active consultation.'
        });
      }

      const records = await patientService.getMedicalRecords(
        patientId,
        req.session.user,
        activeAppointment.id
      );
      const notes = records.filter(
        (record) => record.record_type === 'consultation'
      );

      res.status(200).json({
        success: true,
        data:
          notes,
      });

    } catch (error) {

      console.error(
        'getPatientConsultationNotesController error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Internal server error'
      });
    }
  };

/**
 * Handles GET /api/appointments/active
 *
 * Checks whether the authenticated doctor already has
 * an open appointment with the supplied patient today.
 *
 * Open appointments include:
 * - scheduled
 * - confirmed
 * - in_progress
 *
 * This allows QR/NIC patient lookup to reuse an existing
 * appointment instead of creating a duplicate walk-in visit.
 *
 * Query:
 * ?patientId=<patient-profile-uuid>
 */
const getActiveConsultationController =
  async (
    req,
    res
  ) => {
    try {

      const currentUser =
        req.session?.user;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message:
            'Not authenticated. Please log in.',
        });
      }

      if (
        currentUser.role
          ?.toLowerCase() !==
        'doctor'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Only doctors can check active consultations.',
        });
      }

      const {
        patientId
      } = req.query;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message:
            'patientId is required',
        });
      }

      const doctorId =
        resolveDoctorProfileId(
          currentUser
        );

      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message:
            'Doctor profile could not be resolved.',
        });
      }

      const activeAppointment =
        await appointmentRepository
          .getTodayActiveAppointmentByPatientAndDoctor(
            patientId,
            doctorId
          );

      return res.status(200).json({
        success: true,
        message:
          activeAppointment
            ? 'Existing appointment found for today'
            : 'No existing appointment found for today',
        data:
          activeAppointment,
      });

    } catch (error) {

      console.error(
        'getActiveConsultationController error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  };

/**
 * Uses AI to structure free-text consultation notes.
 */
const summarizeNotesController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        observations
      } = req.body;

      const currentUser =
        req.session?.user;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message:
            'Not authenticated. Please log in.',
        });
      }

      if (
        !observations ||
        observations
          .trim()
          .length < 10
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please type at least a short note before summarizing.',
        });
      }

      const appointment =
        await appointmentRepository
          .getAppointmentById(
            id
          );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            'Appointment not found',
        });
      }

      const doctorProfileId = currentUser.profile_id;

      if (
        !doctorProfileId ||
        String(appointment.doctor_id) !== String(doctorProfileId)
      ) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to summarize notes for this appointment.'
        });
      }

      if (appointment.status !== 'in_progress') {
        return res.status(409).json({
          success: false,
          message: 'Notes can only be summarized during an active consultation.'
        });
      }

      /**
       * Use authenticated session user ID
       * for per-session AI usage tracking.
       */
      // Track AI draft usage per current server process; this is not a persistent rate limit.
      const sessionKey =
        currentUser.id ||
        req.ip;

      const callCount =
        summarizeSessionCounts.get(
          sessionKey
        ) || 0;

      if (
        callCount >=
        MAX_SUMMARIZE_CALLS_PER_SESSION
      ) {
        return res.status(429).json({
          success: false,
          message:
            'AI summary limit reached for this session. Please fill the fields manually.',
        });
      }

      // Ask the AI for structured fields only; the doctor still reviews the returned draft.
      const prompt =
        `You are helping a doctor structure their consultation notes. Based on the following free-text observations, return ONLY a valid JSON object (no markdown, no explanation) with exactly these keys: "chief_complaint" (string), "diagnosis" (string), "treatment_plan" (string), "follow_up_needed" (boolean).

Observations:
"""${observations}"""

Respond with JSON only.`;

      const aiText =
        await generateAIResponse(
          prompt
        );

      let parsed;

      try {

        const cleaned =
          aiText
            .replace(
              /```json|```/g,
              ''
            )
            .trim();

        parsed =
          JSON.parse(
            cleaned
          );

      // If the AI response is not valid JSON, return a manual-entry fallback rather than saving
      // it.
      } catch (parseError) {

        console.error(
          'summarizeNotesController parse error:',
          parseError.message
        );

        return res.status(200).json({
          success: false,
          message:
            "Couldn't generate a summary right now. Please fill the fields manually.",
          data:
            null,
        });
      }

      summarizeSessionCounts.set(
        sessionKey,
        callCount + 1
      );

      await logAudit(
        currentUser.id,
        'AI_SUMMARIZE_NOTES',
        'appointment',
        id,
        {
          observationsLength:
            observations.length
        },
        req.ip
      );

      res.status(200).json({
        success: true,
        message:
          'AI summary generated. Please review before saving.',
        data: {
          chief_complaint:
            parsed.chief_complaint ||
            '',

          diagnosis:
            parsed.diagnosis ||
            '',

          treatment_plan:
            parsed.treatment_plan ||
            '',

          follow_up_needed:
            !!parsed.follow_up_needed,
        },
      });

    } catch (error) {

      console.error(
        'summarizeNotesController error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Couldn't generate a summary right now. Please fill the fields manually.",
      });
    }
  };

/**
 * Handles GET /api/appointments/:id/consultation
 *
 * Returns the full appointment context needed by the
 * doctor consultation workspace.
 */
const getConsultationAppointmentController =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const currentUser =
        req.session?.user;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message:
            'Not authenticated. Please log in.',
        });
      }

      if (
        currentUser.role
          ?.toLowerCase() !==
        'doctor'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Only doctors can access consultation details.',
        });
      }

      // Load the consultation by ID, then verify the logged-in doctor is the assigned doctor.
      const appointment =
        await appointmentRepository
          .getConsultationAppointmentById(
            id
          );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            'Appointment not found',
        });
      }

      /**
       * Ensure the logged-in doctor is the doctor
       * assigned to this appointment.
       */
      const doctorProfileId =
        currentUser.profile_id ||
        null;

      if (
        !doctorProfileId ||
        String(appointment.doctor_id) !==
          String(doctorProfileId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            'You are not authorized to access this consultation.',
        });
      }

      res.status(200).json({
        success: true,
        message:
          'Consultation appointment retrieved successfully',
        data:
          appointment,
      });

    } catch (error) {

      console.error(
        'getConsultationAppointmentController error:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  };

/**
 * Handles POST /api/appointments
 *
 * Books a new appointment.
 *
 * Supports:
 * - Patient self-booking
 * - Doctor-initiated walk-in consultation
 *
 * Doctor walk-in protection:
 * Before a new appointment is created, Care4U checks
 * whether this doctor already has an in-progress
 * consultation with the same patient.
 *
 * If one exists, that existing appointment is returned
 * instead of creating a duplicate.
 */
const bookAppointmentController =
  async (
    req,
    res
  ) => {
    try {

      /**
       * Care4U authentication stores
       * the authenticated user here.
       */
      const currentUser =
        req.session?.user;

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message:
            'Not authenticated. Please log in.',
        });
      }

      let {
        patientId,
        doctorId,
        scheduledAt,
        type,
        notes
      } = req.body;

      const currentRole =
        currentUser.role
          ?.toLowerCase();

      const isDoctorInitiated =
        currentRole ===
        'doctor';

      /* =====================================================
         DOCTOR-INITIATED VISIT
      ====================================================== */

      if (
        isDoctorInitiated
      ) {

        if (!patientId) {
          return res.status(400).json({
            success: false,
            message:
              'Validation failed: patientId is required when a doctor initiates a visit',
          });
        }

        /**
         * Prefer the authenticated doctor's linked
         * profile ID rather than trusting doctorId
         * supplied by the browser.
         */
        // Doctor-initiated walk-ins use the doctor ID in the authenticated session, not the
        // browser request.
        doctorId =
          resolveDoctorProfileId(
            currentUser
          );

        if (!doctorId) {
          return res.status(400).json({
            success: false,
            message:
              'Doctor profile could not be resolved.',
          });
        }

        /**
         * DUPLICATE ACTIVE CONSULTATION PROTECTION
         *
         * If this doctor already has the patient in an
         * active consultation, return that appointment.
         *
         * The existing frontend remains compatible because
         * it receives the normal appointment object in data.
         */
const activeAppointment =
  await appointmentRepository
    .getTodayActiveAppointmentByPatientAndDoctor(
      patientId,
      doctorId
    );

if (
  activeAppointment
) {
  return res.status(200).json({
    success: true,
    message:
      'An existing appointment already exists for this patient today. Reusing the existing appointment.',
    data:
      activeAppointment,

    meta: {
      existingActiveConsultation:
        true,
    },
  });
}

      } else {

        /* ===================================================
           PATIENT SELF-BOOKING
        ==================================================== */

        patientId = currentUser.profile_id;

        if (!patientId) {
          return res.status(400).json({
            success: false,
            message: 'Patient profile could not be resolved.',
          });
        }
      }

      if (
        !doctorId ||
        !scheduledAt ||
        !type
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Validation failed: doctorId, scheduledAt and type are required'
        });
      }

      const bookingTime = new Date(scheduledAt);
      if (!Number.isFinite(bookingTime.getTime()) ||
          bookingTime.getTime() < Date.now() - (isDoctorInitiated ? 5 * 60 * 1000 : 0)) {
        return res.status(400).json({
          success: false,
          message: 'Select a valid future appointment time'
        });
      }
      if (type !== 'opd') {
        return res.status(400).json({
          success: false,
          message: 'Unsupported appointment type'
        });
      }

      const appointment =
        await appointmentRepository
          .bookAvailableAppointment(
            patientId,
            doctorId,
            scheduledAt,
            type,
            notes,
            !isDoctorInitiated
          );

      /* =====================================================
         SIMULATED EMAIL - APPOINTMENT CONFIRMATION
      ====================================================== */

      try {

        const [
          patientData,
          doctorData
        ] =
          await Promise.all([
            patientRepository
              .getPatientById(
                patientId
              ),

            doctorRepository
              .getDoctorById(
                doctorId
              )
          ]);

        if (
          patientData &&
          patientData.email &&
          doctorData
        ) {

          const formattedDate =
            new Intl.DateTimeFormat(
              'en-US',
              {
                weekday:
                  'short',

                month:
                  'short',

                day:
                  'numeric',

                hour:
                  'numeric',

                minute:
                  '2-digit',

                hour12:
                  true
              }
            ).format(
              new Date(
                scheduledAt
              )
            );

          /**
           * Existing simulated asynchronous
           * notification behaviour preserved.
           */
          sendAppointmentConfirmation(
            patientData.email,
            patientData.full_name,
            doctorData.full_name,
            formattedDate
          );

        }

      } catch (emailErr) {

        console.error(
          '[Email] Failed to send confirmation:',
          emailErr
        );
      }

      res.status(201).json({
        success: true,
        message:
          'Appointment booked successfully',
        data:
          appointment
      });

    } catch (error) {

      console.error(
        'bookAppointmentController error:',
        error
      );

      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.statusCode ? error.message : 'Internal server error'
      });
    }
  };

module.exports = {
  updateAppointmentStatusController,
  addConsultationNotesController,
  getPatientConsultationNotesController,

  // Active consultation duplicate protection
  getActiveConsultationController,

  getConsultationAppointmentController,
  bookAppointmentController,
  summarizeNotesController
};
