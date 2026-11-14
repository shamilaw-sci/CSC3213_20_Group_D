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
      [userId, action, entityType, entityId, JSON.stringify(details, (key, value) => /password|secret|token|otp|authorization|cookie|api[_-]?key/i.test(key) ? '[REDACTED]' : value), ipAddress]
    );
  } catch (error) {
    console.error('Audit log persistence failed.');
  }
};

/** Audit an instrumented route after the response finishes, including denial/error status.
 * Capture the actor before handlers can clear/change session state. Store route patterns,
 * not raw URLs/query strings that can contain QR capabilities or personal identifiers.
 * Middleware is best-effort; a successful response cannot be changed after finish.
 * @param {string} action Audit event name. @param {string} entityType Entity category.
 * @returns {Function} Express middleware; does not imply complete route or abort coverage.
 */
const auditMiddleware = (action, entityType) => (req, res, next) => {
  const userId = req.session?.user?.id || null;
  const candidate = req.params?.id || Object.values(req.params || {})[0];
  // The supplied schema defines entity_id as UUID; QR/NIC params are not UUIDs.
  const entityId = typeof candidate === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate) ? candidate : null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const pattern = typeof req.route?.path === 'string' ? req.route.path : '[instrumented route]';
  const details = { method: req.method, path: `${req.baseUrl || ''}${pattern}`,
    userAgent: String(req.headers?.['user-agent'] || '').slice(0, 512) };
  res.once('finish', () => {
    const statusCode = res.statusCode;
    void logAudit(userId, action, entityType, entityId, { ...details, statusCode,
      outcome: statusCode >= 400 ? 'failed' : 'completed' }, ipAddress);
  });
  next();
};

module.exports = { logAudit, auditMiddleware };
