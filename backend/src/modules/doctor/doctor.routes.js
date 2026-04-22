/**
 * @file    doctor.routes.js
 * @module  Doctor
 * @desc    Route definitions for the Doctor module.
 * @author  Tharindu (S/21/166)
 */

const express = require('express');
const router = express.Router();
const {
  getDoctorController,
  getAllDoctorsController,
} = require('./doctor.controller');

// GET /api/doctors — get all verified doctors
router.get('/', getAllDoctorsController);

// GET /api/doctors/:id — get doctor profile by ID
router.get('/:id', getDoctorController);

module.exports = router;