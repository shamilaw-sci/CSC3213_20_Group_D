
/**
 * @file    auditLog.js
 * @module  Audit Logging
 * @desc    Records important actions in the audit_logs table.
 * @author  Tharindu Lakshan (S/21/166)
 */

const { pool } = require('../config/db');

/**
 * FEATURE: Record important user actions.
 * LOGIC: Save who performed the action and what was affected.
 * Hide password/token-like details before saving. A logging error does not stop the main action.
 */
const logAudit = async (userId, action, entityType, entityId, details = {}, ipAddress = null) => {
  try {
    // The audit entry records actor, action, record type and redacted details using parameterized SQL.
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

/**
 * FEATURE: Track API actions on routes that use this middleware.
 * LOGIC: After a request finishes, save its result as completed or failed.
 * Record the route pattern instead of a full URL to avoid exposing personal details.
 */
const auditMiddleware = (action, entityType) => (req, res, next) => {
  const userId = req.session?.user?.id || null;
  const candidate = req.params?.id || Object.values(req.params || {})[0];

  // Only store a record ID when it is a UUID; do not store QR codes or NICs here.
  const entityId = typeof candidate === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate) ? candidate : null;

  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const pattern = typeof req.route?.path === 'string' ? req.route.path : '[instrumented route]';
  const details = { method: req.method, path: `${req.baseUrl || ''}${pattern}`,
    userAgent: String(req.headers?.['user-agent'] || '').slice(0, 512) };

  // Wait until the HTTP response finishes so the log includes its final status; audit failure does not interrupt the request.
  res.once('finish', () => {
    const statusCode = res.statusCode;
    void logAudit(userId, action, entityType, entityId, { ...details, statusCode,
      outcome: statusCode >= 400 ? 'failed' : 'completed' }, ipAddress);
  });

  // Continue to the protected route immediately; the audit insert runs separately after the response.
  next();
};

module.exports = { logAudit, auditMiddleware };
