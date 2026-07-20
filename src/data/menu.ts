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

export interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
  descriptions?: Partial<Record<"vi" | "en" | "ko", string>>;
  image: string;
  tags: TagKey[];
  calories?: number;
  detail?: string; // extra nutrition fact e.g. "Protein: 25g"
  ingredients: string[];
  allergyNote: string;
  category: "Main" | "Starter" | "Beverage" | "Side";
  soldOut?: boolean;
}

export const DEFAULT_MENU: Dish[] = [
  // --- Vietnamese ---
  {
    id: "bun-bo-hue",
    name: "Bún Bò Huế",
    price: 9.5,
    description: "Spicy beef & pork noodle soup from Huế, fragrant with lemongrass and chili oil.",
    descriptions: {
      vi: "Bún bò cay đặc trưng xứ Huế, thơm sả và ớt dầu, đậm đà vị bò và giò heo.",
      ko: "레몬그라스와 고추기름 향이 진한 후에 지방의 매운 소고기·돼지고기 쌀국수.",
    },
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
    descriptions: {
      vi: "Chả heo nướng than hoa ăn kèm bún, rau thơm và nước chấm chua ngọt.",
      ko: "숯불에 구운 돼지고기 완자와 쌀국수, 허브, 새콤달콤한 디핑 소스를 함께 즐기는 요리.",
    },
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
    descriptions: {
      vi: "Chả giò chiên giòn nhân thịt heo, mộc nhĩ và miến, chấm nước mắm chua ngọt.",
      ko: "돼지고기, 목이버섯, 당면을 채운 바삭한 베트남식 튀김 스프링롤.",
    },
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
    descriptions: {
      vi: "Bánh mì nướng giòn kẹp thịt nướng, đồ chua cà rốt củ cải, rau mùi và pate.",
      ko: "구운 바게트에 그릴 돼지고기, 절인 당근·무, 고수, 파테를 채운 베트남식 샌드위치.",
    },
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
    descriptions: {
      vi: "Cơm tấm sườn nướng, trứng ốp la và mỡ hành thơm lừng.",
      ko: "그릴 돼지갈비, 계란후라이, 향긋한 파기름을 곁들인 부서진 쌀밥 요리.",
    },
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
    descriptions: {
      vi: "Cà phê robusta đậm đà pha cùng sữa đặc, phục vụ với đá.",
      ko: "진한 베트남 로부스타 커피에 달콤한 연유를 넣은 아이스 커피.",
    },
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
    descriptions: {
      vi: "Bánh gạo và mì ramen ninh trong nước sốt gochujang cay, ăn kèm trứng và chả cá.",
      ko: "쫄깃한 떡과 라면 사리를 매콤한 고추장 국물에 끓이고 계란과 어묵을 올린 라볶이.",
    },
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
    descriptions: {
      vi: "Cơm trộn nóng với rau củ nêm gia vị, thịt bò ướp, trứng ốp la và sốt gochujang.",
      ko: "따뜻한 밥 위에 양념 채소, 소고기, 계란후라이, 고추장 소스를 올린 비빔밥.",
    },
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
    descriptions: {
      vi: "Thịt bò thái mỏng ướp sốt tương tỏi ngọt, nướng kiểu BBQ Hàn Quốc ngay tại bàn.",
      ko: "달콤한 간장 마늘 소스에 재운 얇게 썬 소고기를 테이블에서 직접 구워 먹는 불고기.",
    },
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
    descriptions: {
      vi: "Bánh gạo dai ninh trong sốt gochujang cay ngọt — món ăn đường phố kinh điển của Hàn Quốc.",
      ko: "쫄깃한 떡을 매콤달콤한 고추장 소스에 조린 한국의 대표 길거리 음식.",
    },
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
    descriptions: {
      vi: "Miến khoai lang xào rau củ và dầu mè — món chay được yêu thích nhất của quán.",
      ko: "채소와 참기름을 넣어 볶은 고구마 당면 요리 — 채식 인기 메뉴.",
    },
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
    descriptions: {
      vi: "Trà quýt Hàn Quốc vị ngọt thanh, phục vụ nóng hoặc đá.",
      ko: "달콤하고 상큼한 한국식 유자차, 따뜻하게 또는 시원하게 즐길 수 있어요.",
    },
    image: "https://images.unsplash.com/photo-1623084921164-4a8c5c37a912?w=600&q=80",
    tags: ["beverage", "cool", "vegan"],
    ingredients: ["Citron marmalade", "Hot or cold water", "Ice"],
    allergyNote: "No common allergens.",
    category: "Beverage",
  },
];

export const BEST_SELLERS = ["com-tam-suon", "bulgogi", "banh-mi-thit-nuong"];

export function getDishDescription(dish: Dish, lang: "vi" | "en" | "ko"): string {
  return dish.descriptions?.[lang] ?? dish.description;
}
