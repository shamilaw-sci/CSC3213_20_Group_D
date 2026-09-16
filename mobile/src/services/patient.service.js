/**
 * @file    patient.service.js
 * @module  Services
 * @desc    Mobile service functions for the Patient module.
 *          Calls the Care4U backend patient API endpoints.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/* =========================================================
   MULTIPART HELPERS
========================================================= */

/**
 * Returns a suitable file extension from an image MIME type.
 *
 * @param {string} mimeType
 * @returns {string}
 */
const getImageExtension = (
  mimeType
) => {
  switch (
    mimeType
  ) {
    case 'image/png':
      return 'png';

    case 'image/webp':
      return 'webp';

    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg';
  }
};

/**
 * Creates the React Native multipart object expected by FormData.
 *
 * @param {string} uri
 * @param {string} mimeType
 * @param {string} prefix
 * @returns {Object}
 */
const createMobileImageFile = (
  uri,
  mimeType = 'image/jpeg',
  prefix = 'image'
) => {
  const extension =
    getImageExtension(
      mimeType
    );

  return {
    uri,

    type:
      mimeType,

    name:
      `${prefix}-${Date.now()}.${extension}`,
  };
};

/* =========================================================
   PROFILE
========================================================= */

/**
 * Fetches a patient profile by patient UUID.
 *
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
export const getPatientProfile =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}`
      );

    return response.data.data;
  };

/**
 * Updates editable fields on a patient profile.
 *
 * @param {string} patientId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updatePatientProfile =
  async (
    patientId,
    data
  ) => {
    const response =
      await api.put(
        `/api/patients/${patientId}`,
        data
      );

    return response.data.data;
  };

/**
 * Uploads a patient profile photo from React Native.
 *
 * @param {string} patientId
 * @param {string} uri
 * @param {string} mimeType
 * @returns {Promise<Object>}
 */
export const uploadPatientPhoto =
  async (
    patientId,
    uri,
    mimeType =
      'image/jpeg'
  ) => {
    const formData =
      new FormData();

    formData.append(
      'photo',
      createMobileImageFile(
        uri,
        mimeType,
        'patient-photo'
      )
    );

    const response =
      await api.post(
        `/api/patients/${patientId}/photo`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

    return response.data.data;
  };

/* =========================================================
   MEDICAL RECORDS
========================================================= */

/**
 * Fetches all medical records for a patient.
 *
 * @param {string} patientId
 * @param {string} role
 * @returns {Promise<Array>}
 */
export const getMedicalRecords =
  async (
    patientId,
    role
  ) => {
    const url =
      role
        ? `/api/patients/${patientId}/medical-records?role=${role}`
        : `/api/patients/${patientId}/medical-records`;

    const response =
      await api.get(
        url
      );

    return response.data.data;
  };

/* =========================================================
   PRESCRIPTIONS
========================================================= */

/**
 * Fetches prescriptions with medicine items.
 *
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getPatientPrescriptions =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/prescriptions`
      );

    return response.data.data;
  };

/* =========================================================
   QR LOOKUP
========================================================= */

/**
 * Fetches a patient using their Care4U QR code ID.
 *
 * @param {string} qrCodeId
 * @returns {Promise<Object>}
 */
export const getPatientByQrCode =
  async (
    qrCodeId
  ) => {
    const response =
      await api.get(
        `/api/patients/qr/${qrCodeId}`
      );

    return response.data.data;
  };

/* =========================================================
   ALLERGIES
========================================================= */

/**
 * Fetches allergy records.
 */
export const getAllergies =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/allergies`
      );

    return response.data.data;
  };

/**
 * Adds an allergy.
 */
export const addAllergy =
  async (
    patientId,
    allergen,
    severity,
    notes
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/allergies`,
        {
          allergen,
          severity,
          notes,
        }
      );

    return response.data.data;
  };

/**
 * Removes an allergy.
 */
export const deleteAllergy =
  async (
    patientId,
    allergyId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/allergies/${allergyId}`
      );

    return response.data;
  };

/* =========================================================
   CHRONIC CONDITIONS
========================================================= */

/**
 * Fetches chronic conditions.
 */
export const getConditions =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/conditions`
      );

    return response.data.data;
  };

/**
 * Adds a chronic condition.
 */
export const addCondition =
  async (
    patientId,
    condition,
    diagnosedAt,
    notes,
    isPriority
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/conditions`,
        {
          condition,
          diagnosedAt,
          notes,
          isPriority,
        }
      );

    return response.data.data;
  };

/**
 * Removes a chronic condition.
 */
export const deleteCondition =
  async (
    patientId,
    conditionId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/conditions/${conditionId}`
      );

    return response.data;
  };

/* =========================================================
   MEDICAL DEVICES & IMPLANTS
========================================================= */

/**
 * Fetches active medical devices and implants.
 *
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getMedicalDevices =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/medical-devices`
      );

    return response.data.data;
  };

/**
 * Adds a medical device or implant.
 *
 * Expected fields:
 * {
 *   deviceName,
 *   deviceType,
 *   implantedAt,
 *   notes,
 *   isEmergencyRelevant
 * }
 */
export const addMedicalDevice =
  async (
    patientId,
    deviceData
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/medical-devices`,
        deviceData
      );

    return response.data.data;
  };

/**
 * Removes a medical device from the active profile.
 */
export const deleteMedicalDevice =
  async (
    patientId,
    deviceId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/medical-devices/${deviceId}`
      );

    return response.data;
  };

/* =========================================================
   IMPORTANT MEDICAL BACKGROUND
========================================================= */

/**
 * Fetches important medical background records.
 *
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getHealthBackground =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/health-background`
      );

    return response.data.data;
  };

/**
 * Adds an important medical background record.
 *
 * Expected fields:
 * {
 *   backgroundType,
 *   title,
 *   eventDate,
 *   notes,
 *   isEmergencyRelevant
 * }
 */
export const addHealthBackground =
  async (
    patientId,
    backgroundData
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/health-background`,
        backgroundData
      );

    return response.data.data;
  };

/**
 * Removes an important medical background record.
 */
export const deleteHealthBackground =
  async (
    patientId,
    backgroundId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/health-background/${backgroundId}`
      );

    return response.data;
  };

/* =========================================================
   FAMILY MEDICAL HISTORY
========================================================= */

/**
 * Fetches active family medical history records.
 *
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getFamilyHistory =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/family-history`
      );

    return response.data.data;
  };

/**
 * Adds a family medical history record.
 *
 * Expected fields:
 * {
 *   relation,
 *   condition,
 *   notes,
 *   isEmergencyRelevant
 * }
 */
export const addFamilyHistory =
  async (
    patientId,
    familyHistoryData
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/family-history`,
        familyHistoryData
      );

    return response.data.data;
  };

/**
 * Removes a family medical history record.
 */
export const deleteFamilyHistory =
  async (
    patientId,
    familyHistoryId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/family-history/${familyHistoryId}`
      );

    return response.data;
  };

/* =========================================================
   VACCINATIONS
========================================================= */

/**
 * Fetches vaccination records.
 */
export const getVaccinations =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/vaccinations`
      );

    return response.data.data;
  };

/**
 * Adds one vaccination record.
 */
export const addVaccination =
  async (
    patientId,
    vaccineName,
    dateAdministered,
    doseNumber,
    notes
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/vaccinations`,
        {
          vaccineName,
          dateAdministered,
          doseNumber,
          notes,
        }
      );

    return response.data.data;
  };

/**
 * Adds multiple vaccination records.
 */
export const addBulkVaccinations =
  async (
    patientId,
    vaccinations
  ) => {
    const response =
      await api.post(
        `/api/patients/${patientId}/vaccinations/bulk`,
        {
          vaccinations,
        }
      );

    return response.data.data;
  };

/**
 * Removes a vaccination record.
 */
export const deleteVaccination =
  async (
    patientId,
    vaccinationId
  ) => {
    const response =
      await api.delete(
        `/api/patients/${patientId}/vaccinations/${vaccinationId}`
      );

    return response.data;
  };

/**
 * Uploads a vaccination-card image from React Native
 * and returns AI-extracted vaccination information.
 *
 * This does not write to the database.
 *
 * @param {string} patientId
 * @param {string} uri
 * @param {string} mimeType
 * @returns {Promise<Array>}
 */
export const scanVaccinationCard =
  async (
    patientId,
    uri,
    mimeType =
      'image/jpeg'
  ) => {
    const formData =
      new FormData();

    formData.append(
      'image',
      createMobileImageFile(
        uri,
        mimeType,
        'vaccination-card'
      )
    );

    const response =
      await api.post(
        `/api/patients/${patientId}/vaccinations/scan`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

    return response.data.data;
  };

/* =========================================================
   AI HISTORY SUMMARY
========================================================= */

/**
 * Fetches an AI-generated clinical history summary.
 */
export const getPatientHistorySummary =
  async (
    patientId,
    role
  ) => {
    const url =
      role
        ? `/api/patients/${patientId}/summary?role=${role}`
        : `/api/patients/${patientId}/summary`;

    const response =
      await api.get(
        url
      );

    return response.data.data;
  };

/* =========================================================
   LAB REPORTS
========================================================= */

/**
 * Fetches completed lab reports.
 */
export const getLabReports =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/lab-reports`
      );

    if (
      !response.data.success
    ) {
      throw new Error(
        response.data.message ||
        'Failed to fetch lab reports'
      );
    }

    return response.data.data;
  };

/**
 * Marks a lab report as read.
 */
export const markLabReportAsRead =
  async (
    patientId,
    reportId
  ) => {
    try {
      const response =
        await api.put(
          `/api/patients/${patientId}/lab-reports/${reportId}/read`
        );

      if (
        !response.data.success
      ) {
        throw new Error(
          response.data.message ||
          'Failed to mark report as read'
        );
      }

      return response.data.data;

    } catch (
      error
    ) {
      throw (
        error.response
          ?.data ||
        error
      );
    }
  };

/* =========================================================
   APPOINTMENTS
========================================================= */

/**
 * Fetches appointments belonging to the patient.
 */
export const getPatientAppointments =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/appointments`
      );

    return response.data.data;
  };

/* =========================================================
   PRIVACY & CONSENT
========================================================= */

/**
 * Retrieves locked privacy categories.
 */
export const getConsentSettings =
  async (
    patientId
  ) => {
    const response =
      await api.get(
        `/api/patients/${patientId}/consent`
      );

    return (
      response.data
        ?.data
        ?.locked_categories ||
      []
    );
  };

/**
 * Updates locked privacy categories.
 */
export const updateConsentSettings =
  async (
    patientId,
    lockedCategories
  ) => {
    const response =
      await api.put(
        `/api/patients/${patientId}/consent`,
        {
          lockedCategories,
        }
      );

    return response.data
      ?.data;
  };