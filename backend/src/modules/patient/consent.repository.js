/**
 * @file    consent.repository.js
 * @module  Patient
 * @desc    Database queries for Patient Privacy & Consent Controls.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { pool } = require('../../config/db');

/**
 * Retrieves a patient's consent settings.
 * @param {string} patientId 
 * @returns {Promise<object>}
 */
const getConsentSettings = async (patientId) => {
    const result = await pool.query(
        `SELECT locked_categories FROM consent_settings WHERE patient_id = $1`,
        [patientId]
    );
    
    // If the patient hasn't set anything up yet, return an empty array
    if (result.rows.length === 0) {
        return { locked_categories: [] };
    }
    
    return result.rows[0];
};

/**
 * Updates or inserts (upserts) a patient's consent settings.
 * @param {string} patientId 
 * @param {Array<string>} lockedCategories - Array of category strings (e.g., ['Mental Health', 'Reproductive Health'])
 * @returns {Promise<object>}
 */
const upsertConsentSettings = async (patientId, lockedCategories) => {
    const result = await pool.query(
        `INSERT INTO consent_settings (patient_id, locked_categories, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (patient_id) 
         DO UPDATE SET locked_categories = EXCLUDED.locked_categories, updated_at = NOW()
         RETURNING locked_categories`,
        [patientId, lockedCategories]
    );
    return result.rows[0];
};

module.exports = {
    getConsentSettings,
    upsertConsentSettings
};