/**
 * @file    server.js
 * @desc    Entry point — starts the Care4U Express server.
 * @author  Wasana Karunanayaka (S/21/081)
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});