/**
 * @file sms.util.js
 * @module Utils
 * @desc Sends emergency SOS notifications through the Telegram Bot API.
 * @author Wasana Karunanayaka (S/21/081)
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Sends an emergency SOS notification to the configured emergency channel.
 *
 * @param {string} toPhone - Reserved emergency-contact phone number
 * @param {string} patientName - Full name of the patient
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Promise<boolean>} Whether Telegram accepted the notification
 */
const sendEmergencySMS = async (
  toPhone,
  patientName,
  latitude,
  longitude
) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error(
      '[Telegram] TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.'
    );
    return false;
  }

  const location =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location unavailable';

  const message =
    `CARE4U URGENT ALERT\n\n${patientName} has triggered an Emergency SOS!` +
    `\n\nLocation: ${location}` +
    '\n\nPlease contact them or local emergency services immediately.';

  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!response.ok) {
      console.error('[Telegram] Emergency notification was rejected.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Emergency notification failed:', error.message);
    return false;
  }
};

module.exports = { sendEmergencySMS };
