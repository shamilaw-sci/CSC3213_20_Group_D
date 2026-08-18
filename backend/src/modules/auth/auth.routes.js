/**
 * @file auth.routes.js
 * @module auth
 * @desc Route definitions for authentication endpoints.
 * @author I.M.L.S Idirisinghe (S/21/389)
 */

const express = require('express');
const router = express.Router();
const {
    registerController,
    verifyOtpController,
    loginController,
    logoutController,
    getMeController,
    forgotPasswordController,
    resetPasswordController
} = require('./auth.controller');

// POST /api/auth/register
router.post('/register', registerController);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpController);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtpController);

// POST /api/auth/login
router.post('/login', loginController);

// POST /api/auth/logout
router.post('/logout', logoutController);

// GET /api/auth/me
router.get('/me', getMeController);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordController);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordController);

module.exports = router;