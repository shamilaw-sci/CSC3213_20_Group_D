/**
 * @file    consent.controller.js
 * @module  Patient
 * @desc    Handles requests to view privacy settings and request temporary doctor access.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const consentService =
  require('./consent.service');

const {
  logAudit
} = require('../../middleware/auditLog');



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



/**
 * FEATURE: Patient privacy settings
 * LOGIC: Return only the logged-in patient's saved privacy categories.
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
 * FEATURE: Change protected categories
 * LOGIC: Save the patient's selected categories and record the change in the audit log.
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



/**
 * FEATURE: Doctor requests private-record access
 * LOGIC: Ask the service for a patient consent email during an active consultation; log the request.
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
 * FEATURE: Verify patient consent code
 * LOGIC: Check the code in the service, record successful access or failed attempts, and return the result.
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
 * 400 covers an invalid/incorrect code.
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
 * FEATURE: Check temporary access
 * LOGIC: Tell the assigned doctor whether a valid consent grant still exists for this consultation.
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
