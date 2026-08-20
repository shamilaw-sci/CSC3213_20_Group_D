/**
 * @file    interaction.routes.js
 * @module  DrugInteraction
 * @desc    Route definitions for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const { checkConflictsController } = require('./interaction.controller');
const { auditMiddleware } = require('../../middleware/auditLog');

// POST /api/interactions/check — check a candidate medicine against allergies + active prescriptions
router.post('/check', auditMiddleware('CHECK_DRUG_INTERACTION', 'interaction'), checkConflictsController);

module.exports = router;