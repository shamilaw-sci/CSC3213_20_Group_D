/**
 * @file    auth.repository.js
 * @module  Authentication
 * @desc    Runs database queries for users, profiles, verification codes and password resets.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

const { pool } = require('../../config/db');

/**
 * FEATURE: Keep related account changes together.
 * LOGIC: Start a database transaction → save everything if successful; undo all changes if any step fails.
 */
const withTransaction = async (callback) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
};

/**
 * FEATURE: Apply the correct approval rule for new users.
 * LOGIC: Patients are approved after email verification; staff accounts start as pending until admin approval.
 */
const createUser = async (
    email,
    phone,
    passwordHash,
    role,
    db = pool
) => {
    const requiresApproval = [
        'doctor',
        'pharmacist',
        'lab_technician',
        'hospital_staff'
    ].includes(role);

    const verificationStatus =
        requiresApproval ? 'pending' : 'approved';

    const result = await db.query(
        `INSERT INTO users
            (
                email,
                phone,
                password_hash,
                role,
                is_verified,
                verification_status
            )
         VALUES
            ($1, $2, $3, $4, true, $5)
         RETURNING
            id,
            email,
            phone,
            role,
            is_verified,
            is_active,
            verification_status,
            created_at`,
        [
            email,
            phone,
            passwordHash,
            role,
            verificationStatus
        ]
    );

    return result.rows[0];
};


const createPatient = async (
    userId,
    fullName,
    nic,
    dateOfBirth,
    qrCodeId,
    db = pool
) => {
    const result = await db.query(
        `INSERT INTO patients
            (
                user_id,
                full_name,
                nic,
                date_of_birth,
                qr_code_id
            )
         VALUES
            ($1, $2, $3, $4, $5)
         RETURNING
            id,
            user_id,
            full_name,
            nic,
            date_of_birth,
            qr_code_id,
            created_at`,
        [
            userId,
            fullName,
            nic,
            dateOfBirth,
            qrCodeId
        ]
    );

    return result.rows[0];
};


const createDoctor = async (
    userId,
    fullName,
    slmcRegNumber,
    specialization,
    db = pool
) => {
    const result = await db.query(
        `INSERT INTO doctors
            (
                user_id,
                full_name,
                slmc_reg_number,
                specialization,
                is_verified
            )
         VALUES
            ($1, $2, $3, $4, false)
         RETURNING
            id,
            user_id,
            full_name,
            slmc_reg_number,
            specialization,
            is_verified,
            created_at`,
        [
            userId,
            fullName,
            slmcRegNumber,
            specialization
        ]
    );

    return result.rows[0];
};


const createPharmacy = async (
    userId,
    name,
    licenseNumber,
    address,
    phone,
    db = pool
) => {
    const result = await db.query(
        `INSERT INTO pharmacies
            (
                user_id,
                name,
                license_number,
                address,
                phone,
                is_verified,
                is_active
            )
         VALUES
            ($1, $2, $3, $4, $5, false, true)
         RETURNING
            id,
            user_id,
            name,
            license_number,
            address,
            phone,
            is_verified,
            is_active,
            created_at`,
        [
            userId,
            name,
            licenseNumber,
            address,
            phone
        ]
    );

    return result.rows[0];
};


const createLaboratory = async (
    userId,
    name,
    licenseNumber,
    address,
    phone,
    db = pool
) => {
    const result = await db.query(
        `INSERT INTO laboratories
            (
                user_id,
                name,
                license_number,
                address,
                phone,
                is_verified,
                is_active
            )
         VALUES
            ($1, $2, $3, $4, $5, false, true)
         RETURNING
            id,
            user_id,
            name,
            license_number,
            address,
            phone,
            is_verified,
            is_active,
            created_at`,
        [
            userId,
            name,
            licenseNumber,
            address,
            phone
        ]
    );

    return result.rows[0];
};


const createHospital = async (
    userId,
    name,
    type,
    location,
    departments,
    db = pool
) => {
    const result = await db.query(
        `INSERT INTO hospitals
            (
                user_id,
                name,
                type,
                location,
                departments,
                is_verified,
                is_active
            )
         VALUES
            ($1, $2, $3, $4, $5, false, true)
         RETURNING
            id,
            user_id,
            name,
            type,
            location,
            departments,
            is_verified,
            is_active,
            created_at`,
        [
            userId,
            name,
            type,
            location,
            departments
        ]
    );

    return result.rows[0];
};

/**
 * FEATURE: Find an existing account by email.
 * LOGIC: Look up the user before registration, login or password recovery.
 */
const findUserByEmail = async (email) => {
    const result = await pool.query(
        `SELECT *
         FROM users
         WHERE email = $1`,
        [email]
    );

    return result.rows[0] || null;
};

/**
 * FEATURE: Store a password reset request.
 * LOGIC: Save a newly generated token with its account and expiry time.
 */
const savePasswordResetToken = async (
    token,
    userId,
    expiresAt
) => {
    const query = `
        INSERT INTO password_reset_tokens
            (token, user_id, expires_at)
        VALUES
            ($1, $2, $3)
        RETURNING *;
    `;

    const result = await pool.query(
        query,
        [
            token,
            userId,
            expiresAt
        ]
    );

    return result.rows[0];
};

/**
 * FEATURE: Check a reset link before changing the password.
 * LOGIC: Find an unused token that has not expired; lock its row while the password is being changed.
 */
const getValidPasswordResetToken = async (token, db = pool) => {
    const result = await db.query(
        `SELECT *
         FROM password_reset_tokens
         WHERE token = $1
           AND used = false
           AND expires_at > CURRENT_TIMESTAMP
         FOR UPDATE`,
        [token]
    );

    return result.rows[0] || null;
};

/**
 * FEATURE: Prevent a reset link from being used again.
 * LOGIC: Mark the token used only if it is still unused and not expired.
 */
const markTokenAsUsed = async (token, db = pool) => {
    const result = await db.query(
        `UPDATE password_reset_tokens
         SET used = true
         WHERE token = $1 AND used = false
           AND expires_at > CURRENT_TIMESTAMP
         RETURNING token`,
        [token]
    );
    return result.rows[0] || null;
};

/**
 * FEATURE: Save the new password securely.
 * LOGIC: Update the stored password hash rather than a plain-text password.
 */
const updateUserPassword = async (
    userId,
    newPasswordHash,
    db = pool
) => {
    await db.query(
        `UPDATE users
         SET password_hash = $2
         WHERE id = $1`,
        [
            userId,
            newPasswordHash
        ]
    );
};

/**
 * FEATURE: Keep one pending verification record per email.
 * LOGIC: Save a new pending registration or replace the previous pending details for that email.
 */
const upsertOtpVerification = async (
    email,
    phone,
    passwordHash,
    role,
    otpCode,
    otpExpiresAt,
    profileData
) => {
    const result = await pool.query(
        `INSERT INTO otp_verifications
            (
                email,
                phone,
                password_hash,
                role,
                otp_code,
                otp_expires_at,
                profile_data
            )
         VALUES
            ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email)
         DO UPDATE SET
            phone = EXCLUDED.phone,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            otp_code = EXCLUDED.otp_code,
            otp_expires_at = EXCLUDED.otp_expires_at,
            profile_data = EXCLUDED.profile_data,
            updated_at = now()
         RETURNING
            id,
            email,
            phone,
            role,
            otp_expires_at,
            profile_data,
            created_at,
            updated_at`,
        [
            email,
            phone,
            passwordHash,
            role,
            otpCode,
            otpExpiresAt,
            profileData
        ]
    );

    return result.rows[0];
};

/**
 * FEATURE: Replace only the code for the same pending registration.
 * LOGIC: Update the matching pending record; do not accidentally recreate a registration already verified.
 */
const replacePendingOtp = async (pendingId, email, otpCode, otpExpiresAt) => {
    const result = await pool.query(
        `UPDATE otp_verifications
         SET otp_code = $3, otp_expires_at = $4, updated_at = NOW()
         WHERE id = $1 AND email = $2
         RETURNING id, email, otp_expires_at`,
        [pendingId, email, otpCode, otpExpiresAt]
    );
    return result.rows[0] || null;
};

/**
 * FEATURE: Check the pending verification code.
 * LOGIC: During verification, lock the record until the account is created or the operation fails.
 */
const findOtpByEmail = async (email, db = pool) => {
    const result = await db.query(
        `SELECT *
         FROM otp_verifications
         WHERE email = $1
         ${db === pool ? '' : 'FOR UPDATE'}`,
        [email]
    );

    return result.rows[0] || null;
};

/**
 * FEATURE: Finish verification.
 * LOGIC: Remove the pending code as part of the same account-creation transaction.
 */
const deleteOtpByEmail = async (
    email,
    db = pool
) => {
    await db.query(
        `DELETE FROM otp_verifications
         WHERE email = $1`,
        [email]
    );
};

/**
 * FEATURE: Lock an account after repeated wrong passwords.
 * LOGIC: Count failed attempts in the database; once the limit is reached, set the lock end time.
 */
const incrementFailedLoginAttempts = async (
    userId,
    maxAttempts,
    cooldownMinutes
) => {
    const result = await pool.query(
        `UPDATE users
         SET failed_login_attempts =
                failed_login_attempts + 1,

             locked_until =
                CASE
                    WHEN failed_login_attempts + 1 >= $2
                    THEN CURRENT_TIMESTAMP +
                         ($3 || ' minutes')::interval
                    ELSE locked_until
                END

         WHERE id = $1

         RETURNING
            failed_login_attempts,
            locked_until`,
        [
            userId,
            maxAttempts,
            cooldownMinutes
        ]
    );

    return result.rows[0];
};

/**
 * FEATURE: Clear login failures after a successful login.
 * LOGIC: Reset the failed-attempt counter and remove the lock time.
 */
const resetFailedLoginAttempts = async (userId) => {
    await pool.query(
        `UPDATE users
         SET failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $1`,
        [userId]
    );
};

module.exports = {
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
};
