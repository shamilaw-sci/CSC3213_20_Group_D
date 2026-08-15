/**
 * @file    email.js
 * @module  Utils
 * @desc    Email sending utility using Resend.
 *          Used for lab report notifications, appointment reminders, etc.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a lab report ready notification email.
 * @param {string} toEmail      - Recipient email address
 * @param {string} toName       - Recipient name
 * @param {string} testType     - Type of test completed
 * @param {string} labName      - Name of the laboratory
 * @param {string} findings     - Summary of findings
 * @returns {Promise<Object>} Resend response
 */
const sendLabReportNotification = async (toEmail, toName, testType, labName, findings) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Care4U <notifications@care4u.health>',
      to: [toEmail],
      subject: `Your ${testType} Report is Ready — Care4U`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Lab Report Ready</h2>
            <p style="color: #64748B;">Dear ${toName},</p>
            <p style="color: #64748B;">Your <strong>${testType}</strong> report from <strong>${labName}</strong> is now ready.</p>
            <div style="background-color: #EBF3FB; border-left: 4px solid #2E75B6; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #1E293B; margin: 0;"><strong>Findings Summary:</strong></p>
              <p style="color: #64748B; margin: 8px 0 0 0;">${findings}</p>
            </div>
            <p style="color: #64748B;">Please log in to Care4U to view the full report.</p>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Care4U. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (err) {
    console.error('sendLabReportNotification error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an appointment reminder email.
 * @param {string} toEmail         - Patient email
 * @param {string} toName          - Patient name
 * @param {string} doctorName      - Doctor name
 * @param {string} appointmentDate - Formatted appointment date
 * @returns {Promise<Object>} Resend response
 */
const sendAppointmentReminder = async (toEmail, toName, doctorName, appointmentDate) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Care4U <notifications@care4u.health>',
      to: [toEmail],
      subject: `Appointment Reminder — Care4U`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Appointment Reminder</h2>
            <p style="color: #64748B;">Dear ${toName},</p>
            <p style="color: #64748B;">This is a reminder that you have an appointment tomorrow.</p>
            <div style="background-color: #EBF3FB; border-left: 4px solid #2E75B6; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #1E293B; margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p style="color: #1E293B; margin: 8px 0 0 0;"><strong>Date & Time:</strong> ${appointmentDate}</p>
            </div>
            <p style="color: #64748B;">Please arrive 10 minutes early. Log in to Care4U to view more details.</p>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Care4U. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (err) {
    console.error('sendAppointmentReminder error:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendLabReportNotification,
  sendAppointmentReminder,
};