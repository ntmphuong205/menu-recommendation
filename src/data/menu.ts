import { computeNutrition, type IngredientLine } from "./ingredients";

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

export interface Dish {
  id: string;
  name: string;
  price: number;
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
  category: "Main" | "Starter" | "Beverage" | "Side";
  soldOut?: boolean;
  /** Kitchen prep time, used to estimate wait time and queue position. */
  prepTimeMinutes?: number;
  /** Dishes that go especially well with this one — shown as an upsell prompt. */
  pairings?: Pairing[];
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
    ingredientLines: [
      { name: "Rice vermicelli", grams: 180 },
      { name: "Beef", grams: 70 },
      { name: "Pork", grams: 50 },
      { name: "Lemongrass", grams: 5 },
      { name: "Fresh herbs / cilantro", grams: 8 },
      { name: "Chili", grams: 3 },
    ],
    ingredients: ["Rice vermicelli", "Beef shank", "Pork knuckle", "Lemongrass", "Chili oil", "Herbs"],
    allergyNote: "Contains shrimp paste (mắm ruốc) and shellfish.",
    category: "Main",
    prepTimeMinutes: 12,
    pairings: [
      {
        dishId: "che-ba-mau",
        reason: "A cooling three-color dessert balances the chili heat of the broth.",
        reasons: {
          vi: "Chè ba màu mát lạnh giúp cân bằng vị cay nồng của bún bò Huế.",
          ko: "시원한 삼색 째가 매운 분보후에 국물의 열기를 잡아줘요.",
        },
      },
      {
        dishId: "goi-cuon",
        reason: "Fresh spring rolls add a light, herbal contrast to the rich spicy broth.",
        reasons: {
          vi: "Gỏi cuốn tươi mát tạo sự đối lập nhẹ nhàng với nước dùng cay đậm đà.",
          ko: "신선한 월남쌈이 진하고 매콤한 국물과 산뜻한 대조를 이뤄요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Ground pork", grams: 120 },
      { name: "Rice vermicelli", grams: 150 },
      { name: "Fish sauce", grams: 20 },
      { name: "Fresh herbs / cilantro", grams: 15 },
      { name: "Carrot", grams: 20 },
    ],
    ingredients: ["Grilled pork patties", "Rice vermicelli", "Fish sauce broth", "Fresh herbs", "Pickled vegetables"],
    allergyNote: "Contains fish sauce and peanuts (garnish).",
    category: "Main",
    prepTimeMinutes: 15,
    pairings: [
      {
        dishId: "cha-gio",
        reason: "Crispy spring rolls add texture contrast alongside the grilled pork.",
        reasons: {
          vi: "Chả giò giòn rụm tạo thêm kết cấu bên cạnh chả nướng.",
          ko: "바삭한 짜조가 구운 돼지고기 완자와 식감의 대비를 더해줘요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Rice paper", grams: 40 },
      { name: "Ground pork", grams: 60 },
      { name: "Mushroom", grams: 15 },
      { name: "Glass noodles (sweet potato)", grams: 20 },
      { name: "Carrot", grams: 15 },
      { name: "Dried shrimp", grams: 10 },
    ],
    ingredients: ["Rice paper", "Ground pork", "Wood ear mushroom", "Glass noodles", "Carrot", "Dried shrimp"],
    allergyNote: "Contains shellfish (dried shrimp) and gluten.",
    category: "Starter",
    prepTimeMinutes: 10,
    pairings: [
      {
        dishId: "goi-cuon",
        reason: "Pairing fried and fresh rolls side by side is a Vietnamese classic — richness balanced by freshness.",
        reasons: {
          vi: "Kết hợp chả giò chiên và gỏi cuốn tươi là bộ đôi kinh điển — vị béo được cân bằng bởi sự tươi mát.",
          ko: "튀긴 스프링롤과 신선한 월남쌈을 함께 즐기는 건 베트남의 클래식 조합이에요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Baguette / bread", grams: 120 },
      { name: "Pork", grams: 70 },
      { name: "Carrot", grams: 20 },
      { name: "Daikon radish", grams: 20 },
      { name: "Fresh herbs / cilantro", grams: 5 },
      { name: "Liver pâté", grams: 20 },
    ],
    ingredients: ["Baguette", "Grilled pork", "Pickled carrot & daikon", "Cilantro", "Chili", "Pork liver pâté"],
    allergyNote: "Contains gluten and liver pâté (not vegetarian).",
    category: "Main",
    prepTimeMinutes: 8,
    pairings: [
      {
        dishId: "ca-phe-sua-da",
        reason: "Iced milk coffee is the classic companion to a Vietnamese bánh mì.",
        reasons: {
          vi: "Cà phê sữa đá là người bạn đồng hành kinh điển của bánh mì.",
          ko: "아이스 밀크커피는 반미의 클래식한 짝꿍이에요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Rice (cooked)", grams: 200 },
      { name: "Pork", grams: 120 },
      { name: "Egg", grams: 55 },
      { name: "Sesame oil", grams: 5 },
      { name: "Fish sauce", grams: 10 },
    ],
    ingredients: ["Broken rice", "Grilled pork chop", "Fried egg", "Scallion oil", "Fish sauce"],
    allergyNote: "Contains egg and fish sauce.",
    category: "Main",
    prepTimeMinutes: 15,
    pairings: [
      {
        dishId: "canh-chua-ca",
        reason: "A tangy fish soup on the side rounds out the meal the way it's traditionally served.",
        reasons: {
          vi: "Thêm canh chua cá bên cạnh giúp bữa ăn tròn vị đúng kiểu truyền thống.",
          ko: "새콤한 생선 수프를 곁들이면 전통적인 방식으로 식사를 완성할 수 있어요.",
        },
      },
      {
        dishId: "goi-cuon",
        reason: "A lighter starter balances the hearty rice plate.",
        reasons: {
          vi: "Món khai vị nhẹ nhàng giúp cân bằng đĩa cơm no bụng.",
          ko: "가벼운 애피타이저가 든든한 덮밥과 균형을 이뤄요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Brewed coffee", grams: 150 },
      { name: "Condensed milk", grams: 30 },
      { name: "Ice / water", grams: 100 },
    ],
    ingredients: ["Robusta coffee", "Condensed milk", "Ice"],
    allergyNote: "Contains dairy.",
    category: "Beverage",
    prepTimeMinutes: 4,
    pairings: [
      {
        dishId: "banh-mi-thit-nuong",
        reason: "A bánh mì on the side turns your coffee break into a full meal.",
        reasons: {
          vi: "Thêm bánh mì biến giờ giải khát thành một bữa ăn trọn vẹn.",
          ko: "반미를 곁들이면 커피 타임이 든든한 한 끼가 돼요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Rice cake (tteok)", grams: 100 },
      { name: "Ramen noodles", grams: 80 },
      { name: "Kimchi", grams: 40 },
      { name: "Fish cake", grams: 40 },
      { name: "Egg", grams: 55 },
      { name: "Gochujang sauce", grams: 20 },
    ],
    ingredients: ["Rice cakes", "Ramen noodles", "Kimchi", "Fish cake", "Boiled egg", "Gochujang broth"],
    allergyNote: "Contains gluten, egg, and seafood (fish cake).",
    category: "Main",
    prepTimeMinutes: 12,
    pairings: [
      {
        dishId: "yuja-cha",
        reason: "Citron tea cools the palate after the spicy gochujang broth.",
        reasons: {
          vi: "Trà quýt giúp làm dịu vị giác sau vị cay của nước sốt gochujang.",
          ko: "유자차가 매콤한 고추장 국물 후에 입맛을 시원하게 해줘요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Rice (cooked)", grams: 180 },
      { name: "Beef", grams: 60 },
      { name: "Carrot", grams: 20 },
      { name: "Lettuce / leafy greens", grams: 30 },
      { name: "Bean sprouts", grams: 20 },
      { name: "Egg", grams: 55 },
      { name: "Gochujang sauce", grams: 15 },
    ],
    ingredients: ["Rice", "Marinated beef", "Carrot", "Spinach", "Bean sprouts", "Fried egg", "Gochujang sauce"],
    allergyNote: "Contains egg, soy, and sesame.",
    category: "Main",
    prepTimeMinutes: 10,
    pairings: [
      {
        dishId: "japchae",
        reason: "A classic Korean combo — glass noodles add variety alongside the rice bowl.",
        reasons: {
          vi: "Bộ đôi kinh điển của Hàn Quốc — miến xào tạo thêm sự đa dạng bên cạnh cơm trộn.",
          ko: "한국의 클래식 조합 — 잡채가 비빔밥과 함께 다양한 맛을 더해줘요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Beef", grams: 180 },
      { name: "Onion", grams: 30 },
      { name: "Sesame oil", grams: 10 },
      { name: "Scallion", grams: 10 },
      { name: "Soy sauce", grams: 20 },
    ],
    ingredients: ["Beef sirloin", "Soy-garlic marinade", "Onion", "Sesame oil", "Scallion"],
    allergyNote: "Contains soy and sesame.",
    category: "Main",
    prepTimeMinutes: 14,
    pairings: [
      {
        dishId: "japchae",
        reason: "Glass noodles are the traditional side to soak up the sweet marinade.",
        reasons: {
          vi: "Miến xào là món ăn kèm truyền thống để thấm vị nước sốt ngọt.",
          ko: "잡채는 달콤한 양념을 잘 흡수하는 전통적인 사이드예요.",
        },
      },
      {
        dishId: "ca-phe-trung",
        reason: "Egg coffee makes a rich, sweet finish after savory grilled beef.",
        reasons: {
          vi: "Cà phê trứng là món tráng miệng ngọt béo tuyệt vời sau món bò nướng đậm đà.",
          ko: "에그 커피는 진한 소고기 요리 후 달콤하고 진한 마무리로 좋아요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Rice cake (tteok)", grams: 150 },
      { name: "Fish cake", grams: 50 },
      { name: "Gochujang sauce", grams: 30 },
      { name: "Scallion", grams: 10 },
    ],
    ingredients: ["Rice cakes", "Fish cake", "Gochujang sauce", "Scallion"],
    allergyNote: "Contains gluten and seafood (fish cake).",
    category: "Side",
    prepTimeMinutes: 10,
    pairings: [
      {
        dishId: "yuja-cha",
        reason: "Citron tea's sweetness and cool temperature offset the spicy sauce.",
        reasons: {
          vi: "Vị ngọt mát của trà quýt giúp trung hoà vị cay của sốt.",
          ko: "유자차의 달콤하고 시원한 맛이 매콤한 소스를 잡아줘요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Glass noodles (sweet potato)", grams: 100 },
      { name: "Lettuce / leafy greens", grams: 20 },
      { name: "Carrot", grams: 20 },
      { name: "Mushroom", grams: 15 },
      { name: "Onion", grams: 15 },
      { name: "Sesame oil", grams: 10 },
      { name: "Soy sauce", grams: 15 },
    ],
    ingredients: ["Sweet potato glass noodles", "Spinach", "Carrot", "Mushroom", "Onion", "Sesame oil", "Soy sauce"],
    allergyNote: "Contains soy and sesame.",
    category: "Starter",
    prepTimeMinutes: 12,
    pairings: [
      {
        dishId: "bulgogi",
        reason: "Grilled beef alongside the noodles is Korean BBQ's most classic pairing.",
        reasons: {
          vi: "Thịt bò nướng bên cạnh miến xào là sự kết hợp kinh điển nhất của BBQ Hàn Quốc.",
          ko: "구운 소고기와 함께 먹는 건 한국식 BBQ의 가장 클래식한 조합이에요.",
        },
      },
    ],
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
    ingredientLines: [
      { name: "Citron marmalade", grams: 40 },
      { name: "Ice / water", grams: 150 },
    ],
    ingredients: ["Citron marmalade", "Hot or cold water", "Ice"],
    allergyNote: "No common allergens.",
    category: "Beverage",
    prepTimeMinutes: 3,
  },
  // --- More Vietnamese local specialties ---
  {
    id: "pho-bo",
    name: "Phở Bò",
    price: 8.5,
    description: "Hanoi-style beef noodle soup with a fragrant star anise broth, herbs, and lime.",
    descriptions: {
      vi: "Phở bò kiểu Hà Nội với nước dùng thơm hoa hồi, hành ngò và chanh tươi.",
      ko: "팔각 향이 은은한 하노이 스타일 소고기 쌀국수, 허브와 라임을 곁들여요.",
    },
    image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=600&q=80",
    tags: ["warm", "hearty", "popular"],
    ingredientLines: [
      { name: "Rice noodles (phở)", grams: 200 },
      { name: "Beef", grams: 90 },
      { name: "Bean sprouts", grams: 20 },
      { name: "Fresh herbs / cilantro", grams: 10 },
      { name: "Onion", grams: 15 },
      { name: "Fish sauce", grams: 10 },
    ],
    ingredients: ["Rice noodles", "Beef brisket & bones broth", "Star anise", "Bean sprouts", "Herbs", "Lime"],
    allergyNote: "Contains fish sauce. Noodles are gluten-free.",
    category: "Main",
    prepTimeMinutes: 15,
    pairings: [
      {
        dishId: "quay",
        reason: "Crispy fried dough sticks are the traditional dip for phở broth.",
        reasons: {
          vi: "Quẩy giòn chấm nước dùng phở là cách ăn truyền thống.",
          ko: "바삭한 꽈이(튀김빵)를 포 국물에 찍어 먹는 건 전통적인 방식이에요.",
        },
      },
      {
        dishId: "ca-phe-trung",
        reason: "Egg coffee is a beloved Hanoi-style finish to a bowl of phở.",
        reasons: {
          vi: "Cà phê trứng là món tráng miệng kiểu Hà Nội được yêu thích sau tô phở.",
          ko: "에그 커피는 포 한 그릇 후 즐기는 하노이 스타일의 인기 있는 마무리예요.",
        },
      },
    ],
  },
  {
    id: "goi-cuon",
    name: "Gỏi Cuốn",
    price: 5.5,
    description: "Fresh rice-paper rolls with shrimp, pork, rice vermicelli, and herbs, served with peanut sauce.",
    descriptions: {
      vi: "Gỏi cuốn tươi cuốn tôm thịt, bún và rau thơm, chấm cùng sốt đậu phộng.",
      ko: "새우, 돼지고기, 쌀국수, 허브를 라이스페이퍼로 만 신선한 월남쌈, 땅콩 소스를 곁들여요.",
    },
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80",
    tags: ["lowCalorie", "glutenFree", "cool"],
    ingredientLines: [
      { name: "Rice paper", grams: 30 },
      { name: "Shrimp", grams: 40 },
      { name: "Pork", grams: 30 },
      { name: "Rice vermicelli", grams: 40 },
      { name: "Fresh herbs / cilantro", grams: 10 },
      { name: "Peanut dipping sauce", grams: 25 },
    ],
    ingredients: ["Rice paper", "Shrimp", "Boiled pork", "Rice vermicelli", "Lettuce & herbs", "Peanut sauce"],
    allergyNote: "Contains shellfish (shrimp) and peanuts (dipping sauce).",
    category: "Starter",
    prepTimeMinutes: 8,
    pairings: [
      {
        dishId: "cha-gio",
        reason: "Pairing fried and fresh rolls side by side is a Vietnamese classic — richness balanced by freshness.",
        reasons: {
          vi: "Kết hợp chả giò chiên và gỏi cuốn tươi là bộ đôi kinh điển — vị béo được cân bằng bởi sự tươi mát.",
          ko: "튀긴 스프링롤과 신선한 월남쌈을 함께 즐기는 건 베트남의 클래식 조합이에요.",
        },
      },
    ],
  },
  {
    id: "banh-xeo",
    name: "Bánh Xèo",
    price: 7,
    description: "Crispy turmeric rice-flour pancake filled with shrimp, pork, and bean sprouts, wrapped in fresh herbs.",
    descriptions: {
      vi: "Bánh xèo giòn rụm vàng ươm nghệ, nhân tôm thịt và giá đỗ, cuốn cùng rau sống.",
      ko: "강황을 넣은 바삭한 쌀가루 팬케이크에 새우, 돼지고기, 숙주나물을 채우고 신선한 허브에 싸 먹어요.",
    },
    image: "https://images.unsplash.com/photo-1626804475297-411a58a09a45?w=600&q=80",
    tags: ["crispy", "hearty"],
    ingredientLines: [
      { name: "Rice flour batter", grams: 120 },
      { name: "Shrimp", grams: 40 },
      { name: "Pork", grams: 40 },
      { name: "Bean sprouts", grams: 30 },
      { name: "Coconut milk", grams: 20 },
      { name: "Onion", grams: 10 },
    ],
    ingredients: ["Rice flour & turmeric batter", "Shrimp", "Pork", "Bean sprouts", "Coconut milk", "Fresh herbs"],
    allergyNote: "Contains shellfish (shrimp) and coconut.",
    category: "Main",
    prepTimeMinutes: 14,
    pairings: [
      {
        dishId: "goi-cuon",
        reason: "Both are traditionally eaten wrapped with fresh herbs — a natural combo.",
        reasons: {
          vi: "Cả hai món đều được ăn kèm rau sống truyền thống — kết hợp rất tự nhiên.",
          ko: "둘 다 전통적으로 신선한 허브와 함께 먹는 음식이라 잘 어울려요.",
        },
      },
      {
        dishId: "che-ba-mau",
        reason: "A sweet dessert balances the savory, crispy pancake.",
        reasons: {
          vi: "Món chè ngọt giúp cân bằng vị mặn béo giòn của bánh xèo.",
          ko: "달콤한 째가 바삭하고 짭짤한 반쎄오와 균형을 이뤄요.",
        },
      },
    ],
  },
  {
    id: "canh-chua-ca",
    name: "Canh Chua Cá",
    price: 8,
    description: "Southern Vietnamese sweet-and-sour fish soup with pineapple, tomato, and tamarind broth.",
    descriptions: {
      vi: "Canh chua cá miền Tây với thơm, cà chua và nước dùng me chua thanh.",
      ko: "파인애플, 토마토, 타마린드 육수로 끓인 남부 베트남식 새콤달콤한 생선 수프.",
    },
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
    tags: ["sweetSour", "warm", "lowCalorie"],
    ingredientLines: [
      { name: "Fish fillet", grams: 120 },
      { name: "Pineapple", grams: 40 },
      { name: "Tomato", grams: 30 },
      { name: "Tamarind sauce", grams: 20 },
      { name: "Bean sprouts", grams: 20 },
      { name: "Fresh herbs / cilantro", grams: 8 },
    ],
    ingredients: ["Fish fillet", "Pineapple", "Tomato", "Tamarind broth", "Bean sprouts", "Herbs"],
    allergyNote: "Contains fish.",
    category: "Main",
    prepTimeMinutes: 15,
    pairings: [
      {
        dishId: "com-tam-suon",
        reason: "A tangy soup on the side is the traditional way this is served alongside rice.",
        reasons: {
          vi: "Ăn kèm cơm là cách thưởng thức canh chua truyền thống.",
          ko: "밥과 함께 먹는 것이 전통적인 방식이에요.",
        },
      },
      {
        dishId: "quay",
        reason: "Fried dough sticks are great for soaking up the tangy broth.",
        reasons: {
          vi: "Quẩy rất hợp để chấm và thấm vị nước canh chua.",
          ko: "꽈이는 새콤한 국물을 찍어 먹기에 아주 좋아요.",
        },
      },
    ],
  },
  {
    id: "che-ba-mau",
    name: "Chè Ba Màu",
    price: 3,
    description: "Layered three-color dessert of mung bean, red bean, and jelly over ice with coconut milk.",
    descriptions: {
      vi: "Chè ba màu với đậu xanh, đậu đỏ và thạch, phủ nước cốt dừa và đá bào.",
      ko: "녹두, 팥, 젤리를 층층이 쌓고 코코넛 밀크와 얼음을 올린 삼색 디저트.",
    },
    image: "https://images.unsplash.com/photo-1608219994488-cbb2f4f56685?w=600&q=80",
    tags: ["beverage", "cool", "sweetSour"],
    ingredientLines: [
      { name: "Mung bean paste", grams: 40 },
      { name: "Grass jelly / tapioca pearls", grams: 30 },
      { name: "Coconut milk", grams: 40 },
      { name: "Ice / water", grams: 60 },
    ],
    ingredients: ["Mung bean paste", "Red beans", "Grass jelly", "Coconut milk", "Ice"],
    allergyNote: "Contains coconut.",
    category: "Beverage",
    prepTimeMinutes: 5,
  },
  {
    id: "ca-phe-trung",
    name: "Cà Phê Trứng",
    price: 3.5,
    description: "Hanoi egg coffee — whipped egg yolk and condensed milk over strong robusta coffee.",
    descriptions: {
      vi: "Cà phê trứng Hà Nội — lòng đỏ trứng đánh bông cùng sữa đặc trên nền cà phê robusta đậm đà.",
      ko: "하노이식 에그 커피 — 진한 로부스타 커피 위에 달걀노른자와 연유를 휘핑해 올려요.",
    },
    image: "https://images.unsplash.com/photo-1610632380989-680fe40816c6?w=600&q=80",
    tags: ["beverage", "warm"],
    ingredientLines: [
      { name: "Brewed coffee", grams: 80 },
      { name: "Egg", grams: 55 },
      { name: "Condensed milk", grams: 25 },
    ],
    ingredients: ["Robusta coffee", "Egg yolk", "Condensed milk"],
    allergyNote: "Contains egg and dairy.",
    category: "Beverage",
    prepTimeMinutes: 6,
  },
  {
    id: "quay",
    name: "Quẩy",
    price: 2,
    description: "Light, crispy fried dough sticks — the classic dip-along for phở and congee.",
    descriptions: {
      vi: "Quẩy chiên giòn nhẹ — món ăn kèm kinh điển của phở và cháo.",
      ko: "가볍고 바삭한 튀김빵 — 포와 죽에 곁들이는 클래식한 사이드.",
    },
    image: "https://images.unsplash.com/photo-1585325701956-60dd0f5b6f2d?w=600&q=80",
    tags: ["crispy", "hearty"],
    ingredientLines: [{ name: "Fried dough sticks (quẩy)", grams: 60 }],
    ingredients: ["Wheat flour", "Yeast", "Oil"],
    allergyNote: "Contains gluten.",
    category: "Side",
    prepTimeMinutes: 6,
    pairings: [
      {
        dishId: "pho-bo",
        reason: "Dipped straight into the broth, quẩy soaks up the flavor of a good bowl of phở.",
        reasons: {
          vi: "Chấm trực tiếp vào nước dùng, quẩy thấm trọn vị ngon của tô phở.",
          ko: "국물에 바로 찍어 먹으면 포의 맛을 그대로 흡수해요.",
        },
      },
    ],
  },
];

DEFAULT_MENU.forEach((dish) => {
  if (!dish.ingredientLines) return;
  const totals = computeNutrition(dish.ingredientLines);
  dish.calories = Math.round(totals.calories);
  dish.protein = Math.round(totals.protein);
  dish.carbs = Math.round(totals.carbs);
  dish.fat = Math.round(totals.fat);
});

export const BEST_SELLERS = ["pho-bo", "com-tam-suon", "banh-mi-thit-nuong"];

export function getDishDescription(dish: Dish, lang: "vi" | "en" | "ko"): string {
  return dish.descriptions?.[lang] ?? dish.description;
}

export function getPairingReason(pairing: Pairing, lang: "vi" | "en" | "ko"): string {
  if (lang === "en") return pairing.reason;
  return pairing.reasons?.[lang] ?? pairing.reason;
}
