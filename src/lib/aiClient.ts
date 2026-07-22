import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Dish } from "../data/menu";
import type { Lang } from "../i18n/translations";
import type { ChatMessage } from "./assistant";
import { RESTAURANT, FAQ } from "../data/restaurant";

export interface AiChatReply {
  reply: string;
  dishIds: string[];
  cartAdditions?: { items: { dishId: string; qty: number; note?: string }[] };
}

/** True whenever a Supabase project is configured, so the app should try the
 *  real conversational agent before falling back to the free rule engine. */
export const isAiChatAvailable = isSupabaseConfigured;

function toHistory(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.text)
    .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text! }));
}

/**
 * Calls the "recommend" Supabase Edge Function, a conversational RAG agent
 * that only responds with real AI output if an OPENAI_API_KEY secret is
 * configured on the project (see supabase/functions/recommend and
 * SETUP.md). Returns null whenever a live call isn't possible (no Supabase
 * project, no key configured, or a network error) so the caller falls back
 * to the free rule-based reply for this one message.
 */
export async function getAiChatReply(
  messages: ChatMessage[],
  lang: Lang,
  menu: Dish[]
): Promise<AiChatReply | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.functions.invoke("recommend", {
      body: {
        history: toHistory(messages),
        lang,
        menu: menu
          .filter((d) => !d.soldOut)
          .map((d) => ({ id: d.id, name: d.name, price: d.price, description: d.description, tags: d.tags })),
        restaurant: { name: RESTAURANT.name, hours: RESTAURANT.hours, faq: FAQ },
      },
    });
    if (error || !data?.available) return null;
    return { reply: data.reply ?? "", dishIds: data.dishIds ?? [], cartAdditions: data.cartAdditions };
  } catch {
    return null;
  }
}
