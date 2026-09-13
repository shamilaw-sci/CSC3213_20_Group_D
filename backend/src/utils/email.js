/**
 * @file email.js
 * @module utils
 * @desc Email sending via Gmail SMTP (Nodemailer). Switched from Resend
 * because Resend's free tier restricts recipients to the account owner's
 * own email until a domain is verified - Gmail SMTP has no such
 * restriction, so real users can actually receive their OTP/reset emails.
 */

const nodemailer = require('nodemailer');

const transporter =
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:
        process.env.EMAIL_USER,
      pass:
        process.env.EMAIL_PASS,
    },
  });

const FROM_EMAIL =
  `"Care4U" <${process.env.EMAIL_USER}>`;

/**
 * Sends a notification that a new lab report is available.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} patientName - Patient's name
 * @param {string} testName - Name of the lab test
 * @returns {Promise<Object>} Send result
 */
const sendLabReportNotification =
  async (
    toEmail,
    patientName,
    testName
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Your Lab Report is Ready',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Lab Report Ready
                </h2>

                <p style="color: #64748B;">
                  Dear ${patientName}, your results for
                  <strong>${testName}</strong>
                  are now available in your Care4U account.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendLabReportNotification error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends an appointment reminder.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} patientName - Patient's name
 * @param {string} appointmentTime - Formatted appointment date/time
 * @returns {Promise<Object>} Send result
 */
const sendAppointmentReminder =
  async (
    toEmail,
    patientName,
    appointmentTime
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Appointment Reminder',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Appointment Reminder
                </h2>

                <p style="color: #64748B;">
                  Dear ${patientName}, this is a reminder of your
                  upcoming appointment on
                  <strong>${appointmentTime}</strong>.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendAppointmentReminder error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends an alert that emergency access was used
 * on a patient's record.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} patientName - Patient's name
 * @param {string} accessedBy - Staff member who accessed
 * @returns {Promise<Object>} Send result
 */
const sendEmergencyAccessAlert =
  async (
    toEmail,
    patientName,
    accessedBy
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Emergency Access Alert',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Emergency Access Alert
                </h2>

                <p style="color: #64748B;">
                  ${patientName}'s medical record was accessed via
                  Break-the-Glass emergency access by ${accessedBy}.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendEmergencyAccessAlert error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends an OTP verification code for registration.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<Object>} Send result
 */
const sendOtpEmail =
  async (
    toEmail,
    otpCode
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Your Care4U Verification Code',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Verify Your Account
                </h2>

                <p style="color: #64748B;">
                  Use the code below to complete your registration:
                </p>

                <div
                  style="
                    background-color: #EBF3FB;
                    border-left: 4px solid #2E75B6;
                    padding: 16px;
                    border-radius: 4px;
                    margin: 16px 0;
                    text-align: center;
                  "
                >

                  <p
                    style="
                      color: #1E293B;
                      margin: 0;
                      font-size: 28px;
                      font-weight: bold;
                      letter-spacing: 4px;
                    "
                  >
                    ${otpCode}
                  </p>

                </div>

                <p style="color: #64748B;">
                  This code will expire in 10 minutes.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendOtpEmail error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends a temporary medical-record access OTP to a patient.
 *
 * The patient shares this code with the doctor during the
 * active consultation if they consent to temporary access.
 *
 * @param {string} toEmail - Patient's registered email
 * @param {string} patientName - Patient's full name
 * @param {string} otpCode - 6-digit consent OTP
 * @returns {Promise<Object>} Send result
 */
const sendConsentAccessOtpEmail =
  async (
    toEmail,
    patientName,
    otpCode
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Care4U Medical Record Access Code',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Medical Record Access Request
                </h2>

                <p style="color: #64748B;">
                  Dear ${patientName || 'Patient'},
                </p>

                <p style="color: #64748B;">
                  A doctor currently treating you has requested
                  temporary access to medical information that you
                  have protected in Care4U.
                </p>

                <p style="color: #64748B;">
                  If you agree to this access, give the following
                  verification code to the doctor:
                </p>

                <div
                  style="
                    background-color: #EBF3FB;
                    border-left: 4px solid #2E75B6;
                    padding: 16px;
                    border-radius: 4px;
                    margin: 16px 0;
                    text-align: center;
                  "
                >

                  <p
                    style="
                      color: #1E293B;
                      margin: 0;
                      font-size: 28px;
                      font-weight: bold;
                      letter-spacing: 4px;
                    "
                  >
                    ${otpCode}
                  </p>

                </div>

                <p style="color: #64748B;">
                  This code expires in
                  <strong>10 minutes</strong>.
                </p>

                <div
                  style="
                    background-color: #FEF3C7;
                    border-left: 4px solid #D97706;
                    padding: 14px;
                    border-radius: 4px;
                    margin-top: 20px;
                  "
                >

                  <p style="color: #92400E; margin: 0; font-size: 13px;">
                    Only share this code if you are currently receiving
                    care from the doctor requesting access.
                    If you did not expect this request, do not share
                    the code.
                  </p>

                </div>

                <p
                  style="
                    color: #64748B;
                    font-size: 12px;
                    margin-top: 24px;
                  "
                >
                  This code only authorizes temporary access to
                  protected medical information. It does not change
                  your Care4U privacy settings.
                </p>

                <p
                  style="
                    color: #64748B;
                    font-size: 12px;
                    margin-top: 12px;
                  "
                >
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendConsentAccessOtpEmail error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends a password reset link containing the reset token.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail =
  async (
    toEmail,
    resetToken
  ) => {
    const resetLink =
      `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Reset Your Care4U Password',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Reset Your Password
                </h2>

                <p style="color: #64748B;">
                  We received a request to reset your password.
                  Click the link below to choose a new one:
                </p>

                <p style="margin: 16px 0;">
                  <a
                    href="${resetLink}"
                    style="color: #2E75B6;"
                  >
                    ${resetLink}
                  </a>
                </p>

                <p style="color: #64748B;">
                  This link will expire in 1 hour.
                  If you didn't request this, you can safely ignore
                  this email.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendPasswordResetEmail error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

/**
 * Sends a notification that a registration
 * application was rejected.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Object>} Send result
 */
const sendRejectionEmail =
  async (
    toEmail,
    reason
  ) => {
    try {
      const info =
        await transporter.sendMail({
          from:
            FROM_EMAIL,

          to:
            toEmail,

          subject:
            'Your Care4U Registration Application',

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

              <div style="background-color: #1E3A5F; padding: 24px; border-radius: 8px 8px 0 0;">

                <h1 style="color: white; margin: 0; font-size: 24px;">
                  Care4U
                </h1>

                <p style="color: #93C5FD; margin: 4px 0 0 0; font-size: 14px;">
                  Healthcare Ecosystem
                </p>

              </div>

              <div style="background-color: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px;">

                <h2 style="color: #1E293B;">
                  Registration Not Approved
                </h2>

                <p style="color: #64748B;">
                  We're sorry to inform you that your registration
                  application could not be approved at this time.
                </p>

                <div
                  style="
                    background-color: #fee2e2;
                    border-left: 4px solid #dc2626;
                    padding: 16px;
                    border-radius: 4px;
                    margin: 16px 0;
                  "
                >

                  <p style="color: #991b1b; margin: 0;">
                    <strong>
                      Reason:
                    </strong>
                  </p>

                  <p style="color: #991b1b; margin: 8px 0 0 0;">
                    ${reason}
                  </p>

                </div>

                <p style="color: #64748B;">
                  If you believe this was a mistake or have questions,
                  please contact Care4U administration.
                </p>

                <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
                  This is an automated notification from Care4U.
                  Please do not reply to this email.
                </p>

              </div>

            </div>
          `,
        });

      return {
        success: true,
        data: info
      };

    } catch (err) {

      console.error(
        'sendRejectionEmail error:',
        err
      );

      return {
        success: false,
        error: err.message
      };
    }
  };

module.exports = {
  sendLabReportNotification,
  sendAppointmentReminder,
  sendEmergencyAccessAlert,
  sendOtpEmail,
  sendConsentAccessOtpEmail,
  sendPasswordResetEmail,
  sendRejectionEmail
};