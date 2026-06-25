import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  try {
    const res = await fetch("/api/config");
    const config = await res.json();
    const url = config.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = config.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.warn("Supabase URL or Anon Key is missing from both /api/config and environment variables.");
    }

    supabaseInstance = createClient(url || "https://dummy.supabase.co", key || "dummy_key");
  } catch (error) {
    console.error("Failed to fetch Supabase config:", error);
    // Fallback to build-time env vars if API fetch fails (e.g. during local dev if API is down)
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key"
    );
  }

  return supabaseInstance;
}
