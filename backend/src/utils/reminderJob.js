/**
 * @file    reminderJob.js
 * @module  Utils
 * @desc    Scheduled job that sends appointment reminder emails
 *          to patients 24 hours before their appointment.
 *          Run this function on a schedule (e.g. every hour via setInterval).
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../config/db');
const { sendAppointmentReminder } = require('./email');

/**
 * Sends reminder emails for appointments scheduled in the next 24-25 hours.
 * Designed to be called every hour so no appointment is missed.
 * @returns {Promise<void>}
 */
const sendAppointmentReminders = async () => {
  try {
    console.log('[ReminderJob] Checking for upcoming appointments...');

    // Find appointments scheduled between 24 and 25 hours from now
    const result = await pool.query(
      `SELECT 
         a.id,
         a.scheduled_at,
         a.type,
         p.full_name  AS patient_name,
         u.email      AS patient_email,
         d.full_name  AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users    u ON p.user_id    = u.id
       JOIN doctors  d ON a.doctor_id  = d.id
       WHERE a.scheduled_at BETWEEN NOW() + INTERVAL '24 hours'
                                AND NOW() + INTERVAL '25 hours'
         AND a.status = 'scheduled'`,
      []
    );

    const appointments = result.rows;
    console.log(`[ReminderJob] Found ${appointments.length} appointment(s) to remind.`);

    for (const appt of appointments) {
      const appointmentDate = new Date(appt.scheduled_at).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailResult = await sendAppointmentReminder(
        appt.patient_email,
        appt.patient_name,
        appointmentDate
      );

      if (!emailResult.success) {
        console.error('[ReminderJob] Failed to send an appointment reminder.');
      }
    }

    console.log('[ReminderJob] Done.');

  } catch (error) {
    console.error('[ReminderJob] Error:', error.message);
  }
};

module.exports = { sendAppointmentReminders };
