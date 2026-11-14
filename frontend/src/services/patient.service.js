/**
 * @file    patient.service.js
 * @module  Patient / Services
 * @desc    Frontend service functions for the Patient module.
 * Calls the Care4U backend patient API endpoints.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import api from './api';

/**
 * FEATURE: Confirm profile, record and consent responses
 * LOGIC: Require success=true and the expected object/list shape for callers using this helper.
 * An empty array is valid; a rejected or malformed envelope throws instead of reporting success.
 * Other service functions below still return their existing response payloads directly.
 */
const patientData = (response, kind = 'object') => {
  const data = response?.data?.data;
  if (response?.data?.success !== true || !data ||
      (kind === 'array' ? !Array.isArray(data) : typeof data !== 'object' || Array.isArray(data))) {
    throw new Error('Care4U did not confirm this request. Please try again.');
  }
  return data;
};


/**
 * Fetches a patient profile by patient UUID.
 */
export const getPatientProfile = async (
  patientId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}`
    );

  const data = patientData(response);
  if (typeof data.id !== 'string') throw new Error('The patient profile was not confirmed. Please try again.');
  return data;
};

/**
 * Updates editable fields on a patient profile.
 */
export const updatePatientProfile = async (
  patientId,
  data
) => {
  const response =
    await api.put(
      `/api/patients/${patientId}`,
      data
    );

  const confirmed = patientData(response);
  if (typeof confirmed.id !== 'string') throw new Error('The patient profile was not confirmed. Please try again.');
  return confirmed;
};

/**
 * Uploads a new profile photo for a patient.
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

  const data = patientData(response);
  if (typeof data.id !== 'string') throw new Error('The patient profile was not confirmed. Please try again.');
  return data;
};

/**
 * Fetches medical records for a patient.
 *
 * Doctors must supply appointmentId for an assigned, in-progress consultation.
 * The legacy role argument is not sent and cannot grant access; backend session rules apply.
 */
export const getMedicalRecords = async (
  patientId,
  role,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/medical-records`,
      {
        params:
          appointmentId
            ? {
                appointmentId
              }
            : {}
      }
    );

  return patientData(response, 'array');
};

/**
 * Fetches all prescriptions with medicine items for a patient.
 */
export const getPatientPrescriptions = async (
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/prescriptions`,
      { params: appointmentId ? { appointmentId } : {} }
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
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/allergies`,
      { params: appointmentId ? { appointmentId } : {} }
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
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/medical-devices`,
      { params: appointmentId ? { appointmentId } : {} }
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
 */
export const getHealthBackground = async (
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/health-background`,
      { params: appointmentId ? { appointmentId } : {} }
    );

  return response.data.data;
};

/**
 * Adds an important medical background record
 * to the patient's profile.
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
 */
export const getFamilyHistory = async (
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/family-history`,
      { params: appointmentId ? { appointmentId } : {} }
    );

  return response.data.data;
};

/**
 * Adds a family medical history record
 * to the patient's profile.
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
 *
 * Supply appointmentId during a doctor consultation so the backend can check access and consent.
 * The legacy role argument is not sent; this function does not bypass privacy filtering.
 */
export const getPatientHistorySummary = async (
  patientId,
  role,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/summary`,
      {
        params:
          appointmentId
            ? {
                appointmentId
              }
            : {}
      }
    );

  return response.data.data;
};

/**
 * Fetches completed laboratory reports.
 */
export const getLabReports = async (
  patientId,
  appointmentId = null
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/lab-reports`,
      { params: appointmentId ? { appointmentId } : {} }
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

/* PRIVACY & CONSENT SETTINGS */

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

  const data = patientData(response);
  if (!Array.isArray(data.locked_categories)) throw new Error('Privacy settings could not be read. Please try again.');
  return data.locked_categories;
};

/**
 * FEATURE: Save privacy category locks
 * LOGIC: Send the complete category list and accept only a confirmed response containing locked_categories.
 * The screen keeps the last confirmed settings if this request rejects.
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

  const data = patientData(response);
  if (!Array.isArray(data.locked_categories)) throw new Error('Privacy changes were not confirmed. Please try again.');
  return data;
};

/* TEMPORARY DOCTOR CONSENT ACCESS */

/**
 * Retrieves temporary consent-access status for
 * the current doctor consultation.
 */
export const getConsentAccessStatus = async (
  patientId,
  appointmentId
) => {
  const response =
    await api.get(
      `/api/patients/${patientId}/consent/access/status`,
      {
        params: {
          appointmentId
        }
      }
    );

  const data = patientData(response);
  if (typeof data.hasActiveGrant !== 'boolean' || !Array.isArray(data.lockedCategories) || !Array.isArray(data.grantedCategories)) throw new Error('Consent status could not be read. Please try again.');
  return data;
};

/**
 * Requests a 6-digit patient consent OTP.
 *
 * The OTP is sent by the backend to the patient's
 * registered Care4U email address.
 */
export const requestConsentAccess = async (
  patientId,
  appointmentId
) => {
  const response =
    await api.post(
      `/api/patients/${patientId}/consent/access/request`,
      {
        appointmentId
      }
    );

  const data = patientData(response);
  if (typeof data.alreadyGranted !== 'boolean' || !Number.isFinite(Date.parse(data.expiresAt)) || (!data.alreadyGranted && typeof data.requestId !== 'string')) throw new Error('The consent request was not confirmed. Please try again.');
  return data;
};

/**
 * FEATURE: Confirm temporary doctor consent
 * LOGIC: Send the appointment and patient-provided code; require granted=true, a category list
 * and a valid expiry before reporting success. The backend validates the code and creates the grant.
 */
export const verifyConsentAccess = async (
  patientId,
  appointmentId,
  otpCode
) => {
  const response =
    await api.post(
      `/api/patients/${patientId}/consent/access/verify`,
      {
        appointmentId,
        otpCode
      }
    );

  const data = patientData(response);
  if (data.granted !== true || !Array.isArray(data.grantedCategories) || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error('Temporary access was not confirmed. Please try again.');
  return data;
};
