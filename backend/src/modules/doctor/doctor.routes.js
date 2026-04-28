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
  updateDoctorController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getTodayAppointmentsController,
} = require('./doctor.controller');

// GET /api/doctors — get all verified doctors
router.get('/', getAllDoctorsController);

// GET /api/doctors/:id — get doctor profile by ID
router.get('/:id', getDoctorController);

// PUT /api/doctors/:id — update doctor profile
router.put('/:id', updateDoctorController);

// GET /api/doctors/:id/availability — get doctor availability
router.get('/:id/availability', getDoctorAvailabilityController);

// PUT /api/doctors/:id/availability — update doctor availability
router.put('/:id/availability', updateDoctorAvailabilityController);

// GET /api/doctors/:id/appointments/today — get today's queue
router.get('/:id/appointments/today', getTodayAppointmentsController);

module.exports = router;