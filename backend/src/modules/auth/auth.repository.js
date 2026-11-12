/**
 * @file auth.repository.js
 * @module auth
 * @desc Database queries for authentication - register, login, and OTP verification.
 * @author I.M.L.S Idirisinghe (S/21/389)
 */

const { pool } = require('../../config/db');

/**
 * Executes a database operation inside a PostgreSQL transaction.
 *
 * @param {Function} callback - Database work to execute using the transaction client
 * @returns {Promise<*>} Result returned by the callback
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
 * Creates a new user in the users table with is_verified = true.
 * Only called from verifyOtp, after OTP verification has already
 * succeeded - so the email/OTP is verified at account creation.
 *
 * Patients are approved immediately after OTP verification.
 * Doctors, pharmacists, lab technicians, and hospital staff require
 * admin approval before they can fully use their account.
 *
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} passwordHash - Bcrypt hashed password
 * @param {string} role - User role
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created user row
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

/**
 * Creates a new patient profile linked to a user.
 * @param {string} userId - UUID of the user
 * @param {string} fullName - Patient full name
 * @param {string} nic - National Identity Card number
 * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
 * @param {string} qrCodeId - Unique QR code identifier
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created patient row
 */
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

/**
 * Creates a new doctor profile linked to a user.
 * Newly registered doctors are not profile-verified until an admin
 * approves their registration.
 *
 * @param {string} userId - UUID of the user
 * @param {string} fullName - Doctor full name
 * @param {string} slmcRegNumber - SLMC register number
 * @param {string} specialization - Doctor specialization
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created doctor row
 */
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

/**
 * Creates a new pharmacy profile linked to a user (pharmacist role).
 * @param {string} userId - UUID of the user
 * @param {string} name - Pharmacy name
 * @param {string} licenseNumber - Pharmacy license number
 * @param {string} address - Pharmacy address
 * @param {string} phone - Pharmacy contact phone
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created pharmacy row
 */
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

/**
 * Creates a new laboratory profile linked to a user (lab_technician role).
 * @param {string} userId - UUID of the user
 * @param {string} name - Laboratory name
 * @param {string} licenseNumber - License number
 * @param {string} address - Address
 * @param {string} phone - Contact phone
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created laboratory row
 */
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

/**
 * Creates a new hospital profile linked to a user (hospital_staff role).
 * @param {string} userId - UUID of the user
 * @param {string} name - Hospital name
 * @param {string} type - Hospital type
 * @param {string} location - Location/Address
 * @param {string} departments - Departments JSON/Text
 * @param {Object} db - PostgreSQL pool or transaction client
 * @returns {Promise<object>} Created hospital row
 */
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
 * Finds a user by email address.
 * @param {string} email - Email to search for
 * @returns {Promise<object|null>} User row or null
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
 * Saves a new password reset token to the database.
 * @param {string} token - The secure hex token
 * @param {string} userId - UUID of the user
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Promise<Object>} The inserted row
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
 * Retrieves a valid, unused, unexpired password reset token.
 * @param {string} token
 * @returns {Promise<object|null>}
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
 * Marks a password reset token as used.
 * @param {string} token
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
 * Updates a user's password.
 * @param {string} userId
 * @param {string} newPasswordHash
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
 * Creates or overwrites a pending OTP verification record for an email.
 * @param {string} email - Email being registered
 * @param {string} phone - Phone number
 * @param {string} passwordHash - Bcrypt hashed password
 * @param {string} role - User role
 * @param {string} otpCode - 6-digit OTP code
 * @param {Date} otpExpiresAt - OTP expiry timestamp
 * @param {object} profileData - Role-specific profile fields
 * @returns {Promise<object>} The upserted otp_verifications row
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
 * Finds a pending OTP verification record by email.
 * @param {string} email - Email to search for
 * @returns {Promise<object|null>} otp_verifications row or null
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
 * Deletes a pending OTP verification record by email.
 * @param {string} email - Email to delete the pending record for
 * @param {Object} db - PostgreSQL pool or transaction client
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
 * Increments a user's failed login attempt count.
 * @param {string} userId - UUID of the user
 * @param {number} maxAttempts - Number of failures before locking
 * @param {number} cooldownMinutes - Lockout duration in minutes
 * @returns {Promise<object>} Updated row (failed_login_attempts, locked_until)
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
 * Resets a user's failed login attempt count and clears any lockout.
 * @param {string} userId - UUID of the user
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
    findOtpByEmail,
    deleteOtpByEmail,
    incrementFailedLoginAttempts,
    resetFailedLoginAttempts
};
