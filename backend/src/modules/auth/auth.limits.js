/**
 * @file    auth.limits.js
 * @module  Authentication
 * @desc    Limits repeated verification and password recovery requests.
 */
const { createHash } = require('crypto');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * FEATURE: Set safe authentication request limits.
 * LOGIC: Use configured positive limits or defaults; reject invalid settings instead of turning limits off.
 */
function readLimitConfig(env) {
  const defaults = {
    AUTH_RATE_WINDOW_MS: 900000,
    AUTH_EMAIL_IP_LIMIT: 20,
    AUTH_EMAIL_ADDRESS_LIMIT: 5,
    AUTH_VERIFY_IP_LIMIT: 30,
    AUTH_VERIFY_EMAIL_LIMIT: 10,
    AUTH_RESET_IP_LIMIT: 30,
    AUTH_RESET_TOKEN_LIMIT: 5,
  };
  return Object.fromEntries(Object.entries(defaults).map(([name, fallback]) => {
    const value = env[name] === undefined ? fallback : Number(env[name]);
    if (!Number.isSafeInteger(value) || value <= 0 ||
        (name === 'AUTH_RATE_WINDOW_MS' && value > 2147483647)) {
      throw new Error(`${name} must be a positive integer${name === 'AUTH_RATE_WINDOW_MS' ? ' at most 2147483647' : ''}`);
    }
    return [name, value];
  }));
}

/**
 * FEATURE: Count repeated requests for the same email or reset token.
 * LOGIC: Use a one-way digest for the counting key; missing values count against the sender IP.
 */
function fieldKey(field) {
  return req => {
    const raw = req.body?.[field];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) return `missing:${ipKeyGenerator(req.ip)}`;
    const counted = field === 'email' ? value.toLowerCase() : value;
    return createHash('sha256').update(`${field}:${counted}`).digest('hex');
  };
}

/**
 * FEATURE: Slow down repeated verification and recovery requests.
 * LOGIC: Apply separate IP and email/token limits; registration, resend and password recovery share email limits.
 */
function createAuthLimiters({ env = process.env, storeFactory } = {}) {
  const config = readLimitConfig(env);
  const make = (name, maximum, keyGenerator) => rateLimit({
    windowMs: config.AUTH_RATE_WINDOW_MS,
    limit: config[maximum],
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: false,
    message: { success: false, message: 'Too many authentication requests. Please try again later.' },
    ...(keyGenerator ? { keyGenerator } : {}),
    ...(storeFactory ? { store: storeFactory(name) } : {}),
  });
  return {
    emailIp: make('emailIp', 'AUTH_EMAIL_IP_LIMIT'),
    emailAddress: make('emailAddress', 'AUTH_EMAIL_ADDRESS_LIMIT', fieldKey('email')),
    verifyIp: make('verifyIp', 'AUTH_VERIFY_IP_LIMIT'),
    verifyEmail: make('verifyEmail', 'AUTH_VERIFY_EMAIL_LIMIT', fieldKey('email')),
    resetIp: make('resetIp', 'AUTH_RESET_IP_LIMIT'),
    resetToken: make('resetToken', 'AUTH_RESET_TOKEN_LIMIT', fieldKey('token')),
  };
}

module.exports = { readLimitConfig, createAuthLimiters };
