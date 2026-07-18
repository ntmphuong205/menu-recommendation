// Supabase Edge Function: hybrid AI fallback for Menu AI.
//
// The client-side rule engine (src/lib/assistant.ts) handles the vast majority of
// requests for free (keyword matching against menu tags). It only calls this
// function when it can't confidently match anything — that's the "paid AI calls
// only where they add measurable value" rule from the business plan. If no AI
// API key is configured, this function returns { available: false } and the
// client keeps using its rule-based fallback reply, so nothing breaks without a key.
//
// Deploy with: supabase functions deploy recommend
// Configure the key with: supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface Dish {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface RequestBody {
  input: string;
  lang: "vi" | "en" | "ko";
  menu: Dish[];
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
    const { input, lang, menu }: RequestBody = await req.json();
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    const menuList = menu
      .map((d) => `- id: ${d.id} | name: ${d.name} | tags: ${d.tags.join(", ")} | ${d.description}`)
      .join("\n");

    const systemPrompt = `You are Menu AI, a friendly restaurant ordering assistant for a Korean-Vietnamese restaurant.
A customer sent a message the rule-based system couldn't confidently match to a dish.
Pick 1-2 dishes from the menu below that best fit their request, and write a short (1-2 sentence),
warm reply in ${LANG_NAME[lang] ?? "English"}. Reply ONLY with strict JSON, no markdown fences:
{"reply": string, "dishIds": string[]}
If nothing on the menu genuinely fits, return {"reply": "...", "dishIds": []}.

Menu:
${menuList}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ available: false, reason: "upstream_error", detail: errText }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify({
        available: true,
        reply: typeof parsed.reply === "string" ? parsed.reply : "",
        dishIds: Array.isArray(parsed.dishIds) ? parsed.dishIds.filter((id: unknown) => typeof id === "string") : [],
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
