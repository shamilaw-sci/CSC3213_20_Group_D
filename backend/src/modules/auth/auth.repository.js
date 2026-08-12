/**
 * @file auth.repository.js
 * @module auth
 * @desc Database queries for authentication - register, login, and OTP verification.
 * @author I.M.L.S Idirisinghe (S/21/389)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new user in the users table with is_verified = true.
 * Only called from verifyOtp, after OTP verification has already
 * succeeded - so the account is verified by definition at creation.
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} passwordHash - Bcrypt hashed password
 * @param {string} role - User role: 'patient' or 'doctor'
 * @returns {Promise<object>} Created user row
 */

const createUser = async (email, phone, passwordHash, role) =>{
    const result = await pool.query (
        `INSERT INTO users (email, phone, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, email, phone, role, is_verified, is_active, created_at`,
        [email, phone, passwordHash, role]
    );
    return result.rows[0]
};

/**
 * Creates a new patient profile linked to a user.
 * @param {string} userID - UUID of the user
 * @param {string} fullName - National Identity Card number
 * @param {string} nic - National Identity Card number
 * @returns {Promise<object>} Created patiend row
 */

const createPatient = async (userId, fullName, nic) => {
  const result = await pool.query(
    `INSERT INTO patients (user_id, full_name, nic)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, full_name, nic, created_at`,
    [userId, fullName, nic]
  );
  return result.rows[0];
};

/**
 * Creates a new doctor profile linked to a user.
 * @param {string} userId - UUID of the user
 * @param {string} fullName - Doctor full name
 * @param {string} slmcRegNumber - SLMC register number
 * @param {string} specialization - Doctor specialization
 * @returns {Promise<object>} Created doctor row
 */

const createDoctor = async (userId, fullName, slmcRegNumber, specialization) => {
    const result = await pool.query(
        `INSERT INTO doctors (user_id, full_name, slmc_reg_number, specialization)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, full_name, slmc_reg_number, specialization, created_at`,
        [userId, fullName, slmcRegNumber, specialization]
    );
    return result.rows[0];
};

/**
 * Finds a user by email address.
 * @param {string} email - Email to search for
 * @returns {Promise<object|null>} User row or null
 */

const findUserByEmail = async (email) => {
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
};

/**
 * Saves a new password reset token to the database.
 * @param {string} token - The secure hex token
 * @param {string} userId - UUID of the user
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Promise<Object>} The inserted row
 */
const savePasswordResetToken = async (token, userId, expiresAt) => {
    const query = `
        INSERT INTO password_reset_tokens (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await pool.query(query, [token, userId, expiresAt]);
    return result.rows[0];
};

/**
 * Retrieves a valid, unused, unexpired password reset token.
 * @param {string} token 
 * @returns {Promise<object|null>} 
 */
const getValidPasswordResetToken = async (token) => {
    const result = await pool.query(
        `SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > CURRENT_TIMESTAMP`,
        [token]
    );
    return result.rows[0] || null;
};

/**
 * Marks a password reset token as used.
 * @param {string} token 
 */
const markTokenAsUsed = async (token) => {
    await pool.query(
        `UPDATE password_reset_tokens SET used = true WHERE token = $1`,
        [token]
    );
};

/**
 * Updates a user's password.
 * @param {string} userId 
 * @param {string} newPasswordHash 
 */
const updateUserPassword = async (userId, newPasswordHash) => {
    await pool.query(
        `UPDATE users SET password_hash = $2 WHERE id = $1`,
        [userId, newPasswordHash]
    );
};

/**
 * Creates or overwrites a pending OTP verification record for an email.
 * Used on both initial registration and OTP resend - if a pending record
 * already exists for this email, it is replaced with a fresh OTP/expiry
 * and the latest submitted registration data.
 * @param {string} email - Email being registered
 * @param {string} phone - Phone number
 * @param {string} passwordHash - Bcrypt hashed password
 * @param {string} role - 'patient' or 'doctor'
 * @param {string} otpCode - 6-digit OTP code
 * @param {Date} otpExpiresAt - OTP expiry timestamp
 * @param {object} profileData - Role-specific profile fields (fullName, nic, etc.)
 * @returns {Promise<object>} The upserted otp_verifications row
 */
const upsertOtpVerification = async (email, phone, passwordHash, role, otpCode, otpExpiresAt, profileData) => {
    const result = await pool.query(
        `INSERT INTO otp_verifications (email, phone, password_hash, role, otp_code, otp_expires_at, profile_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email)
         DO UPDATE SET
            phone = EXCLUDED.phone,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            otp_code = EXCLUDED.otp_code,
            otp_expires_at = EXCLUDED.otp_expires_at,
            profile_data = EXCLUDED.profile_data,
            updated_at = now()
         RETURNING id, email, phone, role, otp_expires_at, profile_data, created_at, updated_at`,
        [email, phone, passwordHash, role, otpCode, otpExpiresAt, profileData]
    );
    return result.rows[0];
};

/**
 * Finds a pending OTP verification record by email.
 * @param {string} email - Email to search for
 * @returns {Promise<object|null>} otp_verifications row or null
 */
const findOtpByEmail = async (email) => {
    const result = await pool.query(
        `SELECT * FROM otp_verifications WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
};

/**
 * Deletes a pending OTP verification record by email.
 * Called after successful verification to clean up the pending row.
 * @param {string} email - Email to delete the pending record for
 */
const deleteOtpByEmail = async (email) => {
    await pool.query(
        `DELETE FROM otp_verifications WHERE email = $1`,
        [email]
    );
};

module.exports = {
    createUser,
    createPatient,
    createDoctor,
    findUserByEmail,
    savePasswordResetToken,
    getValidPasswordResetToken,
    markTokenAsUsed,
    updateUserPassword,
    upsertOtpVerification,
    findOtpByEmail,
    deleteOtpByEmail
};
