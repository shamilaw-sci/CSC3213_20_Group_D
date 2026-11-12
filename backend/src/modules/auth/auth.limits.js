/**
 * @file auth.limits.js
 * @module auth
 * @desc Configurable pre-controller OTP/recovery budgets using the installed
 *       express-rate-limit MemoryStore. Counts all attempts in this process;
 *       restart and multiple workers do not share or preserve these counters.
 * @author Codex Review Assistant (Stage 2B implementation; no student credit claimed)
 */
const { createHash } = require('crypto');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/** Read positive integer settings; reject invalid settings instead of disabling limits.
 * @param {Object} env Environment values (no secrets required).
 * @returns {Object} Window milliseconds and request budgets.
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

/** Build a field bucket without storing raw addresses or reset tokens in the key.
 * Email normalization affects counting only; database lookups are unchanged.
 * Missing/non-string/empty fields fall back to an IP bucket (IPv6 /56).
 * @param {string} field Body field name.
 * @returns {Function} Request-to-key function; digest is not email anonymization.
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

/** Construct six independent budgets. Email generation budgets are intentionally
 * shared across registration, resend and forgot-password. IP runs before field
 * budgets; an IP rejection does not spend the field budget. Errors fail closed.
 * @param {Object} options Optional synthetic environment/store factory for tests.
 * @returns {Object} Real middleware instances; default stores are in-process only.
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
