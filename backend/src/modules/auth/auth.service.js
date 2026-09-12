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
    findOtpByEmail,
    deleteOtpByEmail,
    incrementFailedLoginAttempts,
    resetFailedLoginAttempts
} = require('./auth.repository');


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
        console.error(`[OTP] Failed to email ${email}:`, emailResult.error);
        throw new Error('Failed to send OTP email');
    }

    // Optional development-only logging.
    // Controlled separately from NODE_ENV so session/cookie settings
    // are not affected just to hide OTP codes.
    if (process.env.SHOW_AUTH_CODES_IN_CONSOLE === 'true') {
        console.log(
            `\n=== OTP CODE FOR ${email} ===\n` +
            `${otpCode}\n` +
            `(Expires at ${otpExpiresAt.toISOString()})\n` +
            `=========================================\n`
        );
    }

    return { email, otpExpiresAt };
};


const resendOtp = async (email) => {
    const pending = await findOtpByEmail(email);

    if (!pending) {
        throw new Error('No pending registration found for this email');
    }

    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiry(10);

    await upsertOtpVerification(
        pending.email,
        pending.phone,
        pending.password_hash,
        pending.role,
        otpCode,
        otpExpiresAt,
        pending.profile_data
    );

    const emailResult = await sendOtpEmail(email, otpCode);

    if (!emailResult.success) {
        console.error(`[OTP] Failed to email ${email}:`, emailResult.error);
        throw new Error('Failed to send OTP email');
    }

    // Optional development-only logging
    if (process.env.SHOW_AUTH_CODES_IN_CONSOLE === 'true') {
        console.log(
            `\n=== RESENT OTP CODE FOR ${email} ===\n` +
            `${otpCode}\n` +
            `(Expires at ${otpExpiresAt.toISOString()})\n` +
            `=========================================\n`
        );
    }

    return { email, otpExpiresAt };
};


const verifyOtp = async (email, otpCode) => {
    const pending = await findOtpByEmail(email);

    if (!pending) {
        throw new Error('No pending registration found for this email');
    }

    if (pending.otp_code !== otpCode) {
        throw new Error('Invalid OTP');
    }

    if (new Date(pending.otp_expires_at) < new Date()) {
        throw new Error('OTP has expired');
    }

    const user = await createUser(
        pending.email,
        pending.phone,
        pending.password_hash,
        pending.role
    );

    let profile = null;

    if (pending.role === 'patient') {
        const qrCodeId = generatePatientQR();

        profile = await createPatient(
            user.id,
            pending.profile_data.fullName,
            pending.profile_data.nic,
            pending.profile_data.dateOfBirth,
            qrCodeId
        );

    } else if (pending.role === 'doctor') {

        profile = await createDoctor(
            user.id,
            pending.profile_data.fullName,
            pending.profile_data.slmcRegNumber,
            pending.profile_data.specialization
        );

    } else if (pending.role === 'pharmacist') {

        profile = await createPharmacy(
            user.id,
            pending.profile_data.name,
            pending.profile_data.licenseNumber,
            pending.profile_data.address,
            pending.profile_data.phone
        );

    } else if (pending.role === 'lab_technician') {

        profile = await createLaboratory(
            user.id,
            pending.profile_data.name,
            pending.profile_data.licenseNumber,
            pending.profile_data.address,
            pending.profile_data.phone
        );

    } else if (pending.role === 'hospital_staff') {

        profile = await createHospital(
            user.id,
            pending.profile_data.name,
            pending.profile_data.type,
            pending.profile_data.location,
            pending.profile_data.departments
        );
    }

    await deleteOtpByEmail(email);

    return { user, profile };
};


const login = async (email, password) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
        throw new Error('Account is deactivated. Please contact admin.');
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

    if (user.verification_status === 'pending') {
        throw new Error('Account pending admin approval');
    }

    if (user.verification_status === 'rejected') {
        throw new Error('Account registration was not approved');
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

    await resetFailedLoginAttempts(user.id);

    return user;
};


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

    const emailResult = await sendPasswordResetEmail(
        email,
        token
    );

    if (!emailResult.success) {
        console.error(
            `[PasswordReset] Failed to email ${email}:`,
            emailResult.error
        );
    }

    // Optional development-only logging
    if (process.env.SHOW_AUTH_CODES_IN_CONSOLE === 'true') {
        console.log(
            `\n=== PASSWORD RESET TOKEN FOR ${email} ===\n` +
            `${token}\n` +
            `=========================================\n`
        );
    }

    return {
        message:
            'If an account exists for this email, a password reset link has been sent.'
    };
};


const resetPassword = async (token, newPassword) => {
    const tokenRecord = await getValidPasswordResetToken(token);

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
        passwordHash
    );

    await markTokenAsUsed(token);
};


module.exports = {
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword
};