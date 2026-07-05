/**
 * @file    dateUtils.js
 * @module  Patient
 * @desc    Date/age calculation helpers used across the Patient module.
 *          Computes exact patient age from date of birth, correctly
 *          handling leap years, and formats it for clinical display
 *          (months for infants under 2, years otherwise).
 * @author  Wasana Karunanayaka (S/21/081)
 */

/**
 * Calculates exact age in completed years from a date of birth.
 * Leap years are handled correctly because this compares full
 * calendar dates (year/month/day), not just year subtraction —
 * so someone born Feb 29 isn't miscounted in a non-leap year.
 * @param {string|Date} dateOfBirth - ISO date string or Date object
 * @returns {number} Age in completed years
 */
const calculateAgeInYears = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  // If we haven't reached the birth month/day yet this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }

  return years;
};

/**
 * Calculates exact age in completed months from a date of birth.
 * Used for infants under 2 years old, where "1 year old" is far
 * less clinically useful than "14 months old."
 * @param {string|Date} dateOfBirth - ISO date string or Date object
 * @returns {number} Age in completed months
 */
const calculateAgeInMonths = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let months = (today.getFullYear() - dob.getFullYear()) * 12;
  months += today.getMonth() - dob.getMonth();

  // If we haven't reached the birth day yet this month, subtract 1
  if (today.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

/**
 * Returns a clinically formatted age string from a date of birth.
 * - Under 2 years old: "14 months"
 * - 2 years and older: "34 years"
 * - No DOB provided: "—"
 * @param {string|Date|null} dateOfBirth - ISO date string, Date object, or null
 * @returns {string} Formatted age string ready for display
 */
const formatAge = (dateOfBirth) => {
  if (!dateOfBirth) return '—';

  const years = calculateAgeInYears(dateOfBirth);

  if (years < 2) {
    const months = calculateAgeInMonths(dateOfBirth);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  return `${years} ${years === 1 ? 'year' : 'years'}`;
};

export { calculateAgeInYears, calculateAgeInMonths, formatAge };