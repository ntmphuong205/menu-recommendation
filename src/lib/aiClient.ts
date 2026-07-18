import { supabase } from "./supabaseClient";
import type { Dish } from "../data/menu";
import type { Lang } from "../i18n/translations";

export interface AiRecommendation {
  reply: string;
  dishIds: string[];
}

/**
 * Calls the "recommend" Supabase Edge Function, which only responds with real
 * AI output if an OPENAI_API_KEY secret is configured on the project (see
 * supabase/functions/recommend and SETUP.md). Returns null whenever a live
 * call isn't possible (no Supabase project, no key configured, or a network
 * error) so callers can fall back to the free rule-based reply.
 */
export async function getAiRecommendation(input: string, lang: Lang, menu: Dish[]): Promise<AiRecommendation | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.functions.invoke("recommend", {
      body: { input, lang, menu: menu.map((d) => ({ id: d.id, name: d.name, description: d.description, tags: d.tags })) },
    });
    if (error || !data?.available) return null;
    return { reply: data.reply ?? "", dishIds: data.dishIds ?? [] };
  } catch {
    return null;
  }
}
