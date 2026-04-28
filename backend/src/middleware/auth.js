/**
 * @file auth.js
 * @module Middleware
 * @desc Authentication and authorization middleware.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

/**
 * Checks if the user is logged in via session.
 * Blocks request with 401 if no session exists.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Not authenticated. Please log in.'
  });
};

/**
 * Middleware to check if user has the required role.
 * Must be used AFTER isAuthenticated.
 * @param {...string} roles - Allowed roles (e.g. 'patient', 'doctor')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission.'
      });
    }
    return next();
  };
};

module.exports = { isAuthenticated, authorize };