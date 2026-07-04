/**
 * @file    gemini.util.js
 * @module  Shared Utilities
 * @desc    Centralized Google Gemini API client for the Care4U system.
 * Provides a single, reusable interface for generating AI responses
 * to prevent code duplication across different modules (e.g., Patient, Doctor).
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure the API key is available
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment variables.');
}

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates text using the Gemini model based on a provided prompt.
 * Uses gemini-3.5-flash for fast, efficient text-based generation.
 * @param {string} prompt - The instructions and data for the AI to process.
 * @returns {Promise<string>} The generated text response from the AI.
 * @throws Will throw an error if the Gemini API request fails.
 */
const generateAIResponse = async (prompt) => {
  try {
    // For text-only tasks, gemini-3.5-flash is the recommended, fastest model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini AI Generation Error:', error);
    throw new Error('Failed to generate response from AI service.');
  }
};

module.exports = {
  generateAIResponse,
};