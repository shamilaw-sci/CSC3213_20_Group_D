/**
 * @file auth.service.js
 * @module Services
 * @desc Frontend service function for the auth module.
 * Calls the Care4U backend authentication API endpoints.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

import api from './api';

/** Send auth requests to the backend and accept the result only if it confirms success. */
const postAuth = async (path, payload) => {
  const response = await api.post(path.startsWith('/api/') ? path : `/api/auth/${path}`, payload, { timeout: 15000 });
  if (response.data?.success !== true) {
    const error = new Error('Authentication request was not acknowledged');
    error.response = response;
    throw error;
  }
  return response.data;
};

/** Show clear, safe errors to users; explain connection problems and when to retry after too many requests. */
export const authErrorMessage = (error, fallback = 'The request failed. Please try again.') => {
  const response = error?.response;
  if (!response) return 'Cannot connect to Care4U. Check your connection and try again.';
  const serverMessage = typeof response.data?.message === 'string' ? response.data.message : fallback;
  // Only the known provider-submission message is public on a 5xx response.
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

/** Authentication request — sends the screen values to its matching backend endpoint. */
export const login = (email, password) => postAuth('login', { email, password });

/** Sends this account action to the backend; the server checks the final rules. */
export const register = (email, phone, password, role, profileData) => postAuth('register', { email, phone, password, role, profileData });

/** Sends this account action to the backend; the server checks the final rules. */
export const verifyOtp = (email, otpCode) => postAuth('verify-otp', { email, otpCode });

/** Sends this account action to the backend; the server checks the final rules. */
export const resendOtp = email => postAuth('resend-otp', { email });

/** Sends this account action to the backend; the server checks the final rules. */
export const forgotPassword = email => postAuth('forgot-password', { email });

/** Sends this account action to the backend; the server checks the final rules. */
export const resetPassword = (token, newPassword) => postAuth('reset-password', { token, newPassword });

/** Sends this account action to the backend; the server checks the final rules. */
export const registerPharmacy = payload => postAuth('/api/pharmacies/register', payload);

/** Sends this account action to the backend; the server checks the final rules. */
export const registerLaboratory = payload => postAuth('/api/laboratories/register', payload);
