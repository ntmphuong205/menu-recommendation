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

export const DEFAULT_MENU: Dish[] = [
  // --- Vietnamese ---
  {
    id: "bun-bo-hue",
    name: "Bún Bò Huế",
    price: 9.5,
    description: "Spicy beef & pork noodle soup from Huế, fragrant with lemongrass and chili oil.",
    image: "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=600&q=80",
    tags: ["spicy", "warm", "hearty"],
    calories: 480,
    detail: "Protein: 28g",
    ingredients: ["Rice vermicelli", "Beef shank", "Pork knuckle", "Lemongrass", "Chili oil", "Herbs"],
    allergyNote: "Contains shrimp paste (mắm ruốc) and shellfish.",
    category: "Main",
  },
  {
    id: "bun-cha",
    name: "Bún Chả",
    price: 8.5,
    description: "Charcoal-grilled pork patties served with rice vermicelli, herbs, and a tangy dipping broth.",
    image: "https://images.unsplash.com/photo-1763703544688-2ac7839b0659?w=600&q=80",
    tags: ["hearty", "warm"],
    calories: 520,
    detail: "Protein: 26g",
    ingredients: ["Grilled pork patties", "Rice vermicelli", "Fish sauce broth", "Fresh herbs", "Pickled vegetables"],
    allergyNote: "Contains fish sauce and peanuts (garnish).",
    category: "Main",
  },
  {
    id: "cha-gio",
    name: "Chả Giò",
    price: 6,
    description: "Crispy fried spring rolls packed with pork, wood ear mushroom, and glass noodles.",
    image: "https://images.unsplash.com/photo-1679310290259-78d9eaa32700?w=600&q=80",
    tags: ["crispy", "popular"],
    calories: 310,
    ingredients: ["Rice paper", "Ground pork", "Wood ear mushroom", "Glass noodles", "Carrot", "Dried shrimp"],
    allergyNote: "Contains shellfish (dried shrimp) and gluten.",
    category: "Starter",
  },
  {
    id: "banh-mi-thit-nuong",
    name: "Bánh Mì Thịt Nướng",
    price: 5,
    description: "Toasted baguette stuffed with grilled pork, pickled carrot & daikon, cilantro, and pâté.",
    image: "https://images.unsplash.com/photo-1700937244987-92488ab2ada5?w=600&q=80",
    tags: ["hearty", "crispy", "popular"],
    calories: 450,
    detail: "Protein: 24g",
    ingredients: ["Baguette", "Grilled pork", "Pickled carrot & daikon", "Cilantro", "Chili", "Pork liver pâté"],
    allergyNote: "Contains gluten and liver pâté (not vegetarian).",
    category: "Main",
  },
  {
    id: "com-tam-suon",
    name: "Cơm Tấm Sườn",
    price: 7.5,
    description: "Broken rice with a grilled pork chop, fried egg, and fragrant scallion oil.",
    image: "https://images.unsplash.com/photo-1766050587783-1c90751275dd?w=600&q=80",
    tags: ["hearty", "highProtein", "popular"],
    calories: 650,
    detail: "Protein: 32g",
    ingredients: ["Broken rice", "Grilled pork chop", "Fried egg", "Scallion oil", "Fish sauce"],
    allergyNote: "Contains egg and fish sauce.",
    category: "Main",
  },
  {
    id: "ca-phe-sua-da",
    name: "Cà Phê Sữa Đá",
    price: 2.5,
    description: "Bold Vietnamese robusta coffee over ice with sweet condensed milk.",
    image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80",
    tags: ["beverage", "cool"],
    ingredients: ["Robusta coffee", "Condensed milk", "Ice"],
    allergyNote: "Contains dairy.",
    category: "Beverage",
  },
  // --- Korean ---
  {
    id: "rabokki",
    name: "Rabokki",
    price: 9,
    description: "Chewy rice cakes and ramen noodles simmered in a spicy gochujang broth with egg and fish cake.",
    image: "https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=600&q=80",
    tags: ["spicy", "warm", "hearty"],
    calories: 560,
    ingredients: ["Rice cakes", "Ramen noodles", "Kimchi", "Fish cake", "Boiled egg", "Gochujang broth"],
    allergyNote: "Contains gluten, egg, and seafood (fish cake).",
    category: "Main",
  },
  {
    id: "bibimbap",
    name: "Bibimbap",
    price: 9.5,
    description: "Warm rice bowl topped with seasoned vegetables, marinated beef, a fried egg, and gochujang sauce.",
    image: "https://images.unsplash.com/photo-1718777791239-c473e9ce7376?w=600&q=80",
    tags: ["lowCalorie", "highProtein", "popular"],
    calories: 420,
    detail: "Protein: 22g",
    ingredients: ["Rice", "Marinated beef", "Carrot", "Spinach", "Bean sprouts", "Fried egg", "Gochujang sauce"],
    allergyNote: "Contains egg, soy, and sesame.",
    category: "Main",
  },
  {
    id: "bulgogi",
    name: "Bulgogi",
    price: 12,
    description: "Thinly sliced beef marinated in a sweet soy-garlic sauce, grilled tableside Korean BBQ style.",
    image: "https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=600&q=80",
    tags: ["hearty", "highProtein", "popular"],
    calories: 580,
    detail: "Protein: 38g",
    ingredients: ["Beef sirloin", "Soy-garlic marinade", "Onion", "Sesame oil", "Scallion"],
    allergyNote: "Contains soy and sesame.",
    category: "Main",
  },
  {
    id: "tteokbokki",
    name: "Tteokbokki",
    price: 6,
    description: "Chewy rice cakes simmered in a sweet-and-spicy gochujang sauce — a Korean street food classic.",
    image: "https://images.unsplash.com/photo-1679581083578-94eae6e8d7a4?w=600&q=80",
    tags: ["spicy"],
    calories: 380,
    ingredients: ["Rice cakes", "Fish cake", "Gochujang sauce", "Scallion"],
    allergyNote: "Contains gluten and seafood (fish cake).",
    category: "Side",
  },
  {
    id: "japchae",
    name: "Japchae",
    price: 7.5,
    description: "Stir-fried sweet potato glass noodles with vegetables and sesame oil — our vegetarian favorite.",
    image: "https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&q=80",
    tags: ["vegan", "lowCalorie"],
    calories: 340,
    ingredients: ["Sweet potato glass noodles", "Spinach", "Carrot", "Mushroom", "Onion", "Sesame oil", "Soy sauce"],
    allergyNote: "Contains soy and sesame.",
    category: "Starter",
  },
  {
    id: "yuja-cha",
    name: "Yuja Cha",
    price: 3.5,
    description: "Korean citron tea, sweet and tangy, served warm or over ice.",
    image: "https://images.unsplash.com/photo-1623084921164-4a8c5c37a912?w=600&q=80",
    tags: ["beverage", "cool", "vegan"],
    ingredients: ["Citron marmalade", "Hot or cold water", "Ice"],
    allergyNote: "No common allergens.",
    category: "Beverage",
  },
];

export const BEST_SELLERS = ["com-tam-suon", "bulgogi", "banh-mi-thit-nuong"];
