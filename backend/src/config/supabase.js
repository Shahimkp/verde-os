const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl && supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.replace('/rest/v1/', '');
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Initialize Supabase client with the service role key
// This allows the backend to bypass RLS and act as admin
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
