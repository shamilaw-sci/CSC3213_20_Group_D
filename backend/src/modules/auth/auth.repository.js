/**
 * @file auth.repository.js
 * @module auth
 * @desc Database queries for authentication - register and login.
 * @author I.M.L.S Idirisinghe (S/21/389)
 */

const { pool } = require('../../config/db');

/**
 * Creates a new user in the users table.
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} passwordHash - Bcrypt hashed password
 * @param {string} role - User role: 'patient' or 'doctor'
 * @returns {Promise<object>} Created user row
 */

const createUser = async (email, phone, passwordHash, role) =>{
    const result = await pool.query (
        `INSERT INTO users (email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4)
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

module.exports = {createUser, createPatient, createDoctor, findUserByEmail};