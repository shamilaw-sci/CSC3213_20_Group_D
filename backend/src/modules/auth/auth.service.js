/**
 * @file auth.service.js
 * @module auth
 * @desc Business logic for authentication - register and login
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const bcrypt = require('bcryptjs');
const {createUser, createPatient, createDoctor, findUserByEmail} = require('./auth.repository');

/**
 * Registers a new patient or doctir.
 * @param {string} email - User email
 * @param {string} phone - User phone number
 * @param {string} password - Plain text password
 * @param {string} role - 'patient' or 'doctor'
 * @param {Object} profileData - Extra data depending on role
 * @returns {Promise<Object>} Created user and profile   
 */

const register = async (email, phone, password, role, profileData) => {
    //Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser){
        throw new Error('Email already registered');
    }

    //Hash the password with bcrypt saltRounds = 12
    const passwordHash = await bcrypt.hash(password, 12);

    //Create the user row
    const user = await createUser(email, phone, passwordHash, role);

    //Create role specification profile
    let profile = null;
    if (role === 'patient'){
        profile = await createPatient (user.id, profileData.fullName, profileData.nic);
    } else if (role === 'doctor'){
        profile = await createDoctor(user.id, profileData.fullName, profileData.slmcRegNumber, profileData.specialization);
    }

    return {user, profile};
};

/**
 * Logs in a user by verifying email and password.
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} User object if login successful
 */

const login = async(email, password) =>{
    
    //Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    //check if account is active
    if (!user.is_active) {
        throw new Error('Account is deactivated. Please contact admin.');
    }

    //Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    return user;
};

module.exports = {register, login};