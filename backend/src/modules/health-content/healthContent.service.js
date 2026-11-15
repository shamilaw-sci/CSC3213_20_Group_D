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

const { supabase } = require('../../config/supabase');

const VALID_CATEGORIES = [
    'first-aid',
    'vaccine',
    'nutrition',
    'mental-health',
    'dengue-alert'
];

const CONTENT_IMAGE_BUCKET = 'health-content-images';

const IMAGE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

/**
 * Uploads an optional health-content image to Supabase Storage.
 * @param {object|null} file - Multer file object
 * @returns {Promise<string|null>} Public image URL or null when no file is provided
 */
const uploadContentImage = async (file) => {
    if (!file) {
        return null;
    }

    const extension = IMAGE_EXTENSIONS[file.mimetype];

    // Reject unsupported image types before sending a file to storage.
    if (!extension) {
        const error = new Error(
            'Article image must be a JPEG, PNG, or WebP file'
        );

        error.statusCode = 400;
        throw error;
    }

    const storagePath =
        `articles/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}.${extension}`;

    // Use a new storage path for each uploaded article image; do not overwrite other images.
    const { error: uploadError } = await supabase.storage
        .from(CONTENT_IMAGE_BUCKET)
        .upload(
            storagePath,
            file.buffer,
            {
                contentType: file.mimetype,
                upsert: false
            }
        );

    // If storage fails, stop and report the error instead of saving a broken image link.
    if (uploadError) {
        console.error(
            'Health content image upload error:',
            uploadError
        );

        const error = new Error(
            'Failed to upload article image'
        );

        error.statusCode = 500;
        throw error;
    }

    const { data: publicUrlData } = supabase.storage
        .from(CONTENT_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

    if (!publicUrlData?.publicUrl) {
        const error = new Error(
            'Failed to generate article image URL'
        );

        error.statusCode = 500;
        throw error;
    }

    return publicUrlData.publicUrl;
};

/**
 * Creates a new draft health content item.
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {string} source
 * @param {object|null} file - Optional Multer image file
 * @returns {Promise<object>} Created content
 */
const addContent = async (
    title,
    body,
    category,
    source,
    file = null
) => {
    if (!VALID_CATEGORIES.includes(category)) {
        throw new Error(
            `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
        );
    }

    // An optional image is uploaded before the new article is stored as a draft.
    const imageUrl =
        await uploadContentImage(file);

    return await createContent(
        title,
        body,
        category,
        source,
        imageUrl
    );
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
 * If no new image file is supplied, the currently stored image is preserved.
 * @param {string} id
 * @param {string} title
 * @param {string} body
 * @param {string} category
 * @param {string} source
 * @param {object|null} file - Optional replacement Multer image file
 * @returns {Promise<object>} Updated content
 */
const editContent = async (
    id,
    title,
    body,
    category,
    source,
    file = null
) => {
    // Editing an unknown article must fail rather than silently creating one.
    const existing =
        await findContentById(id);

    if (!existing) {
        throw new Error(
            'Content not found'
        );
    }

    if (!VALID_CATEGORIES.includes(category)) {
        throw new Error(
            `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
        );
    }

    // No replacement file returns a null URL; the repository keeps the saved image.
    const imageUrl =
        await uploadContentImage(file);

    return await updateContent(
        id,
        title,
        body,
        category,
        source,
        imageUrl
    );
};

/**
 * Publishes a draft content item.
 * @param {string} id
 * @returns {Promise<object>} Updated content
 */
const publishDraftContent = async (id) => {
    const existing =
        await findContentById(id);

    if (!existing) {
        throw new Error(
            'Content not found'
        );
    }

    // Prevent publishing the same article twice; publishing is a separate action from drafting.
    if (existing.status === 'published') {
        throw new Error(
            'Content is already published'
        );
    }

    return await publishContent(id);
};

/**
 * Deletes a content item.
 * @param {string} id
 * @returns {Promise<void>}
 */
const removeContent = async (id) => {
    const existing =
        await findContentById(id);

    if (!existing) {
        throw new Error(
            'Content not found'
        );
    }

    await deleteContent(id);
};

module.exports = {
    addContent,
    getAllContent,
    editContent,
    publishDraftContent,
    removeContent
};