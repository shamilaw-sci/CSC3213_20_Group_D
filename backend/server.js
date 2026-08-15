/**
 * @file    server.js
 * @desc    Entry point — starts the Care4U Express server.
 * @author  Wasana Karunanayaka (S/21/081)
 */

require('dotenv').config();
const app = require('./app');
const { sendAppointmentReminders } = require('./src/utils/reminderJob');
const { runExpiryJob }             = require('./src/utils/expiryJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Run appointment reminder job every hour
  sendAppointmentReminders();
  setInterval(sendAppointmentReminders, 60 * 60 * 1000);
  console.log('[ReminderJob] Appointment reminder job scheduled (every 1 hour)');

  // Run prescription expiry job every 24 hours
  runExpiryJob();
  setInterval(runExpiryJob, 24 * 60 * 60 * 1000);
  console.log('[ExpiryJob] Prescription expiry job scheduled (every 24 hours)');
});