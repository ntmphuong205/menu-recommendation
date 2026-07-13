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
  emoji: string;
}

export const TAGS: Record<TagKey, TagMeta> = {
  spicy: { label: "Spicy", emoji: "🌶️" },
  lowCalorie: { label: "Low-Calorie", emoji: "🥗" },
  hearty: { label: "Hearty", emoji: "🍔" },
  crispy: { label: "Crispy", emoji: "🍗" },
  beverage: { label: "Beverage", emoji: "🥤" },
  cool: { label: "Cool", emoji: "🧊" },
  warm: { label: "Warm", emoji: "🔥" },
  vegan: { label: "Vegan", emoji: "🌱" },
  glutenFree: { label: "Gluten-Free", emoji: "🌾" },
  highProtein: { label: "High-Protein", emoji: "💪" },
  sweetSour: { label: "Sweet & Sour", emoji: "🍅" },
  popular: { label: "Popular", emoji: "⭐" },
};

export interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: TagKey[];
  calories?: number;
  detail?: string; // extra nutrition fact e.g. "Protein: 25g"
  ingredients: string[];
  allergyNote: string;
  category: "Main" | "Starter" | "Beverage" | "Side";
}

export const MENU: Dish[] = [
  {
    id: "hamburger",
    name: "Handmade Hamburger",
    price: 8,
    description: "100% fresh beef patty, crisp veggies, our signature secret sauce.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    tags: ["hearty", "popular"],
    calories: 520,
    detail: "Protein: 25g",
    ingredients: ["Burger bun", "Ground beef patty", "Cheese", "Lettuce", "Tomato", "Signature sauce"],
    allergyNote: "Contains gluten, dairy, sesame.",
    category: "Main",
  },
  {
    id: "fried-chicken",
    name: "Crispy Fried Chicken",
    price: 14,
    description: "Golden crispy on the outside, juicy on the inside.",
    image:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80",
    tags: ["crispy", "hearty", "highProtein"],
    calories: 890,
    detail: "Protein: 55g",
    ingredients: ["Chicken thigh", "Crispy batter", "House seasoning"],
    allergyNote: "Contains gluten. May contain traces of soy.",
    category: "Main",
  },
  {
    id: "french-fries",
    name: "French Fries",
    price: 3,
    description: "Freshly fried, crispy and lightly salted.",
    image:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80",
    tags: ["crispy"],
    calories: 320,
    detail: "Sodium: 210mg",
    ingredients: ["Potatoes", "Cooking oil", "Salt"],
    allergyNote: "Gluten-free, but fried in shared oil with gluten items.",
    category: "Side",
  },
  {
    id: "cola",
    name: "Cola",
    price: 1.54,
    description: "Ice-cold cola served with ice.",
    image:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80",
    tags: ["beverage", "cool"],
    ingredients: ["Sparkling water", "Cola syrup", "Ice"],
    allergyNote: "No common allergens.",
    category: "Beverage",
  },
  {
    id: "sprite",
    name: "Sprite",
    price: 1.54,
    description: "Refreshing lemon-lime fizz, instantly cooling.",
    image:
      "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80",
    tags: ["beverage", "cool"],
    ingredients: ["Sparkling water", "Lemon-lime syrup", "Ice"],
    allergyNote: "No common allergens.",
    category: "Beverage",
  },
  {
    id: "mushroom-soup",
    name: "Mushroom Soup",
    price: 3.85,
    description: "Rich and smooth mushroom soup, lightly creamy and warming.",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
    tags: ["warm"],
    ingredients: ["Mushroom", "Fresh cream", "Butter", "Onion"],
    allergyNote: "Contains dairy. Gluten-free.",
    category: "Starter",
  },
  {
    id: "tomato-pasta",
    name: "Tomato Pasta",
    price: 10,
    description: "Pasta in a fresh tomato sauce, perfectly sweet and tangy.",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    tags: ["sweetSour"],
    ingredients: ["Pasta", "Tomato", "Garlic", "Basil"],
    allergyNote: "Contains gluten.",
    category: "Main",
  },
  {
    id: "spicy-chicken-salad",
    name: "Spicy Grilled Chicken Salad",
    price: 12.5,
    description:
      "If you want something light and healthy with a kick, this is our most recommended pick — under 400 calories!",
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80",
    tags: ["spicy", "lowCalorie", "highProtein", "popular"],
    calories: 380,
    ingredients: ["Grilled chicken breast", "Lettuce", "Cherry tomato", "Onion", "Spicy sauce"],
    allergyNote: "Gluten-free. Onions can be removed on request.",
    category: "Main",
  },
  {
    id: "quinoa-bowl",
    name: "Quinoa Buddha Bowl",
    price: 13.5,
    description: "Quinoa, fresh vegetables and a light tangy dressing — gluten-free.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    tags: ["lowCalorie", "glutenFree", "vegan"],
    ingredients: ["Quinoa", "Avocado", "Chickpeas", "Seasonal vegetables"],
    allergyNote: "Gluten-free. 100% vegan.",
    category: "Main",
  },
  {
    id: "carrot-ginger-soup",
    name: "Carrot Ginger Soup",
    price: 8.5,
    description: "Warm vegan soup with the natural sweetness of carrot and ginger.",
    image:
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80",
    tags: ["vegan", "warm", "lowCalorie"],
    ingredients: ["Carrot", "Ginger", "Vegetable broth"],
    allergyNote: "Vegan, gluten-free.",
    category: "Starter",
  },
];

export const findDish = (id: string) => MENU.find((d) => d.id === id);

export const BEST_SELLERS = ["hamburger", "fried-chicken", "spicy-chicken-salad"];
