
/**
 * @file patientAccess.js
 * @module Middleware
 * @desc Object-level authorization for patient-scoped resources.
 * @author Wasana Karunanayaka (S/21/081)
 */

const appointmentRepository =
  require('../modules/appointment/appointment.repository');

/**
 * FEATURE: Protect patient records.
 * LOGIC: Patients can access only their own records.
 * Doctors need an in-progress appointment with the patient before access is allowed.
 * Pharmacy access is allowed only when the route specifically enables it.
 */
const authorizePatientResource = ({
  allowDoctor = false,
  allowPharmacist = false,
} = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.session?.user;
      const patientId =
        req.params?.id || req.params?.patientId || req.body?.patientId;

      // A patient's login must match the requested patient profile.
      if (
        user?.role === 'patient' &&
        user.profile_id &&
        String(user.profile_id) === String(patientId)
      ) {
        return next();
      }

      // This exception works only on routes that enable pharmacist access.
      if (user?.role === 'pharmacist' && allowPharmacist) {
        return next();
      }

      if (user?.role === 'doctor' && allowDoctor) {
        const appointmentId =
          req.query?.appointmentId || req.body?.appointmentId;

        if (!appointmentId || !user.profile_id) {
          return res.status(403).json({
            success: false,
            message: 'An active consultation is required to access this patient record.'
          });
        }

        const appointment =
          await appointmentRepository.getAppointmentById(appointmentId);

        // The appointment must match both people and still be in progress.
        if (
          appointment &&
          appointment.status === 'in_progress' &&
          String(appointment.patient_id) === String(patientId) &&
          String(appointment.doctor_id) === String(user.profile_id)
        ) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this patient record.'
      });
    } catch (error) {
      console.error('authorizePatientResource error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

module.exports = { authorizePatientResource };
