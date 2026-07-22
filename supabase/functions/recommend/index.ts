// Supabase Edge Function: conversational RAG ordering agent for Menu AI.
//
// This is the primary chat channel once OPENAI_API_KEY is configured — the
// client sends the full conversation history plus the restaurant's real menu
// (retrieval), and this function answers naturally like a waiter, using tool
// calls to (a) surface specific dishes as photo cards and (b) place a real
// order once the customer has actually confirmed what they want. If no key is
// configured, it returns { available: false } and the client falls back to
// the free rule-based engine (src/lib/assistant.ts) — nothing breaks without
// a key, and this function is never required for the app to work.
//
// Deploy with: supabase functions deploy recommend
// Configure the key with: supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: string[];
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RestaurantInfo {
  name: string;
  hours: { day: string; time: string }[];
  faq: { question: string; answer: string }[];
}

interface RequestBody {
  history: ChatTurn[];
  lang: "vi" | "en" | "ko";
  menu: Dish[];
  restaurant: RestaurantInfo;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAME: Record<RequestBody["lang"], string> = {
  vi: "Vietnamese",
  en: "English",
  ko: "Korean",
};

const FALLBACK_ACK: Record<RequestBody["lang"], string> = {
  vi: "Vâng ạ!",
  en: "Got it!",
  ko: "네, 알겠습니다!",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "show_dishes",
      description:
        "Show one or more dishes as photo cards to the customer. Call this whenever you mention or recommend specific dishes by name in your reply.",
      parameters: {
        type: "object",
        properties: {
          dishIds: { type: "array", items: { type: "string" }, description: "Menu item IDs, exactly as given in the menu." },
        },
        required: ["dishIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description:
        "Place a real order once the customer has clearly confirmed what they want (which dish(es), how many, and any special requests). Only call this when they've actually confirmed — not just when they show interest.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dishId: { type: "string", description: "Menu item ID, exactly as given in the menu." },
                qty: { type: "integer", minimum: 1 },
                note: { type: "string", description: "Any customization, e.g. 'no onions'. Omit if none." },
              },
              required: ["dishId", "qty"],
            },
          },
        },
        required: ["items"],
      },
    },
  },
] as const;

function buildSystemPrompt(menu: Dish[], restaurant: RestaurantInfo, lang: RequestBody["lang"]): string {
  const menuList = menu
    .map((d) => `- id: ${d.id} | name: ${d.name} | $${d.price.toFixed(2)} | tags: ${d.tags.join(", ")} | ${d.description}`)
    .join("\n");
  const hoursList = restaurant.hours.map((h) => `${h.day}: ${h.time}`).join("; ");
  const faqList = restaurant.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n");

  return `You are Menu AI, a warm, friendly staff member at ${restaurant.name} — think of a genuinely helpful waiter, not a corporate bot. Keep replies short and conversational (1-3 sentences), match the customer's energy, and reply in ${LANG_NAME[lang] ?? "English"}.

Help the customer find something they'll enjoy based on their mood or cravings, answer questions using the restaurant info below, and take their order the way a real waiter would: ask about quantity or any customization if it's not already clear, then confirm before finalizing.

Rules:
- Only ever recommend or order dishes from the menu below. Never invent a dish or a price.
- Call show_dishes whenever you recommend or reference specific dishes, so the customer sees a photo card.
- Call place_order only once the customer has clearly confirmed what they want — not on a first recommendation.
- If something the customer wants isn't on the menu (or is out of scope), say so honestly and suggest the closest real alternative.

Restaurant hours: ${hoursList}
FAQ:
${faqList}

Menu:
${menuList}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ available: false, reason: "no_api_key" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { history, lang, menu, restaurant }: RequestBody = await req.json();
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
    const systemPrompt = buildSystemPrompt(menu, restaurant, lang);

    // deno-lint-ignore no-explicit-any
    const messages: any[] = [{ role: "system", content: systemPrompt }, ...history];

    const dishIds = new Set<string>();
    let orderItems: { dishId: string; qty: number; note?: string }[] | null = null;
    let finalReply = "";

    // Up to two rounds: first call may request tool(s), second gets the natural-language reply.
    for (let round = 0; round < 2; round++) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, tools: TOOLS, tool_choice: "auto" }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ available: false, reason: "upstream_error", detail: errText }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const message = data.choices?.[0]?.message;
      if (!message) break;

      const toolCalls = message.tool_calls ?? [];
      if (toolCalls.length === 0) {
        finalReply = message.content ?? "";
        break;
      }

      messages.push(message);
      for (const call of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // ignore malformed tool arguments
        }
        if (call.function.name === "show_dishes" && Array.isArray(args.dishIds)) {
          (args.dishIds as unknown[]).forEach((id) => typeof id === "string" && dishIds.add(id));
        }
        if (call.function.name === "place_order" && Array.isArray(args.items)) {
          orderItems = (args.items as Record<string, unknown>[])
            .filter((i) => typeof i.dishId === "string" && menu.some((d) => d.id === i.dishId))
            .map((i) => ({
              dishId: i.dishId as string,
              qty: typeof i.qty === "number" && i.qty > 0 ? Math.floor(i.qty) : 1,
              note: typeof i.note === "string" && i.note.trim() ? i.note.trim() : undefined,
            }));
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: "ok" });
      }
    }

    return new Response(
      JSON.stringify({
        available: true,
        reply: finalReply || FALLBACK_ACK[lang] ?? FALLBACK_ACK.en,
        dishIds: Array.from(dishIds),
        order: orderItems && orderItems.length > 0 ? { items: orderItems } : undefined,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ available: false, reason: "error", detail: String(err) }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
