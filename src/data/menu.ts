import type { IngredientLine } from "./ingredients";

export type TagKey =
  | "spicy"
  | "lowCalorie"
  | "hearty"
  | "crispy"
  | "beverage"
  | "cool"
  | "warm"
  | "vegan"
  | "glutenFree"
  | "highProtein"
  | "sweetSour"
  | "popular";

export interface TagMeta {
  label: string;
}

export const TAGS: Record<TagKey, TagMeta> = {
  spicy: { label: "Spicy" },
  lowCalorie: { label: "Low-Calorie" },
  hearty: { label: "Hearty" },
  crispy: { label: "Crispy" },
  beverage: { label: "Beverage" },
  cool: { label: "Cool" },
  warm: { label: "Warm" },
  vegan: { label: "Vegan" },
  glutenFree: { label: "Gluten-Free" },
  highProtein: { label: "High-Protein" },
  sweetSour: { label: "Sweet & Sour" },
  popular: { label: "Popular" },
};

/** A suggested dish to order alongside another — balances the palate, adds
 *  contrast, or completes a traditional combo. Surfaced on the dish detail
 *  sheet and as an upsell prompt in the cart. */
export interface Pairing {
  dishId: string;
  /** English fallback reason. */
  reason: string;
  reasons?: Partial<Record<"vi" | "ko", string>>;
}

/** One option on a dish offering a choice (a size like M/L, or a flavor
 *  like Mango/Strawberry) — the dish stays a single menu item; picking a
 *  variant changes price/calories (same price across flavor options). */
export interface SizeVariant {
  id: string;
  /** English fallback label — see Dish.name for the same convention. */
  label: string;
  labels?: Partial<Record<"vi" | "en" | "ko", string>>;
  price: number;
  calories?: number;
}

export interface Dish {
  id: string;
  /** English fallback name — proper-noun dish names (e.g. "Phở Bò") are
   *  meant to stay as-is across languages; translatable names use `names`. */
  name: string;
  names?: Partial<Record<"vi" | "en" | "ko", string>>;
  price: number;
  /** ISO 4217-ish code for `price` — stores aren't all USD (e.g. VND). */
  currency: string;
  description: string;
  descriptions?: Partial<Record<"vi" | "en" | "ko", string>>;
  image: string;
  tags: TagKey[];
  /** Computed from ingredientLines via computeNutrition() — the owner enters
   *  ingredients + grams, the app works these numbers out automatically. */
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredientLines?: IngredientLine[];
  ingredients: string[];
  allergyNote: string;
  /** Free-text grouping label — each store keeps its own list in
   *  stores.menu_categories. "Main"/"Starter"/"Beverage"/"Side" are the
   *  legacy defaults and stay translated in MenuScreen's CATEGORY_KEY;
   *  anything else is shown as entered. */
  category: string;
  soldOut?: boolean;
  /** Kitchen prep time, used to estimate wait time and queue position. */
  prepTimeMinutes?: number;
  /** Dishes that go especially well with this one — shown as an upsell prompt. */
  pairings?: Pairing[];
  /** Size choices sharing this one dish (e.g. M/L) — when set, `price`/
   *  `calories` above mirror the first variant as a fallback for any code
   *  that doesn't know about variants. */
  sizeVariants?: SizeVariant[];
}

// Real menu ids from db/seed.sql (Phở Bò, Cơm Tấm Sườn, Bánh Mì Thịt Nướng) —
// these are UUIDs generated once at seed time, not slugs, since dishes now
// live in the database rather than as static local data.
export const BEST_SELLERS = [
  "bf3beb4b-f100-44e9-8a5f-319bc4707bb5",
  "92232755-a5c7-4fdf-b88b-cdc5543734f5",
  "1e6609a2-10c4-4859-b277-32b2b00dd566",
];

export function getDishName(dish: Dish, lang: "vi" | "en" | "ko"): string {
  return dish.names?.[lang] ?? dish.name;
}

export function getDishDescription(dish: Dish, lang: "vi" | "en" | "ko"): string {
  return dish.descriptions?.[lang] ?? dish.description;
}

export function getPairingReason(pairing: Pairing, lang: "vi" | "en" | "ko"): string {
  if (lang === "en") return pairing.reason;
  return pairing.reasons?.[lang] ?? pairing.reason;
}

export function getVariant(dish: Dish, variantId?: string): SizeVariant | undefined {
  return variantId ? dish.sizeVariants?.find((v) => v.id === variantId) : undefined;
}

export function getVariantPrice(dish: Dish, variantId?: string): number {
  return getVariant(dish, variantId)?.price ?? dish.price;
}

export function getVariantLabel(variant: SizeVariant, lang: "vi" | "en" | "ko"): string {
  return variant.labels?.[lang] ?? variant.label;
}
