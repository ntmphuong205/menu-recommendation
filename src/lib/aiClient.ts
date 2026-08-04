import { apiClient, type ChatHistoryTurn } from "./apiClient";
import type { Lang } from "../i18n/translations";
import type { ChatMessage } from "./assistant";

export interface AiChatReply {
  reply: string;
  dishIds: string[];
}

function toHistory(messages: ChatMessage[]): ChatHistoryTurn[] {
  // Cap at the last 10 turns — plenty for follow-ups like "the second one"
  // without growing the request unbounded as a conversation gets long.
  return messages
    .filter((m) => m.text)
    .slice(-10)
    .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), text: m.text! }));
}

/**
 * Calls the backend's Gemini-backed /api/chat, which grounds its answer in
 * the live store/menu/table data and the recent conversation history (see
 * api/index.py's chat()). Returns null on any failure (no GEMINI_API_KEY
 * configured, network error, etc.) so the caller falls back to the free
 * rule-based reply in lib/assistant.ts for that one message — the app stays
 * usable either way.
 *
 * Menu suggestions come back as dish ids only (recommended_menu_ids plus any
 * suggested_cart_items) and are rendered as the same tappable dish cards the
 * rule-based engine already uses — the AI never adds to the cart directly,
 * the customer always taps to confirm.
 */
export async function getAiChatReply(
  query: string,
  lang: Lang,
  history: ChatMessage[] = []
): Promise<AiChatReply | null> {
  try {
    const res = await apiClient.chat({ query, language: lang, mode: "store", history: toHistory(history) });
    if (!res.success) return null;
    const dishIds = Array.from(
      new Set([...res.recommended_menu_ids, ...res.suggested_cart_items.map((i) => i.menu_id)])
    );
    return { reply: res.reply, dishIds };
  } catch {
    return null;
  }
}
