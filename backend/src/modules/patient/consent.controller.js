/**
 * @file    consent.controller.js
 * @module  Patient
 * @desc    Controller for handling patient privacy and consent settings.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const consentRepository = require('./consent.repository');

/**
 * Retrieves the consent settings for a specific patient.
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getConsent = async (req, res) => {
    try {
        const { id } = req.params;
        const settings = await consentRepository.getConsentSettings(id);
        
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('getConsent error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Updates the consent settings for a specific patient.
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const updateConsent = async (req, res) => {
    try {
        const { id } = req.params;
        const { lockedCategories } = req.body;

        if (!Array.isArray(lockedCategories)) {
            return res.status(400).json({ 
                success: false, 
                message: 'lockedCategories must be an array' 
            });
        }

        const updatedSettings = await consentRepository.upsertConsentSettings(id, lockedCategories);
        
        res.status(200).json({
            success: true,
            message: 'Privacy settings updated successfully',
            data: updatedSettings
        });
    } catch (error) {
        console.error('updateConsent error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getConsent,
    updateConsent
};