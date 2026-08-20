/**
 * @file    interaction.service.js
 * @module  DrugInteraction
 * @desc    Business logic for cross-checking a candidate prescription medicine
 *          against a patient's allergies and other active prescriptions.
 * @author  Tharindu (S/21/166)
 */

const interactionRepository = require('./interaction.repository');

const SEVERITY_ORDER = { severe: 3, moderate: 2, mild: 1 };

/**
 * Strips dosage/strength/form text from a medicine name to get its base drug name.
 * e.g. "Ibuprofen 400mg" -> "Ibuprofen", "Salbutamol Inhaler" -> "Salbutamol"
 * @param {string} medicineName - Full medicine name as stored/typed
 * @returns {string} Base drug name
 */
const getBaseDrugName = (medicineName) => {
  return medicineName
    .replace(/\(.*?\)/g, '')
    .replace(/\d.*$/, '')
    .replace(/\b(Inhaler|Tablet|Injection|Syrup|Capsule)\b/gi, '')
    .trim();
};

// Known drug-class relationships not obvious from name matching alone.
// Keys are lowercased base drug names; values are allergy class names they belong to.
const DRUG_ALLERGY_CLASSES = {
  amoxicillin: ['penicillin'],
  cefuroxime: ['cephalosporin', 'penicillin'], // partial cross-reactivity with penicillin allergy
};

/**
 * Checks a candidate medicine against a patient's recorded allergies.
 * @param {string} candidateBaseName - Base drug name being prescribed
 * @param {Array<Object>} allergies - Patient's { allergen, severity } records
 * @returns {Array<Object>} Allergy conflict warnings
 */
const checkAllergyConflicts = (candidateBaseName, allergies) => {
  const lowerCandidate = candidateBaseName.toLowerCase();
  const classNames = DRUG_ALLERGY_CLASSES[lowerCandidate] || [];

  return allergies
    .filter((allergy) => {
      const allergen = (allergy.allergen || '').toLowerCase().trim();
      if (!allergen) return false;
      const directMatch =
        allergen === lowerCandidate ||
        allergen.includes(lowerCandidate) ||
        lowerCandidate.includes(allergen);
      const classMatch = classNames.some((c) => allergen.includes(c));
      return directMatch || classMatch;
    })
    .map((allergy) => ({
      type: 'allergy',
      severity: (allergy.severity || 'moderate').toLowerCase(),
      message: `Patient has a recorded ${allergy.severity} allergy to ${allergy.allergen}.`,
      conflictWith: allergy.allergen,
    }));
};

/**
 * Checks a candidate medicine against the patient's other active prescriptions
 * using the drug_interactions reference table.
 * @param {string} candidateBaseName - Base drug name being prescribed
 * @param {Array<string>} activeMedicineNames - Full names of patient's active prescription medicines
 * @param {Array<Object>} interactionRows - Full drug_interactions reference table
 * @returns {Array<Object>} Drug interaction warnings
 */
const checkDrugInteractions = (candidateBaseName, activeMedicineNames, interactionRows) => {
  const lowerCandidate = candidateBaseName.toLowerCase();
  const activeBaseNames = activeMedicineNames.map((name) => getBaseDrugName(name).toLowerCase());

  const warnings = [];
  for (const row of interactionRows) {
    const a = row.drug_a.toLowerCase();
    const b = row.drug_b.toLowerCase();
    let conflictWith = null;
    if (a === lowerCandidate && activeBaseNames.includes(b)) conflictWith = row.drug_b;
    else if (b === lowerCandidate && activeBaseNames.includes(a)) conflictWith = row.drug_a;

    if (conflictWith) {
      warnings.push({
        type: 'drug_interaction',
        severity: row.severity,
        message: row.note,
        conflictWith,
      });
    }
  }
  return warnings;
};

/**
 * Runs the full conflict check for a candidate medicine being added to a patient's prescription.
 * @param {string} patientId - UUID of the patient
 * @param {string} medicineName - Full name of the medicine being prescribed (e.g. "Ibuprofen 400mg")
 * @returns {Promise<Array<Object>>} Combined list of warnings, most severe first
 */
const checkPrescriptionConflicts = async (patientId, medicineName) => {
  if (!patientId || !medicineName || !medicineName.trim()) {
    const error = new Error('Validation failed: patientId and medicineName are required');
    error.statusCode = 400;
    throw error;
  }

  const candidateBaseName = getBaseDrugName(medicineName);

  const [allergies, activeMedicines, interactionRows] = await Promise.all([
    interactionRepository.getAllergiesByPatientId(patientId),
    interactionRepository.getActiveMedicinesByPatientId(patientId),
    interactionRepository.getAllDrugInteractions(),
  ]);

  const allergyWarnings = checkAllergyConflicts(candidateBaseName, allergies);
  const interactionWarnings = checkDrugInteractions(candidateBaseName, activeMedicines, interactionRows);

  return [...allergyWarnings, ...interactionWarnings].sort(
    (x, y) => (SEVERITY_ORDER[y.severity] || 0) - (SEVERITY_ORDER[x.severity] || 0)
  );
};

module.exports = {
  checkPrescriptionConflicts,
  getBaseDrugName,
};