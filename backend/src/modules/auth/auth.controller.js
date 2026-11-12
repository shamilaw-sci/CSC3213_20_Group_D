/**
 * @file    auth.controller.js
 * @module  auth
 * @desc    Handles HTTP requests and responses for authentication.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword
} = require('./auth.service');

// Import repositories to fetch profile IDs and names
const patientRepository = require('../patient/patient.repository');
const doctorRepository = require('../doctor/doctor.repository');
const pharmacyRepository = require('../pharmacy/pharmacy.repository');
const laboratoryRepository = require('../laboratory/laboratory.repository');
const hospitalRepository = require('../hospital/hospital.repository');

/**
 * Rotate the anonymous session ID, assign the identity, then confirm persistence.
 * Failed persistence removes the in-memory identity and attempts destruction.
 * @param {Object} req - Request with express-session middleware installed.
 * @param {Object} user - Public identity fields only; never a password hash.
 * @returns {Promise<void>} Resolves only after the session store acknowledges save.
 */
const saveAuthenticatedSession = async (req, user) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });
    req.session.user = user;
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
  } catch (error) {
    if (req.session) {
      delete req.session.user;
      req.session.destroy(() => {});
    }
    throw error;
  }
};

/**
 * Validate required JSON string fields before calling database/hash providers.
 * @param {*} value - Untrusted request-body field.
 * @returns {boolean} Whether it is a nonempty string (passwords are not trimmed).
 */
const isNonemptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * POST /api/auth/register
 * Validate scalar fields, role and password length; stage registration and report email submission.
 * @param {Object} req - body: email, phone, password, role, optional object profileData.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 staged; 400 validation/duplicate, 502 delivery rejection, 500 unexpected failure.
 */
const registerController = async (req, res) => {
  try {
    const { email, phone, password, role, profileData } = req.body || {};

    if (![email, phone, password, role].every(isNonemptyString)) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, password and role are required'
      });
    }

    if (profileData !== undefined && (profileData === null || typeof profileData !== 'object' || Array.isArray(profileData))) {
      return res.status(400).json({ success: false, message: 'Profile data must be an object' });
    }

    if (
      ![
        'patient',
        'doctor',
        'pharmacist',
        'lab_technician',
        'hospital_staff'
      ].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Role must be patient, doctor, pharmacist, lab_technician, or hospital_staff'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const result = await register(
      email,
      phone,
      password,
      role,
      profileData || {}
    );

    return res.status(200).json({
      success: true,
      message:
        'Verification code sent by email. Enter it to complete registration.',
      data: {
        email: result.email,
        otpExpiresAt: result.otpExpiresAt
      }
    });

  } catch (error) {
    console.error('registerController error:', error.code || error.name);

    if (error.message === 'Email already registered') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already registered'
      });
    }

    if (error.message === 'Failed to send OTP email') {
      return res.status(502).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * POST /api/auth/resend-otp
 * Validate email and replace/send a pending verification code.
 * @param {Object} req - body.email string.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 submitted; 400 missing, 404 no pending record, 502 delivery rejection, 500 unexpected.
 */
const resendOtpController = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!isNonemptyString(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await resendOtp(email);

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent.',
      data: {
        email: result.email,
        otpExpiresAt: result.otpExpiresAt
      }
    });

  } catch (error) {
    console.error('resendOtpController error:', error.code || error.name);

    if (error.message === 'No pending registration found for this email') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Failed to send OTP email') {
      return res.status(502).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * POST /api/auth/verify-otp
 * Complete account creation; approved identities get a regenerated, saved session. Pending professionals receive approvalPending and no session user.
 * @param {Object} req - body.email and six-digit body.otpCode.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 201 created; 400 invalid/expired/duplicate, 404 no pending record, 500 DB/session failure.
 */
const verifyOtpController = async (req, res) => {
  try {
    const { email, otpCode } = req.body || {};

    if (!isNonemptyString(email) || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({
        success: false,
        message: 'Email and a 6-digit verification code are required'
      });
    }

    const result = await verifyOtp(email, otpCode);

    const user = result.user;
    const profile = result.profile;

    const approvalPending = user.role !== 'patient' &&
      user.verification_status !== 'approved';

    if (!approvalPending) {
      await saveAuthenticatedSession(req, {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_id: profile ? profile.id : null,
        full_name: profile ? profile.full_name : null
      });
    } else if (req.session) {
      delete req.session.user;
    }

    return res.status(201).json({
      success: true,
      message: approvalPending
        ? 'Account verified. Await admin approval before signing in.'
        : 'Account verified and created successfully',
      data: {
        approvalPending,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile_id: profile ? profile.id : null,
          full_name: profile ? profile.full_name : null
        },
        profile
      }
    });

  } catch (error) {
    console.error('verifyOtpController error:', error.code || error.name);

    if (error.message === 'No pending registration found for this email') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message === 'Invalid OTP' ||
      error.message === 'OTP has expired'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already registered'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * POST /api/auth/login
 * Validate credentials, resolve the role-linked profile, rotate the session and await persistence before returning public identity fields.
 * @param {Object} req - body.email/password and middleware-provided session.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 identity; 400 malformed input, 401 bad credentials, 403 restricted account, 429 lockout, 500 DB/session failure.
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!isNonemptyString(email) || !isNonemptyString(password)) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await login(email, password);

    let profileId = null;
    let fullName = null;

    const userRole = user.role?.toLowerCase();

    if (userRole === 'patient') {
      const patientProfile =
        await patientRepository.getPatientByUserId(user.id);

      if (patientProfile) {
        profileId = patientProfile.id;
        fullName = patientProfile.full_name;
      }

    } else if (userRole === 'doctor') {
      const doctorProfile =
        await doctorRepository.getDoctorByUserId(user.id);

      if (doctorProfile) {
        profileId = doctorProfile.id;
        fullName = doctorProfile.full_name;
      }

    } else if (userRole === 'pharmacist') {
      const pharmacyProfile =
        await pharmacyRepository.getPharmacyByUserId(user.id);

      if (pharmacyProfile) {
        profileId = pharmacyProfile.id;
        fullName = pharmacyProfile.name;
      }

    } else if (userRole === 'lab_technician') {
      const laboratoryProfile =
        await laboratoryRepository.getLaboratoryByUserId(user.id);

      if (laboratoryProfile) {
        profileId = laboratoryProfile.id;
        fullName = laboratoryProfile.name;
      }

    } else if (userRole === 'hospital_staff') {
      const hospitalProfile =
        await hospitalRepository.getHospitalByUserId(user.id);

      if (hospitalProfile) {
        profileId = hospitalProfile.id;
        fullName = hospitalProfile.name;
      }
    }

    await saveAuthenticatedSession(req, {
      id: user.id,
      email: user.email,
      role: user.role,
      profile_id: profileId,
      full_name: fullName
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: req.session.user
    });

  } catch (error) {
    console.error('loginController error:', error.code || error.name);

    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Account is deactivated. Please contact admin.') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Account pending admin approval') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Account registration was not approved') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message?.startsWith('Too many failed attempts')) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * POST /api/auth/logout
 * Destroy the server session before clearing the default cookie. Already-absent sessions are idempotent; store failure never returns success.
 * @param {Object} req - middleware-provided optional session.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 destroyed/absent; 500 destruction failure.
 */
const logoutController = (req, res) => {
  if (!req.session) {
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.clearCookie('connect.sid');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });
};


/**
 * GET /api/auth/me
 * Return the public identity already admitted by isAuthenticated. This handler alone does not query fresh account state.
 * @param {Object} req - session.user, refreshed/gated by preceding middleware.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 public session user; 401 absent identity.
 */
const getMeController = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Session active',
    data: req.session.user
  });
};


/**
 * POST /api/auth/forgot-password
 * Validate email and relay the generic recovery response without confirming account existence or delivery.
 * @param {Object} req - body.email string.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 generic; 400 malformed, 500 repository/unexpected failure.
 */
const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!isNonemptyString(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('forgotPasswordController error:', error.code || error.name);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


/**
 * POST /api/auth/reset-password
 * Require the generated token format and minimum password length, then request token-bound password replacement. This does not sign the caller in.
 * @param {Object} req - body.token lowercase hex and body.newPassword string.
 * @param {Object} res - Express response.
 * @returns {Object|Promise<Object>} 200 confirmed reset; 400 invalid/expired/used token or malformed password, 500 unexpected failure.
 */
const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !isNonemptyString(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    await resetPassword(token, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('resetPasswordController error:', error.code || error.name);

    if (error.message === 'Invalid or expired password reset token') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


module.exports = {
  registerController,
  verifyOtpController,
  resendOtpController,
  loginController,
  logoutController,
  getMeController,
  forgotPasswordController,
  resetPasswordController
};
