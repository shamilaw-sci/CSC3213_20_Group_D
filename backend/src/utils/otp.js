/**
 * @file    otp.js
 * @module  Utils
 * @desc    Utility functions for generating OTP codes and their expiry timestamps.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

/**
 * Generates a random 6-digit numeric OTP code.
 * @returns {string} 6-digit OTP as a string (e.g. "042917")
 */
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
