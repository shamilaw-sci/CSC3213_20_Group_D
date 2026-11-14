/**
 * @file    auth.service.js
 * @module  Services
 * @desc    Frontend service functions for the Auth module (mobile).
 * Calls the Care4U backend authentication API endpoints.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import api from './api';

/**
 * FEATURE: Send authentication requests to the backend.
 * LOGIC: Wait up to 15 seconds for a response. Return only confirmed success;
 * otherwise treat the request as failed so the screen can show an error.
 */
const postAuth = async (path, payload) => {
  const response = await api.post(`/api/auth/${path}`, payload, { timeout: 15000 });
  if (response.data?.success !== true) {
    const error = new Error('Authentication request was not acknowledged');
    error.response = response;
    throw error;
  }
  return response.data;
};

/**
 * FEATURE: Show clear authentication error messages.
 * LOGIC: Explain connection failures without exposing technical errors.
 * Show helpful messages for invalid codes and links; when requests are limited,
 * include the waiting time if the backend provides one.
 */
export const authErrorMessage = (error, fallback = 'The request failed. Please try again.') => {
  const response = error?.response;
  if (!response) return 'Cannot connect to Care4U. Check your connection and try again.';
  const serverMessage = typeof response.data?.message === 'string' ? response.data.message : fallback;
  // Hide unexpected server errors; only the known email-delivery error is shown.
  if (response.status >= 500) {
    return response.status === 502 && serverMessage === 'Failed to send verification email. Please try again.'
      ? serverMessage
      : 'Care4U could not complete the request. Please try again.';
  }
  const messages = {
    'Internal server error': 'Care4U could not complete the request. Please try again.',
    'Invalid OTP': 'The code is incorrect or has been replaced. Check your email or request a new code after waiting.',
    'OTP has expired': 'This verification code has expired. Request a new code.',
    'No pending registration found for this email': 'No pending registration was found. Start registration again or sign in if you already verified.',
    'Invalid or expired password reset token': 'This reset link is invalid, expired or already used. Request a new link.',
  };
  const message = Object.prototype.hasOwnProperty.call(messages, serverMessage) ? messages[serverMessage] : serverMessage;
  if (response.status !== 429) return message;
  const headers = response.headers;
  const seconds = Number(headers?.get?.('retry-after') ?? headers?.['retry-after']);
  const retry = Number.isFinite(seconds) && seconds > 0
    ? `Try again in ${Math.ceil(seconds)} seconds.`
    : 'Wait before trying again.';
  return `${message} ${retry}`;
};

// Login — send the entered email and password for backend verification.
export const login = (email, password) => postAuth('login', { email, password });

// Register — send account details and selected role to start email verification.
export const register = (email, phone, password, role, profileData) => postAuth('register', { email, phone, password, role, profileData });

// Verify email — submit the code; staff accounts may still require approval.
export const verifyOtp = (email, otpCode) => postAuth('verify-otp', { email, otpCode });

// Resend code — request a replacement; success does not guarantee email delivery.
export const resendOtp = email => postAuth('resend-otp', { email });

// Forgot password — request a reset link without revealing registered emails.
export const forgotPassword = email => postAuth('forgot-password', { email });

// Reset password — send the reset token and new password to the backend.
export const resetPassword = (token, newPassword) => postAuth('reset-password', { token, newPassword });
