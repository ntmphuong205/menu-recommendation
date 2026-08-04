-- Sample store, menu, and table-layout data for the merged schema.
-- Adapted from Wexit's seed.sql, updated for db/schema.sql column set
-- (adds nutrition/pairing fields to demonstrate the merged menu shape).

insert into public.stores (
    id,
    name,
    name_en,
    name_vi,
    hours,
    hours_en,
    hours_vi,
    description,
    description_en,
    description_vi,
    recommendation_keywords
)
values (
    '11111111-1111-4111-8111-111111111111',
    '라 테라짜 키친',
    'La Terrazza Kitchen',
    'Nhà hàng La Terrazza',
    '평일 11:30 - 22:00',
    'Weekdays 11:30 - 22:00',
    'Các ngày trong tuần 11:30 - 22:00',
    '테라스가 있는 양식 레스토랑',
    'A Western restaurant with a terrace',
    'Nhà hàng món Âu có sân hiên',
    '["#스트레스", "#해장", "#혼밥", "#가성비", "#회식", "#매운맛", "#달콤한", "#국물"]'::jsonb
)
on conflict (id) do update set
    name = excluded.name,
    name_en = excluded.name_en,
    name_vi = excluded.name_vi,
    hours = excluded.hours,
    hours_en = excluded.hours_en,
    hours_vi = excluded.hours_vi,
    description = excluded.description,
    description_en = excluded.description_en,
    description_vi = excluded.description_vi,
    recommendation_keywords = excluded.recommendation_keywords;

insert into public.menus (
    id,
    store_id,
    name,
    price,
    currency,
    description,
    tags,
    image_url,
    is_sold_out,
    category,
    calories,
    protein,
    carbs,
    fat,
    ingredient_lines,
    prep_time_minutes
)
values
(
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    '{"ko":"후라이드 치킨","en":"Fried Chicken","vi":"Gà rán"}'::jsonb,
    18000,
    'KRW',
    '{"ko":"바삭바삭한 황금빛 후라이드 치킨","en":"Crispy golden fried chicken","vi":"Gà rán vàng giòn"}'::jsonb,
    '["crispy", "popular"]'::jsonb,
    'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=150&q=80',
    false,
    'Main',
    620,
    38,
    28,
    36,
    '[{"name":"chicken","grams":300},{"name":"flour","grams":60},{"name":"oil","grams":20}]'::jsonb,
    15
),
(
    '22222222-2222-4222-8222-222222222223',
    '11111111-1111-4111-8111-111111111111',
    '{"ko":"시저 샐러드","en":"Caesar Salad","vi":"Salad Caesar"}'::jsonb,
    9000,
    'KRW',
    '{"ko":"신선한 로메인과 파마산 치즈 샐러드","en":"Fresh romaine and parmesan salad","vi":"Salad xà lách romaine và phô mai parmesan"}'::jsonb,
    '["lowCalorie", "vegan"]'::jsonb,
    'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=150&q=80',
    false,
    'Starter',
    280,
    9,
    14,
    18,
    '[{"name":"romaine lettuce","grams":150},{"name":"parmesan cheese","grams":20}]'::jsonb,
    8
)
on conflict (id) do update set
    name = excluded.name,
    price = excluded.price,
    currency = excluded.currency,
    description = excluded.description,
    tags = excluded.tags,
    image_url = excluded.image_url,
    is_sold_out = excluded.is_sold_out,
    category = excluded.category,
    calories = excluded.calories,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    ingredient_lines = excluded.ingredient_lines,
    prep_time_minutes = excluded.prep_time_minutes;

-- Pairing suggestion: recommend the salad alongside the fried chicken.
update public.menus
set pairings = '[{"menu_id":"22222222-2222-4222-8222-222222222223","reason":{"ko":"가벼운 곁들임","en":"A light side","vi":"Món ăn kèm nhẹ nhàng"}}]'::jsonb
where id = '22222222-2222-4222-8222-222222222222';

-- The full original ICAPS demo menu (Vietnamese/Korean fusion dishes),
-- migrated from src/data/menu.ts into this schema — restores the rich
-- catalog alongside the 2 example dishes above.
insert into public.menus (
    id, store_id, name, price, currency, description, category, tags,
    image_url, is_sold_out, calories, protein, carbs, fat, ingredient_lines,
    allergy_note, prep_time_minutes, pairings
)
values
('795a8996-8035-4fcc-9c58-0b18db6cce30', '11111111-1111-4111-8111-111111111111', '{"en": "Bún Bò Huế", "ko": "Bún Bò Huế", "vi": "Bún Bò Huế"}'::jsonb, 9.5, 'USD', '{"en": "Spicy beef & pork noodle soup from Huế, fragrant with lemongrass and chili oil.", "ko": "레몬그라스와 고추기름 향이 진한 후에 지방의 매운 소고기·돼지고기 쌀국수.", "vi": "Bún bò cay đặc trưng xứ Huế, thơm sả và ớt dầu, đậm đà vị bò và giò heo."}'::jsonb, 'Main', '["spicy", "warm", "hearty"]'::jsonb, 'https://images.unsplash.com/photo-1597345637412-9fd611e758f3?w=600&q=80', false, 500, 36, 47, 18, '[{"name": "Rice vermicelli", "grams": 180}, {"name": "Beef", "grams": 70}, {"name": "Pork", "grams": 50}, {"name": "Lemongrass", "grams": 5}, {"name": "Fresh herbs / cilantro", "grams": 8}, {"name": "Chili", "grams": 3}]'::jsonb, '{"en": "Contains shrimp paste (mắm ruốc) and shellfish.", "ko": "Contains shrimp paste (mắm ruốc) and shellfish.", "vi": "Contains shrimp paste (mắm ruốc) and shellfish."}'::jsonb, 12, '[{"menu_id": "eeac2519-a9a3-4766-a210-0fc29c0ea30d", "reason": {"en": "A cooling three-color dessert balances the chili heat of the broth.", "ko": "시원한 삼색 째가 매운 분보후에 국물의 열기를 잡아줘요.", "vi": "Chè ba màu mát lạnh giúp cân bằng vị cay nồng của bún bò Huế."}}, {"menu_id": "8474f747-b593-4326-9843-37ccfec94d45", "reason": {"en": "Fresh spring rolls add a light, herbal contrast to the rich spicy broth.", "ko": "신선한 월남쌈이 진하고 매콤한 국물과 산뜻한 대조를 이뤄요.", "vi": "Gỏi cuốn tươi mát tạo sự đối lập nhẹ nhàng với nước dùng cay đậm đà."}}]'::jsonb),
('1e6deef9-76fa-4f2e-b944-3dd9fdcaffef', '11111111-1111-4111-8111-111111111111', '{"en": "Bún Chả", "ko": "Bún Chả", "vi": "Bún Chả"}'::jsonb, 8.5, 'USD', '{"en": "Charcoal-grilled pork patties served with rice vermicelli, herbs, and a tangy dipping broth.", "ko": "숯불에 구운 돼지고기 완자와 쌀국수, 허브, 새콤달콤한 디핑 소스를 함께 즐기는 요리.", "vi": "Chả heo nướng than hoa ăn kèm bún, rau thơm và nước chấm chua ngọt."}'::jsonb, 'Main', '["hearty", "warm"]'::jsonb, 'https://images.unsplash.com/photo-1763703544688-2ac7839b0659?w=600&q=80', false, 498, 34, 41, 22, '[{"name": "Ground pork", "grams": 120}, {"name": "Rice vermicelli", "grams": 150}, {"name": "Fish sauce", "grams": 20}, {"name": "Fresh herbs / cilantro", "grams": 15}, {"name": "Carrot", "grams": 20}]'::jsonb, '{"en": "Contains fish sauce and peanuts (garnish).", "ko": "Contains fish sauce and peanuts (garnish).", "vi": "Contains fish sauce and peanuts (garnish)."}'::jsonb, 15, '[{"menu_id": "6d8c3cbd-993f-4fb6-bb6b-b6ab453dfd6f", "reason": {"en": "Crispy spring rolls add texture contrast alongside the grilled pork.", "ko": "바삭한 짜조가 구운 돼지고기 완자와 식감의 대비를 더해줘요.", "vi": "Chả giò giòn rụm tạo thêm kết cấu bên cạnh chả nướng."}}]'::jsonb),
('6d8c3cbd-993f-4fb6-bb6b-b6ab453dfd6f', '11111111-1111-4111-8111-111111111111', '{"en": "Chả Giò", "ko": "Chả Giò", "vi": "Chả Giò"}'::jsonb, 6, 'USD', '{"en": "Crispy fried spring rolls packed with pork, wood ear mushroom, and glass noodles.", "ko": "돼지고기, 목이버섯, 당면을 채운 바삭한 베트남식 튀김 스프링롤.", "vi": "Chả giò chiên giòn nhân thịt heo, mộc nhĩ và miến, chấm nước mắm chua ngọt."}'::jsonb, 'Starter', '["crispy", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1679310290259-78d9eaa32700?w=600&q=80', false, 357, 24, 40, 11, '[{"name": "Rice paper", "grams": 40}, {"name": "Ground pork", "grams": 60}, {"name": "Mushroom", "grams": 15}, {"name": "Glass noodles (sweet potato)", "grams": 20}, {"name": "Carrot", "grams": 15}, {"name": "Dried shrimp", "grams": 10}]'::jsonb, '{"en": "Contains shellfish (dried shrimp) and gluten.", "ko": "Contains shellfish (dried shrimp) and gluten.", "vi": "Contains shellfish (dried shrimp) and gluten."}'::jsonb, 10, '[{"menu_id": "8474f747-b593-4326-9843-37ccfec94d45", "reason": {"en": "Pairing fried and fresh rolls side by side is a Vietnamese classic — richness balanced by freshness.", "ko": "튀긴 스프링롤과 신선한 월남쌈을 함께 즐기는 건 베트남의 클래식 조합이에요.", "vi": "Kết hợp chả giò chiên và gỏi cuốn tươi là bộ đôi kinh điển — vị béo được cân bằng bởi sự tươi mát."}}]'::jsonb),
('1e6609a2-10c4-4859-b277-32b2b00dd566', '11111111-1111-4111-8111-111111111111', '{"en": "Bánh Mì Thịt Nướng", "ko": "Bánh Mì Thịt Nướng", "vi": "Bánh Mì Thịt Nướng"}'::jsonb, 5, 'USD', '{"en": "Toasted baguette stuffed with grilled pork, pickled carrot & daikon, cilantro, and pâté.", "ko": "구운 바게트에 그릴 돼지고기, 절인 당근·무, 고수, 파테를 채운 베트남식 샌드위치.", "vi": "Bánh mì nướng giòn kẹp thịt nướng, đồ chua cà rốt củ cải, rau mùi và pate."}'::jsonb, 'Main', '["hearty", "crispy", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1700937244987-92488ab2ada5?w=600&q=80', false, 564, 33, 62, 19, '[{"name": "Baguette / bread", "grams": 120}, {"name": "Pork", "grams": 70}, {"name": "Carrot", "grams": 20}, {"name": "Daikon radish", "grams": 20}, {"name": "Fresh herbs / cilantro", "grams": 5}, {"name": "Liver pâté", "grams": 20}]'::jsonb, '{"en": "Contains gluten and liver pâté (not vegetarian).", "ko": "Contains gluten and liver pâté (not vegetarian).", "vi": "Contains gluten and liver pâté (not vegetarian)."}'::jsonb, 8, '[{"menu_id": "bdfc7429-1a44-49c5-9bf8-cadccdd3bbcd", "reason": {"en": "Iced milk coffee is the classic companion to a Vietnamese bánh mì.", "ko": "아이스 밀크커피는 반미의 클래식한 짝꿍이에요.", "vi": "Cà phê sữa đá là người bạn đồng hành kinh điển của bánh mì."}}]'::jsonb),
('92232755-a5c7-4fdf-b88b-cdc5543734f5', '11111111-1111-4111-8111-111111111111', '{"en": "Cơm Tấm Sườn", "ko": "Cơm Tấm Sườn", "vi": "Cơm Tấm Sườn"}'::jsonb, 7.5, 'USD', '{"en": "Broken rice with a grilled pork chop, fried egg, and fragrant scallion oil.", "ko": "그릴 돼지갈비, 계란후라이, 향긋한 파기름을 곁들인 부서진 쌀밥 요리.", "vi": "Cơm tấm sườn nướng, trứng ốp la và mỡ hành thơm lừng."}'::jsonb, 'Main', '["hearty", "highProtein", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1766050587783-1c90751275dd?w=600&q=80', false, 683, 45, 57, 28, '[{"name": "Rice (cooked)", "grams": 200}, {"name": "Pork", "grams": 120}, {"name": "Egg", "grams": 55}, {"name": "Sesame oil", "grams": 5}, {"name": "Fish sauce", "grams": 10}]'::jsonb, '{"en": "Contains egg and fish sauce.", "ko": "Contains egg and fish sauce.", "vi": "Contains egg and fish sauce."}'::jsonb, 15, '[{"menu_id": "1f1bb37f-1d2c-48f4-a0a7-61486fc1a2f2", "reason": {"en": "A tangy fish soup on the side rounds out the meal the way it''s traditionally served.", "ko": "새콤한 생선 수프를 곁들이면 전통적인 방식으로 식사를 완성할 수 있어요.", "vi": "Thêm canh chua cá bên cạnh giúp bữa ăn tròn vị đúng kiểu truyền thống."}}, {"menu_id": "8474f747-b593-4326-9843-37ccfec94d45", "reason": {"en": "A lighter starter balances the hearty rice plate.", "ko": "가벼운 애피타이저가 든든한 덮밥과 균형을 이뤄요.", "vi": "Món khai vị nhẹ nhàng giúp cân bằng đĩa cơm no bụng."}}]'::jsonb),
('bdfc7429-1a44-49c5-9bf8-cadccdd3bbcd', '11111111-1111-4111-8111-111111111111', '{"en": "Cà Phê Sữa Đá", "ko": "Cà Phê Sữa Đá", "vi": "Cà Phê Sữa Đá"}'::jsonb, 2.5, 'USD', '{"en": "Bold Vietnamese robusta coffee over ice with sweet condensed milk.", "ko": "진한 베트남 로부스타 커피에 달콤한 연유를 넣은 아이스 커피.", "vi": "Cà phê robusta đậm đà pha cùng sữa đặc, phục vụ với đá."}'::jsonb, 'Beverage', '["beverage", "cool"]'::jsonb, 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80', false, 99, 3, 16, 3, '[{"name": "Brewed coffee", "grams": 150}, {"name": "Condensed milk", "grams": 30}, {"name": "Ice / water", "grams": 100}]'::jsonb, '{"en": "Contains dairy.", "ko": "Contains dairy.", "vi": "Contains dairy."}'::jsonb, 4, '[{"menu_id": "1e6609a2-10c4-4859-b277-32b2b00dd566", "reason": {"en": "A bánh mì on the side turns your coffee break into a full meal.", "ko": "반미를 곁들이면 커피 타임이 든든한 한 끼가 돼요.", "vi": "Thêm bánh mì biến giờ giải khát thành một bữa ăn trọn vẹn."}}]'::jsonb),
('991fd17b-b04d-4c03-8c69-62aa42290544', '11111111-1111-4111-8111-111111111111', '{"en": "Rabokki", "ko": "Rabokki", "vi": "Rabokki"}'::jsonb, 9, 'USD', '{"en": "Chewy rice cakes and ramen noodles simmered in a spicy gochujang broth with egg and fish cake.", "ko": "쫄깃한 떡과 라면 사리를 매콤한 고추장 국물에 끓이고 계란과 어묵을 올린 라볶이.", "vi": "Bánh gạo và mì ramen ninh trong nước sốt gochujang cay, ăn kèm trứng và chả cá."}'::jsonb, 'Main', '["spicy", "warm", "hearty"]'::jsonb, 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=600&q=80', false, 539, 21, 83, 13, '[{"name": "Rice cake (tteok)", "grams": 100}, {"name": "Ramen noodles", "grams": 80}, {"name": "Kimchi", "grams": 40}, {"name": "Fish cake", "grams": 40}, {"name": "Egg", "grams": 55}, {"name": "Gochujang sauce", "grams": 20}]'::jsonb, '{"en": "Contains gluten, egg, and seafood (fish cake).", "ko": "Contains gluten, egg, and seafood (fish cake).", "vi": "Contains gluten, egg, and seafood (fish cake)."}'::jsonb, 12, '[{"menu_id": "6657f636-f1f0-4fff-b7a4-3cdcd278ddfb", "reason": {"en": "Citron tea cools the palate after the spicy gochujang broth.", "ko": "유자차가 매콤한 고추장 국물 후에 입맛을 시원하게 해줘요.", "vi": "Trà quýt giúp làm dịu vị giác sau vị cay của nước sốt gochujang."}}]'::jsonb),
('2e6d4947-8b52-4048-8406-3846db5ea84e', '11111111-1111-4111-8111-111111111111', '{"en": "Bibimbap", "ko": "Bibimbap", "vi": "Bibimbap"}'::jsonb, 9.5, 'USD', '{"en": "Warm rice bowl topped with seasoned vegetables, marinated beef, a fried egg, and gochujang sauce.", "ko": "따뜻한 밥 위에 양념 채소, 소고기, 계란후라이, 고추장 소스를 올린 비빔밥.", "vi": "Cơm trộn nóng với rau củ nêm gia vị, thịt bò ướp, trứng ốp la và sốt gochujang."}'::jsonb, 'Main', '["lowCalorie", "highProtein", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1718777791239-c473e9ce7376?w=600&q=80', false, 520, 30, 62, 16, '[{"name": "Rice (cooked)", "grams": 180}, {"name": "Beef", "grams": 60}, {"name": "Carrot", "grams": 20}, {"name": "Lettuce / leafy greens", "grams": 30}, {"name": "Bean sprouts", "grams": 20}, {"name": "Egg", "grams": 55}, {"name": "Gochujang sauce", "grams": 15}]'::jsonb, '{"en": "Contains egg, soy, and sesame.", "ko": "Contains egg, soy, and sesame.", "vi": "Contains egg, soy, and sesame."}'::jsonb, 10, '[{"menu_id": "5e00a10b-83cb-4ebd-a6ca-e66e19cedaf0", "reason": {"en": "A classic Korean combo — glass noodles add variety alongside the rice bowl.", "ko": "한국의 클래식 조합 — 잡채가 비빔밥과 함께 다양한 맛을 더해줘요.", "vi": "Bộ đôi kinh điển của Hàn Quốc — miến xào tạo thêm sự đa dạng bên cạnh cơm trộn."}}]'::jsonb),
('2a44afa4-8865-418a-aaa9-eb9075527133', '11111111-1111-4111-8111-111111111111', '{"en": "Bulgogi", "ko": "Bulgogi", "vi": "Bulgogi"}'::jsonb, 12, 'USD', '{"en": "Thinly sliced beef marinated in a sweet soy-garlic sauce, grilled tableside Korean BBQ style.", "ko": "달콤한 간장 마늘 소스에 재운 얇게 썬 소고기를 테이블에서 직접 구워 먹는 불고기.", "vi": "Thịt bò thái mỏng ướp sốt tương tỏi ngọt, nướng kiểu BBQ Hàn Quốc ngay tại bàn."}'::jsonb, 'Main', '["hearty", "highProtein", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1632558610168-8377309e34c7?w=600&q=80', false, 566, 49, 5, 37, '[{"name": "Beef", "grams": 180}, {"name": "Onion", "grams": 30}, {"name": "Sesame oil", "grams": 10}, {"name": "Scallion", "grams": 10}, {"name": "Soy sauce", "grams": 20}]'::jsonb, '{"en": "Contains soy and sesame.", "ko": "Contains soy and sesame.", "vi": "Contains soy and sesame."}'::jsonb, 14, '[{"menu_id": "5e00a10b-83cb-4ebd-a6ca-e66e19cedaf0", "reason": {"en": "Glass noodles are the traditional side to soak up the sweet marinade.", "ko": "잡채는 달콤한 양념을 잘 흡수하는 전통적인 사이드예요.", "vi": "Miến xào là món ăn kèm truyền thống để thấm vị nước sốt ngọt."}}, {"menu_id": "87acc0ba-2791-4f1f-9629-0108897483d5", "reason": {"en": "Egg coffee makes a rich, sweet finish after savory grilled beef.", "ko": "에그 커피는 진한 소고기 요리 후 달콤하고 진한 마무리로 좋아요.", "vi": "Cà phê trứng là món tráng miệng ngọt béo tuyệt vời sau món bò nướng đậm đà."}}]'::jsonb),
('fbdef78e-cb0b-4a0a-9c7e-f575aaf2e5cd', '11111111-1111-4111-8111-111111111111', '{"en": "Tteokbokki", "ko": "Tteokbokki", "vi": "Tteokbokki"}'::jsonb, 6, 'USD', '{"en": "Chewy rice cakes simmered in a sweet-and-spicy gochujang sauce — a Korean street food classic.", "ko": "쫄깃한 떡을 매콤달콤한 고추장 소스에 조린 한국의 대표 길거리 음식.", "vi": "Bánh gạo dai ninh trong sốt gochujang cay ngọt — món ăn đường phố kinh điển của Hàn Quốc."}'::jsonb, 'Side', '["spicy"]'::jsonb, 'https://images.unsplash.com/photo-1679581083578-94eae6e8d7a4?w=600&q=80', false, 438, 13, 90, 2, '[{"name": "Rice cake (tteok)", "grams": 150}, {"name": "Fish cake", "grams": 50}, {"name": "Gochujang sauce", "grams": 30}, {"name": "Scallion", "grams": 10}]'::jsonb, '{"en": "Contains gluten and seafood (fish cake).", "ko": "Contains gluten and seafood (fish cake).", "vi": "Contains gluten and seafood (fish cake)."}'::jsonb, 10, '[{"menu_id": "6657f636-f1f0-4fff-b7a4-3cdcd278ddfb", "reason": {"en": "Citron tea''s sweetness and cool temperature offset the spicy sauce.", "ko": "유자차의 달콤하고 시원한 맛이 매콤한 소스를 잡아줘요.", "vi": "Vị ngọt mát của trà quýt giúp trung hoà vị cay của sốt."}}]'::jsonb),
('5e00a10b-83cb-4ebd-a6ca-e66e19cedaf0', '11111111-1111-4111-8111-111111111111', '{"en": "Japchae", "ko": "Japchae", "vi": "Japchae"}'::jsonb, 7.5, 'USD', '{"en": "Stir-fried sweet potato glass noodles with vegetables and sesame oil — our vegetarian favorite.", "ko": "채소와 참기름을 넣어 볶은 고구마 당면 요리 — 채식 인기 메뉴.", "vi": "Miến khoai lang xào rau củ và dầu mè — món chay được yêu thích nhất của quán."}'::jsonb, 'Starter', '["vegan", "lowCalorie"]'::jsonb, 'https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&q=80', false, 321, 3, 54, 10, '[{"name": "Glass noodles (sweet potato)", "grams": 100}, {"name": "Lettuce / leafy greens", "grams": 20}, {"name": "Carrot", "grams": 20}, {"name": "Mushroom", "grams": 15}, {"name": "Onion", "grams": 15}, {"name": "Sesame oil", "grams": 10}, {"name": "Soy sauce", "grams": 15}]'::jsonb, '{"en": "Contains soy and sesame.", "ko": "Contains soy and sesame.", "vi": "Contains soy and sesame."}'::jsonb, 12, '[{"menu_id": "2a44afa4-8865-418a-aaa9-eb9075527133", "reason": {"en": "Grilled beef alongside the noodles is Korean BBQ''s most classic pairing.", "ko": "구운 소고기와 함께 먹는 건 한국식 BBQ의 가장 클래식한 조합이에요.", "vi": "Thịt bò nướng bên cạnh miến xào là sự kết hợp kinh điển nhất của BBQ Hàn Quốc."}}]'::jsonb),
('6657f636-f1f0-4fff-b7a4-3cdcd278ddfb', '11111111-1111-4111-8111-111111111111', '{"en": "Yuja Cha", "ko": "Yuja Cha", "vi": "Yuja Cha"}'::jsonb, 3.5, 'USD', '{"en": "Korean citron tea, sweet and tangy, served warm or over ice.", "ko": "달콤하고 상큼한 한국식 유자차, 따뜻하게 또는 시원하게 즐길 수 있어요.", "vi": "Trà quýt Hàn Quốc vị ngọt thanh, phục vụ nóng hoặc đá."}'::jsonb, 'Beverage', '["beverage", "cool", "vegan"]'::jsonb, 'https://images.unsplash.com/photo-1623084921164-4a8c5c37a912?w=600&q=80', false, 100, 0, 25, 0, '[{"name": "Citron marmalade", "grams": 40}, {"name": "Ice / water", "grams": 150}]'::jsonb, '{"en": "No common allergens.", "ko": "No common allergens.", "vi": "No common allergens."}'::jsonb, 3, '[]'::jsonb),
('bf3beb4b-f100-44e9-8a5f-319bc4707bb5', '11111111-1111-4111-8111-111111111111', '{"en": "Phở Bò", "ko": "Phở Bò", "vi": "Phở Bò"}'::jsonb, 8.5, 'USD', '{"en": "Hanoi-style beef noodle soup with a fragrant star anise broth, herbs, and lime.", "ko": "팔각 향이 은은한 하노이 스타일 소고기 쌀국수, 허브와 라임을 곁들여요.", "vi": "Phở bò kiểu Hà Nội với nước dùng thơm hoa hồi, hành ngò và chanh tươi."}'::jsonb, 'Main', '["warm", "hearty", "popular"]'::jsonb, 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=600&q=80', false, 463, 29, 53, 14, '[{"name": "Rice noodles (phở)", "grams": 200}, {"name": "Beef", "grams": 90}, {"name": "Bean sprouts", "grams": 20}, {"name": "Fresh herbs / cilantro", "grams": 10}, {"name": "Onion", "grams": 15}, {"name": "Fish sauce", "grams": 10}]'::jsonb, '{"en": "Contains fish sauce. Noodles are gluten-free.", "ko": "Contains fish sauce. Noodles are gluten-free.", "vi": "Contains fish sauce. Noodles are gluten-free."}'::jsonb, 15, '[{"menu_id": "3b9f2e70-5555-453a-87e4-cc80f63d4f9b", "reason": {"en": "Crispy fried dough sticks are the traditional dip for phở broth.", "ko": "바삭한 꽈이(튀김빵)를 포 국물에 찍어 먹는 건 전통적인 방식이에요.", "vi": "Quẩy giòn chấm nước dùng phở là cách ăn truyền thống."}}, {"menu_id": "87acc0ba-2791-4f1f-9629-0108897483d5", "reason": {"en": "Egg coffee is a beloved Hanoi-style finish to a bowl of phở.", "ko": "에그 커피는 포 한 그릇 후 즐기는 하노이 스타일의 인기 있는 마무리예요.", "vi": "Cà phê trứng là món tráng miệng kiểu Hà Nội được yêu thích sau tô phở."}}]'::jsonb),
('8474f747-b593-4326-9843-37ccfec94d45', '11111111-1111-4111-8111-111111111111', '{"en": "Gỏi Cuốn", "ko": "Gỏi Cuốn", "vi": "Gỏi Cuốn"}'::jsonb, 5.5, 'USD', '{"en": "Fresh rice-paper rolls with shrimp, pork, rice vermicelli, and herbs, served with peanut sauce.", "ko": "새우, 돼지고기, 쌀국수, 허브를 라이스페이퍼로 만 신선한 월남쌈, 땅콩 소스를 곁들여요.", "vi": "Gỏi cuốn tươi cuốn tôm thịt, bún và rau thơm, chấm cùng sốt đậu phộng."}'::jsonb, 'Starter', '["lowCalorie", "glutenFree", "cool"]'::jsonb, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80', false, 318, 23, 36, 9, '[{"name": "Rice paper", "grams": 30}, {"name": "Shrimp", "grams": 40}, {"name": "Pork", "grams": 30}, {"name": "Rice vermicelli", "grams": 40}, {"name": "Fresh herbs / cilantro", "grams": 10}, {"name": "Peanut dipping sauce", "grams": 25}]'::jsonb, '{"en": "Contains shellfish (shrimp) and peanuts (dipping sauce).", "ko": "Contains shellfish (shrimp) and peanuts (dipping sauce).", "vi": "Contains shellfish (shrimp) and peanuts (dipping sauce)."}'::jsonb, 8, '[{"menu_id": "6d8c3cbd-993f-4fb6-bb6b-b6ab453dfd6f", "reason": {"en": "Pairing fried and fresh rolls side by side is a Vietnamese classic — richness balanced by freshness.", "ko": "튀긴 스프링롤과 신선한 월남쌈을 함께 즐기는 건 베트남의 클래식 조합이에요.", "vi": "Kết hợp chả giò chiên và gỏi cuốn tươi là bộ đôi kinh điển — vị béo được cân bằng bởi sự tươi mát."}}]'::jsonb),
('5dd601f4-8dc2-46d5-94c7-2628bd2874d9', '11111111-1111-4111-8111-111111111111', '{"en": "Bánh Xèo", "ko": "Bánh Xèo", "vi": "Bánh Xèo"}'::jsonb, 7, 'USD', '{"en": "Crispy turmeric rice-flour pancake filled with shrimp, pork, and bean sprouts, wrapped in fresh herbs.", "ko": "강황을 넣은 바삭한 쌀가루 팬케이크에 새우, 돼지고기, 숙주나물을 채우고 신선한 허브에 싸 먹어요.", "vi": "Bánh xèo giòn rụm vàng ươm nghệ, nhân tôm thịt và giá đỗ, cuốn cùng rau sống."}'::jsonb, 'Main', '["crispy", "hearty"]'::jsonb, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/B%C3%A1nh_x%C3%A8o_1.jpg/960px-B%C3%A1nh_x%C3%A8o_1.jpg', false, 375, 25, 42, 12, '[{"name": "Rice flour batter", "grams": 120}, {"name": "Shrimp", "grams": 40}, {"name": "Pork", "grams": 40}, {"name": "Bean sprouts", "grams": 30}, {"name": "Coconut milk", "grams": 20}, {"name": "Onion", "grams": 10}]'::jsonb, '{"en": "Contains shellfish (shrimp) and coconut.", "ko": "Contains shellfish (shrimp) and coconut.", "vi": "Contains shellfish (shrimp) and coconut."}'::jsonb, 14, '[{"menu_id": "8474f747-b593-4326-9843-37ccfec94d45", "reason": {"en": "Both are traditionally eaten wrapped with fresh herbs — a natural combo.", "ko": "둘 다 전통적으로 신선한 허브와 함께 먹는 음식이라 잘 어울려요.", "vi": "Cả hai món đều được ăn kèm rau sống truyền thống — kết hợp rất tự nhiên."}}, {"menu_id": "eeac2519-a9a3-4766-a210-0fc29c0ea30d", "reason": {"en": "A sweet dessert balances the savory, crispy pancake.", "ko": "달콤한 째가 바삭하고 짭짤한 반쎄오와 균형을 이뤄요.", "vi": "Món chè ngọt giúp cân bằng vị mặn béo giòn của bánh xèo."}}]'::jsonb),
('1f1bb37f-1d2c-48f4-a0a7-61486fc1a2f2', '11111111-1111-4111-8111-111111111111', '{"en": "Canh Chua Cá", "ko": "Canh Chua Cá", "vi": "Canh Chua Cá"}'::jsonb, 8, 'USD', '{"en": "Southern Vietnamese sweet-and-sour fish soup with pineapple, tomato, and tamarind broth.", "ko": "파인애플, 토마토, 타마린드 육수로 끓인 남부 베트남식 새콤달콤한 생선 수프.", "vi": "Canh chua cá miền Tây với thơm, cà chua và nước dùng me chua thanh."}'::jsonb, 'Main', '["sweetSour", "warm", "lowCalorie"]'::jsonb, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80', false, 185, 25, 14, 3, '[{"name": "Fish fillet", "grams": 120}, {"name": "Pineapple", "grams": 40}, {"name": "Tomato", "grams": 30}, {"name": "Tamarind sauce", "grams": 20}, {"name": "Bean sprouts", "grams": 20}, {"name": "Fresh herbs / cilantro", "grams": 8}]'::jsonb, '{"en": "Contains fish.", "ko": "Contains fish.", "vi": "Contains fish."}'::jsonb, 15, '[{"menu_id": "92232755-a5c7-4fdf-b88b-cdc5543734f5", "reason": {"en": "A tangy soup on the side is the traditional way this is served alongside rice.", "ko": "밥과 함께 먹는 것이 전통적인 방식이에요.", "vi": "Ăn kèm cơm là cách thưởng thức canh chua truyền thống."}}, {"menu_id": "3b9f2e70-5555-453a-87e4-cc80f63d4f9b", "reason": {"en": "Fried dough sticks are great for soaking up the tangy broth.", "ko": "꽈이는 새콤한 국물을 찍어 먹기에 아주 좋아요.", "vi": "Quẩy rất hợp để chấm và thấm vị nước canh chua."}}]'::jsonb),
('eeac2519-a9a3-4766-a210-0fc29c0ea30d', '11111111-1111-4111-8111-111111111111', '{"en": "Chè Ba Màu", "ko": "Chè Ba Màu", "vi": "Chè Ba Màu"}'::jsonb, 3, 'USD', '{"en": "Layered three-color dessert of mung bean, red bean, and jelly over ice with coconut milk.", "ko": "녹두, 팥, 젤리를 층층이 쌓고 코코넛 밀크와 얼음을 올린 삼색 디저트.", "vi": "Chè ba màu với đậu xanh, đậu đỏ và thạch, phủ nước cốt dừa và đá bào."}'::jsonb, 'Beverage', '["beverage", "cool", "sweetSour"]'::jsonb, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Ch%C3%A8_b%C3%A0_ba.jpg/960px-Ch%C3%A8_b%C3%A0_ba.jpg', false, 249, 10, 32, 10, '[{"name": "Mung bean paste", "grams": 40}, {"name": "Grass jelly / tapioca pearls", "grams": 30}, {"name": "Coconut milk", "grams": 40}, {"name": "Ice / water", "grams": 60}]'::jsonb, '{"en": "Contains coconut.", "ko": "Contains coconut.", "vi": "Contains coconut."}'::jsonb, 5, '[]'::jsonb),
('87acc0ba-2791-4f1f-9629-0108897483d5', '11111111-1111-4111-8111-111111111111', '{"en": "Cà Phê Trứng", "ko": "Cà Phê Trứng", "vi": "Cà Phê Trứng"}'::jsonb, 3.5, 'USD', '{"en": "Hanoi egg coffee — whipped egg yolk and condensed milk over strong robusta coffee.", "ko": "하노이식 에그 커피 — 진한 로부스타 커피 위에 달걀노른자와 연유를 휘핑해 올려요.", "vi": "Cà phê trứng Hà Nội — lòng đỏ trứng đánh bông cùng sữa đặc trên nền cà phê robusta đậm đà."}'::jsonb, 'Beverage', '["beverage", "warm"]'::jsonb, 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?w=600&q=80', false, 167, 9, 14, 8, '[{"name": "Brewed coffee", "grams": 80}, {"name": "Egg", "grams": 55}, {"name": "Condensed milk", "grams": 25}]'::jsonb, '{"en": "Contains egg and dairy.", "ko": "Contains egg and dairy.", "vi": "Contains egg and dairy."}'::jsonb, 6, '[]'::jsonb),
('3b9f2e70-5555-453a-87e4-cc80f63d4f9b', '11111111-1111-4111-8111-111111111111', '{"en": "Quẩy", "ko": "Quẩy", "vi": "Quẩy"}'::jsonb, 2, 'USD', '{"en": "Light, crispy fried dough sticks — the classic dip-along for phở and congee.", "ko": "가볍고 바삭한 튀김빵 — 포와 죽에 곁들이는 클래식한 사이드.", "vi": "Quẩy chiên giòn nhẹ — món ăn kèm kinh điển của phở và cháo."}'::jsonb, 'Side', '["crispy", "hearty"]'::jsonb, 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Youtiao.jpg/960px-Youtiao.jpg', false, 216, 4, 27, 10, '[{"name": "Fried dough sticks (quẩy)", "grams": 60}]'::jsonb, '{"en": "Contains gluten.", "ko": "Contains gluten.", "vi": "Contains gluten."}'::jsonb, 6, '[{"menu_id": "bf3beb4b-f100-44e9-8a5f-319bc4707bb5", "reason": {"en": "Dipped straight into the broth, quẩy soaks up the flavor of a good bowl of phở.", "ko": "국물에 바로 찍어 먹으면 포의 맛을 그대로 흡수해요.", "vi": "Chấm trực tiếp vào nước dùng, quẩy thấm trọn vị ngon của tô phở."}}]'::jsonb)
on conflict (id) do update set
    name = excluded.name,
    price = excluded.price,
    currency = excluded.currency,
    description = excluded.description,
    category = excluded.category,
    tags = excluded.tags,
    image_url = excluded.image_url,
    is_sold_out = excluded.is_sold_out,
    calories = excluded.calories,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    ingredient_lines = excluded.ingredient_lines,
    allergy_note = excluded.allergy_note,
    prep_time_minutes = excluded.prep_time_minutes,
    pairings = excluded.pairings;

insert into public.tables (
    store_id,
    table_code,
    x,
    y,
    status,
    view_name,
    tag,
    capacity,
    sort_order
)
values
('11111111-1111-4111-8111-111111111111', 'T1', 12, 35, 'available', 'Window', 'Window', 4, 1),
('11111111-1111-4111-8111-111111111111', 'T2', 28, 35, 'occupied', 'Window', 'Window', 4, 2),
('11111111-1111-4111-8111-111111111111', 'T3', 40, 35, 'available', 'Indoor', '', 4, 3),
('11111111-1111-4111-8111-111111111111', 'T4', 55, 45, 'reserved', 'Indoor', '', 4, 4),
('11111111-1111-4111-8111-111111111111', 'T5', 70, 45, 'soon', 'Indoor', '', 4, 5),
('11111111-1111-4111-8111-111111111111', 'T6', 12, 75, 'available', 'Window', 'Window', 4, 6),
('11111111-1111-4111-8111-111111111111', 'T7', 28, 75, 'occupied', 'Window', 'Window', 4, 7),
('11111111-1111-4111-8111-111111111111', 'T8', 43, 75, 'available', 'Indoor', 'Popular', 4, 8),
('11111111-1111-4111-8111-111111111111', 'T9', 70, 75, 'available', 'Window', 'Window', 4, 9),
('11111111-1111-4111-8111-111111111111', 'T10', 75, 25, 'available', 'Terrace', '', 4, 10),
('11111111-1111-4111-8111-111111111111', 'T11', 88, 25, 'reserved', 'Terrace', '', 4, 11),
('11111111-1111-4111-8111-111111111111', 'T12', 78, 55, 'available', 'Terrace', 'Popular', 4, 12),
('11111111-1111-4111-8111-111111111111', 'T13', 75, 80, 'soon', 'Terrace', '', 4, 13),
('11111111-1111-4111-8111-111111111111', 'T14', 88, 80, 'available', 'Terrace', '', 4, 14)
on conflict (store_id, table_code) do update set
    x = excluded.x,
    y = excluded.y,
    status = excluded.status,
    view_name = excluded.view_name,
    tag = excluded.tag,
    capacity = excluded.capacity,
    sort_order = excluded.sort_order;

-- After creating a Supabase Auth user for the owner, link it to this store
-- so the FastAPI auth dependency accepts their JWT on admin write routes:
--
--   insert into public.staff (id, store_id, role)
--   values ('<auth.users.id of the signed-up owner>',
--           '11111111-1111-4111-8111-111111111111', 'owner');
