/**
 * @file    supabase.js
 * @module  Config
 * @desc    Initializes the Supabase JS client using the service role key.
 *          Used server-side only, for Storage operations (e.g. patient
 *          photo uploads). Separate from the `pg` pool in db.js, which
 *          handles all direct table queries.
 *
 *          The `ws` transport is passed explicitly because Node.js < 22
 *          has no native WebSocket support, and the underlying
 *          @supabase/realtime-js client throws on init without one —
 *          even though this project only uses Storage, not Realtime.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws,
    },
  }
);

module.exports = { supabase };