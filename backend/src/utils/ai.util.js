/**
 * @file    ai.util.js
 * @module  Shared Utilities
 * @desc    Centralized AI API client for the Care4U system.
 * Uses Groq (Llama 3.1) for blazing-fast primary generation, with a Graceful Degradation
 * fallback to Google Gemini, and a final local data-extraction fallback if all APIs are offline.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// --- 1. Initialize Gemini ---
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment variables.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 2. Initialize Groq ---
if (!process.env.GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY is not defined in the environment variables.');
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generates text using AI based on a provided prompt.
 * Tries Groq first (speed), falls back to Gemini (reliability), then extracts local data.
 * Uses a low, fixed temperature and seed so identical prompts (e.g. the clinical
 * summary prompt, which a doctor may regenerate) produce consistent, reproducible
 * output rather than flip-flopping on judgment calls like "is this follow-up outstanding".
 * @param {string} prompt - The instructions and data for the AI to process.
 * @returns {Promise<string>} The generated text response.
 */
const generateAIResponse = async (prompt) => {
  try {
      // --- PRIMARY SERVICE: Groq (Llama 3.3 70B - High Speed & High Reasoning) ---
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Upgraded to 70B for strict prompt adherence
        temperature: 0.1, // Low, near-deterministic — avoids inconsistent judgment calls on repeated generations
        seed: 42,          // Fixed seed for reproducibility across calls with identical input
      });
      
      return groqResponse.choices[0].message.content;

  } catch (groqError) {
    console.error('Groq AI Generation Error:', groqError.message);
    console.warn('Groq failed. Engaging Gemini Fallback Circuit...');
    
    try {
      // --- SECONDARY SERVICE: Google Gemini (Reliability) ---
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: { temperature: 0.1 }, // Match Groq's low temperature for consistency
      });
      const result = await model.generateContent(prompt);
      
      return result.response.text();

    } catch (geminiError) {
      console.error('Gemini AI Fallback Error:', geminiError.message);
      
      // --- FINAL SAFETY NET: Local Data Extraction ---
      console.warn('Both Groq and Gemini are offline. Engaging local data extraction fallback.');
      
      // Attempt to extract the raw medical records from the prompt itself
      const recordsMatch = prompt.match(/--- PAST MEDICAL RECORDS ---\n([\s\S]*)/);
      
      if (recordsMatch && recordsMatch[1]) {
        const rawRecords = recordsMatch[1].trim().split('\n');
        
        if (rawRecords.length === 1 && rawRecords[0].includes('No past medical records')) {
           return "### ⚠️ Local Fallback (APIs Offline)\n\n* No past medical records found for this patient.";
        }

        // Format the raw data cleanly
        const formatted = rawRecords.map(record => {
          // Converts "- [Date] Type: Title" to "* **Date:** Type: Title"
          return record.replace('- [', '* **').replace('] ', ':** ');
        }).join('\n\n');

        return `### ⚠️ Local Fallback Timeline (APIs Offline)\n\n${formatted}\n\n*(Note: This is an un-summarized list extracted locally because all AI cloud services are currently unavailable.)*`;
      }

      // If extraction fails entirely
      return `### ⚠️ Local Fallback (APIs Offline)\n\n* Unable to generate summary. Please review the detailed table below manually.`;
    }
  }
};

module.exports = {
  generateAIResponse,
};