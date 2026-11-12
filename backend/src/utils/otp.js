/**
 * @file    otp.js
 * @module  Utils
 * @desc    Utility functions for generating OTP codes and their expiry timestamps.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

const crypto = require('crypto');

/**
 * Generates a random 6-digit numeric OTP code.
 * @returns {string} Six-digit OTP from a cryptographic random source.
 */
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Calculates an OTP expiry timestamp a given number of minutes from now.
 * @param {number} minutes - Minutes until expiry (default 10)
 * @returns {Date} Expiry timestamp
 */
const getOtpExpiry = (minutes = 10) => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
};

module.exports = { generateOtp, getOtpExpiry };
