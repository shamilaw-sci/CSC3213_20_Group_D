/**
 * @file    ai.util.js
 * @module  Shared Utilities
 * @desc    Centralized AI API client for the Care4U system.
 * Uses Groq (Llama 3.1) for blazing-fast primary text generation, with a Graceful Degradation
 * fallback to Google Gemini. Includes a dedicated Vision function using Gemini for image processing.
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
 * Tries Groq first (speed), falls back to Gemini (reliability), then returns a
 * plain "please check manually" notice if both cloud services are unavailable.
 * Uses a low, fixed temperature and seed so identical prompts (e.g. the clinical
 * summary prompt, which a doctor may regenerate) produce consistent, reproducible
 * output rather than flip-flopping on judgment calls like "is this follow-up outstanding".
 * @param {string} prompt - The instructions and data for the AI to process.
 * @returns {Promise<string>} The generated text response.
 */
const generateAIResponse = async (prompt) => {
  try {
      // --- PRIMARY SERVICE: Groq (Llama 3.1 70B - High Speed & High Reasoning) ---
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b', // Upgraded to 70B for strict prompt adherence
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

      // --- FINAL SAFETY NET: Manual Review Notice ---
      // Both AI services are unavailable. Rather than re-parsing and re-displaying
      // records/conditions the doctor can already see in their own dedicated
      // UI sections on this page, just point them there directly.
      console.warn('Both Groq and Gemini are offline. Returning manual-review notice.');

      return `### ⚠️ AI Summary Unavailable\n\nBoth AI services are currently offline and a summary could not be generated. Please refer to the **Chronic Conditions**, **Known Allergies**, and **Medical Records** sections above for this patient's full history.`;
    }
  }
};

/**
 * Analyzes an image using AI Vision.
 * Exclusively uses Gemini, as it natively handles base64 image inputs highly efficiently.
 * @param {string} prompt - Instructions for data extraction.
 * @param {Buffer} imageBuffer - The raw image file buffer.
 * @param {string} mimeType - The mime type of the image (e.g., 'image/jpeg').
 * @returns {Promise<string>} The generated text (JSON) response.
 */
const generateAIVisionResponse = async (prompt, imageBuffer, mimeType) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash', 
      generationConfig: { temperature: 0.1 }, // Low temperature for factual extraction, no creative guessing
    });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error('AI Vision Generation Error:', error.message);
    throw new Error('Failed to extract data from image. Please enter details manually.');
  }
};

module.exports = {
  generateAIResponse,
  generateAIVisionResponse, // Exporting the new Vision function
};