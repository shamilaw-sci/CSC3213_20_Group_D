/**
 * @file    interaction.repository.js
 * @module  DrugInteraction
 * @desc    Database queries for drug interaction & allergy conflict checking.
 * @author  Tharindu (S/21/166)
 */

const { pool } = require('../../config/db');

/**
 * Gets all medicine names from a patient's currently active prescriptions.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array<string>>} List of medicine names currently prescribed
 */
const getActiveMedicinesByPatientId = async (patientId) => {
  const result = await pool.query(
    `SELECT DISTINCT pi.medicine_name
     FROM prescription_items pi
     JOIN prescriptions p ON pi.prescription_id = p.id
     WHERE p.patient_id = $1
       AND p.status = 'active'`,
    [patientId]
  );
  return result.rows.map(row => row.medicine_name);
};

/**
 * Gets a patient's recorded allergies.
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array<Object>>} List of { allergen, severity } objects
 */
const getAllergiesByPatientId = async (patientId) => {
  const result = await pool.query(
    `SELECT allergen, severity
     FROM patient_allergies
     WHERE patient_id = $1`,
    [patientId]
  );
  return result.rows;
};

/**
 * Gets the full drug interaction reference table.
 * Small, static reference dataset — fetched in full and matched in the
 * service layer, same "load once, match in code" pattern as the medicine
 * autocomplete dataset (medicineSearch.js).
 * @returns {Promise<Array<Object>>} List of { drug_a, drug_b, severity, note } rows
 */
const getAllDrugInteractions = async () => {
  const result = await pool.query(
    `SELECT drug_a, drug_b, severity, note FROM drug_interactions`
  );
  return result.rows;
};

module.exports = {
  getActiveMedicinesByPatientId,
  getAllergiesByPatientId,
  getAllDrugInteractions,
};