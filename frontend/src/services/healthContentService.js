/**
 * @file    healthContentService.js
 * @module  Patient
 * @desc    API calls and smart filtering logic for the Health Awareness Feed.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import api from './api';

/**
 * Fetches all published health content from the backend.
 * The public endpoint returns published articles only.
 */
export const getHealthContent = async () => {
  try {
    const response = await api.get('/api/admin/health-content');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching health content:', error);
    return []; // Return empty array on failure so the UI doesn't crash
  }
};

/**
 * FEATURE: Select relevant awareness articles
 * LOGIC: Keep the last article for each exact title in memory; do not delete database content.
 * Rank articles containing any supplied allergy name in their title/category/body before other articles.
 * With no allergies, return the unique articles in their existing order; conditions are not used.
 */
export const getPersonalizedFeed = (articles, patientAllergies = []) => {
  if (!articles || articles.length === 0) return [];

  // Map replaces an earlier article with the same exact title.
  const uniqueArticles = Array.from(new Map(articles.map(item => [item.title, item])).values());

  if (!patientAllergies || patientAllergies.length === 0) return uniqueArticles;

  // Convert allergies to a lowercase array for easy keyword matching
  const allergyKeywords = patientAllergies.map(a => a.allergen?.toLowerCase() || '');

  // Create a copy of the unique articles array to sort
  return [...uniqueArticles].sort((a, b) => {
    // Combine title, category, and body into one searchable text block
    const aText = `${a.title} ${a.category} ${a.body}`.toLowerCase();
    const bText = `${b.title} ${b.category} ${b.body}`.toLowerCase();

    // Check if article A or B mentions any of the patient's allergies
    const aMatches = allergyKeywords.some(keyword => aText.includes(keyword)) ? 1 : 0;
    const bMatches = allergyKeywords.some(keyword => bText.includes(keyword)) ? 1 : 0;

    // Sort descending (matched articles = 1, unmatched = 0. 1 goes before 0)
    return bMatches - aMatches;
  });
};
