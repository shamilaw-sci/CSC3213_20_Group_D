/**
 * @file auth.service.js
 * @module Services
 * @desc Frontend service function for the auth module.
 * Calls the Care4U backend authentication API endpoints.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

import api from './api';

/** Send one auth request with a bounded wait and require an acknowledged envelope.
 * @param {string} path Known local API path or auth endpoint suffix (fixed by the wrappers).
 * @param {Object} payload Validated screen values; never logged or persisted here.
 * @returns {Promise<Object>} Success envelope; transport and negative envelopes reject.
 */
const postAuth = async (path, payload) => {
  const response = await api.post(path.startsWith('/api/') ? path : `/api/auth/${path}`, payload, { timeout: 15000 });
  if (response.data?.success !== true) {
    const error = new Error('Authentication request was not acknowledged');
    error.response = response;
    throw error;
  }
  return response.data;
};

/** Convert expected API errors into UI copy; never expose raw transport exceptions.
 * @param {Object} error Axios error or rejected response envelope.
 * @param {string} fallback Context-specific failure wording.
 * @returns {string} Public server message with Retry-After guidance, or network help.
 */
export const authErrorMessage = (error, fallback = 'The request failed. Please try again.') => {
  const response = error?.response;
  if (!response) return 'Cannot connect to Care4U. Check your connection and try again.';
  const serverMessage = typeof response.data?.message === 'string' ? response.data.message : fallback;
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

/** @param {string} email Exact address after UI trimming. @param {string} password Unchanged password.
 * @returns {Promise<Object>} Public session identity after server acknowledgement; cookie persistence is separate.
 */
export const login = (email, password) => postAuth('login', { email, password });

/** @param {string} email Address. @param {string} phone Contact. @param {string} password Unchanged password.
 * @param {string} role Supported public role. @param {Object} profileData Role-specific fields.
 * @returns {Promise<Object>} Pending email/expiry; registration alone does not authenticate.
 */
export const register = (email, phone, password, role, profileData) => postAuth('register', { email, phone, password, role, profileData });

/** @param {string} email Pending address. @param {string} otpCode Six digits.
 * @returns {Promise<Object>} User/profile and approvalPending; pending professionals have no authenticated session.
 */
export const verifyOtp = (email, otpCode) => postAuth('verify-otp', { email, otpCode });

/** @param {string} email Pending address.
 * @returns {Promise<Object>} Replacement expiry after submission acknowledgement, not confirmed inbox delivery.
 * Failed submission may still leave a replacement stored; concurrent emails may be superseded.
 */
export const resendOtp = email => postAuth('resend-otp', { email });

/** @param {string} email Recovery address.
 * @returns {Promise<Object>} Generic acknowledgement for known/unknown addresses; no delivery guarantee.
 */
export const forgotPassword = email => postAuth('forgot-password', { email });

/** @param {string} token Valid reset bearer token. @param {string} newPassword Unchanged new password.
 * @returns {Promise<Object>} Acknowledged password update; sessions/other links retain existing policy.
 */
export const resetPassword = (token, newPassword) => postAuth('reset-password', { token, newPassword });

/** @param {Object} payload Pharmacy account/facility fields; no OTP step in this existing application contract.
 * @returns {Promise<Object>} Acknowledged pending-approval application; no signed-in session is claimed.
 */
export const registerPharmacy = payload => postAuth('/api/pharmacies/register', payload);

/** @param {Object} payload Laboratory account/facility fields and available_tests.
 * @returns {Promise<Object>} Acknowledged pending-approval application; preserves the separate existing enrollment workflow.
 */
export const registerLaboratory = payload => postAuth('/api/laboratories/register', payload);
