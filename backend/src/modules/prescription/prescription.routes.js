/**
 * @file    prescription.routes.js
 * @module  Prescription
 * @desc    API routes for prescription endpoints.
 * @author  S/21/001
 */

const express = require('express');
const router = express.Router();
const { 
  createPrescriptionController,
  getPrescriptionController,
  verifyPrescriptionController
} = require('./prescription.controller');

router.post('/', createPrescriptionController);

router.get('/verify/:qrValue', verifyPrescriptionController);

router.get('/:id', getPrescriptionController);

module.exports = router;