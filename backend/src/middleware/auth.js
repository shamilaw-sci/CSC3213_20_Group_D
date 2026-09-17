/**
 * @file auth.js
 * @module Middleware
 * @desc Authentication and authorization middleware.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const { pool } = require('../config/db');
/**
 * Checks if the user is logged in via session.
 * Blocks request with 401 if no session exists.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const isAuthenticated = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated. Please log in.'
    });
  }

  try {
    const result = await pool.query(
      `SELECT is_active FROM users WHERE id = $1`,
      [req.session.user.id]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    return next();

  } catch (error) {
    console.error('isAuthenticated middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
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

/**
 * Restricts a profile-scoped route to the profile stored in the session.
 * Must be used after isAuthenticated.
 *
 * @param {string} [paramName='id'] - Route parameter containing the profile ID
 * @returns {Function} Express middleware
 */
const authorizeOwnProfile = (paramName = 'id') => {
  return (req, res, next) => {
    const profileId = req.session?.user?.profile_id;
    const requestedId = req.params?.[paramName];

    if (
      !profileId ||
      !requestedId ||
      String(profileId) !== String(requestedId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own profile.'
      });
    }

    return next();
  };
};

module.exports = {
  isAuthenticated,
  authorize,
  authorizeOwnProfile
};
