
/**
 * @file    auth.js
 * @module  Authentication
 * @desc    Controls who can use protected Care4U API routes.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

const { pool } = require('../config/db');

/**
 * FEATURE: Allow only active, permitted accounts into protected routes.
 * LOGIC: Check login session → Check account in database → Reject blocked accounts.
 * If the user's role changed, end the old session and require a new login.
 * Patients do not need staff approval; other roles must be approved.
 */
const isAuthenticated = async (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated. Please log in.'
    });
  }

  try {
    const result = await pool.query(
      `SELECT is_active, role, verification_status FROM users WHERE id = $1`,
      [req.session.user.id]
    );

    const user = result.rows[0];

    if (user && user.role !== req.session.user.role) {
      delete req.session.user;
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: 'Account permissions changed. Please sign in again.'
      });
    }

    if (!user || !user.is_active) {
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    if (user.verification_status === 'rejected') {
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        message: 'Account registration was not approved.'
      });
    }

    if (user.role !== 'patient' && user.verification_status !== 'approved') {
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        message: 'Account requires admin approval before access.'
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
 * FEATURE: Restrict actions to allowed user roles.
 * LOGIC: User's role is on the allowed list → Continue; otherwise → Reject.
 * Use after the login and account-status check.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }
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
 * FEATURE: Prevent users from opening another user's profile through a URL.
 * LOGIC: Profile ID in the URL matches their logged-in profile → Continue.
 * Otherwise → Reject. Use after the login check.
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
