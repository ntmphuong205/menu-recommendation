import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

// Single-tenant for now: the app always looks up the "fresh-bites" restaurant
// seeded by supabase/seed.sql. Returns null while loading, or if Supabase
// isn't configured / the seed hasn't been run yet — callers should treat null
// as "use local storage instead" rather than blocking.
export function useRestaurantId(slug = "fresh-bites"): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let cancelled = false;
    supabase
      .from("restaurants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          console.warn(
            `[MenuPilot] Supabase is configured but no restaurant found for slug "${slug}". Run supabase/seed.sql, or the app will keep using local browser storage.`
          );
          return;
        }
        setId(data.id);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return id;
}
