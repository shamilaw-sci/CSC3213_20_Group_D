/**
 * @file    auth.service.js
 * @module  Authentication
 * @desc    Handles registration, verification, login protection and password recovery rules.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
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
 * FEATURE: Register with email verification.
 * LOGIC: Reject an existing email, hash the password, save a pending registration and email a code valid for 10 minutes.
 */
const register = async (email, phone, password, role, profileData) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash the password before it enters the pending registration record.
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
 * FEATURE: Replace an unused verification code.
 * LOGIC: Only update an existing pending registration; the newest stored code is the one that works.
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
 * FEATURE: Create the account only after a valid code.
 * LOGIC: Check code and expiry, then create user + role profile and remove the code in one database transaction.
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

        // Create the account and matching role profile in the same transaction; no partial registration on failure.
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
 * FEATURE: Check credentials and prevent repeated guessing.
 * LOGIC: After five wrong passwords, lock the account for 15 minutes; require active status and staff approval.
 */
const login = async (email, password) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check the lockout end time before comparing another password.
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
    // Professional accounts cannot sign in before administrator approval.
    if (user.role !== 'patient' && user.verification_status !== 'approved') {
        throw new Error('Account pending admin approval');
    }

    await resetFailedLoginAttempts(user.id);

    return user;
};


/**
 * FEATURE: Send a password reset link without revealing accounts.
 * LOGIC: If the email exists, save a random token that expires in one hour; return the same message for unknown emails.
 */
const forgotPassword = async (email) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return {
            message:
                'If an account exists for this email, a password reset link has been sent.'
        };
    }

    // Use an unpredictable reset token and expire it after one hour.
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
 * FEATURE: Change a password only once per valid reset link.
 * LOGIC: Lock and check the unused token, update the hashed password and mark the token used in one transaction.
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

        // Mark the reset token used in the same transaction as the password change.
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
