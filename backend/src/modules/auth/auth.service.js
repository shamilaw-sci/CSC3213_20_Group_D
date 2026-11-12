/**
 * @file auth.service.js
 * @module auth
 * @desc Business logic for authentication - register, login, and password reset
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const { generateOtp, getOtpExpiry } = require('../../utils/otp');
const { sendOtpEmail, sendPasswordResetEmail } = require('../../utils/email');
const { generatePatientQR } = require('../../utils/qr');

const {
    withTransaction,
    createUser,
    createPatient,
    createDoctor,
    createPharmacy,
    createLaboratory,
    createHospital,
    findUserByEmail,
    savePasswordResetToken,
    getValidPasswordResetToken,
    markTokenAsUsed,
    updateUserPassword,
    upsertOtpVerification,
    replacePendingOtp,
    findOtpByEmail,
    deleteOtpByEmail,
    incrementFailedLoginAttempts,
    resetFailedLoginAttempts
} = require('./auth.repository');


/**
 * Hash a registration password, replace the pending record and email its code.
 * Account/profile creation happens only in verifyOtp; email failure leaves a
 * pending record so the user can request another code. Never log the code.
 * @param {string} email - Exact email lookup key (no case normalization here).
 * @param {string} phone - Registration contact value.
 * @param {string} password - Plain password validated by the HTTP controller.
 * @param {string} role - One of the five public registration roles.
 * @param {Object} profileData - Role-specific fields consumed after verification.
 * @returns {Promise<Object>} Email and expiry; rejects on duplicate/provider/DB failure.
 */
const register = async (email, phone, password, role, profileData) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiry(10);

    await upsertOtpVerification(
        email,
        phone,
        passwordHash,
        role,
        otpCode,
        otpExpiresAt,
        profileData
    );

    const emailResult = await sendOtpEmail(email, otpCode);

    if (!emailResult.success) {
        console.error('[OTP] Registration verification email delivery failed.');
        throw new Error('Failed to send OTP email');
    }

    return { email, otpExpiresAt };
};


/**
 * Replace the code/expiry for an existing pending registration and send email.
 * Update only the observed row's code/expiry; never restore stale registration
 * fields or recreate a row consumed by verification. Only the stored code is
 * valid: concurrent delivery may finish out of order. Provider failure leaves
 * the replacement stored. Email submission happens after the atomic write.
 * @param {string} email - Pending registration's exact email key.
 * @returns {Promise<Object>} Email and new expiry, or rejects if missing/send fails.
 */
const resendOtp = async (email) => {
    const pending = await findOtpByEmail(email);

    if (!pending) {
        throw new Error('No pending registration found for this email');
    }

    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiry(10);

    const updated = await replacePendingOtp(pending.id, pending.email, otpCode, otpExpiresAt);
    if (!updated) {
        throw new Error('No pending registration found for this email');
    }

    try {
        const emailResult = await sendOtpEmail(email, otpCode);
        if (!emailResult.success) throw new Error('Provider rejected submission');
    } catch {
        console.error('[OTP] Resent verification email delivery failed.');
        throw new Error('Failed to send OTP email');
    }

    return { email, otpExpiresAt };
};


/**
 * Lock and validate a pending code, create its user/profile and delete it using
 * one transaction client. Exact expiry and invalid expiry fail closed. The
 * requested SQL locking/rollback still requires disposable PostgreSQL testing.
 * @param {string} email - Pending registration key.
 * @param {string} otpCode - Six digits, validated at the HTTP boundary.
 * @returns {Promise<Object>} Created user/profile, with professional approval pending.
 */
const verifyOtp = async (email, otpCode) => {
    const result = await withTransaction(async (db) => {
        const pending = await findOtpByEmail(email, db);

        if (!pending) {
            throw new Error('No pending registration found for this email');
        }

        if (pending.otp_code !== otpCode) {
            throw new Error('Invalid OTP');
        }

        const expiresAt = new Date(pending.otp_expires_at).getTime();
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
            throw new Error('OTP has expired');
        }

        const user = await createUser(
            pending.email,
            pending.phone,
            pending.password_hash,
            pending.role,
            db
        );

        let profile = null;

        if (pending.role === 'patient') {
            const qrCodeId = generatePatientQR();

            profile = await createPatient(
                user.id,
                pending.profile_data.fullName,
                pending.profile_data.nic,
                pending.profile_data.dateOfBirth,
                qrCodeId,
                db
            );

        } else if (pending.role === 'doctor') {

            profile = await createDoctor(
                user.id,
                pending.profile_data.fullName,
                pending.profile_data.slmcRegNumber,
                pending.profile_data.specialization,
                db
            );

        } else if (pending.role === 'pharmacist') {

            profile = await createPharmacy(
                user.id,
                pending.profile_data.name,
                pending.profile_data.licenseNumber,
                pending.profile_data.address,
                pending.profile_data.phone,
                db
            );

        } else if (pending.role === 'lab_technician') {

            profile = await createLaboratory(
                user.id,
                pending.profile_data.name,
                pending.profile_data.licenseNumber,
                pending.profile_data.address,
                pending.profile_data.phone,
                db
            );

        } else if (pending.role === 'hospital_staff') {

            profile = await createHospital(
                user.id,
                pending.profile_data.name,
                pending.profile_data.type,
                pending.profile_data.location,
                pending.profile_data.departments,
                db
            );
        }

        await deleteOtpByEmail(
            email,
            db
        );

        return {
            user,
            profile
        };
    });

    return result;
};


/**
 * Validate credentials with persisted account lockout and approval restrictions.
 * Locked accounts are rejected before hashing; otherwise account-state details
 * are returned only after a correct password. This function does not create a
 * session: the controller resolves the profile and rotates/saves the session.
 * @param {string} email - Exact email key.
 * @param {string} password - Plain password to compare with the stored hash.
 * @returns {Promise<Object>} User row; failed passwords increment the stored count.
 */
const login = async (email, password) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (
        user.locked_until &&
        new Date(user.locked_until) > new Date()
    ) {
        const minutesRemaining = Math.ceil(
            (new Date(user.locked_until) - new Date()) / 60000
        );

        throw new Error(
            `Too many failed attempts. Try again in ${minutesRemaining} ` +
            `minute${minutesRemaining === 1 ? '' : 's'}.`
        );
    }

    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isMatch) {
        await incrementFailedLoginAttempts(
            user.id,
            MAX_FAILED_LOGIN_ATTEMPTS,
            LOCKOUT_MINUTES
        );

        throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
        throw new Error('Account is deactivated. Please contact admin.');
    }
    if (user.verification_status === 'rejected') {
        throw new Error('Account registration was not approved');
    }
    if (user.role !== 'patient' && user.verification_status !== 'approved') {
        throw new Error('Account pending admin approval');
    }

    await resetFailedLoginAttempts(user.id);

    return user;
};


/**
 * Store a random, one-hour reset token and attempt email for an existing user.
 * Unknown accounts and transport failures use the same public response. DB
 * failures still propagate. Tokens are currently stored raw (documented risk).
 * @param {string} email - Exact account email key.
 * @returns {Promise<Object>} Generic response; not proof of provider delivery.
 */
const forgotPassword = async (email) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return {
            message:
                'If an account exists for this email, a password reset link has been sent.'
        };
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await savePasswordResetToken(
        token,
        user.id,
        expiresAt
    );

    try {
        const emailResult = await sendPasswordResetEmail(email, token);
        if (!emailResult.success) {
            console.error('[PasswordReset] Reset email delivery failed.');
        }
    } catch {
        console.error('[PasswordReset] Reset email delivery failed.');
    }

    return {
        message:
            'If an account exists for this email, a password reset link has been sent.'
    };
};


/**
 * Lock an unused/unexpired token and update password/consume token on one client.
 * A write/consumption failure rejects and asks withTransaction to roll back.
 * Other sessions, other reset tokens and login lockout are not changed here.
 * @param {string} token - Raw 64-character lowercase hex reset token.
 * @param {string} newPassword - Controller-validated plain password (8+ characters).
 * @returns {Promise<void>} Resolves after transaction commit is acknowledged.
 */
const resetPassword = async (token, newPassword) => {
    await withTransaction(async (db) => {
        const tokenRecord = await getValidPasswordResetToken(token, db);

        if (!tokenRecord) {
            throw new Error(
                'Invalid or expired password reset token'
            );
        }

        const passwordHash = await bcrypt.hash(
            newPassword,
            12
        );

        await updateUserPassword(
            tokenRecord.user_id,
            passwordHash,
            db
        );

        const consumed = await markTokenAsUsed(token, db);
        if (!consumed) {
            throw new Error('Invalid or expired password reset token');
        }
    });
};


module.exports = {
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword
};
