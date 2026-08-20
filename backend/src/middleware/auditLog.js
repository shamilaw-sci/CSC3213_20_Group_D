/**
 * @file    auditLog.js
 * @module  Middleware
 * @desc    Audit logging middleware for tracking important system actions.
 *          Logs user actions to the audit_logs table for security and compliance.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../config/db');

/**
 * Log an important system action to the audit_logs table.
 * @param {string} userId     - UUID of the user performing the action
 * @param {string} action     - Action performed (e.g. LOGIN, VIEW_RECORD)
 * @param {string} entityType - Type of entity affected (e.g. patient, prescription)
 * @param {string} entityId   - UUID of the affected entity
 * @param {Object} details    - Additional details about the action
 * @param {string} ipAddress  - IP address of the request
 * @returns {Promise<void>}
 */
const logAudit = async (userId, action, entityType, entityId, details = {}, ipAddress = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

/**
 * Express middleware that automatically logs every API request.
 * Attach to any route to enable automatic audit logging.
 *
 * Resolves entityId from req.params — checks `:id` first (the most common
 * name), then falls back to whatever the first route param actually is
 * (e.g. `:reportId`, `:appointmentId`), so routes that don't name their
 * param "id" still get the correct entity logged instead of null.
 *
 * @param {string} action     - Action name to log
 * @param {string} entityType - Entity type being affected
 */
const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    try {
      const userId = req.session?.user?.id || null;
      const paramValues = Object.values(req.params || {});
      const entityId = req.params?.id || paramValues[0] || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || null;
      const details = {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
      };

      await logAudit(userId, action, entityType, entityId, details, ipAddress);
    } catch (error) {
      console.error('auditMiddleware error:', error.message);
    }
    next();
  };
};

module.exports = {
  logAudit,
  auditMiddleware,
};