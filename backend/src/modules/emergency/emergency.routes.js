/**
 * @file    emergency.routes.js
 * @module  Emergency
 * @desc    Express route definitions for the emergency module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { 
  triggerSosController, 
  logEmergencyAccessController, 
  getEmergencySnapshotController,
  getActiveAlertsController,
  resolveAlertController
} = require('./emergency.controller');
const { isAuthenticated, authorize } = require('../../middleware/auth');

// POST /api/emergencies/sos
// Only authenticated patients can trigger an SOS alert
router.post(
  '/sos',
  isAuthenticated,
  authorize('patient'),
  triggerSosController
);

// POST /api/emergencies/access-logs
// Only doctors and emergency staff can trigger the break-glass audit log
router.post(
  '/access-logs',
  isAuthenticated,
  authorize(
    'doctor',
    'emergency',
    'admin',
    'hospital_staff'
  ),
  logEmergencyAccessController
);

// GET /api/emergencies/snapshot/:patientId
// Only doctors and emergency staff can retrieve the minimalist break-glass snapshot
router.get(
  '/snapshot/:patientId',
  isAuthenticated,
  authorize(
    'doctor',
    'emergency',
    'admin',
    'hospital_staff'
  ),
  getEmergencySnapshotController
);

// GET /api/emergencies/alerts
// Retrieve all active SOS alerts for the live hospital dashboard
router.get(
  '/alerts',
  isAuthenticated,
  authorize(
    'doctor',
    'emergency',
    'admin',
    'hospital_staff'
  ),
  getActiveAlertsController
);

// PATCH /api/emergencies/alerts/:alertId/resolve
// Mark an active SOS alert as resolved
router.patch(
  '/alerts/:alertId/resolve',
  isAuthenticated,
  authorize(
    'doctor',
    'emergency',
    'admin',
    'hospital_staff'
  ),
  resolveAlertController
);

module.exports = router;