/**
 * @file healthContent.routes.js
 * @module healthContent
 * @desc Route definitions for admin health content management. All routes
 *       require an authenticated user with the 'admin' role.
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

router.post('/', isAuthenticated, authorize('admin'), createContentController);
router.get('/', isAuthenticated, authorize('admin'), getAllContentController);
router.put('/:id', isAuthenticated, authorize('admin'), updateContentController);
router.post('/:id/publish', isAuthenticated, authorize('admin'), publishContentController);
router.delete('/:id', isAuthenticated, authorize('admin'), deleteContentController);

module.exports = router;