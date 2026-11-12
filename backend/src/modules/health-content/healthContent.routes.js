/**
 * @file healthContent.routes.js
 * @module healthContent
 * @desc Route definitions for admin health content management.
 *       Admin listing and mutations require an authenticated admin.
 *       The public feed returns published content only.
 */

const express = require('express');
const router = express.Router();

const {
    isAuthenticated,
    authorize
} = require('../../middleware/auth');

const {
    upload
} = require('../../middleware/upload');

const {
    createContentController,
    getAllContentController,
    getPublishedContentController,
    updateContentController,
    publishContentController,
    deleteContentController
} = require('./healthContent.controller');

// Admin-only modifying routes
router.post(
    '/',
    isAuthenticated,
    authorize('admin'),
    upload.single('image'),
    createContentController
);

router.put(
    '/:id',
    isAuthenticated,
    authorize('admin'),
    upload.single('image'),
    updateContentController
);

router.post(
    '/:id/publish',
    isAuthenticated,
    authorize('admin'),
    publishContentController
);

router.delete(
    '/:id',
    isAuthenticated,
    authorize('admin'),
    deleteContentController
);

router.get('/admin', isAuthenticated, authorize('admin'), getAllContentController);

// Public feed: query parameters cannot select drafts.
router.get(
    '/',
    getPublishedContentController
);

module.exports = router;
