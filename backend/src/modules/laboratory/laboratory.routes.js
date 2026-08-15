/**
 * @file    laboratory.routes.js
 * @module  Laboratory
 * @desc    API routes for laboratory registration,
 *          approval, and profile endpoints.
 * @author  Pamudika Abayarathna (S/21/001)
 */

const express = require('express');
const router = express.Router();
const {
  registerLaboratoryController,
  getLaboratoryController,
  approveLaboratoryController,
  getAllLaboratoriesController,
} = require('./laboratory.controller');

// GET /api/laboratories — Get all verified laboratories
router.get('/', getAllLaboratoriesController);

// POST /api/laboratories/register — Register a new laboratory (public)
router.post('/register', registerLaboratoryController);

// GET /api/laboratories/:id — Get laboratory profile
router.get('/:id', getLaboratoryController);

// PUT /api/laboratories/:id/approve — Approve a laboratory (admin only)
router.put('/:id/approve', approveLaboratoryController);

module.exports = router;