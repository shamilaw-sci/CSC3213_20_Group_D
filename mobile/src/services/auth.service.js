/**
 * @file    auth.service.js
 * @module  Services
 * @desc    Frontend service functions for the Auth module (mobile).
 * Calls the Care4U backend authentication API endpoints.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import api from './api';

/**
 * Requests a password reset token for the given email.
 * Backend always returns a generic success message, whether or not
 * the email exists, to prevent email enumeration.
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} The response data ({ success, message })
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

/**
 * Registers a new patient or doctor. Does NOT log the user in - backend
 * generates an OTP and stores it pending verification. Navigate to
 * OtpVerificationScreen after this succeeds.
 * @param {string} email       - User email
 * @param {string} phone       - User phone number
 * @param {string} password    - Plain text password
 * @param {string} role        - 'patient' or 'doctor'
 * @param {Object} profileData - Role-specific fields (fullName, nic, slmcRegNumber, specialization)
 * @returns {Promise<Object>} The response data ({ success, message, data: { email, otpExpiresAt } })
 */
export const register = async (email, phone, password, role, profileData) => {
  const response = await api.post('/api/auth/register', { email, phone, password, role, profileData });
  return response.data;
};

/**
 * Verifies the OTP for a pending registration. On success, the backend
 * creates the account. Patients receive a saved session; professionals get
 * approvalPending and must await admin approval. Native cookie persistence
 * depends on the runtime and is not established by withCredentials alone.
 * @param {string} email   - Email being verified
 * @param {string} otpCode - 6-digit OTP entered by the user
 * @returns {Promise<Object>} The response data ({ success, message, data: { user, profile, approvalPending } })
 */
export const verifyOtp = async (email, otpCode) => {
  const response = await api.post('/api/auth/verify-otp', { email, otpCode });
  return response.data;
};

/**
 * Requests a fresh OTP for an existing pending registration.
 * @param {string} email - Email with a pending registration
 * @returns {Promise<Object>} The response data ({ success, message, data: { email, otpExpiresAt } })
 */
export const resendOtp = async (email) => {
  const response = await api.post('/api/auth/resend-otp', { email });
  return response.data;
};

/**
 * Resets a user's password using a valid reset token.
 * @param {string} token       - The password reset token
 * @param {string} newPassword - The new plain text password
 * @returns {Promise<Object>} The response data ({ success, message })
 */
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/api/auth/reset-password', { token, newPassword });
  return response.data;
};
