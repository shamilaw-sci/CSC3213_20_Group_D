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
const pharmacyRoutes   = require('./src/modules/pharmacy/pharmacy.routes');
const laboratoryRoutes = require('./src/modules/laboratory/laboratory.routes');
const emergencyRoutes = require('./src/modules/emergency/emergency.routes'); 
const orderRoutes = require('./src/modules/order/order.routes');
const interactionRoutes = require('./src/modules/interaction/interaction.routes');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup (No JWT — Session-based as per supervisor requirement)
const isProduction = process.env.NODE_ENV === 'production';
const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE_MS, 10) || (1000 * 60 * 60 * 24);

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET,
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
app.get('/', (req, res) => {
  res.json({ status: 'Care4U API is running' });
});

// Module Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacies',   pharmacyRoutes);
app.use('/api/laboratories', laboratoryRoutes);
app.use('/api/emergencies', emergencyRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/interactions', interactionRoutes);

module.exports = app;