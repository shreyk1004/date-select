import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are set.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('REACT_APP_SUPABASE_URL environment variable is missing.');
}
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  throw new Error('REACT_APP_SUPABASE_ANON_KEY environment variable is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
