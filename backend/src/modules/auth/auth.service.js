/**
 * @file auth.service.js
 * @module auth
 * @desc Business logic for authentication - register, login, and password reset
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateOtp, getOtpExpiry } = require('../../utils/otp');
const {
    findUserByEmail,
    savePasswordResetToken, getValidPasswordResetToken,
    markTokenAsUsed, updateUserPassword,
    upsertOtpVerification
} = require('./auth.repository');

/**
 * Starts registration for a new patient or doctor. Does NOT create the
 * users row yet - stores a pending record with a 6-digit OTP instead.
 * The users row is only created once the OTP is verified.
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} password - Plain text password
 * @param {string} role - 'patient' or 'doctor'
 * @param {Object} profileData - Extra data depending on role
 * @returns {Promise<Object>} Email and OTP expiry timestamp
 */
const register = async (email, phone, password, role, profileData) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiry(10);

    await upsertOtpVerification(email, phone, passwordHash, role, otpCode, otpExpiresAt, profileData);

    // TODO(sms): Integrate real SMS/email OTP delivery here. Academic
    // project - OTP is logged to console instead of being sent for real.
    console.log(`\n=== OTP CODE FOR ${email} ===\n${otpCode}\n(Expires at ${otpExpiresAt.toISOString()})\n=========================================\n`);

    return { email, otpExpiresAt };
};

/**
 * Logs in a user by verifying email and password.
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} User object if login successful
 */
const login = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
        throw new Error('Account is deactivated. Please contact admin.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    return user;
};

/**
 * Initiates the password reset flow by generating a secure token.
 * @param {string} email - User email
 * @returns {Promise<object>} Status object
 */
const forgotPassword = async (email) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return { message: 'If an account exists for this email, a password reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await savePasswordResetToken(token, user.id, expiresAt);

    // TODO(email): Integrate Resend email service here.
    console.log(`\n=== PASSWORD RESET TOKEN FOR ${email} ===\n${token}\n=========================================\n`);

    return { message: 'If an account exists for this email, a password reset link has been sent.' };
};

/**
 * Resets a user's password using a valid token.
 * @param {string} token - The password reset token
 * @param {string} newPassword - The new plain text password
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
    const tokenRecord = await getValidPasswordResetToken(token);

    if (!tokenRecord) {
        throw new Error('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await updateUserPassword(tokenRecord.user_id, passwordHash);
    await markTokenAsUsed(token);
};

module.exports = { register, login, forgotPassword, resetPassword };