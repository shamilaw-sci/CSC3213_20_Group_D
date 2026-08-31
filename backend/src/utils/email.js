/**
 * @file    email.js
 * @module  Utils
 * @desc    Email sending utility using Resend.
 *          Used for lab report notifications, appointment reminders, emergency alerts,
 *          booking confirmations/cancellations, and auth flows (OTP, reset).
 * @author  Pamudika Abayarathna (S/21/001), Wasana Karunanayaka (S/21/081) & Lasitha Sanuth (S/21/389)
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// For free/test accounts, Resend requires using their verified sandbox address
const FROM_EMAIL = 'Care4U <onboarding@resend.dev>';

/**
 * Sends a lab report ready notification email.
 */
const sendLabReportNotification = async (toEmail, toName, testType, labName, findings) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
 */
const sendAppointmentReminder = async (toEmail, toName, doctorName, appointmentDate) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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

/**
 * Sends a security alert to the registered emergency contact when a patient's snapshot is accessed.
 */
const sendEmergencyAccessAlert = async (toEmail, patientName, doctorName, reason) => {
  if (!toEmail) return { success: false, error: 'No email provided' };
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `🚨 SECURITY ALERT: Emergency Record Accessed — Care4U`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #dc2626; padding: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U Security Alert</h1>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px;">
            <h2 style="color: #1E293B;">Emergency Break-Glass Activated</h2>
            <p style="color: #64748B;">Hello,</p>
            <p style="color: #64748B;">This is an automated security notification. The highly restricted Emergency Medical Snapshot for <strong>${patientName}</strong> was just accessed using the Break-Glass protocol.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #991b1b; margin: 0;"><strong>Accessed By:</strong> Dr. ${doctorName}</p>
              <p style="color: #991b1b; margin: 8px 0 0 0;"><strong>Stated Reason:</strong> ${reason}</p>
              <p style="color: #991b1b; margin: 8px 0 0 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #64748B;">No sensitive medical history was exposed, only life-saving triage data. If ${patientName} is not currently experiencing a medical emergency, please contact Care4U administration immediately.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending emergency alert:', error);
      return { success: false, error };
    }

    console.log(`[Email] Emergency access alert successfully sent to ${toEmail}`);
    return { success: true, data };

  } catch (err) {
    console.error('sendEmergencyAccessAlert error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an OTP verification code for registration.
 */
const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Your Care4U Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Verify Your Account</h2>
            <p style="color: #64748B;">Use the code below to complete your registration:</p>
            <div style="background-color: #EBF3FB; border-left: 4px solid #2E75B6; padding: 16px; border-radius: 4px; margin: 16px 0; text-align: center;">
              <p style="color: #1E293B; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
            </div>
            <p style="color: #64748B;">This code will expire in 10 minutes.</p>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Care4U. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending OTP:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (err) {
    console.error('sendOtpEmail error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a password reset link containing the reset token.
 */
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Reset Your Care4U Password`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Reset Your Password</h2>
            <p style="color: #64748B;">We received a request to reset your password. Click the link below to choose a new one:</p>
            <p style="margin: 16px 0;"><a href="${resetLink}" style="color: #2E75B6;">${resetLink}</a></p>
            <p style="color: #64748B;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Care4U. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending password reset email:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (err) {
    console.error('sendPasswordResetEmail error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a notification that a registration application was rejected.
 */
const sendRejectionEmail = async (toEmail, reason) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Your Care4U Registration Application`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Registration Not Approved</h2>
            <p style="color: #64748B;">We're sorry to inform you that your registration application could not be approved at this time.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #991b1b; margin: 0;"><strong>Reason:</strong></p>
              <p style="color: #991b1b; margin: 8px 0 0 0;">${reason}</p>
            </div>
            <p style="color: #64748B;">If you believe this was a mistake or have questions, please contact Care4U administration.</p>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
              This is an automated notification from Care4U. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Error sending rejection email:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (err) {
    console.error('sendRejectionEmail error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an appointment confirmation email.
 */
const sendAppointmentConfirmation = async (toEmail, toName, doctorName, appointmentDate) => {
  try {
    const DEMO_EMAIL = 'wasanakarunanayaka2002@gmail.com';
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [DEMO_EMAIL],
      subject: `Appointment Confirmed — Care4U`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Appointment Confirmed!</h2>
            <p style="color: #64748B;">Dear ${toName},</p>
            <p style="color: #64748B;">Your appointment has been successfully booked.</p>
            <div style="background-color: #EBF3FB; border-left: 4px solid #2E75B6; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #1E293B; margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p style="color: #1E293B; margin: 8px 0 0 0;"><strong>Date & Time:</strong> ${appointmentDate}</p>
            </div>
            <p style="color: #64748B;">Please log in to your Care4U app to manage your visits.</p>
          </div>
        </div>
      `,
    });
    if (error) console.error('Email send error:', error);
    return { success: !error, data };
  } catch (err) {
    console.error('sendAppointmentConfirmation error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an appointment cancellation email.
 */
const sendAppointmentCancellation = async (toEmail, toName) => {
  try {
    const DEMO_EMAIL = 'wasanakarunanayaka2002@gmail.com';
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [DEMO_EMAIL],
      subject: `Appointment Cancelled — Care4U`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Care4U</h1>
            <p style="color: #fca5a5; margin: 4px 0 0 0; font-size: 14px;">Healthcare Ecosystem</p>
          </div>
          <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1E293B;">Appointment Cancelled</h2>
            <p style="color: #64748B;">Dear ${toName},</p>
            <p style="color: #64748B;">As requested, your appointment has been successfully cancelled.</p>
            <p style="color: #64748B; margin-top: 16px;">If you need to rebook, you can easily find another slot using the Care4U mobile app or website.</p>
          </div>
        </div>
      `,
    });
    if (error) console.error('Email send error:', error);
    return { success: !error, data };
  } catch (err) {
    console.error('sendAppointmentCancellation error:', err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendLabReportNotification,
  sendAppointmentReminder,
  sendEmergencyAccessAlert,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendRejectionEmail,
  sendAppointmentConfirmation,
  sendAppointmentCancellation
};