export interface IngredientNutrition {
  label: string;
  /** All values per 100g of the ingredient as used in the dish (cooked weight unless noted). */
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

/**
 * A small reference database so a restaurant only has to enter each
 * ingredient + how many grams go into a dish — the app looks up macros
 * per ingredient and adds them up, instead of asking the owner to already
 * know a dish's total nutrition facts.
 */
export const INGREDIENT_DB: Record<string, IngredientNutrition> = {
  rice: { label: "Rice (cooked)", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  riceVermicelli: { label: "Rice vermicelli", caloriesPer100g: 109, proteinPer100g: 2, carbsPer100g: 25, fatPer100g: 0.2 },
  glassNoodles: { label: "Glass noodles (sweet potato)", caloriesPer100g: 200, proteinPer100g: 0.3, carbsPer100g: 48, fatPer100g: 0.1 },
  riceCake: { label: "Rice cake (tteok)", caloriesPer100g: 220, proteinPer100g: 4, carbsPer100g: 48, fatPer100g: 0.6 },
  ramenNoodles: { label: "Ramen noodles", caloriesPer100g: 190, proteinPer100g: 5, carbsPer100g: 27, fatPer100g: 7 },
  baguette: { label: "Baguette / bread", caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2 },
  ricePaper: { label: "Rice paper", caloriesPer100g: 300, proteinPer100g: 6, carbsPer100g: 68, fatPer100g: 0.6 },

  beef: { label: "Beef", caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  pork: { label: "Pork", caloriesPer100g: 242, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 14 },
  groundPork: { label: "Ground pork", caloriesPer100g: 263, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 18 },
  chicken: { label: "Chicken", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  egg: { label: "Egg", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  shrimp: { label: "Shrimp", caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3 },
  driedShrimp: { label: "Dried shrimp", caloriesPer100g: 280, proteinPer100g: 55, carbsPer100g: 5, fatPer100g: 3 },
  fishCake: { label: "Fish cake", caloriesPer100g: 90, proteinPer100g: 12, carbsPer100g: 8, fatPer100g: 1 },
  tofu: { label: "Tofu", caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  liverPate: { label: "Liver pâté", caloriesPer100g: 320, proteinPer100g: 14, carbsPer100g: 3, fatPer100g: 28 },

  carrot: { label: "Carrot", caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  daikon: { label: "Daikon radish", caloriesPer100g: 18, proteinPer100g: 0.6, carbsPer100g: 4.1, fatPer100g: 0.1 },
  onion: { label: "Onion", caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1 },
  scallion: { label: "Scallion", caloriesPer100g: 32, proteinPer100g: 1.8, carbsPer100g: 7.3, fatPer100g: 0.2 },
  herbs: { label: "Fresh herbs / cilantro", caloriesPer100g: 23, proteinPer100g: 2.1, carbsPer100g: 3.7, fatPer100g: 0.5 },
  lettuce: { label: "Lettuce / leafy greens", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  beanSprouts: { label: "Bean sprouts", caloriesPer100g: 30, proteinPer100g: 3, carbsPer100g: 5.9, fatPer100g: 0.2 },
  mushroom: { label: "Mushroom", caloriesPer100g: 34, proteinPer100g: 2.7, carbsPer100g: 6, fatPer100g: 0.3 },
  cucumber: { label: "Cucumber", caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },
  kimchi: { label: "Kimchi", caloriesPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 2.4, fatPer100g: 0.5 },
  lemongrass: { label: "Lemongrass", caloriesPer100g: 99, proteinPer100g: 1.8, carbsPer100g: 25, fatPer100g: 0.5 },
  chili: { label: "Chili", caloriesPer100g: 40, proteinPer100g: 1.9, carbsPer100g: 9, fatPer100g: 0.4 },

  gochujangSauce: { label: "Gochujang sauce", caloriesPer100g: 200, proteinPer100g: 4, carbsPer100g: 45, fatPer100g: 1.5 },
  soySauce: { label: "Soy sauce", caloriesPer100g: 60, proteinPer100g: 8, carbsPer100g: 5, fatPer100g: 0.1 },
  fishSauce: { label: "Fish sauce", caloriesPer100g: 35, proteinPer100g: 5, carbsPer100g: 3, fatPer100g: 0 },
  sesameOil: { label: "Sesame oil", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  condensedMilk: { label: "Condensed milk", caloriesPer100g: 321, proteinPer100g: 7.9, carbsPer100g: 54, fatPer100g: 8.7 },
  citronMarmalade: { label: "Citron marmalade", caloriesPer100g: 250, proteinPer100g: 0.3, carbsPer100g: 62, fatPer100g: 0.1 },
  coffee: { label: "Brewed coffee", caloriesPer100g: 2, proteinPer100g: 0.1, carbsPer100g: 0, fatPer100g: 0 },
  ice: { label: "Ice / water", caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0 },

  phoNoodles: { label: "Rice noodles (phở)", caloriesPer100g: 110, proteinPer100g: 2, carbsPer100g: 25, fatPer100g: 0.2 },
  peanutSauce: { label: "Peanut dipping sauce", caloriesPer100g: 280, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 18 },
  riceFlourBatter: { label: "Rice flour batter", caloriesPer100g: 150, proteinPer100g: 2.5, carbsPer100g: 32, fatPer100g: 1 },
  coconutMilk: { label: "Coconut milk", caloriesPer100g: 230, proteinPer100g: 2.3, carbsPer100g: 6, fatPer100g: 24 },
  fish: { label: "Fish fillet", caloriesPer100g: 105, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 2.5 },
  tomato: { label: "Tomato", caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  pineapple: { label: "Pineapple", caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13, fatPer100g: 0.1 },
  tamarindSauce: { label: "Tamarind sauce", caloriesPer100g: 130, proteinPer100g: 1, carbsPer100g: 32, fatPer100g: 0.1 },
  mungBean: { label: "Mung bean paste", caloriesPer100g: 340, proteinPer100g: 22, carbsPer100g: 60, fatPer100g: 1 },
  jelly: { label: "Grass jelly / tapioca pearls", caloriesPer100g: 70, proteinPer100g: 0.2, carbsPer100g: 17, fatPer100g: 0.1 },
  friedDough: { label: "Fried dough sticks (quẩy)", caloriesPer100g: 360, proteinPer100g: 7, carbsPer100g: 45, fatPer100g: 16 },
};

export type IngredientKey = keyof typeof INGREDIENT_DB;

/** All known ingredient display names, for the owner-facing autocomplete list. */
export const INGREDIENT_NAMES: string[] = Object.values(INGREDIENT_DB).map((i) => i.label);

/** Case-insensitive lookup by display name — the owner types a name, not a key. */
export function findIngredientByName(name: string): IngredientNutrition | undefined {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  return Object.values(INGREDIENT_DB).find((info) => info.label.toLowerCase() === normalized);
}

export interface IngredientLine {
  /** Free text — the owner isn't limited to the built-in database. */
  name: string;
  grams: number;
  /** Per-100g nutrition the owner enters by hand when `name` doesn't match
   *  anything in INGREDIENT_DB (an ingredient we don't have on file). */
  custom?: { calories: number; protein: number; carbs: number; fat: number };
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function computeNutrition(lines: IngredientLine[]): NutritionTotals {
  return lines.reduce(
    (totals, line) => {
      const known = findIngredientByName(line.name);
      const info = known ?? (line.custom
        ? { caloriesPer100g: line.custom.calories, proteinPer100g: line.custom.protein, carbsPer100g: line.custom.carbs, fatPer100g: line.custom.fat }
        : undefined);
      if (!info) return totals;
      const factor = line.grams / 100;
      return {
        calories: totals.calories + info.caloriesPer100g * factor,
        protein: totals.protein + info.proteinPer100g * factor,
        carbs: totals.carbs + info.carbsPer100g * factor,
        fat: totals.fat + info.fatPer100g * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
