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
