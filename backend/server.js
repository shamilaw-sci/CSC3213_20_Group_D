/**
 * @file    server.js
 * @desc    Entry point — starts the Care4U Express server.
 * @author  Wasana Karunanayaka (S/21/081)
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const { sendAppointmentReminders } = require('./src/utils/reminderJob');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Run appointment reminder job every hour
  sendAppointmentReminders(); // run once on startup
  setInterval(sendAppointmentReminders, 60 * 60 * 1000); // then every hour
  console.log('[ReminderJob] Appointment reminder job scheduled (every 1 hour)');
});