import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
} else {
    console.warn('⚠️ Supabase credentials missing (SUPABASE_URL, SUPABASE_KEY). Persistent storage disabled.');
}

export { supabase };
