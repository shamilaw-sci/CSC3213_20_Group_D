const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./src/config/db');
require('dotenv').config();

const app = express();

// Route Imports
const patientRoutes = require('./src/modules/patient/patient.routes');

// Security & Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup (No JWT — Session-based as per supervisor requirement)
app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

// Health Check Route
app.get('/', (req, res) => {
  res.json({ status: 'Care4U API is running' });
});

// Routes
app.use('/api/patients', patientRoutes);


module.exports = app;