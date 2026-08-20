/**
 * @file    interaction.routes.js
 * @module  DrugInteraction
 * @desc    Route definitions for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const { checkConflictsController } = require('./interaction.controller');

// POST /api/interactions/check — check a candidate medicine against allergies + active prescriptions
// Audit logging handled explicitly inside the controller (patientId comes from
// the request body, not a route param, so the generic auditMiddleware can't capture it).
router.post('/check', checkConflictsController);

module.exports = router;