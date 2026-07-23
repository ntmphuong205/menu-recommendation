import type { Dish, TagKey } from "../data/menu";
import { getDishDescription } from "../data/menu";
import { RESTAURANT, FAQ, getHoursLabel, getFaqText } from "../data/restaurant";
import { t as translate, type Lang } from "../i18n/translations";

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

// Keyword lists are multilingual (EN/VI/KO in one list) so a customer can type in
// whichever of the three languages the menu supports and still get matched.
const MOOD_KEYWORDS: Array<{ tags: TagKey[]; words: string[] }> = [
  { tags: ["spicy"], words: ["spicy", "hot", "kick", "cay", "매운", "맵고", "매콤"] },
  {
    tags: ["lowCalorie"],
    words: [
      "light", "healthy", "low calorie", "low-calorie", "diet", "eat clean", "clean eating", "detox",
      "nhẹ", "lành mạnh", "ít calo", "ăn kiêng", "giảm cân",
      "가볍게", "가벼운", "건강한", "저칼로리", "다이어트",
    ],
  },
  { tags: ["vegan"], words: ["vegan", "vegetarian", "plant based", "plant-based", "chay", "thuần chay", "비건", "채식"] },
  {
    tags: ["hearty", "highProtein"],
    words: [
      "hungry", "starving", "meat", "hearty", "filling", "protein",
      "đói", "no bụng", "thịt", "đạm",
      "배고파", "든든한", "고기", "단백질",
    ],
  },
  { tags: ["crispy"], words: ["crispy", "crunchy", "fried", "giòn", "chiên", "바삭", "튀김"] },
  {
    tags: ["warm"],
    words: [
      "warm", "hot soup", "cold outside", "rainy", "comfort food",
      "ấm", "nóng", "trời lạnh", "trời mưa",
      "따뜻한", "국물", "추워요", "비 오는",
    ],
  },
  {
    tags: ["beverage", "cool"],
    words: [
      "cool", "refreshing", "thirsty", "drink", "beverage",
      "mát", "giải khát", "khát nước", "đồ uống",
      "시원한", "음료", "목말라",
    ],
  },
  {
    tags: ["sweetSour"],
    words: ["sweet and sour", "sweet", "sour", "tangy", "chua ngọt", "ngọt", "chua", "새콤달콤", "달콤한", "새콤한"],
  },
  { tags: ["glutenFree"], words: ["gluten free", "gluten-free", "không gluten", "글루텐 프리"] },
  {
    tags: ["popular"],
    words: [
      "popular", "best seller", "bestseller", "can't decide", "cant decide", "surprise me", "recommend anything", "what's good",
      "phổ biến", "bán chạy", "không biết chọn", "bất ngờ cho tôi", "gợi ý giúp",
      "인기", "베스트셀러", "뭘 골라야", "추천해줘", "아무거나",
    ],
  },
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, "1": 1, một: 1, "하나": 1, "한개": 1, "한 개": 1,
  two: 2, "2": 2, hai: 2, "둘": 2, "두개": 2, "두 개": 2,
  three: 3, "3": 3, ba: 3, "셋": 3, "세개": 3, "세 개": 3,
  four: 4, "4": 4, bốn: 4, "넷": 4, "네개": 4, "네 개": 4,
  five: 5, "5": 5, năm: 5, "다섯": 5, "다섯개": 5, "다섯 개": 5,
};

const AFFIRMATIVE_RE =
  /\b(yes|yeah|yep|correct|sure|confirm|ok|okay|order this)\b|(có|đồng ý|ừ|ok|được|đặt món này)|(네|예|좋아요|넵|응|이걸로 주문할게요)/;
const DECLINE_RE = /(no|cancel|never mind|nevermind|no thanks)|(không|huỷ|hủy|thôi)|(아니요|취소)/;
const DECLINE_ADDITIONAL_RE =
  /(nothing else|that's all|thats all|no more|no thanks|that is all|all good|nope)|(không còn gì|vậy thôi|hết rồi|thôi được rồi)|(없어요|그게 다예요|괜찮아요)/;
const GREETING_RE = /(hi|hello|hey)|(chào|xin chào)|(안녕)/;
const HOURS_RE = /(opening hours|what time|open until|hours today|business hours)|(giờ mở cửa|mấy giờ)|(영업시간|몇 시)/;
const BESTSELLER_RE = /(best seller|bestseller|most popular|famous dish)|(bán chạy nhất|món phổ biến)|(베스트셀러|인기메뉴|인기 메뉴)/;
const EXCLUDE_MOOD_RE = /(spicy|light|vegan)|(cay|nhẹ|chay)|(매운|가벼운|비건)/;
const ALLERGY_RE = /(allerg|ingredient|what's in|whats in|contains)|(dị ứng|thành phần|nguyên liệu)|(알레르기|재료)/;
const FULL_MENU_RE = /(full menu|see the menu|what do you have|show menu)|(xem thực đơn|có món gì|toàn bộ thực đơn)|(전체메뉴|전체 메뉴|메뉴 보여줘)/;
const CANT_DECIDE_RE =
  /(can't decide|cant decide|surprise me|not sure what|pick for me|suggest something else)|(không biết chọn|bất ngờ cho tôi|chọn giúp|gợi ý món khác)|(고르기 어려|아무거나 추천|추천해줘|다른 메뉴 추천해줘)/;

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function parseQuantity(text: string): number | null {
  const t = normalize(text);
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(t) || t.includes(word)) return num;
  }
  if (AFFIRMATIVE_RE.test(t)) return 1;
  return null;
}

function parseRemoval(text: string): string | null {
  const t = normalize(text);
  const patterns = [
    /remove\s+(.+)/, /no\s+(.+)/, /without\s+(.+)/, /hold\s+the\s+(.+)/,
    /bỏ\s+(.+)/, /không\s+(.+)/,
    /(.+)\s*빼주세요/, /(.+)\s*없이/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function isDeclineAdditional(text: string): boolean {
  return DECLINE_ADDITIONAL_RE.test(normalize(text));
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

function greeting(lang: Lang): string {
  return translate("bot_greeting", lang, { restaurant: RESTAURANT.name });
}

function greetingQuickReplies(lang: Lang): string[] {
  return [translate("chat_quick_spicy_low", lang), translate("chat_quick_filling", lang), translate("chat_quick_surprise", lang)];
}

export function initialMessages(lang: Lang = "en"): ChatMessage[] {
  return [bot(greeting(lang), undefined, greetingQuickReplies(lang))];
}

export function respond(input: string, state: ConversationState, menu: Dish[], lang: Lang = "en"): AssistantResult {
  const t = normalize(input);
  // Named-dish lookups search the full menu (so the bot can recognize a
  // sold-out dish and apologize) but new recommendations only ever draw
  // from what's actually available.
  const findDish = (id: string) => menu.find((d) => d.id === id);
  const availableMenu = menu.filter((d) => !d.soldOut);
  const tr = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, lang, vars);

  // Stage: awaiting confirm quantity for a just-recommended dish
  if (state.stage === "awaitingConfirm" && state.pendingDishId) {
    const dish = findDish(state.pendingDishId)!;
    const decline = DECLINE_RE.test(t);
    const qty = parseQuantity(t);
    if (decline && qty === null) {
      return {
        messages: [bot(tr("bot_decline"))],
        state: { stage: "idle" },
      };
    }
    if (qty !== null) {
      return {
        messages: [
          bot(
            tr("bot_confirm_qty", { qty, dish: dish.name }),
            undefined,
            [tr("qr_nothing_else"), tr("qr_remove_onions")]
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
        messages: [bot(tr("bot_order_done", { qty, dish: dish.name }))],
        state: { stage: "idle" },
        cartOp: { type: "add", dishId: dish.id, qty },
      };
    }
    const removal = parseRemoval(t);
    const note = removal ? `No ${removal}` : input.trim();
    return {
      messages: [bot(tr("bot_order_done_note", { qty, dish: dish.name, note }))],
      state: { stage: "idle" },
      cartOp: { type: "add", dishId: dish.id, qty, note },
    };
  }

  // Restaurant info intents
  if (HOURS_RE.test(t)) {
    const hoursText = RESTAURANT.hours
      .map((h) => {
        const label = getHoursLabel(h, lang);
        return `${label.day}: ${label.time}`;
      })
      .join("\n");
    return {
      messages: [bot(tr("bot_hours", { restaurant: RESTAURANT.name, hours: hoursText }))],
      state: { stage: "idle" },
    };
  }

  if (BESTSELLER_RE.test(t) && !EXCLUDE_MOOD_RE.test(t)) {
    const picks = availableMenu.filter((d) => d.tags.includes("popular"));
    return {
      messages: [bot(tr("bot_bestsellers"), picks)],
      state: { stage: "idle" },
    };
  }

  const namedDish = findDishByName(t, menu);
  if (namedDish && ALLERGY_RE.test(t)) {
    return {
      messages: [
        bot(
          tr("bot_allergy", {
            dish: namedDish.name,
            ingredients: namedDish.ingredients.join(", "),
            allergyNote: namedDish.allergyNote,
          }),
          [namedDish]
        ),
      ],
      state: { stage: "idle" },
    };
  }

  if (FULL_MENU_RE.test(t)) {
    return {
      messages: [bot(tr("bot_full_menu"), availableMenu.filter((d) => d.tags.includes("popular")))],
      state: { stage: "idle" },
    };
  }

  if (GREETING_RE.test(t) && t.length < 20) {
    return { messages: [bot(greeting(lang), undefined, greetingQuickReplies(lang))], state: { stage: "idle" } };
  }

  if (namedDish && namedDish.soldOut) {
    return {
      messages: [bot(tr("bot_sold_out", { dish: namedDish.name }), undefined, [tr("qr_suggest_else")])],
      state: { stage: "idle" },
    };
  }

  // Direct dish name mention -> treat as recommendation/confirmation start
  if (namedDish) {
    return {
      messages: [bot(tr("bot_dish_pick_qty", { dish: namedDish.name }), [namedDish])],
      state: { stage: "awaitingConfirm", pendingDishId: namedDish.id },
    };
  }

  // Mood-based recommendation
  const recs = recommendDishes(t, availableMenu);
  if (recs.length > 0) {
    const top = recs[0];
    const reply =
      recs.length > 1
        ? tr("bot_recs_multi", { dishes: recs.map((d) => d.name).join(" / ") })
        : tr("bot_recs_single", { dish: top.name, description: getDishDescription(top, lang) });
    return {
      messages: [bot(reply, recs, [tr("qr_order_this"), tr("qr_suggest_else")])],
      state: { stage: "awaitingConfirm", pendingDishId: top.id },
    };
  }

  if (CANT_DECIDE_RE.test(t)) {
    const pick = popularPick(availableMenu);
    return {
      messages: [bot(tr("bot_surprise", { dish: pick.name }), [pick])],
      state: { stage: "awaitingConfirm", pendingDishId: pick.id },
    };
  }

  // FAQ fallback — matching is against the English question text (customers asking in
  // their own language mostly won't hit this), but the reply itself is localized.
  const faqHit = FAQ.find((f) => t.includes(normalize(f.question.replace("?", "").slice(0, 8))));
  if (faqHit) {
    return { messages: [bot(getFaqText(faqHit, lang).answer)], state: { stage: "idle" } };
  }

  return {
    messages: [
      bot(tr("bot_fallback"), undefined, [tr("chat_quick_spicy_low"), tr("qr_opening_hours"), tr("qr_best_sellers")]),
    ],
    state: { stage: "idle" },
  };
}

export function botMessage(text: string, dishes?: Dish[], quickReplies?: string[]): ChatMessage {
  return bot(text, dishes, quickReplies);
}
