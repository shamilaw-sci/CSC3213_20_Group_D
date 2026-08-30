/**
 * @file healthContent.service.js
 * @module healthContent
 * @desc Business logic for admin health content management.
 */

const {
    createContent,
    findAllContent,
    findContentById,
    updateContent,
    publishContent,
    deleteContent
} = require('./healthContent.repository');

const VALID_CATEGORIES = ['first-aid', 'vaccine', 'nutrition', 'mental-health', 'dengue-alert'];

/**
 * Creates a new draft health content item.
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {string} source
 * @returns {Promise<object>} Created content
 */
const addContent = async (title, body, category, source) => {
    if (!VALID_CATEGORIES.includes(category)) {
        throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    return await createContent(title, body, category, source);
};

/**
 * Gets all content, optionally filtered by status.
 * @param {string} [status]
 * @returns {Promise<Array>} List of content
 */
const getAllContent = async (status) => {
    return await findAllContent(status);
};

/**
 * Edits an existing content item.
 * @param {string} id
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {string} source
 * @returns {Promise<object>} Updated content
 */
const editContent = async (id, title, body, category, source) => {
    const existing = await findContentById(id);
    if (!existing) {
        throw new Error('Content not found');
    }

    if (!VALID_CATEGORIES.includes(category)) {
        throw new Error(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    return await updateContent(id, title, body, category, source);
};

/**
 * Publishes a draft content item.
 * @param {string} id
 * @returns {Promise<object>} Updated content
 */
const publishDraftContent = async (id) => {
    const existing = await findContentById(id);
    if (!existing) {
        throw new Error('Content not found');
    }

    if (existing.status === 'published') {
        throw new Error('Content is already published');
    }

    return await publishContent(id);
};

/**
 * Deletes a content item.
 * @param {string} id
 * @returns {Promise<void>}
 */
const removeContent = async (id) => {
    const existing = await findContentById(id);
    if (!existing) {
        throw new Error('Content not found');
    }

    await deleteContent(id);
};

module.exports = { addContent, getAllContent, editContent, publishDraftContent, removeContent };