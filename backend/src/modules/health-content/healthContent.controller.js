/**
 * @file healthContent.controller.js
 * @module healthContent
 * @desc Handles HTTP requests/responses for admin health content management.
 */

const {
    addContent,
    getAllContent,
    editContent,
    publishDraftContent,
    removeContent
} = require('./healthContent.service');

/**
 * Handles POST /api/admin/health-content
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const createContentController = async (req, res) => {
    try {
        const {
            title,
            body,
            category,
            source
        } = req.body;

        if (!title || !body || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, body, and category are required'
            });
        }

        const content = await addContent(
            title,
            body,
            category,
            source,
            req.file || null
        );

        return res.status(201).json({
            success: true,
            message: 'Content created successfully',
            data: content
        });

    } catch (error) {
        console.error(
            'createContentController error:',
            error
        );

        if (
            error.message.startsWith(
                'Category must be one of'
            )
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles GET /api/admin/health-content
 * Supports optional ?status= query param
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAllContentController = async (req, res) => {
    try {
        const {
            status
        } = req.query;

        const content =
            await getAllContent(status);

        return res.status(200).json({
            success: true,
            message: 'Content retrieved successfully',
            data: content
        });

    } catch (error) {
        console.error(
            'getAllContentController error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/** Public feed ignores caller-supplied status and never returns drafts. */
const getPublishedContentController = async (req, res) => {
    try {
        const content = await getAllContent('published');
        return res.status(200).json({
            success: true,
            message: 'Content retrieved successfully',
            data: content
        });
    } catch (error) {
        console.error('getPublishedContentController error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles PUT /api/admin/health-content/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const updateContentController = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const {
            title,
            body,
            category,
            source
        } = req.body;

        if (!title || !body || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, body, and category are required'
            });
        }

        const content = await editContent(
            id,
            title,
            body,
            category,
            source,
            req.file || null
        );

        return res.status(200).json({
            success: true,
            message: 'Content updated successfully',
            data: content
        });

    } catch (error) {
        console.error(
            'updateContentController error:',
            error
        );

        if (
            error.message ===
            'Content not found'
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message.startsWith(
                'Category must be one of'
            )
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles POST /api/admin/health-content/:id/publish
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const publishContentController = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const content =
            await publishDraftContent(id);

        return res.status(200).json({
            success: true,
            message: 'Content published successfully',
            data: content
        });

    } catch (error) {
        console.error(
            'publishContentController error:',
            error
        );

        if (
            error.message ===
            'Content not found'
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message ===
            'Content is already published'
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handles DELETE /api/admin/health-content/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const deleteContentController = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        await removeContent(id);

        return res.status(200).json({
            success: true,
            message: 'Content deleted successfully'
        });

    } catch (error) {
        console.error(
            'deleteContentController error:',
            error
        );

        if (
            error.message ===
            'Content not found'
        ) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createContentController,
    getAllContentController,
    getPublishedContentController,
    updateContentController,
    publishContentController,
    deleteContentController
};
