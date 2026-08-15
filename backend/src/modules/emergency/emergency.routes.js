/**
 * @file    emergency.routes.js
 * @module  Emergency
 * @desc    Express route definitions for the emergency module.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const express = require('express');
const router = express.Router();
const { triggerSosController } = require('./emergency.controller');
// We now import BOTH from auth.js instead of looking for rbac.js
const { isAuthenticated, authorize } = require('../../middleware/auth');

// POST /api/emergencies/sos
// Only authenticated patients can trigger an SOS alert
router.post('/sos', isAuthenticated, authorize('patient'), triggerSosController);

module.exports = router;