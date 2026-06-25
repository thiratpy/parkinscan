import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  try {
    // In production (HF Space), frontend + API are on the same origin → relative path works.
    // In local dev, Next.js runs on :3000/:3001 but the Python API is on :8000.
    let apiUrl = "/api/config";
    if (typeof window !== "undefined") {
      const port = window.location.port;
      const host = window.location.hostname;
      if (host === "localhost" && (port === "3000" || port === "3001")) {
        apiUrl = "http://localhost:8000/api/config";
      }
    }
    const res = await fetch(apiUrl);
    
    if (!res.ok) throw new Error(`API returned status ${res.status}`);
    
    const config = await res.json();
    const url = config.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = config.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (!url || !key) {
      console.warn("Supabase URL or Anon Key is missing from both /api/config and environment variables.");
    }

    supabaseInstance = createClient(url || "https://dummy.supabase.co", key || "dummy_key");
  } catch (error) {
    console.warn("Failed to fetch Supabase config, falling back to process.env:", error.message);
    // Fallback to build-time env vars if API fetch fails (e.g. during local dev if API is down)
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "dummy_key"
    );
  }

  return supabaseInstance;
}
