/**
 * @file healthContent.repository.js
 * @module healthContent
 * @desc Database queries for admin health content management (CRUD + publish workflow).
 */

const { pool } = require('../../config/db');

/**
 * Creates a new health content item, starting as 'draft'.
 * @param {string} title
 * @param {string} body
 * @param {string} category - One of: first-aid, vaccine, nutrition, mental-health, dengue-alert
 * @param {string} source
 * @param {string|null} imageUrl - Optional public article image URL
 * @returns {Promise<object>} Created row
 */
const createContent = async (
    title,
    body,
    category,
    source,
    imageUrl = null
) => {
    const result = await pool.query(
        `INSERT INTO health_content
            (title, body, category, source, image_url, status)
         VALUES
            ($1, $2, $3, $4, $5, 'draft')
         RETURNING *`,
        [
            title,
            body,
            category,
            source,
            imageUrl
        ]
    );

    return result.rows[0];
};

/**
 * Retrieves all health content items, optionally filtered by status.
 * @param {string} [status] - 'draft' or 'published'
 * @returns {Promise<Array>} List of content rows
 */
const findAllContent = async (status) => {
    if (status) {
        const result = await pool.query(
            `SELECT *
             FROM health_content
             WHERE status = $1
             ORDER BY created_at DESC`,
            [status]
        );

        return result.rows;
    }

    const result = await pool.query(
        `SELECT *
         FROM health_content
         ORDER BY created_at DESC`
    );

    return result.rows;
};

/**
 * Finds a single content item by ID.
 * @param {string} id
 * @returns {Promise<object|null>} Content row or null
 */
const findContentById = async (id) => {
    const result = await pool.query(
        `SELECT *
         FROM health_content
         WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
};

/**
 * Updates a content item's editable fields.
 * If imageUrl is null, the current article image is preserved.
 * @param {string} id
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {string} source
 * @param {string|null} imageUrl - New public article image URL, or null to keep the current image
 * @returns {Promise<object>} Updated row
 */
const updateContent = async (
    id,
    title,
    body,
    category,
    source,
    imageUrl = null
) => {
    const result = await pool.query(
        `UPDATE health_content
         SET
            title = $2,
            body = $3,
            category = $4,
            source = $5,
            image_url = COALESCE($6, image_url),
            updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
            id,
            title,
            body,
            category,
            source,
            imageUrl
        ]
    );

    return result.rows[0];
};

/**
 * Publishes a draft content item, setting status and published_at.
 * @param {string} id
 * @returns {Promise<object>} Updated row
 */
const publishContent = async (id) => {
    const result = await pool.query(
        `UPDATE health_content
         SET
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
};

/**
 * Deletes a content item.
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteContent = async (id) => {
    await pool.query(
        `DELETE FROM health_content
         WHERE id = $1`,
        [id]
    );
};

module.exports = {
    createContent,
    findAllContent,
    findContentById,
    updateContent,
    publishContent,
    deleteContent
};