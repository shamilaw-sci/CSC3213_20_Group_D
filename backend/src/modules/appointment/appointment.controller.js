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
 * Care4U sessions normally contain profile_id.
 * The fallback user ID is retained for compatibility
 * with the current authentication structure.
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

  return (
    currentUser.profile_id ||
    currentUser.id ||
    null
  );
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

            console.log(
              `[Email] Cancellation sent to ${patientData.email}`
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

      const notes =
        await appointmentRepository
          .getConsultationNotesByPatientId(
            patientId
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
 * Checks whether the authenticated doctor already
 * has an in-progress consultation with a patient.
 *
 * The doctor ID is taken from the authenticated
 * session instead of trusting a doctor ID supplied
 * by the browser.
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
          .getActiveConsultationByPatientAndDoctor(
            patientId,
            doctorId
          );

      return res.status(200).json({
        success: true,
        message:
          activeAppointment
            ? 'Active consultation found'
            : 'No active consultation found',
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

      /**
       * Use authenticated session user ID
       * for per-session AI usage tracking.
       */
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
        doctorProfileId &&
        appointment.doctor_id !==
          doctorProfileId
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
            .getActiveConsultationByPatientAndDoctor(
              patientId,
              doctorId
            );

        if (
          activeAppointment
        ) {
          return res.status(200).json({
            success: true,
            message:
              'An active consultation already exists for this patient. Resuming the existing consultation.',
            data:
              activeAppointment,

            /**
             * Optional metadata for newer frontends.
             * Older frontend code can safely ignore this.
             */
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

        patientId =
          currentUser.profile_id ||
          patientId ||
          currentUser.id;
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

      /**
       * Existing exact-time booking conflict validation
       * remains unchanged.
       */
      const conflict =
        await appointmentRepository
          .checkAppointmentConflict(
            doctorId,
            scheduledAt
          );

      if (conflict) {
        return res.status(400).json({
          success: false,
          message:
            'This time slot is already booked for the selected doctor'
        });
      }

      const appointment =
        await appointmentRepository
          .bookAppointment(
            patientId,
            doctorId,
            scheduledAt,
            type,
            notes
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

          console.log(
            `[Email] Confirmation sent to ${patientData.email}`
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

      res.status(500).json({
        success: false,
        message:
          'Internal server error'
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