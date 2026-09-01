/**
 * @file    labTestSearch.js
 * @module  Utils
 * @desc    Client-side fuzzy search for lab test types.
 *          Powered by fuse.js for typo-tolerance and speed — mirrors the
 *          same pattern as medicineSearch.js, but searches whatever test
 *          list is passed in (each laboratory has its own available_tests),
 *          rather than one fixed list.
 * @author  Tharindu (S/21/166)
 */

import Fuse from 'fuse.js';

const fuseOptions = {
  threshold: 0.3,
  distance: 100,
  minMatchCharLength: 2,
};

/**
 * Searches a given list of lab test names for the query.
 * If the query is empty, returns an empty array (avoids showing the full
 * list by default — same behavior as searchMedicines).
 * @param {string[]} testList - The available test names for the selected lab
 * @param {string} query - The search string
 * @returns {string[]} List of matching test names
 */
export const searchLabTests = (testList, query) => {
  if (!query || query.trim() === '' || !testList || testList.length === 0) {
    return [];
  }
  const fuse = new Fuse(testList, fuseOptions);
  return fuse.search(query).map((result) => result.item);
};