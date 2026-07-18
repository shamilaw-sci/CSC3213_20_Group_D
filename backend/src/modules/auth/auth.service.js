/**
 * @file auth.service.js
 * @module auth
 * @desc Business logic for authentication - register, login, and password reset
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
    createUser, createPatient, createDoctor, findUserByEmail,
    savePasswordResetToken, getValidPasswordResetToken,
    markTokenAsUsed, updateUserPassword
} = require('./auth.repository');

/**
 * Registers a new patient or doctor.
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} password - Plain text password
 * @param {string} role - 'patient' or 'doctor'
 * @param {Object} profileData - Extra data depending on role
 * @returns {Promise<Object>} Created user and profile
 */
const register = async (email, phone, password, role, profileData) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(email, phone, passwordHash, role);

    let profile = null;
    if (role === 'patient') {
        profile = await createPatient(user.id, profileData.fullName, profileData.nic);
    } else if (role === 'doctor') {
        profile = await createDoctor(user.id, profileData.fullName, profileData.slmcRegNumber, profileData.specialization);
    }

    return { user, profile };
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