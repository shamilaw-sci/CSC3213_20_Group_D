
/**
 * @file    supabase.js
 * @module  Config
 * @desc    Connects the backend to Supabase Storage for file uploads.
 * @author  Wasana Karunanayaka (S/21/081)
 */

// FEATURE: Connect to Supabase Storage without exposing the secret key to the frontend.
// LOGIC: Create the client only when the storage URL and service-role key are provided.
// Use ws for compatibility with Node versions that lack built-in WebSocket support.
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws,
    },
  }
) : null;

// When storage settings are missing, export null so the rest of the backend can start.
module.exports = { supabase };
