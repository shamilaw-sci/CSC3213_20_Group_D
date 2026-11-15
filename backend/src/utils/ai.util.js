/**
 * @file    ai.util.js
 * @module  Shared Utilities
 * @desc    Centralized AI API client for the Care4U system.
 *          Uses Google Gemini as the primary AI engine with retry handling
 *          for temporary provider failures and Groq GPT-OSS 120B as a
 *          graceful-degradation fallback.
 *          Both providers receive the same Care4U response instructions
 *          for consistent language, safety, and mobile-friendly formatting.
 *          Gemini is also used for AI Vision image-processing tasks.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const {
  GoogleGenerativeAI,
} = require('@google/generative-ai');

const Groq = require('groq-sdk');

/* =========================================================
   MODEL CONFIGURATION
========================================================= */

const GEMINI_TEXT_MODEL =
  'gemini-3.8-flash';

const GEMINI_VISION_MODEL =
  'gemini-3.8-flash';

const GROQ_FALLBACK_MODEL =
  'openai/gpt-oss-120b';

/* =========================================================
   GEMINI RETRY CONFIGURATION
========================================================= */

/**
 * Gemini receives three chances before Care4U switches
 * to the Groq fallback.
 *
 * Attempt 1 -> immediate
 * Attempt 2 -> after 1.5 seconds
 * Attempt 3 -> after another 3 seconds
 */
const GEMINI_MAX_ATTEMPTS =
  3;

const GEMINI_RETRY_DELAYS = [
  1500,
  3000,
];

/* =========================================================
   INITIALIZE GEMINI
========================================================= */

if (
  !process.env
    .GEMINI_API_KEY
) {
  console.warn(
    'WARNING: GEMINI_API_KEY is not defined in the environment variables.'
  );
}

// Optional integrations must not prevent unrelated API modules from loading.
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/* =========================================================
   INITIALIZE GROQ
========================================================= */

if (
  !process.env
    .GROQ_API_KEY
) {
  console.warn(
    'WARNING: GROQ_API_KEY is not defined in the environment variables.'
  );
}

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/* =========================================================
   SHARED CARE4U RESPONSE RULES
========================================================= */

/**
 * These instructions are applied to both Gemini and Groq.
 *
 * This keeps the fallback response style close to the primary
 * model instead of allowing the fallback provider to suddenly
 * return wide tables, repetitive translations, or unsuitable
 * mobile formatting.
 */
const CARE4U_RESPONSE_RULES = `
CARE4U RESPONSE RULES:

LANGUAGE

1. Follow the language requested in the task.

2. If English is requested:
   - Respond naturally in English.
   - Use simple, patient-friendly wording unless the task specifically
     requires professional or technical terminology.

3. If Sinhala is requested:
   - Respond naturally and fluently in Sinhala.
   - Prefer natural Sinhala phrasing rather than literal word-for-word
     translation from English.
   - Avoid repeating the same Sinhala word, sentence, or explanation.
   - Do not produce meaningless or repetitive Sinhala filler.
   - Standard medical terms, medicine names, Care4U feature names,
     and commonly understood English clinical terms may remain in English
     when this improves clarity.
   - Explain unfamiliar medical terms naturally when useful.
   - Do not transliterate Sinhala into English letters unless the user
     wrote that way or specifically asks for transliteration.

MOBILE RESPONSE FORMAT

4. The response will usually be displayed inside a mobile healthcare
   chat interface.

5. Keep the structure easy to read on a narrow mobile screen.

6. Prefer:
   - short paragraphs
   - short headings
   - bullet points
   - numbered steps
   - clearly labelled sections

7. Keep individual bullet points reasonably short.

8. NEVER use Markdown tables.

9. If information would normally be presented in a table, convert it
   into headings and bullet points instead.

10. Do not create unnecessarily large walls of text.

11. Do not repeat the same information in several different sections
    unless repetition is necessary for patient safety.

MARKDOWN

12. Markdown may be used for:
    - short headings
    - bold text
    - bullet lists
    - numbered lists

13. Markdown tables are prohibited under all circumstances.

MEDICAL SAFETY

14. Do not present AI-generated information as a confirmed medical
    diagnosis.

15. Do not claim that the AI replaces a doctor or other qualified
    healthcare professional.

16. Do not independently prescribe medication.

17. Do not instruct a patient to begin, stop, replace, or change the
    dosage of prescribed medication without appropriate professional
    medical guidance.

18. Existing medicines supplied in Care4U patient data may be explained
    or summarized when the task requires it, but do not invent medicines,
    dosages, or treatment plans.

19. Do not invent:
    - patient information
    - diagnoses
    - symptoms
    - medications
    - laboratory results
    - appointments
    - allergies
    - medical records
    - clinical history

20. Preserve the facts, constraints, and patient information supplied
    in the task.

EMERGENCY GUIDANCE

21. If the described situation may be urgent or life-threatening:
    - prioritize immediate safety actions
    - clearly recommend appropriate emergency medical assistance
    - keep emergency instructions direct and easy to understand
    - do not bury urgent advice inside a long response

22. If the available information is insufficient, say so instead of
    inventing an answer.

GENERAL QUALITY

23. Answer the actual question directly.

24. Avoid unnecessary introductory filler.

25. Avoid repetitive conclusions.

26. Be concise enough for mobile reading while still including the
    information necessary to answer the request safely.

Follow all of these rules together with the task-specific instructions
provided below.
`;

/* =========================================================
   HELPERS
========================================================= */

/**
 * Delays execution for the supplied number of milliseconds.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
const sleep = (
  milliseconds
) => {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
};

/**
 * Checks whether a Gemini failure is likely temporary and
 * therefore worth retrying.
 *
 * Care4U retries temporary provider/network problems such as:
 * 408 - Request Timeout
 * 429 - Rate Limit
 * 500 - Internal Server Error
 * 502 - Bad Gateway
 * 503 - Service Unavailable / High Demand
 * 504 - Gateway Timeout
 *
 * Invalid prompts and other non-temporary errors are not retried.
 *
 * @param {Error} error
 * @returns {boolean}
 */
const isRetryableGeminiError = (
  error
) => {
  const status =
    Number(
      error?.status ||
      error?.response
        ?.status ||
      0
    );

  const retryableStatuses =
    [
      408,
      429,
      500,
      502,
      503,
      504,
    ];

  if (
    retryableStatuses
      .includes(
        status
      )
  ) {
    return true;
  }

  const message =
    String(
      error?.message ||
      ''
    ).toLowerCase();

  return (
    message.includes(
      '503'
    ) ||
    message.includes(
      '502'
    ) ||
    message.includes(
      '504'
    ) ||
    message.includes(
      '500'
    ) ||
    message.includes(
      '429'
    ) ||
    message.includes(
      '408'
    ) ||
    message.includes(
      'high demand'
    ) ||
    message.includes(
      'service unavailable'
    ) ||
    message.includes(
      'temporarily unavailable'
    ) ||
    message.includes(
      'rate limit'
    ) ||
    message.includes(
      'timeout'
    ) ||
    message.includes(
      'timed out'
    )
  );
};

/**
 * Runs a Gemini operation with retry handling.
 *
 * @param {Function} operation
 * @param {string} operationName
 * @returns {Promise<any>}
 */
const runGeminiWithRetry =
  async (
    operation,
    operationName
  ) => {
    let lastError =
      null;

    for (
      let attempt = 1;
      attempt <=
        GEMINI_MAX_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const result =
          await operation();

        if (
          attempt > 1
        ) {
          console.log(
            `${operationName} succeeded on attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}.`
          );
        }

        return result;

      } catch (
        error
      ) {
        lastError =
          error;

        console.error(
          `${operationName} attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed:`,
          'Provider request failed.'
        );

        // Retry only transient Gemini failures and stop after the configured attempt limit.
        const canRetry =
          attempt <
            GEMINI_MAX_ATTEMPTS &&
          isRetryableGeminiError(
            error
          );

        if (
          !canRetry
        ) {
          break;
        }

        const delay =
          GEMINI_RETRY_DELAYS[
            attempt - 1
          ];

        console.warn(
          `${operationName} temporarily unavailable. Retrying in ${delay} ms...`
        );

        await sleep(
          delay
        );
      }
    }

    throw (
      lastError ||
      new Error(
        `${operationName} failed.`
      )
    );
  };

/**
 * Adds the shared Care4U response rules to a task-specific
 * text prompt.
 *
 * @param {string} prompt
 * @returns {string}
 */
const buildTextPrompt = (
  prompt
) => {
  return `${CARE4U_RESPONSE_RULES}

============================================================
TASK-SPECIFIC INSTRUCTIONS
============================================================

${prompt}`;
};

/* =========================================================
   TEXT GENERATION
========================================================= */

/**
 * Generates a text response using Care4U's AI services.
 *
 * Processing order:
 *
 * Gemini attempt 1
 * -> temporary failure
 * -> wait 1.5 seconds
 * -> Gemini attempt 2
 * -> temporary failure
 * -> wait 3 seconds
 * -> Gemini attempt 3
 * -> Groq GPT-OSS 120B fallback
 * -> final manual notice if both providers fail
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const generateAIResponse =
  async (
    prompt,
    modelName = GEMINI_TEXT_MODEL
  ) => {
    const preparedPrompt =
      buildTextPrompt(
        prompt
      );

    /* =====================================================
       PRIMARY SERVICE: GEMINI
    ====================================================== */

    try {
      // Missing Gemini credentials enter the fallback path for text rather than stopping the API.
      if (!genAI) throw new Error('Primary AI is not configured');
      const model =
        genAI
          .getGenerativeModel({
            model:
              modelName,
          });

      const geminiText =
        await runGeminiWithRetry(
          async () => {
            const result =
              await model
                .generateContent(
                  preparedPrompt
                );

            const text =
              result.response.text();

            if (
              !text ||
              !text.trim()
            ) {
              throw new Error(
                'Gemini returned an empty response.'
              );
            }

            return text.trim();
          },
          'Gemini text generation'
        );

      return geminiText;

    } catch (
      geminiError
    ) {
      console.error(
        'Gemini AI Generation Error after retries:',
        'Provider request failed.'
      );

      console.warn(
        'Gemini unavailable after retries. Engaging Groq fallback circuit...'
      );
    }

    /* =====================================================
       SECONDARY SERVICE: GROQ GPT-OSS 120B
    ====================================================== */

    try {
      // If the text fallback is also unavailable, return the safe service-unavailable notice below.
      if (!groq) throw new Error('Fallback AI is not configured');
      const groqResponse =
        await groq
          .chat
          .completions
          .create({
            messages: [
              {
                role:
                  'user',

                content:
                  preparedPrompt,
              },
            ],

            model:
              GROQ_FALLBACK_MODEL,

            reasoning_effort:
              'low',

            include_reasoning:
              false,

            temperature:
              0.1,

            seed:
              42,
          });

      const text =
        groqResponse
          ?.choices
          ?.[0]
          ?.message
          ?.content;

      if (
        !text ||
        !text.trim()
      ) {
        throw new Error(
          'Groq returned an empty response.'
        );
      }

      console.log(
        'Groq fallback completed successfully.'
      );

      return text.trim();

    } catch (
      groqError
    ) {
      console.error(
        'Groq AI Fallback Error:',
        'Provider request failed.'
      );

      console.warn(
        'Both Gemini and Groq are unavailable. Returning Care4U fallback notice.'
      );

      /* ===================================================
         FINAL SAFETY NET
      ==================================================== */

      return `### AI Assistant Temporarily Unavailable

The Care4U AI service is temporarily unavailable.

Please try again shortly.

For medical concerns, use the information already available in Care4U or contact a verified healthcare professional.

If you are experiencing a medical emergency or severe symptoms, seek emergency medical assistance immediately.`;
    }
  };

/* =========================================================
   VISION GENERATION
========================================================= */

/**
 * Analyzes an image using Gemini Vision.
 *
 * Vision uses Gemini because Care4U's current Groq fallback path
 * is text-only.
 *
 * Temporary Gemini failures are retried before Care4U asks the
 * patient to enter the information manually.
 *
 * @param {string} prompt
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
const generateAIVisionResponse =
  async (
    prompt,
    imageBuffer,
    mimeType
  ) => {
    try {
      if (!genAI) throw new Error('Primary AI is not configured');
      const model =
        genAI
          .getGenerativeModel({
            model:
              GEMINI_VISION_MODEL,
          });

      // Encode the image as base64 with its MIME type for Gemini Vision; the text-only Groq fallback is not used for images.
      const imagePart = {
        inlineData: {
          data:
            imageBuffer
              .toString(
                'base64'
              ),

          mimeType:
            mimeType,
        },
      };

      const visionText =
        await runGeminiWithRetry(
          async () => {
            const result =
              await model
                .generateContent([
                  prompt,
                  imagePart,
                ]);

            const text =
              result
                .response
                .text();

            if (
              !text ||
              !text.trim()
            ) {
              throw new Error(
                'Gemini Vision returned an empty response.'
              );
            }

            return text.trim();
          },
          'Gemini Vision generation'
        );

      return visionText;

    } catch (
      error
    ) {
      console.error(
        'AI Vision Generation Error after retries:',
        'Provider request failed.'
      );

      throw new Error(
        'Failed to extract data from image. Please try again or enter the details manually.'
      );
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  generateAIResponse,
  generateAIVisionResponse,
};