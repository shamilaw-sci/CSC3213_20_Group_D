/**
 * @file    patient.service.js
 * @module  Services
 * @desc    Frontend service functions for the Patient module.
 * Calls the Care4U backend patient API endpoints.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * Fetches a patient profile by patient UUID.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Object>} The patient data object
 */
export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/api/patients/${patientId}`);
  return response.data.data;
};

/**
 * Updates editable fields on a patient profile.
 * @param {string} patientId - UUID of the patient
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} The updated patient data object
 */
export const updatePatientProfile = async (patientId, data) => {
  const response = await api.put(
    `/api/patients/${patientId}`,
    data
  );

  return response.data.data;
};

/**
 * Uploads a new profile photo for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {File} file - Image file selected by the user
 * @returns {Promise<Object>} Updated patient data
 */
export const uploadPatientPhoto = async (
  patientId,
  file
) => {
  const formData =
    new FormData();

  formData.append(
    'photo',
    file
  );

  const response =
    await api.post(
      `/api/patients/${patientId}/photo`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data'
        },
      }
    );

  return response.data.data;
};

/**
 * Fetches all medical records for a patient.
 * @param {string} patientId - UUID of the patient
 * @param {string} role - Optional requester role
 */
export const getMedicalRecords = async (
  patientId,
  role
) => {
  const url =
    role
      ? `/api/patients/${patientId}/medical-records?role=${role}`
      : `/api/patients/${patientId}/medical-records`;

  const response =
    await api.get(url);

  return response.data.data;
};

/**
 * Fetches all prescriptions with medicine items for a patient.
 */
export const getPatientPrescriptions = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/prescriptions`
    );

  return response.data.data;
};

/**
 * Fetches a patient profile by their QR code ID.
 */
export const getPatientByQrCode = async (
  qrCodeId
) => {
  const response =
    await api.get(
      `/api/patients/qr/${qrCodeId}`
    );

  return response.data.data;
};

/**
 * Fetches all allergy records for a patient.
 */
export const getAllergies = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/allergies`
    );

  return response.data.data;
};

/**
 * Adds a new allergy for a patient.
 */
export const addAllergy = async (
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
        notes
      }
    );

  return response.data.data;
};

/**
 * Deletes an allergy record for a patient.
 */
export const deleteAllergy = async (
  patientId,
  allergyId
) => {
  const response =
    await api.delete(
      `/api/patients/${patientId}/allergies/${allergyId}`
    );

  return response.data;
};

/**
 * Fetches all chronic conditions for a patient.
 */
export const getConditions = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/conditions`
    );

  return response.data.data;
};

/**
 * Adds a chronic condition for a patient.
 */
export const addCondition = async (
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
        isPriority
      }
    );

  return response.data.data;
};

/**
 * Deletes a chronic condition.
 */
export const deleteCondition = async (
  patientId,
  conditionId
) => {
  const response =
    await api.delete(
      `/api/patients/${patientId}/conditions/${conditionId}`
    );

  return response.data;
};

/**
 * Fetches all active medical devices and implants
 * belonging to the authenticated patient.
 */
export const getMedicalDevices = async (
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
 */
export const addMedicalDevice = async (
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
 * Removes a medical device from the patient's
 * active profile.
 */
export const deleteMedicalDevice = async (
  patientId,
  deviceId
) => {
  const response =
    await api.delete(
      `/api/patients/${patientId}/medical-devices/${deviceId}`
    );

  return response.data;
};

/**
 * Fetches all active important medical background
 * records belonging to the authenticated patient.
 *
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of background records
 */
export const getHealthBackground = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/health-background`
    );

  return response.data.data;
};

/**
 * Adds an important medical background record
 * to the patient's profile.
 *
 * @param {string} patientId - UUID of the patient
 * @param {Object} backgroundData - Background information
 * @returns {Promise<Object>} Created background record
 */
export const addHealthBackground = async (
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
 * Removes an important medical background record
 * from the patient's active profile.
 *
 * @param {string} patientId - UUID of the patient
 * @param {string} backgroundId - UUID of the record
 * @returns {Promise<Object>} Success response
 */
export const deleteHealthBackground = async (
  patientId,
  backgroundId
) => {
  const response =
    await api.delete(
      `/api/patients/${patientId}/health-background/${backgroundId}`
    );

  return response.data;
};

/**
 * Fetches all active family medical history records.
 *
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} Array of family history records
 */
export const getFamilyHistory = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/family-history`
    );

  return response.data.data;
};

/**
 * Adds a family medical history record
 * to the patient's profile.
 *
 * @param {string} patientId - UUID of the patient
 * @param {Object} familyHistoryData - Family history information
 * @returns {Promise<Object>} Created family history record
 */
export const addFamilyHistory = async (
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
 * Removes a family medical history record
 * from the patient's active profile.
 *
 * @param {string} patientId - UUID of the patient
 * @param {string} familyHistoryId - UUID of the family history record
 * @returns {Promise<Object>} Success response
 */
export const deleteFamilyHistory = async (
  patientId,
  familyHistoryId
) => {
  const response =
    await api.delete(
      `/api/patients/${patientId}/family-history/${familyHistoryId}`
    );

  return response.data;
};

/**
 * Fetches all vaccination records for a patient.
 */
export const getVaccinations = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/vaccinations`
    );

  return response.data.data;
};

/**
 * Adds a vaccination record.
 */
export const addVaccination = async (
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
        notes
      }
    );

  return response.data.data;
};

/**
 * Adds multiple vaccination records.
 */
export const addBulkVaccinations = async (
  patientId,
  vaccinations
) => {
  const response =
    await api.post(
      `/api/patients/${patientId}/vaccinations/bulk`,
      {
        vaccinations
      }
    );

  return response.data.data;
};

/**
 * Deletes a vaccination record.
 */
export const deleteVaccination = async (
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
 * Uploads an image of a vaccination card and
 * returns AI-extracted details.
 */
export const scanVaccinationCard = async (
  patientId,
  file
) => {
  const formData =
    new FormData();

  formData.append(
    'image',
    file
  );

  const response =
    await api.post(
      `/api/patients/${patientId}/vaccinations/scan`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data'
        },
      }
    );

  return response.data.data;
};

/**
 * Fetches an AI-generated clinical summary.
 */
export const getPatientHistorySummary = async (
  patientId,
  role
) => {
  const url =
    role
      ? `/api/patients/${patientId}/summary?role=${role}`
      : `/api/patients/${patientId}/summary`;

  const response =
    await api.get(url);

  return response.data.data;
};

/**
 * Fetches completed laboratory reports.
 */
export const getLabReports = async (
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
 * Marks a laboratory report as read.
 */
export const markLabReportAsRead = async (
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

  } catch (error) {
    throw (
      error.response?.data ||
      error
    );
  }
};

/**
 * Fetches all appointments for a patient.
 */
export const getPatientAppointments = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/appointments`
    );

  return response.data.data;
};

/**
 * Retrieves privacy and consent settings.
 */
export const getConsentSettings = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/consent`
    );

  return (
    response.data?.data
      ?.locked_categories ||
    []
  );
};

/**
 * Updates privacy and consent settings.
 */
export const updateConsentSettings = async (
  patientId,
  lockedCategories
) => {
  const response =
    await api.put(
      `/api/patients/${patientId}/consent`,
      {
        lockedCategories
      }
    );

  return response.data?.data;
};