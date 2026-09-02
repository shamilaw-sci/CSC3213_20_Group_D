/**
 * @file healthContent.routes.js
 * @module healthContent
 * @desc Route definitions for admin health content management.
 *       Modifying routes require an authenticated user with the 'admin' role.
 *       Fetching content is available for the Patient Dashboard feed (requires session).
 */

const express = require('express');
const router = express.Router();

const { isAuthenticated, authorize } = require('../../middleware/auth');
const {
    createContentController,
    getAllContentController,
    updateContentController,
    publishContentController,
    deleteContentController
} = require('./healthContent.controller');

// Admin-only modifying routes
router.post('/', isAuthenticated, authorize('admin'), createContentController);
router.put('/:id', isAuthenticated, authorize('admin'), updateContentController);
router.post('/:id/publish', isAuthenticated, authorize('admin'), publishContentController);
router.delete('/:id', isAuthenticated, authorize('admin'), deleteContentController);

// Dashboard route so the Patient can fetch the articles (Requires login)
router.get('/', isAuthenticated, getAllContentController);

module.exports = router;