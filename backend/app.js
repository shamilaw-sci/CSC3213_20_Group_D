/**
 * @file app.js
 * @module Application
 * @desc Configures the Care4U Express application and module routes.
 * @author Wasana Karunanayaka (S/21/081)
 */

require('dotenv').config();

const express = require('express');

const cors = require('cors');

const helmet = require('helmet');

const morgan = require('morgan');

const session = require('express-session');

const pgSession = require('connect-pg-simple')(session);

const { pool } = require('./src/config/db');

// Route Imports

const patientRoutes = require('./src/modules/patient/patient.routes');

const doctorRoutes = require('./src/modules/doctor/doctor.routes');

const appointmentRoutes = require('./src/modules/appointment/appointment.routes');

const prescriptionRoutes = require('./src/modules/prescription/prescription.routes');

const pharmacyRoutes = require('./src/modules/pharmacy/pharmacy.routes');

const laboratoryRoutes = require('./src/modules/laboratory/laboratory.routes');

const hospitalRoutes = require('./src/modules/hospital/hospital.routes');

const emergencyRoutes = require('./src/modules/emergency/emergency.routes');

const orderRoutes = require('./src/modules/order/order.routes');

const paymentRoutes = require('./src/modules/payment/payment.routes');

const interactionRoutes = require('./src/modules/interaction/interaction.routes');

const adminRoutes = require('./src/modules/admin/admin.routes');

const healthContentRoutes = require('./src/modules/health-content/healthContent.routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
// Direct development requests ignore forwarded IPs. Production retains the
// previous one-hop assumption unless explicitly configured. A hop count is safe
// only when deployment access is restricted to the expected trusted proxies.
const trustProxyHops = process.env.TRUST_PROXY_HOPS === undefined
  ? (isProduction ? 1 : 0)
  : Number(process.env.TRUST_PROXY_HOPS);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
}
app.set('trust proxy', trustProxyHops);

// Security & Middleware

app.use(helmet());

app.use(morgan('dev'));

// Explicit allow-list — CORS_ALLOWED_ORIGINS can hold a comma-separated

// list for supporting multiple environments (e.g. local dev + production

// frontend). Falls back to CLIENT_URL alone if not set, for compatibility.

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_URL || '')

  .split(',')

  .map(origin => origin.trim())

  .filter(Boolean);

app.use(cors({

  /**
   * @param {string|undefined} origin Browser Origin header; native clients may omit it.
   * @param {Function} callback CORS decision callback.
   * @returns {void} Allow an exact configured origin or no-origin client; deny others.
   * This is browser CORS configuration, not a complete CSRF policy.
   */
  origin: (origin, callback) => {

    // Allow non-browser requests (no Origin header, e.g. Postman/curl) and

    // any origin explicitly present in the allow-list.

    if (!origin || allowedOrigins.includes(origin)) {

      return callback(null, true);

    }

    return callback(new Error('Not allowed by CORS'));

  },

  credentials: true

}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Session Setup (No JWT — Session-based as per supervisor requirement)

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CORS_ALLOWED_ORIGINS or CLIENT_URL is required in production');
}

const sessionMaxAge = process.env.SESSION_MAX_AGE_MS
  ? Number(process.env.SESSION_MAX_AGE_MS)
  : 1000 * 60 * 60 * 24;

if (!Number.isSafeInteger(sessionMaxAge) || sessionMaxAge <= 0) {
  throw new Error('SESSION_MAX_AGE_MS must be a positive integer');
}

app.use(session({

  store: new pgSession({

    pool,

    tableName: 'session',

    pruneSessionInterval: 60 * 15 // prune expired sessions every 15 minutes

  }),

  secret: process.env.SESSION_SECRET,
  proxy: isProduction,

  resave: false,

  saveUninitialized: false,

  cookie: {

    httpOnly: true,

    secure: isProduction,

    sameSite: isProduction ? 'none' : 'lax',

    maxAge: sessionMaxAge

  }

}));

// Auth Routes

const authRoutes = require('./src/modules/auth/auth.routes');

app.use('/api/auth', authRoutes);

// Health Check route

/** @param {Object} req Request. @param {Object} res Response. @returns {void} Process liveness JSON; no DB check. */
app.get('/', (req, res) => {

  res.json({ status: 'Care4U API is running' });

});

/** @param {Object} req Request. @param {Object} res Response. @returns {void} Process health envelope; not schema/provider readiness. */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Care4U API is healthy'
  });
});

// Module Routes

app.use('/api/patients', patientRoutes);

app.use('/api/doctors', doctorRoutes);

app.use('/api/appointments', appointmentRoutes);

app.use('/api/prescriptions', prescriptionRoutes);

app.use('/api/pharmacies', pharmacyRoutes);

app.use('/api/laboratories', laboratoryRoutes);

app.use('/api/hospitals', hospitalRoutes);

app.use('/api/emergencies', emergencyRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/interactions', interactionRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/admin/health-content', healthContentRoutes);

// Global error handler - catches anything that escapes individual route

// try/catch blocks (e.g. errors thrown in middleware itself). Always

// returns a generic message, never the raw error, regardless of NODE_ENV.

/**
 * @param {Error} err Escaped route/middleware error.
 * @param {Object} req Request.
 * @param {Object} res Response.
 * @param {Function} next Express error-handler arity marker (unused).
 * @returns {void} Generic 500; raw error objects are deliberately not logged.
 */
app.use((err, req, res, next) => {

  // Error objects can contain SQL details, provider URLs or request payloads.
  console.error('Unhandled request failure.');

  res.status(500).json({

    success: false,

    message: 'Internal server error'

  });

});

module.exports = app;
