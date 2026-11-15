/**
 * @file    medicineSearch.js
 * @module  Utils
 * @desc    Client-side fuzzy search for common prescription medicines.
 *          Powered by fuse.js for typo-tolerance and speed.
 * @author  Tharindu (S/21/166)
 */

import Fuse from 'fuse.js';

const commonMedicines = [
  { name: 'Paracetamol 500mg', category: 'Analgesic', defaultDosage: '500mg', defaultFrequency: 'Three times daily' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', defaultDosage: '500mg', defaultFrequency: 'Three times daily' },
  { name: 'Ibuprofen 400mg', category: 'NSAID', defaultDosage: '400mg', defaultFrequency: 'Three times daily' },
  { name: 'Metformin 500mg', category: 'Antidiabetic', defaultDosage: '500mg', defaultFrequency: 'Twice daily' },
  { name: 'Amlodipine 5mg', category: 'Antihypertensive', defaultDosage: '5mg', defaultFrequency: 'Once daily' },
  { name: 'Omeprazole 20mg', category: 'PPI / Antacid', defaultDosage: '20mg', defaultFrequency: 'Once daily' },
  { name: 'Cetirizine 10mg', category: 'Antihistamine', defaultDosage: '10mg', defaultFrequency: 'Once daily' },
  { name: 'Azithromycin 500mg', category: 'Antibiotic', defaultDosage: '500mg', defaultFrequency: 'Once daily' },
  { name: 'Atorvastatin 20mg', category: 'Statin', defaultDosage: '20mg', defaultFrequency: 'Once daily at night' },
  { name: 'Losartan 50mg', category: 'Antihypertensive', defaultDosage: '50mg', defaultFrequency: 'Once daily' },
  { name: 'Salbutamol Inhaler', category: 'Bronchodilator', defaultDosage: '2 puffs', defaultFrequency: 'As needed' },
  { name: 'Cefuroxime 500mg', category: 'Antibiotic', defaultDosage: '500mg', defaultFrequency: 'Twice daily' },
  { name: 'Diclofenac 50mg', category: 'NSAID', defaultDosage: '50mg', defaultFrequency: 'Twice daily' },
  { name: 'Ranitidine 150mg', category: 'Antacid', defaultDosage: '150mg', defaultFrequency: 'Twice daily' },
  { name: 'Metronidazole 400mg', category: 'Antibiotic', defaultDosage: '400mg', defaultFrequency: 'Three times daily' },
  { name: 'Prednisolone 5mg', category: 'Corticosteroid', defaultDosage: '5mg', defaultFrequency: 'Once daily' },
  { name: 'Insulin (Human, Mixtard)', category: 'Antidiabetic', defaultDosage: '10 units', defaultFrequency: 'Before meals' },
  { name: 'Aspirin 75mg', category: 'Antiplatelet', defaultDosage: '75mg', defaultFrequency: 'Once daily' },
  { name: 'Domperidone 10mg', category: 'Antiemetic', defaultDosage: '10mg', defaultFrequency: 'Three times daily' },
  { name: 'Multivitamin Tablet', category: 'Supplement', defaultDosage: '1 tablet', defaultFrequency: 'Once daily' },
];

// Search the local medicine names and categories; small spelling mistakes may still match.
const fuseOptions = {
  keys: ['name', 'category'],
  threshold: 0.3,
  distance: 100,
  minMatchCharLength: 2,
};

// This is autocomplete only, not an external drug database or a clinical safety engine.
const fuse = new Fuse(commonMedicines, fuseOptions);

/**
 * Searches the local medicine database.
 * If the query is empty, returns an empty array (avoids showing all 20 by default).
 * @param {string} query - The search string
 * @returns {Array} List of matching medicine objects
 */
export const searchMedicines = (query) => {
  if (!query || query.trim() === '') {
    return [];
  }
  // Return editable medicine suggestions; the doctor chooses the final dose and frequency.
  return fuse.search(query).map(result => result.item);
};