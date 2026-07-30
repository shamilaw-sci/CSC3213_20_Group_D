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
 * Resets a user's password using a valid reset token.
 * @param {string} token       - The password reset token
 * @param {string} newPassword - The new plain text password
 * @returns {Promise<Object>} The response data ({ success, message })
 */
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/api/auth/reset-password', { token, newPassword });
  return response.data;
};