/**
 * @file    expiryJob.js
 * @module  Utils
 * @desc    Scheduled job that automatically marks active prescriptions
 *          as expired once their expiry date has passed.
 *          Run this function daily via setInterval in server.js.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const { pool } = require('../config/db');

/**
 * Finds all active prescriptions past their expiry date
 * and updates their status to 'expired'.
 * @returns {Promise<void>}
 */
const runExpiryJob = async () => {
  try {
    console.log('[ExpiryJob] Checking for expired prescriptions...');

    // Expire only currently active prescriptions whose expiry time has passed; preserve all other statuses.
    const result = await pool.query(
      `UPDATE prescriptions
       SET status     = 'expired',
           updated_at = NOW()
       WHERE status    = 'active'
         AND expires_at < NOW()
       RETURNING id`,
      []
    );

    const expired = result.rows;

    if (expired.length === 0) {
      console.log('[ExpiryJob] No prescriptions to expire.');
    } else {
      console.log(`[ExpiryJob] Expired ${expired.length} prescription(s).`);
    }

    console.log('[ExpiryJob] Done.');

  } catch (error) {
    // Log job failures without crashing the API process; the next scheduled run can retry.
    console.error('[ExpiryJob] Error:', error.message);
  }
};

module.exports = { runExpiryJob };
