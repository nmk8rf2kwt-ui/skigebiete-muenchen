import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use Admin/Service Role key if available (for backend writes), otherwise fallback to public key
const supabaseKey = process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
        console.error("CRITICAL: Supabase URL or Key missing in production!");
    } else {
        console.warn("Supabase credentials missing. History will not be saved.");
    }
} else {
    // secure log
    if (process.env.SUPABASE_ADMIN_KEY) {
        console.log("🔐 Supabase: Using Service Role (Admin) Key");
    } else {
        console.warn("⚠️ Supabase: Using Public (Anon) Key - Write operations may fail if RLS is enabled!");
    }
}

// Create a single supabase client for interacting with your database
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function checkConnection() {
    if (!supabase) return { ok: false, message: "Client not initialized" };
    try {
        // Simple query to check connection
        const { data, error } = await supabase.from('resort_snapshots').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return { ok: true, message: "Connected" };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

export { supabase };
