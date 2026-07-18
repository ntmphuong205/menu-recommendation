import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// When no project is configured, the app transparently falls back to the
// browser-local persistence it already had — see store/usePersistentState.ts
// and store/restaurantData.ts. Nothing else needs to check this flag directly.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
