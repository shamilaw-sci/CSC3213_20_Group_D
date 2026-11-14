/**
 * @file    consent.controller.js
 * @module  Patient
 * @desc    HTTP controllers for patient privacy settings and
 *          temporary doctor access to protected medical data.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const consentService =
  require('./consent.service');

const {
  logAudit
} = require('../../middleware/auditLog');

/* =========================================================
   HELPERS
========================================================= */

/**
 * Resolves the client IP address used in audit records.
 */
const getRequestIp = (
  req
) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    null
  );
};

/* =========================================================
   PATIENT PRIVACY SETTINGS
========================================================= */

/**
 * GET /api/patients/:id/consent
 *
 * Retrieves the authenticated patient's own
 * privacy and consent settings.
 */
const getConsent =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const settings =
        await consentService
          .getPatientConsentSettings(
            id,
            req.session?.user
          );

      return res.status(200).json({
        success: true,
        message:
          'Privacy settings retrieved successfully',
        data:
          settings
      });

    } catch (error) {

      console.error(
        'getConsent error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error'
      });
    }
  };

/**
 * PUT /api/patients/:id/consent
 *
 * Updates the authenticated patient's own
 * locked medical-information categories.
 */
const updateConsent =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        lockedCategories
      } = req.body || {};

      const settings =
        await consentService
          .updatePatientConsentSettings(
            id,
            lockedCategories,
            req.session?.user
          );

      await logAudit(
        req.session?.user?.id ||
          null,
        'CONSENT_SETTINGS_UPDATED',
        'patient',
        id,
        {
          lockedCategories:
            settings?.locked_categories ||
            lockedCategories ||
            []
        },
        getRequestIp(req)
      );

      return res.status(200).json({
        success: true,
        message:
          'Privacy settings updated successfully',
        data:
          settings
      });

    } catch (error) {

      console.error(
        'updateConsent error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error'
      });
    }
  };

/* =========================================================
   TEMPORARY DOCTOR CONSENT ACCESS
========================================================= */

/**
 * POST /api/patients/:id/consent/access/request
 *
 * Requests a patient-approved OTP for temporary
 * access to protected medical categories.
 *
 * Body:
 * {
 *   "appointmentId": "..."
 * }
 */
const requestConsentAccess =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        appointmentId
      } = req.body || {};

      const result =
        await consentService
          .requestConsentAccessOtp(
            id,
            appointmentId,
            req.session?.user
          );

      await logAudit(
        req.session?.user?.id ||
          null,
        'CONSENT_ACCESS_REQUESTED',
        'patient',
        id,
        {
          appointmentId:
            appointmentId ||
            null,

          requestId:
            result?.requestId ||
            null,

          requestedCategories:
            result?.lockedCategories ||
            [],

          requestExpiresAt:
            result?.expiresAt ||
            null,

          alreadyGranted:
            !!result?.alreadyGranted
        },
        getRequestIp(req)
      );

      return res.status(200).json({
        success: true,

        message:
          result.alreadyGranted
            ? 'Temporary access is already active for this consultation'
            : 'Consent email submitted. Ask the patient to check their inbox and spam folder.',

        data:
          result
      });

    } catch (error) {

      console.error(
        'requestConsentAccess error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error'
      });
    }
  };

/**
 * POST /api/patients/:id/consent/access/verify
 *
 * Verifies the 6-digit patient consent code and
 * creates a temporary access grant.
 *
 * Body:
 * {
 *   "appointmentId": "...",
 *   "otpCode": "123456"
 * }
 */
const verifyConsentAccess =
  async (
    req,
    res
  ) => {

    const {
      id
    } = req.params;

    const {
      appointmentId,
      otpCode
    } = req.body || {};

    try {

      const result =
        await consentService
          .verifyConsentAccessOtp(
            id,
            appointmentId,
            otpCode,
            req.session?.user
          );

      await logAudit(
        req.session?.user?.id ||
          null,
        'CONSENT_ACCESS_GRANTED',
        'patient',
        id,
        {
          appointmentId:
            appointmentId ||
            null,

          grantedCategories:
            result?.grantedCategories ||
            result?.categories ||
            [],

          grantedAt:
            result?.grantedAt ||
            null,

          expiresAt:
            result?.expiresAt ||
            null
        },
        getRequestIp(req)
      );

      return res.status(200).json({
        success: true,
        message:
          'Temporary access granted successfully',
        data:
          result
      });

    } catch (error) {

      console.error(
        'verifyConsentAccess error:',
        error
      );

      /**
       * Record failed verification attempts without
       * recording the submitted OTP itself.
       *
       * 400 covers an invalid/incorrect code.
       * 429 covers the maximum-attempt limit.
       */
      if (
        error.statusCode === 400 ||
        error.statusCode === 429
      ) {
        await logAudit(
          req.session?.user?.id ||
            null,
          'CONSENT_OTP_FAILED',
          'patient',
          id,
          {
            appointmentId:
              appointmentId ||
              null,

            statusCode:
              error.statusCode,

            reason:
              error.message ||
              'Consent code verification failed'
          },
          getRequestIp(req)
        );
      }

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error'
      });
    }
  };

/**
 * GET /api/patients/:id/consent/access/status
 *
 * Returns whether the doctor currently has
 * temporary consent access for this consultation.
 *
 * Query:
 * ?appointmentId=<appointment-uuid>
 */
const getConsentAccessStatus =
  async (
    req,
    res
  ) => {
    try {

      const {
        id
      } = req.params;

      const {
        appointmentId
      } = req.query;

      const result =
        await consentService
          .getConsentAccessStatus(
            id,
            appointmentId,
            req.session?.user
          );

      return res.status(200).json({
        success: true,
        message:
          'Consent access status retrieved successfully',
        data:
          result
      });

    } catch (error) {

      console.error(
        'getConsentAccessStatus error:',
        error
      );

      return res.status(
        error.statusCode ||
        500
      ).json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : 'Internal server error'
      });
    }
  };

module.exports = {
  getConsent,
  updateConsent,
  requestConsentAccess,
  verifyConsentAccess,
  getConsentAccessStatus
};