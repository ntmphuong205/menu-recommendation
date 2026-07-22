export type Lang = "vi" | "en" | "ko";

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

export const DEFAULT_LANG: Lang = "en";

const dict = {
  // Tab bar
  tab_chat: { vi: "Trò chuyện", en: "Chat", ko: "채팅" },
  tab_menu: { vi: "Thực đơn", en: "Menu", ko: "메뉴" },
  tab_cart: { vi: "Giỏ hàng", en: "Cart", ko: "장바구니" },
  tab_info: { vi: "Thông tin", en: "Info", ko: "정보" },

  // Welcome screen (shown once when the customer app first loads)
  welcome_greeting: {
    vi: "Chào mừng quý khách đến với {restaurant}! 👋",
    en: "Welcome to {restaurant}! 👋",
    ko: "{restaurant}에 오신 것을 환영합니다! 👋",
  },
  welcome_sub: {
    vi: "Hãy để mình giúp bạn chọn món ngon nhất hôm nay nhé.",
    en: "Let me help you pick something delicious today.",
    ko: "오늘 가장 맛있는 메뉴를 골라드릴게요.",
  },
  welcome_cta: { vi: "Bắt đầu gọi món", en: "Start ordering", ko: "주문 시작하기" },

  // Chat screen
  chat_online: { vi: "Đang hoạt động", en: "Online", ko: "온라인" },
  chat_table: { vi: "Bàn", en: "Table", ko: "테이블" },
  chat_placeholder: {
    vi: "vd. tôi muốn món cay và ít calo...",
    en: "e.g. I want something spicy and low-calorie...",
    ko: "예: 맵고 칼로리가 낮은 음식을 원해요...",
  },
  chat_quick_spicy_low: {
    vi: "Món cay & ít calo",
    en: "Something spicy & low-calorie",
    ko: "맵고 칼로리 낮은 음식",
  },
  chat_quick_filling: { vi: "Món no bụng", en: "I want something filling", ko: "든든한 음식 추천" },
  chat_quick_surprise: { vi: "Bất ngờ cho tôi", en: "Surprise me", ko: "추천 부탁해요" },

  // Tag labels
  tag_spicy: { vi: "Cay", en: "Spicy", ko: "매운맛" },
  tag_lowCalorie: { vi: "Ít calo", en: "Low-Calorie", ko: "저칼로리" },
  tag_hearty: { vi: "No bụng", en: "Hearty", ko: "든든한" },
  tag_crispy: { vi: "Giòn", en: "Crispy", ko: "바삭한" },
  tag_beverage: { vi: "Đồ uống", en: "Beverage", ko: "음료" },
  tag_cool: { vi: "Mát lạnh", en: "Cool", ko: "시원한" },
  tag_warm: { vi: "Ấm nóng", en: "Warm", ko: "따뜻한" },
  tag_vegan: { vi: "Chay", en: "Vegan", ko: "비건" },
  tag_glutenFree: { vi: "Không gluten", en: "Gluten-Free", ko: "글루텐 프리" },
  tag_highProtein: { vi: "Giàu đạm", en: "High-Protein", ko: "고단백" },
  tag_sweetSour: { vi: "Chua ngọt", en: "Sweet & Sour", ko: "새콤달콤" },
  tag_popular: { vi: "Phổ biến", en: "Popular", ko: "인기" },

  // Menu screen
  menu_title: { vi: "Thực đơn", en: "Menu", ko: "메뉴" },
  menu_search_placeholder: { vi: "Tìm món ăn...", en: "Search dishes...", ko: "메뉴 검색..." },
  menu_filter_all: { vi: "Tất cả", en: "All", ko: "전체" },
  menu_no_results: { vi: "Không tìm thấy món phù hợp 🥲", en: "No matching dishes found 🥲", ko: "일치하는 메뉴가 없어요 🥲" },
  menu_category_main: { vi: "Món chính", en: "Main", ko: "메인" },
  menu_category_starter: { vi: "Khai vị", en: "Starter", ko: "애피타이저" },
  menu_category_beverage: { vi: "Đồ uống", en: "Beverage", ko: "음료" },
  menu_category_side: { vi: "Món phụ", en: "Side", ko: "사이드" },

  dish_add: { vi: "Thêm", en: "Add", ko: "담기" },
  dish_sold_out: { vi: "Hết hàng", en: "Sold out", ko: "품절" },

  // Dish sheet
  dish_ingredients: { vi: "Nguyên liệu", en: "Ingredients", ko: "재료" },
  nutrition_calories: { vi: "Calo", en: "Calories", ko: "칼로리" },
  nutrition_protein: { vi: "Đạm", en: "Protein", ko: "단백질" },
  nutrition_carbs: { vi: "Tinh bột", en: "Carbs", ko: "탄수화물" },
  nutrition_fat: { vi: "Chất béo", en: "Fat", ko: "지방" },
  nutrition_prep_time: { vi: "Thời gian chế biến", en: "Prep time", ko: "조리 시간" },
  nutrition_minutes: { vi: "phút", en: "min", ko: "분" },
  dish_add_to_cart: { vi: "Thêm vào giỏ", en: "Add to cart", ko: "장바구니에 담기" },
  dish_added: { vi: "Đã thêm ✓", en: "Added to cart ✓", ko: "담았어요 ✓" },
  dish_note_label: { vi: "Yêu cầu thêm (không bắt buộc)", en: "Special request (optional)", ko: "요청사항 (선택)" },
  dish_note_placeholder: {
    vi: "vd: ít đường, không hành...",
    en: "e.g. less sugar, no onions...",
    ko: "예: 설탕 적게, 양파 빼주세요...",
  },

  // Cart screen
  cart_title: { vi: "Giỏ hàng", en: "Cart", ko: "장바구니" },
  cart_empty_title: { vi: "Giỏ hàng trống", en: "Your cart is empty", ko: "장바구니가 비어있어요" },
  cart_empty_desc: {
    vi: "Trò chuyện với Menu AI hoặc xem tab Thực đơn để chọn món ngon!",
    en: "Chat with Menu AI or browse the Menu tab to pick something delicious!",
    ko: "메뉴 AI와 대화하거나 메뉴 탭에서 맛있는 음식을 골라보세요!",
  },
  cart_ask_ai: { vi: "Hỏi Menu AI", en: "Ask Menu AI", ko: "메뉴 AI에게 물어보기" },
  cart_total: { vi: "Tổng cộng", en: "Total", ko: "합계" },
  cart_confirm_order: { vi: "Xác nhận đặt món", en: "Confirm order", ko: "주문 확정" },
  cart_placed_title: { vi: "Đã đặt món!", en: "Order placed!", ko: "주문 완료!" },
  cart_placed_desc: {
    vi: "Đơn của Bàn {table} đã được gửi tới bếp. Món ăn sẽ được mang tới bàn ngay!",
    en: "Your order for Table {table} has been sent to the kitchen. Your food will be brought to your table shortly.",
    ko: "테이블 {table}의 주문이 주방으로 전달되었습니다. 곧 음식이 준비됩니다!",
  },
  cart_back_to_chat: { vi: "Về trò chuyện", en: "Back to Chat", ko: "채팅으로 돌아가기" },
  cart_queue_position: { vi: "Vị trí hàng đợi", en: "Queue position", ko: "대기 순번" },
  cart_estimated_wait: { vi: "Thời gian chờ dự kiến", en: "Estimated wait", ko: "예상 대기 시간" },
  cart_your_orders: { vi: "Đơn của bạn", en: "Your orders", ko: "내 주문" },
  cart_total_bill: { vi: "Tổng hoá đơn", en: "Total bill", ko: "총 청구액" },
  cart_cancel_order: { vi: "Huỷ đơn", en: "Cancel order", ko: "주문 취소" },
  cart_cancel_confirm: {
    vi: "Bạn có chắc muốn huỷ đơn này không?",
    en: "Are you sure you want to cancel this order?",
    ko: "정말 이 주문을 취소하시겠습니까?",
  },

  // Info screen
  info_best_sellers: { vi: "Món bán chạy", en: "Best Sellers", ko: "인기 메뉴" },
  info_hours: { vi: "Giờ mở cửa", en: "Opening Hours", ko: "영업시간" },
  info_faq: { vi: "Câu hỏi thường gặp", en: "Frequently Asked Questions", ko: "자주 묻는 질문" },
  info_ask_chat: { vi: "Hỏi thêm qua Chat", en: "Ask more via Chat", ko: "채팅으로 더 물어보기" },
  info_call_staff: { vi: "Gọi nhân viên", en: "Call Staff", ko: "직원 호출" },
  call_reason_help: { vi: "Cần hỗ trợ", en: "Need help", ko: "도움이 필요해요" },
  call_reason_change_order: { vi: "Muốn đổi món", en: "Change my order", ko: "메뉴 변경 요청" },
  call_reason_bill: { vi: "Xin thanh toán", en: "Ask for the bill", ko: "계산서 요청" },
  call_sent_title: { vi: "Đã gửi yêu cầu!", en: "Request sent!", ko: "요청을 보냈어요!" },
  call_sent_desc: {
    vi: "Nhân viên sẽ tới bàn {table} ngay.",
    en: "A staff member is on their way to Table {table}.",
    ko: "직원이 곧 테이블 {table}로 갈게요.",
  },
  call_close: { vi: "Đóng", en: "Close", ko: "닫기" },

  // Reviews
  review_title: { vi: "Đánh giá", en: "Reviews", ko: "리뷰" },
  review_none: { vi: "Chưa có đánh giá nào", en: "No reviews yet", ko: "아직 리뷰가 없어요" },
  review_write: { vi: "Viết đánh giá", en: "Write a review", ko: "리뷰 작성" },
  review_placeholder: {
    vi: "Bạn thấy món này thế nào?",
    en: "How was this dish?",
    ko: "이 메뉴는 어땠나요?",
  },
  review_submit: { vi: "Gửi đánh giá", en: "Submit review", ko: "리뷰 등록" },
  review_thanks: { vi: "Cảm ơn bạn đã đánh giá! ✓", en: "Thanks for your review! ✓", ko: "리뷰 감사합니다! ✓" },

  // Owner dashboard
  owner_dashboard: { vi: "Trang quản lý", en: "Owner Dashboard", ko: "사장님 대시보드" },
  owner_nav_orders: { vi: "Đơn hàng", en: "Orders", ko: "주문" },
  owner_nav_menu: { vi: "Quản lý thực đơn", en: "Menu Management", ko: "메뉴 관리" },
  owner_nav_analytics: { vi: "Thống kê", en: "Analytics", ko: "분석" },
  owner_nav_tables: { vi: "Mã QR bàn", en: "Table QR Codes", ko: "테이블 QR 코드" },
  owner_view_customer: { vi: "Xem app khách hàng", en: "View customer app", ko: "고객 앱 보기" },
  owner_table_requests: { vi: "Yêu cầu từ bàn", en: "Table Requests", ko: "테이블 요청" },
  owner_resolve: { vi: "Đã xử lý", en: "Resolve", ko: "처리 완료" },
  owner_logout: { vi: "Đăng xuất", en: "Log out", ko: "로그아웃" },

  // Menu management table
  menu_table_img: { vi: "Ảnh", en: "Img", ko: "이미지" },
  menu_table_name: { vi: "Món", en: "Menu", ko: "메뉴" },
  menu_table_price: { vi: "Giá", en: "Price", ko: "가격" },
  menu_table_desc: { vi: "Mô tả", en: "Desc", ko: "설명" },
  menu_table_tags: { vi: "Tag", en: "Tags", ko: "태그" },
  menu_table_status: { vi: "Trạng thái", en: "Status", ko: "상태" },
  menu_delete_selected: { vi: "Xoá mục đã chọn", en: "Delete Selected", ko: "선택 삭제" },
  menu_set_sold_out: { vi: "Đánh dấu hết hàng", en: "Set Sold Out", ko: "품절 처리" },
  menu_mark_available: { vi: "Còn hàng trở lại", en: "Mark Available", ko: "판매 재개" },
  menu_edit: { vi: "Sửa", en: "Edit", ko: "수정" },

  // Menu AI bot replies (templates; {placeholders} filled in by assistant.ts)
  bot_greeting: {
    vi: "Xin chào! Mình là Menu AI, trợ lý của {restaurant} 🍃\nQuán phục vụ món Hàn và món Việt — hãy cho mình biết bạn đang thèm gì hoặc tâm trạng thế nào, mình sẽ gợi ý món phù hợp nhất!",
    en: "Hi there! I'm Menu AI, {restaurant}'s assistant 🍃\nWe serve Korean and Vietnamese favorites — tell me what you're craving or how you're feeling, and I'll recommend the perfect dish for you!",
    ko: "안녕하세요! 저는 {restaurant}의 메뉴 AI예요 🍃\n한식과 베트남 음식을 함께 즐길 수 있어요 — 지금 뭐가 당기는지 알려주시면 딱 맞는 메뉴를 추천해드릴게요!",
  },
  bot_decline: {
    vi: "Không sao! Cứ nói với mình bất cứ khi nào bạn muốn được gợi ý món khác nhé 😊",
    en: "No worries! Just let me know whenever you'd like another recommendation 😊",
    ko: "괜찮아요! 다른 메뉴 추천이 필요할 때 언제든 말씀해주세요 😊",
  },
  bot_confirm_qty: {
    vi: "Để xác nhận lại: {qty} phần {dish}? Bạn có yêu cầu gì thêm không (vd: bỏ hành, thêm sốt)?",
    en: "Just to confirm: {qty} {dish}? Any other requests (e.g. remove onions, add extra sauce)?",
    ko: "확인할게요: {dish} {qty}개 맞으신가요? 추가 요청 있으신가요 (예: 양파 빼주세요, 소스 추가)?",
  },
  bot_order_done: {
    vi: "Đã ghi nhận, {qty} phần {dish}! Mình đã thêm vào giỏ hàng — bạn xem lại và xác nhận ở tab Giỏ hàng nhé 🛒",
    en: "Got it, {qty} {dish}! I've added it to your cart — head to the Cart tab whenever you're ready to confirm 🛒",
    ko: "네, {dish} {qty}개! 장바구니에 담았어요 — 준비되면 장바구니 탭에서 확인해주세요 🛒",
  },
  bot_order_done_note: {
    vi: "Đã ghi nhận! {qty} phần {dish} ({note}). Mình đã thêm vào giỏ hàng — bạn xem lại và xác nhận ở tab Giỏ hàng nhé 🛒",
    en: "Got it! {qty} {dish} ({note}). I've added it to your cart — head to the Cart tab whenever you're ready to confirm 🛒",
    ko: "네! {dish} {qty}개 ({note}). 장바구니에 담았어요 — 준비되면 장바구니 탭에서 확인해주세요 🛒",
  },
  bot_hours: {
    vi: "{restaurant} mở cửa:\n{hours}",
    en: "{restaurant} is open:\n{hours}",
    ko: "{restaurant} 영업시간:\n{hours}",
  },
  bot_bestsellers: {
    vi: "Đây là những món bán chạy nhất của quán:",
    en: "Here are our best-selling dishes:",
    ko: "저희 가게의 인기 메뉴예요:",
  },
  bot_allergy: {
    vi: "{dish} gồm có: {ingredients}.\nLưu ý dị ứng: {allergyNote}",
    en: "{dish} contains: {ingredients}.\nAllergy note: {allergyNote}",
    ko: "{dish}의 재료: {ingredients}.\n알레르기 안내: {allergyNote}",
  },
  bot_full_menu: {
    vi: "Bạn có thể xem toàn bộ thực đơn ở tab 'Thực đơn' bên dưới. Trong lúc đó, đây là vài món nổi bật:",
    en: "You can browse the full menu on the 'Menu' tab below. Meanwhile, here are a few highlights:",
    ko: "아래 '메뉴' 탭에서 전체 메뉴를 볼 수 있어요. 그동안 인기 메뉴 몇 가지를 보여드릴게요:",
  },
  bot_dish_pick_qty: {
    vi: "{dish} là lựa chọn tuyệt vời! Bạn muốn đặt mấy phần?",
    en: "{dish} is a great choice! How many would you like?",
    ko: "{dish} 좋은 선택이에요! 몇 개 드릴까요?",
  },
  bot_recs_multi: {
    vi: "Nếu bạn đang muốn vậy, mình gợi ý {dishes}!",
    en: "If that's the vibe you're going for, I'd suggest {dishes}!",
    ko: "그런 느낌을 원하신다면 {dishes} 어떠세요!",
  },
  bot_recs_single: {
    vi: "Nếu bạn muốn món như vậy, {dish} rất được khuyên dùng! {description}",
    en: "If you want something like that, {dish} is highly recommended! {description}",
    ko: "그런 걸 원하신다면 {dish}를 강력 추천해요! {description}",
  },
  bot_surprise: {
    vi: "Nếu chưa biết chọn gì, mình gợi ý món phổ biến nhất: {dish}! 🍔",
    en: "If you can't decide, I recommend our most popular dish: {dish}! 🍔",
    ko: "고르기 어려우시다면 저희 인기 메뉴 {dish}를 추천드려요! 🍔",
  },
  bot_sold_out: {
    vi: "Xin lỗi, {dish} hiện đã hết hàng. Bạn muốn mình gợi ý món khác không?",
    en: "Sorry, {dish} is sold out right now. Want me to suggest something else?",
    ko: "죄송해요, {dish}는 현재 품절이에요. 다른 메뉴를 추천해드릴까요?",
  },
  bot_fallback: {
    vi: "Hãy cho mình biết bạn đang thèm gì hoặc cảm thấy thế nào, hoặc hỏi mình về giờ mở cửa, món bán chạy, hay dị ứng thực phẩm nhé!",
    en: "Tell me what you're craving or how you're feeling, or ask me about opening hours, best-sellers, or food allergies!",
    ko: "지금 뭐가 당기는지 알려주시거나, 영업시간·인기메뉴·알레르기에 대해 물어보세요!",
  },

  // Chat quick-reply chips
  qr_nothing_else: { vi: "Không còn gì nữa", en: "Nothing else", ko: "없어요" },
  qr_remove_onions: { vi: "Bỏ hành", en: "Remove onions", ko: "양파 빼주세요" },
  qr_order_this: { vi: "Đặt món này", en: "Order this", ko: "이걸로 주문할게요" },
  qr_suggest_else: { vi: "Gợi ý món khác", en: "Suggest something else", ko: "다른 메뉴 추천해줘" },
  qr_opening_hours: { vi: "Giờ mở cửa", en: "Opening hours", ko: "영업시간" },
  qr_best_sellers: { vi: "Món bán chạy", en: "Best sellers", ko: "인기 메뉴" },
} as const;

export type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, lang: Lang, vars?: Record<string, string | number>): string {
  let str: string = dict[key][lang] ?? dict[key][DEFAULT_LANG];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
