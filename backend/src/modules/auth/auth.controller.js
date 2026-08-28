/**
 * @file    auth.controller.js
 * @module  auth
 * @desc    Handles HTTP requests and responses for authentication.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

const { register, verifyOtp, resendOtp, login, forgotPassword, resetPassword } = require('./auth.service');

// Import repositories to fetch profile IDs and names
const patientRepository = require('../patient/patient.repository');
const doctorRepository = require('../doctor/doctor.repository');

/**
 * Handles POST/ api/ auth/ register
 * @param {object} req - Express request
 * @param {object} res - Express response 
 */
const registerController = async (req, res) => {
    try {
        const {email, phone, password, role, profileData} = req.body;

        //Validate required fields
        if (!email || !phone || !password || !role) {
            return res.status(400).json({
                success: false,
                message:'Email, phone, password and role are required'
            });
        }

        //Validate role
        if (!['patient','doctor','pharmacist','lab_technician','hospital_staff'].includes(role)){
            return res.status(400).json({
                success: false,
                message:'Role must be patient, doctor, pharmacist, lab_technician, or hospital_staff'
            });
        }

        // Validate password length
        if (password.length<8) {
            return res.status(400).json({
                success: false,
                message:'Password must be at least 8 characters'
            });
        }

        const result = await register(email, phone, password, role, profileData || {});

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your registered contact. Please verify to complete registration.',
            data: {
                email: result.email,
                otpExpiresAt: result.otpExpiresAt
            }
        });

    } catch(error) {
      console.error('registerController error: ',error);

      if(error.message === 'Email already registered') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
      }

      if(error.code === '23505') {
        return res.status(400).json({
            success: false,
            message: 'Email or phone number already registered'
        });
      }

      return res.status(500).json({
        success:false,
        message: 'Internal server error'
      });
    }
};

/**
 * Handles POST /api/auth/resend-otp
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const resendOtpController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
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
        console.error('resendOtpController error:', error);

        if (error.message === 'No pending registration found for this email') {
            return res.status(404).json({
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
 * Handles POST /api/auth/verify-otp
 * Verifies the OTP, creates the user account, and starts the session -
 * same session-setting logic as loginController.
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const verifyOtpController = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP code are required'
            });
        }

        const result = await verifyOtp(email, otpCode);
        const user = result.user;
        const profile = result.profile;

        // Save user to session, including full_name
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            profile_id: profile ? profile.id : null,
            full_name: profile ? profile.full_name : null
        };

        return res.status(201).json({
            success: true,
            message: 'Account verified and created successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    profile_id: profile ? profile.id : null,
                    full_name: profile ? profile.full_name : null
                },
                profile: profile
            }
        });

    } catch (error) {
        console.error('verifyOtpController error:', error);

        if (error.message === 'No pending registration found for this email') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Invalid OTP' || error.message === 'OTP has expired') {
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
 * Handles POST /api/auth/login
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await login(email, password);

    // Fetch the specific profile ID and Name based on role
    let profileId = null;
    let fullName = null;
    const userRole = user.role?.toLowerCase();
    
    if (userRole === 'patient') {
      const patientProfile = await patientRepository.getPatientByUserId(user.id);
      if (patientProfile) {
        profileId = patientProfile.id;
        fullName = patientProfile.full_name;
      }
    } else if (userRole === 'doctor') {
      const doctorProfile = await doctorRepository.getDoctorByUserId(user.id);
      if (doctorProfile) {
        profileId = doctorProfile.id;
        fullName = doctorProfile.full_name;
      }
    }

    // Save user to session, now including full_name
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile_id: profileId,
      full_name: fullName
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_id: profileId,
        full_name: fullName
      }
    });

  } catch (error) {
    console.error('loginController error:', error);

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

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handles POST /api/auth/logout
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const logoutController = (req,res) => {
    req.session.destroy((err) => {
        if(err){
            return res.status(500).json({
                success:false,
                message:'Logout failed'
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
 * Handles GET api/auth/me
 * Returns the currently logged in user from session
 * @param {object} req - Express request
 * @param {object} res - Express response
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
 * Handles POST /api/auth/forgot-password
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
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
        console.error('forgotPasswordController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles POST /api/auth/reset-password
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const resetPasswordController = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
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
        console.error('resetPasswordController error:', error);

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

module.exports = { registerController, verifyOtpController, resendOtpController, loginController, logoutController, getMeController, forgotPasswordController, resetPasswordController };