/**
 * @file    ai.util.js
 * @module  Shared Utilities
 * @desc    Centralized AI API client for the Care4U system.
 * Uses Google Gemini as the PRIMARY engine for superior multilingual (Sinhala) 
 * support and reasoning, with Graceful Degradation fallback to Groq (Llama 3.1). 
 * Includes a dedicated Vision function using Gemini for image processing.
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
 * Tries Gemini first (for superior Sinhala/multilingual support), falls back to 
 * Groq (speed/availability), then returns a manual review notice if both fail.
 * @param {string} prompt - The instructions and data for the AI to process.
 * @returns {Promise<string>} The generated text response.
 */
const generateAIResponse = async (prompt) => {
  try {
      // --- PRIMARY SERVICE: Google Gemini (Superior Multilingual & Reasoning) ---
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: { temperature: 0.1 }, // Low temperature for consistency
      });
      const result = await model.generateContent(prompt);
      
      return result.response.text();

  } catch (geminiError) {
    console.error('Gemini AI Generation Error:', geminiError.message);
    console.warn('Gemini failed. Engaging Groq Fallback Circuit...');
    
    try {
      // --- SECONDARY SERVICE: Groq (Llama 3.1 70B - High Speed Fallback) ---
      const groqResponse = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b', // Maintaining your existing model string
        temperature: 0.1, 
        seed: 42,          
      });
      
      return groqResponse.choices[0].message.content;

    } catch (groqError) {
      console.error('Groq AI Fallback Error:', groqError.message);

      // --- FINAL SAFETY NET: Manual Review Notice ---
      console.warn('Both Gemini and Groq are offline. Returning manual-review notice.');

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
      generationConfig: { temperature: 0.1 }, 
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
  generateAIVisionResponse,
};