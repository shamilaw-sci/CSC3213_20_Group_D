/**
 * @file    emergency.routes.js
 * @module  Emergency
 * @desc    Express route definitions for the emergency module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { triggerSosController, logEmergencyAccessController } = require('./emergency.controller');
const { isAuthenticated, authorize } = require('../../middleware/auth');

// POST /api/emergencies/sos
// Only authenticated patients can trigger an SOS alert
router.post('/sos', isAuthenticated, authorize('patient'), triggerSosController);

// POST /api/emergencies/access-logs
// Only doctors and emergency staff can trigger the break-glass audit log
router.post('/access-logs', isAuthenticated, authorize('doctor', 'emergency'), logEmergencyAccessController);

module.exports = router;