import type { Dish, TagKey } from "../data/menu";
import { RESTAURANT, FAQ } from "../data/restaurant";

export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text?: string;
  dishes?: Dish[];
  quickReplies?: string[];
}

export type Stage = "idle" | "awaitingConfirm" | "awaitingCustomization";

export interface ConversationState {
  stage: Stage;
  pendingDishId?: string;
  pendingQty?: number;
}

export interface AssistantResult {
  messages: ChatMessage[];
  state: ConversationState;
  cartOp?: { type: "add"; dishId: string; qty: number; note?: string };
}

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

const bot = (text: string, dishes?: Dish[], quickReplies?: string[]): ChatMessage => ({
  id: nextId(),
  from: "bot",
  text,
  dishes,
  quickReplies,
});

const MOOD_KEYWORDS: Array<{ tags: TagKey[]; words: string[] }> = [
  { tags: ["spicy"], words: ["spicy", "hot", "kick"] },
  {
    tags: ["lowCalorie"],
    words: ["light", "healthy", "low calorie", "low-calorie", "diet", "eat clean", "clean eating", "detox"],
  },
  { tags: ["vegan"], words: ["vegan", "vegetarian", "plant based", "plant-based"] },
  {
    tags: ["hearty", "highProtein"],
    words: ["hungry", "starving", "meat", "hearty", "filling", "protein"],
  },
  { tags: ["crispy"], words: ["crispy", "crunchy", "fried"] },
  { tags: ["warm"], words: ["warm", "hot soup", "cold outside", "rainy", "comfort food"] },
  { tags: ["beverage", "cool"], words: ["cool", "refreshing", "thirsty", "drink", "beverage"] },
  { tags: ["sweetSour"], words: ["sweet and sour", "sweet", "sour", "tangy"] },
  { tags: ["glutenFree"], words: ["gluten free", "gluten-free"] },
  {
    tags: ["popular"],
    words: ["popular", "best seller", "bestseller", "can't decide", "cant decide", "surprise me", "recommend anything", "what's good"],
  },
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, "1": 1,
  two: 2, "2": 2,
  three: 3, "3": 3,
  four: 4, "4": 4,
  five: 5, "5": 5,
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function parseQuantity(text: string): number | null {
  const t = normalize(text);
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) return num;
  }
  if (/\b(yes|yeah|yep|correct|sure|confirm|ok|okay)\b/.test(t)) return 1;
  return null;
}

function parseRemoval(text: string): string | null {
  const t = normalize(text);
  const patterns = [/remove\s+(.+)/, /no\s+(.+)/, /without\s+(.+)/, /hold\s+the\s+(.+)/];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function isDeclineAdditional(text: string): boolean {
  const t = normalize(text);
  return /(nothing else|that's all|thats all|no more|no thanks|that is all|all good|nope)/.test(t);
}

function findDishByName(text: string, menu: Dish[]): Dish | undefined {
  const t = normalize(text);
  return menu.find((d) => t.includes(normalize(d.name)));
}

function recommendDishes(text: string, menu: Dish[]): Dish[] {
  const t = normalize(text);
  const matchedTags = new Set<TagKey>();
  for (const group of MOOD_KEYWORDS) {
    if (group.words.some((w) => t.includes(w))) {
      group.tags.forEach((tag) => matchedTags.add(tag));
    }
  }
  if (matchedTags.size === 0) return [];
  const scored = menu.map((d) => ({
    dish: d,
    score: d.tags.filter((tag) => matchedTags.has(tag)).length,
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.dish);
}

function popularPick(menu: Dish[]): Dish {
  return menu.find((d) => d.tags.includes("popular")) ?? menu[0];
}

const GREETING = `Hi there! I'm Menu AI, ${RESTAURANT.name}'s assistant 🍃\nWe serve Korean and Vietnamese favorites — tell me what you're craving or how you're feeling, and I'll recommend the perfect dish for you!`;

export function initialMessages(): ChatMessage[] {
  return [bot(GREETING, undefined, ["Something spicy & low-calorie", "I want something filling", "Surprise me"])];
}

export function respond(input: string, state: ConversationState, menu: Dish[]): AssistantResult {
  const t = normalize(input);
  const findDish = (id: string) => menu.find((d) => d.id === id);

  // Stage: awaiting confirm quantity for a just-recommended dish
  if (state.stage === "awaitingConfirm" && state.pendingDishId) {
    const dish = findDish(state.pendingDishId)!;
    const decline = /(no|cancel|never mind|nevermind|no thanks)/.test(t);
    const qty = parseQuantity(t);
    if (decline && qty === null) {
      return {
        messages: [bot("No worries! Just let me know whenever you'd like another recommendation 😊")],
        state: { stage: "idle" },
      };
    }
    if (qty !== null) {
      return {
        messages: [
          bot(
            `Just to confirm: ${qty} ${dish.name}? Any other requests (e.g. remove onions, add extra sauce)?`,
            undefined,
            ["Nothing else", "Remove onions"]
          ),
        ],
        state: { stage: "awaitingCustomization", pendingDishId: dish.id, pendingQty: qty },
      };
    }
    // Doesn't look like a confirmation/decline (e.g. the customer pivoted to a new
    // request) — fall through to treat this input as a fresh message instead.
  }

  // Stage: awaiting customization note before finalizing
  if (state.stage === "awaitingCustomization" && state.pendingDishId) {
    const dish = findDish(state.pendingDishId)!;
    const qty = state.pendingQty ?? 1;
    if (isDeclineAdditional(t)) {
      return {
        messages: [bot(`Got it, ${qty} ${dish.name}. Your order has been submitted to the kitchen! 🎉`)],
        state: { stage: "idle" },
        cartOp: { type: "add", dishId: dish.id, qty },
      };
    }
    const removal = parseRemoval(t);
    const note = removal ? `No ${removal}` : input.trim();
    return {
      messages: [
        bot(`Got it! ${qty} ${dish.name} (${note}). Your order has been submitted to the kitchen! 🎉`),
      ],
      state: { stage: "idle" },
      cartOp: { type: "add", dishId: dish.id, qty, note },
    };
  }

  // Restaurant info intents
  if (/(opening hours|what time|open until|hours today|business hours)/.test(t)) {
    const hoursText = RESTAURANT.hours.map((h) => `${h.day}: ${h.time}`).join("\n");
    return {
      messages: [bot(`${RESTAURANT.name} is open:\n${hoursText}`)],
      state: { stage: "idle" },
    };
  }

  if (/(best seller|bestseller|most popular|famous dish)/.test(t) && !/(spicy|light|vegan)/.test(t)) {
    const picks = menu.filter((d) => d.tags.includes("popular"));
    return {
      messages: [bot("Here are our best-selling dishes:", picks)],
      state: { stage: "idle" },
    };
  }

  const namedDish = findDishByName(t, menu);
  if (namedDish && /(allerg|ingredient|what's in|whats in|contains)/.test(t)) {
    return {
      messages: [
        bot(
          `${namedDish.name} contains: ${namedDish.ingredients.join(", ")}.\nAllergy note: ${namedDish.allergyNote}`,
          [namedDish]
        ),
      ],
      state: { stage: "idle" },
    };
  }

  if (/(full menu|see the menu|what do you have|show menu)/.test(t)) {
    return {
      messages: [
        bot("You can browse the full menu on the 'Menu' tab below. Meanwhile, here are a few highlights:", menu.filter(d => d.tags.includes("popular"))),
      ],
      state: { stage: "idle" },
    };
  }

  if (/(hi|hello|hey)/.test(t) && t.length < 20) {
    return { messages: [bot(GREETING, undefined, ["Something spicy & low-calorie", "I want something filling", "Surprise me"])], state: { stage: "idle" } };
  }

  // Direct dish name mention -> treat as recommendation/confirmation start
  if (namedDish) {
    return {
      messages: [bot(`${namedDish.name} is a great choice! How many would you like?`, [namedDish])],
      state: { stage: "awaitingConfirm", pendingDishId: namedDish.id },
    };
  }

  // Mood-based recommendation
  const recs = recommendDishes(t, menu);
  if (recs.length > 0) {
    const top = recs[0];
    const reply =
      recs.length > 1
        ? `If that's the vibe you're going for, I'd suggest ${recs.map((d) => d.name).join(" or ")}!`
        : `If you want something like that, ${top.name} is highly recommended! ${top.description}`;
    return {
      messages: [bot(reply, recs, ["Order this", "Suggest something else"])],
      state: { stage: "awaitingConfirm", pendingDishId: top.id },
    };
  }

  if (/(can't decide|cant decide|surprise me|not sure what|pick for me)/.test(t)) {
    const pick = popularPick(menu);
    return {
      messages: [bot(`If you can't decide, I recommend our most popular dish: ${pick.name}! 🍔`, [pick])],
      state: { stage: "awaitingConfirm", pendingDishId: pick.id },
    };
  }

  // FAQ fallback
  const faqHit = FAQ.find((f) => t.includes(normalize(f.question.replace("?", "").slice(0, 8))));
  if (faqHit) {
    return { messages: [bot(faqHit.answer)], state: { stage: "idle" } };
  }

  return {
    messages: [
      bot(
        "Tell me what you're craving or how you're feeling, or ask me about opening hours, best-sellers, or food allergies!",
        undefined,
        ["Something spicy & low-calorie", "Opening hours", "Best sellers"]
      ),
    ],
    state: { stage: "idle" },
  };
}
