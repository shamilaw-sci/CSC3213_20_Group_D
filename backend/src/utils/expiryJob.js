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

    const result = await pool.query(
      `UPDATE prescriptions
       SET status     = 'expired',
           updated_at = NOW()
       WHERE status    = 'active'
         AND expires_at < NOW()
       RETURNING id, qr_code_value, expires_at`,
      []
    );

    const expired = result.rows;

    if (expired.length === 0) {
      console.log('[ExpiryJob] No prescriptions to expire.');
    } else {
      console.log(`[ExpiryJob] Expired ${expired.length} prescription(s):`);
      expired.forEach(p => {
        console.log(`  - ${p.qr_code_value} (expired at ${p.expires_at})`);
      });
    }

    console.log('[ExpiryJob] Done.');

  } catch (error) {
    console.error('[ExpiryJob] Error:', error.message);
  }
};

module.exports = { runExpiryJob };