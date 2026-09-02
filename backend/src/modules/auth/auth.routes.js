/**
 * @file auth.routes.js
 * @module auth
 * @desc Route definitions for authentication endpoints.
 * @author I.M.L.S Idirisinghe (S/21/389)
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth');
const {
  registerController,
  verifyOtpController,
  resendOtpController,
  loginController,
  logoutController,
  getMeController,
  forgotPasswordController,
  resetPasswordController
} = require('./auth.controller');

const rateLimit = require('express-rate-limit');

// Limits login attempts per IP, independent of the per-account lockout
// in login() itself - this protects against distributing guesses
// across many different accounts from one machine.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

// POST /api/auth/register
router.post('/register', registerController);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpController);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtpController);

// POST /api/auth/login
router.post('/login', loginRateLimiter, loginController);

// POST /api/auth/logout
router.post('/logout', isAuthenticated, logoutController);

// GET /api/auth/me
router.get('/me', isAuthenticated, getMeController);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordController);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordController);

module.exports = router;