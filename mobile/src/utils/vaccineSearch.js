/**
 * @file    vaccineSearch.js
 * @module  Utils
 * @desc    Client-side fuzzy search for standard Sri Lankan EPI vaccines.
 *          Powered by fuse.js for typo-tolerance and speed.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import Fuse from 'fuse.js';

const standardVaccines = [
  { name: 'BCG (Bacillus Calmette-Guérin)', category: 'Tuberculosis' },
  { name: 'OPV (Oral Polio Vaccine)', category: 'Polio' },
  { name: 'fIPV (Fractional Inactivated Polio Vaccine)', category: 'Polio' },
  { name: 'Pentavalent (DTP-HepB-Hib)', category: 'Diphtheria, Tetanus, Pertussis, Hep B, Hib' },
  { name: 'MMR (Measles, Mumps, Rubella)', category: 'Measles, Mumps, Rubella' },
  { name: 'JE (Japanese Encephalitis)', category: 'Japanese Encephalitis' },
  { name: 'HPV (Human Papillomavirus)', category: 'Cervical Cancer' },
  { name: 'aTd (Adult Tetanus Diphtheria)', category: 'Tetanus, Diphtheria' },
  { name: 'COVID-19 (Sinopharm)', category: 'COVID-19' },
  { name: 'COVID-19 (Pfizer)', category: 'COVID-19' },
  { name: 'COVID-19 (AstraZeneca)', category: 'COVID-19' },
  { name: 'COVID-19 (Moderna)', category: 'COVID-19' },
  { name: 'Influenza (Flu)', category: 'Influenza' },
  { name: 'Hepatitis A', category: 'Hepatitis' },
  { name: 'Hepatitis B', category: 'Hepatitis' },
  { name: 'Typhoid', category: 'Typhoid Fever' },
  { name: 'Varicella (Chickenpox)', category: 'Chickenpox' },
  { name: 'Rabies', category: 'Rabies' },
  { name: 'Cholera', category: 'Cholera' },
  { name: 'Yellow Fever', category: 'Yellow Fever' }
];

const fuseOptions = {
  keys: ['name', 'category'],
  threshold: 0.3,
  distance: 100,
  minMatchCharLength: 2,
};

const fuse = new Fuse(standardVaccines, fuseOptions);

/**
 * Searches the local vaccine database.
 * If the query is empty, returns all standard vaccines.
 * @param {string} query - The search string
 * @returns {Array} List of matching vaccine objects
 */
export const searchVaccines = (query) => {
  if (!query || query.trim() === '') {
    return standardVaccines;
  }
  return fuse.search(query).map(result => result.item);
};