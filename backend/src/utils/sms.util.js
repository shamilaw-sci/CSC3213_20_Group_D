/**
 * @file    sms.util.js
 * @desc    Utility service for sending Emergency SOS via Telegram Bot API.
 *          Provides a highly reliable, free, and visual push notification 
 *          demonstration for the project panel.
 * @author  Wasana Karunanayaka (S/21/081)
 */

// Paste the Token from BotFather here:
const TELEGRAM_BOT_TOKEN = '8847358478:AAGUe0bLTAFhnwMIwO48wcLBcR2dgwNxV-4';

// Paste your User ID from @getmyid_bot here:
const DEMO_CONTACT_CHAT_ID = '1215345410';

/**
 * Sends an emergency SOS notification via Telegram to the emergency contact.
 * @param {string} toPhone - The emergency contact's phone number (kept for function signature)
 * @param {string} patientName - Full name of the patient
 * @param {number} latitude - GPS Latitude
 * @param {number} longitude - GPS Longitude
 * @returns {Promise<boolean>} True if sent successfully
 */
const sendEmergencySMS = async (toPhone, patientName, latitude, longitude) => {
  const locationStr = (latitude && longitude) 
    ? `https://www.google.com/maps?q=${latitude},${longitude}` 
    : 'Location unavailable';

  // Format the message with Markdown for bold text
  const messageBody = `🚨 *CARE4U URGENT ALERT* 🚨\n\n*${patientName}* has triggered an Emergency SOS!\n\n*Location:* ${locationStr}\n\nPlease contact them or local emergency services immediately.`;

  console.log(`[Telegram] Dispatching SOS for ${patientName}...`);

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: DEMO_CONTACT_CHAT_ID,
        text: messageBody,
        parse_mode: 'Markdown' // Allows us to use *bold* text
      })
    });
    
    if (response.ok) {
      console.log(`✅ [Telegram] Emergency alert successfully delivered to phone!`);
      return true;
    } else {
      console.error('❌ [Telegram] Failed to send message. Check Token and Chat ID.');
      return false;
    }
  } catch (error) {
    console.error('❌ [Telegram] Network error while sending message:', error.message);
    return false;
  }
};

module.exports = { sendEmergencySMS };