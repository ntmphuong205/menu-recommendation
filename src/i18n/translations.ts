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
  tab_staff_chat: { vi: "Nhân viên", en: "Staff", ko: "직원" },
  tab_menu: { vi: "Thực đơn", en: "Menu", ko: "메뉴" },
  tab_cart: { vi: "Giỏ hàng", en: "Cart", ko: "장바구니" },
  tab_info: { vi: "Thông tin", en: "Info", ko: "정보" },
  tab_reserve: { vi: "Đặt bàn", en: "Reserve", ko: "예약" },

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
  dish_choose_size: { vi: "Chọn loại", en: "Choose option", ko: "옵션 선택" },
  dish_sold_out: { vi: "Hết hàng", en: "Sold out", ko: "품절" },

  // Dish sheet
  dish_ingredients: { vi: "Nguyên liệu", en: "Ingredients", ko: "재료" },
  dish_pairs_with: { vi: "Kết hợp ngon nhất với", en: "Pairs perfectly with", ko: "찰떡궁합 메뉴" },
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
  cart_confirm_error: {
    vi: "Không đặt được món, vui lòng thử lại.",
    en: "Couldn't place the order — please try again.",
    ko: "주문을 넣지 못했습니다 — 다시 시도해 주세요.",
  },
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
  cart_pickup_code_label: { vi: "Mã lấy đơn", en: "Pickup code", ko: "픽업 코드" },
  cart_total_bill: { vi: "Tổng hoá đơn", en: "Total bill", ko: "총 청구액" },
  cart_cancel_order: { vi: "Huỷ đơn", en: "Cancel order", ko: "주문 취소" },
  cart_cancel_confirm: {
    vi: "Bạn có chắc muốn huỷ đơn này không?",
    en: "Are you sure you want to cancel this order?",
    ko: "정말 이 주문을 취소하시겠습니까?",
  },
  cart_pairs_title: { vi: "Gợi ý dùng kèm", en: "Goes great with your order", ko: "함께 드시면 좋은 메뉴" },

  // Info screen
  info_best_sellers: { vi: "Món bán chạy", en: "Best Sellers", ko: "인기 메뉴" },
  info_reviews_count: { vi: "{count} đánh giá", en: "{count} reviews", ko: "리뷰 {count}개" },
  info_hours: { vi: "Giờ mở cửa", en: "Opening Hours", ko: "영업시간" },
  info_faq: { vi: "Câu hỏi thường gặp", en: "Frequently Asked Questions", ko: "자주 묻는 질문" },
  info_ask_chat: { vi: "Hỏi thêm qua Chat", en: "Ask more via Chat", ko: "채팅으로 더 물어보기" },
  info_call_staff: { vi: "Gọi nhân viên", en: "Call Staff", ko: "직원 호출" },

  // Table availability + reservation request (InfoScreen)
  info_tables_title: { vi: "Tình trạng bàn", en: "Table Availability", ko: "좌석 현황" },
  info_tables_desc: {
    vi: "Chọn một bàn để xem chi tiết hoặc gửi yêu cầu đặt chỗ.",
    en: "Tap a table to see details or request it.",
    ko: "테이블을 눌러 상세 정보를 보거나 예약을 요청하세요.",
  },
  table_status_available: { vi: "Còn trống", en: "Available", ko: "이용 가능" },
  table_status_soon: { vi: "Sắp trống", en: "Available soon", ko: "곧 이용 가능" },
  table_status_reserved: { vi: "Đã đặt", en: "Reserved", ko: "예약됨" },
  table_status_occupied: { vi: "Đang sử dụng", en: "Occupied", ko: "이용 중" },
  table_terrace: { vi: "Sân hiên", en: "Terrace", ko: "테라스" },
  table_feature_window: { vi: "Cạnh cửa sổ", en: "Window", ko: "창가" },
  table_feature_indoor: { vi: "Trong nhà", en: "Indoor", ko: "실내" },
  table_kitchen: { vi: "Bếp", en: "Kitchen", ko: "주방" },
  table_select_prompt_title: { vi: "Chọn bàn bạn thích", en: "Select your preferred table", ko: "원하는 테이블을 선택하세요" },
  table_select_prompt_desc: {
    vi: "Chạm vào một bàn để xem chi tiết và tình trạng.",
    en: "Tap a table to see details and availability.",
    ko: "테이블을 눌러 상세 정보와 이용 가능 여부를 확인하세요.",
  },
  reserve_screen_title: { vi: "Đặt bàn trước", en: "Reserve a table", ko: "테이블 예약" },
  reserve_screen_desc: {
    vi: "Chọn một bàn còn trống tại {store} để giữ chỗ trước khi đến.",
    en: "Pick an available table at {store} to hold before you arrive.",
    ko: "{store}에서 원하는 테이블을 선택해 미리 예약하세요.",
  },
  reserve_screen_desc_generic: {
    vi: "Chọn một bàn còn trống để giữ chỗ trước khi đến.",
    en: "Pick an available table to hold before you arrive.",
    ko: "원하는 테이블을 선택해 미리 예약하세요.",
  },
  reserve_screen_no_tables: {
    vi: "Hiện chưa có sơ đồ bàn. Vui lòng liên hệ nhà hàng trực tiếp.",
    en: "No seating layout available yet. Please contact the restaurant directly.",
    ko: "아직 좌석 배치가 없습니다. 매장에 직접 문의해 주세요.",
  },
  reserve_screen_browse_menu: { vi: "Xem thực đơn", en: "Browse menu", ko: "메뉴 보기" },
  staffchatview_title: { vi: "Tin nhắn khách hàng", en: "Customer messages", ko: "고객 메시지" },
  staffchatview_subtitle: { vi: "Trả lời khách đang nhắn tin", en: "Reply to customers messaging in", ko: "메시지를 보낸 고객에게 답장하세요" },
  staffchatview_empty: { vi: "Chưa có cuộc trò chuyện nào.", en: "No conversations yet.", ko: "아직 대화가 없습니다." },
  staffchatview_select_prompt: { vi: "Chọn 1 cuộc trò chuyện để xem", en: "Select a conversation to view it", ko: "대화를 선택해 주세요" },
  staffchatview_reply_placeholder: { vi: "Nhập phản hồi...", en: "Type a reply...", ko: "답장 입력..." },
  staffchatview_unknown_table: { vi: "Khách (từ xa)", en: "Guest (remote)", ko: "고객 (원격)" },
  // {code} is the guest's real pickup_code (same one shown to them and
  // handed over at the counter) — lets staff match a no-table conversation
  // to an actual order instead of a made-up label.
  staffchatview_guest_order_code: {
    vi: "Khách — Đơn #{code}",
    en: "Guest — Order #{code}",
    ko: "고객 — 주문 #{code}",
  },
  staffchatview_you: { vi: "Bạn", en: "You", ko: "나" },
  staffchat_subtitle: { vi: "Nhắn tin trực tiếp với nhân viên", en: "Message the restaurant directly", ko: "매장에 직접 메시지 보내기" },
  staffchat_empty: {
    vi: "Chưa có tin nhắn nào — gửi tin đầu tiên cho nhân viên nhé.",
    en: "No messages yet — send the first one to staff.",
    ko: "아직 메시지가 없어요 — 직원에게 첫 메시지를 보내보세요.",
  },
  staffchat_placeholder: { vi: "Nhắn tin cho nhân viên...", en: "Message staff...", ko: "직원에게 메시지 보내기..." },
  order_mode_banner: {
    vi: "Muốn đặt món? Thêm vào giỏ hàng, thanh toán trước và hẹn giờ ra lấy.",
    en: "Ready to order? Add to your cart, pay in advance, and pick a time to collect it.",
    ko: "주문하시겠어요? 장바구니에 담고 미리 결제한 뒤 수령 시간을 정하세요.",
  },
  reservation_title: { vi: "Đặt bàn {table}", en: "Reserve table {table}", ko: "{table} 예약" },
  reservation_status_label: { vi: "Trạng thái", en: "Status", ko: "상태" },
  reservation_feature_label: { vi: "Đặc điểm", en: "Feature", ko: "특징" },
  reservation_table_photo: { vi: "Ảnh bàn", en: "Table Photo", ko: "테이블 사진" },
  reservation_view_photo: { vi: "Ảnh view", en: "View Photo", ko: "전망 사진" },
  reservation_no_photo: { vi: "Chưa có ảnh.", en: "No photo has been added.", ko: "등록된 사진이 없습니다." },
  reservation_up_to: { vi: "Tối đa {count}", en: "Up to {count}", ko: "최대 {count}명" },
  reservation_party_size: { vi: "Số khách", en: "Party size", ko: "인원 수" },
  reservation_request_button: { vi: "Gửi yêu cầu đặt bàn", en: "Request this table", ko: "예약 요청 보내기" },
  reservation_waiting_note: {
    vi: "Bàn đang được sử dụng — yêu cầu của bạn sẽ vào danh sách chờ.",
    en: "This table is occupied — your request will join the waiting list.",
    ko: "현재 이용 중인 테이블입니다 — 웨이팅 목록에 등록됩니다.",
  },
  reservation_submitted: { vi: "Đã gửi yêu cầu đặt bàn!", en: "Reservation request sent!", ko: "예약 요청을 보냈습니다!" },
  reservation_error: {
    vi: "Không gửi được yêu cầu đặt bàn. Vui lòng thử lại.",
    en: "Couldn't submit the reservation request. Please try again.",
    ko: "예약 요청을 보내지 못했습니다. 다시 시도해 주세요.",
  },
  reservation_web_mode_blocked: {
    vi: "Quét mã QR tại bàn để đặt chỗ hoặc gọi món.",
    en: "Scan the QR code at a table to reserve or order.",
    ko: "예약이나 주문은 매장 테이블의 QR 코드를 스캔해 주세요.",
  },
  order_mode_switch_to_pickup: {
    vi: "Muốn đặt trước và lấy sau? Bấm để đổi lựa chọn.",
    en: "Want to order ahead and pick up later? Tap to switch.",
    ko: "미리 주문하고 나중에 픽업하시겠어요? 눌러서 변경하세요.",
  },
  pickup_checkout_note: {
    vi: "Đặt trước và thanh toán ngay, tới quầy đưa mã để lấy đồ.",
    en: "Pre-order and pay now, then show your code at the counter to collect.",
    ko: "미리 주문하고 결제한 뒤, 카운터에서 코드를 보여주고 수령하세요.",
  },
  pickup_time_label: { vi: "Giờ dự kiến ra lấy", en: "Pickup time", ko: "픽업 시간" },
  pickup_time_window: {
    vi: "Chỉ nhận lấy hàng trong khung giờ {start} - {end}",
    en: "Pickup is only available between {start} and {end}",
    ko: "픽업은 {start} ~ {end} 사이에만 가능합니다",
  },
  cart_confirm_pickup_button: { vi: "Xác nhận đơn hàng", en: "Confirm order", ko: "주문 확인" },
  pickup_time_sheet_title: {
    vi: "Bạn muốn nhận đơn lúc mấy giờ?",
    en: "What time would you like to pick up your order?",
    ko: "몇 시에 픽업하시겠어요?",
  },
  pickup_time_sheet_continue: { vi: "Tiếp tục", en: "Continue", ko: "계속" },
  invoice_title: { vi: "Hóa đơn", en: "Invoice", ko: "영수증" },
  invoice_change_time: { vi: "Đổi giờ", en: "Change", ko: "변경" },
  pickup_bank_transfer_button: {
    vi: "Chuyển khoản ngân hàng",
    en: "Pay by bank transfer",
    ko: "계좌 이체로 결제",
  },
  pickup_bank_transfer_title: { vi: "Chuyển khoản để hoàn tất đơn", en: "Transfer to complete your order", ko: "계좌 이체로 주문을 완료하세요" },
  pickup_bank_transfer_instructions: {
    vi: "Quét mã bằng app ngân hàng bất kỳ, giữ nguyên số tiền và nội dung chuyển khoản đã điền sẵn. Nhân viên sẽ xác nhận khi nhận được tiền.",
    en: "Scan with any banking app — the amount and transfer note are already filled in. Staff will confirm once the payment is received.",
    ko: "아무 은행 앱으로 스캔하세요 — 금액과 이체 메모가 이미 입력되어 있습니다. 입금이 확인되면 직원이 확인해 드립니다.",
  },
  pickup_bank_transfer_amount: { vi: "Số tiền", en: "Amount", ko: "금액" },
  pickup_bank_transfer_note: { vi: "Nội dung chuyển khoản", en: "Transfer note", ko: "이체 메모" },
  pickup_bank_transfer_waiting: { vi: "Đang chờ nhân viên xác nhận…", en: "Waiting for staff to confirm…", ko: "직원 확인 대기 중…" },
  test_mark_paid_button: {
    vi: "🧪 [Thử nghiệm] Giả lập đã thanh toán",
    en: "🧪 [Test] Simulate payment success",
    ko: "🧪 [테스트] 결제 완료로 표시",
  },
  pickup_pay_loading: { vi: "Đang chuyển đến VNPay…", en: "Redirecting to VNPay…", ko: "VNPay로 이동 중…" },
  pickup_pay_error: {
    vi: "Không thể bắt đầu thanh toán. Vui lòng thử lại.",
    en: "Couldn't start the payment. Please try again.",
    ko: "결제를 시작할 수 없습니다. 다시 시도해 주세요.",
  },
  pickup_not_configured: {
    vi: "Quán chưa thiết lập tài khoản nhận thanh toán. Vui lòng liên hệ trực tiếp.",
    en: "This store hasn't set up payments yet. Please contact them directly.",
    ko: "이 매장은 아직 결제 설정이 되어 있지 않습니다. 직접 문의해 주세요.",
  },
  pickup_result_waiting_title: { vi: "Đang xác nhận thanh toán…", en: "Confirming your payment…", ko: "결제 확인 중…" },
  pickup_result_waiting_desc: {
    vi: "Vui lòng đợi trong giây lát, đừng đóng trang này.",
    en: "This will only take a moment — please don't close this page.",
    ko: "잠시만 기다려 주세요 — 이 페이지를 닫지 마세요." ,
  },
  pickup_result_success_title: { vi: "Thanh toán thành công!", en: "Payment successful!", ko: "결제 완료!" },
  pickup_result_code_label: { vi: "Mã lấy đơn", en: "Pickup code", ko: "픽업 코드" },
  pickup_result_instructions: {
    vi: "Đưa mã này cho nhân viên tại quầy để nhận đồ ăn.",
    en: "Show this code to staff at the counter to collect your order.",
    ko: "이 코드를 카운터 직원에게 보여주고 주문을 받으세요.",
  },
  pickup_result_find_later: {
    vi: "Lỡ thoát ra? Mã này vẫn lưu ở tab Giỏ hàng, mục \"Đơn của bạn\".",
    en: "Left this page by accident? Find this code again under \"Your orders\" in the Cart tab.",
    ko: "실수로 페이지를 나갔나요? 장바구니 탭의 \"내 주문\"에서 이 코드를 다시 확인할 수 있습니다.",
  },
  pickup_result_failed_title: { vi: "Thanh toán không thành công", en: "Payment failed", ko: "결제 실패" },
  pickup_result_failed_desc: {
    vi: "Đơn hàng chưa được thanh toán. Bạn có thể quay lại và thử đặt lại.",
    en: "This order hasn't been paid for. You can go back and try ordering again.",
    ko: "아직 결제되지 않았습니다. 다시 돌아가서 주문을 시도해 주세요.",
  },
  pickup_result_back_button: { vi: "Về giỏ hàng", en: "Back to cart", ko: "장바구니로 돌아가기" },
  orders_pickup_badge: { vi: "Lấy tại quầy #{code}", en: "Pickup #{code}", ko: "픽업 #{code}" },
  orders_awaiting_payment_heading: {
    vi: "Chờ xác nhận thanh toán",
    en: "Awaiting payment confirmation",
    ko: "결제 확인 대기 중",
  },
  orders_confirm_payment_received: { vi: "Xác nhận đã nhận tiền", en: "Confirm payment received", ko: "입금 확인" },
  orders_awaiting_vnpay_auto: {
    vi: "Đang chờ VNPay tự động xác nhận",
    en: "Waiting for VNPay to confirm automatically",
    ko: "VNPay 자동 확인 대기 중",
  },
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
  review_owner_reply: { vi: "Phản hồi từ quán", en: "Reply from the restaurant", ko: "매장 답글" },

  // Owner dashboard
  owner_dashboard: { vi: "Trang quản lý", en: "Owner Dashboard", ko: "사장님 대시보드" },
  owner_nav_orders: { vi: "Đơn hàng", en: "Orders", ko: "주문" },
  owner_nav_chat: { vi: "Tin nhắn", en: "Messages", ko: "메시지" },
  owner_nav_menu: { vi: "Quản lý thực đơn", en: "Menu Management", ko: "메뉴 관리" },
  owner_nav_analytics: { vi: "Thống kê", en: "Analytics", ko: "분석" },
  owner_nav_seating: { vi: "Sơ đồ bàn", en: "Seating", ko: "좌석 배치" },
  owner_nav_tables: { vi: "Mã QR bàn", en: "Table QR Codes", ko: "테이블 QR 코드" },
  owner_nav_reviews: { vi: "Đánh giá", en: "Reviews", ko: "리뷰" },
  owner_nav_store: { vi: "Cài đặt quán", en: "Store Settings", ko: "매장 설정" },
  owner_view_customer: { vi: "Xem app khách hàng", en: "View customer app", ko: "고객 앱 보기" },
  owner_table_requests: { vi: "Yêu cầu từ bàn", en: "Table Requests", ko: "테이블 요청" },
  owner_resolve: { vi: "Đã xử lý", en: "Resolve", ko: "처리 완료" },
  owner_logout: { vi: "Đăng xuất", en: "Log out", ko: "로그아웃" },
  owner_switch_store: { vi: "Đổi quán", en: "Switch store", ko: "매장 전환" },
  owner_change_password: { vi: "Đổi mật khẩu", en: "Change password", ko: "비밀번호 변경" },

  // Orders (admin)
  orders_title: { vi: "Đơn hàng", en: "Orders", ko: "주문" },
  orders_subtitle: {
    vi: "Đơn hàng trực tiếp từ các bàn khách.",
    en: "Live orders coming in from customer tables.",
    ko: "고객 테이블에서 들어오는 실시간 주문입니다.",
  },
  orders_reservations_waiting: { vi: "Đặt chỗ & chờ bàn", en: "Reservations & waiting", ko: "예약 및 대기" },
  orders_status_waiting: { vi: "Đang chờ", en: "Waiting", ko: "대기 중" },
  orders_status_reserved: { vi: "Đã đặt", en: "Reserved", ko: "예약됨" },
  orders_accept: { vi: "Chấp nhận", en: "Accept", ko: "수락" },
  orders_stat_active: { vi: "Đơn đang xử lý", en: "Active Orders", ko: "진행 중인 주문" },
  orders_stat_tables_occupied: { vi: "Bàn đang dùng", en: "Tables Occupied", ko: "이용 중인 테이블" },
  orders_stat_revenue: { vi: "Tổng doanh thu", en: "Total Revenue", ko: "총 매출" },
  orders_empty: {
    vi: "Chưa có đơn nào đang xử lý. Khi khách xác nhận đặt món từ bàn, đơn sẽ hiện ở đây theo thời gian thực.",
    en: "No active orders yet. Once a customer confirms an order from their table, it'll show up here in real time.",
    ko: "진행 중인 주문이 아직 없습니다. 고객이 테이블에서 주문을 확정하면 실시간으로 여기에 표시됩니다.",
  },
  orders_count_label: { vi: "{count} đơn", en: "{count} order(s)", ko: "주문 {count}건" },
  orders_cancel_order: { vi: "Huỷ đơn", en: "Cancel order", ko: "주문 취소" },
  orders_cancel_confirm: {
    vi: "Huỷ toàn bộ đơn của Bàn {table}?",
    en: "Cancel this whole order for Table {table}?",
    ko: "{table} 테이블의 전체 주문을 취소할까요?",
  },
  orders_cancel_item_title: { vi: "Huỷ món này", en: "Cancel this item", ko: "이 항목 취소" },
  orders_mark_next_title: { vi: "Đánh dấu {status}", en: "Mark {status}", ko: "{status}(으)로 표시" },
  orders_served_heading: { vi: "Đã phục vụ", en: "Served", ko: "서빙 완료" },
  orders_cancelled_heading: { vi: "Đã huỷ", en: "Cancelled", ko: "취소됨" },
  order_status_new: { vi: "Mới", en: "New", ko: "신규" },
  order_status_preparing: { vi: "Đang chuẩn bị", en: "Preparing", ko: "준비 중" },
  order_status_served: { vi: "Đã phục vụ", en: "Served", ko: "서빙 완료" },
  order_status_cancelled: { vi: "Đã huỷ", en: "Cancelled", ko: "취소됨" },
  order_status_awaiting_payment: { vi: "Chờ thanh toán", en: "Awaiting payment", ko: "결제 대기 중" },
  orders_time_just_now: { vi: "vừa xong", en: "just now", ko: "방금 전" },
  orders_time_min_ago: { vi: "{n} phút trước", en: "{n} min ago", ko: "{n}분 전" },
  orders_time_hr_ago: { vi: "{n} giờ trước", en: "{n} hr ago", ko: "{n}시간 전" },

  // Menu management (admin)
  menu_mgmt_subtitle: {
    vi: "Thay đổi ở đây hiện ngay lập tức trong app khách hàng — kể cả gợi ý của Menu AI.",
    en: "Changes here appear instantly in the customer app — including Menu AI's recommendations.",
    ko: "여기서의 변경 사항은 Menu AI의 추천을 포함해 고객 앱에 즉시 반영됩니다.",
  },
  menu_mgmt_add_dish: { vi: "Thêm món", en: "Add Dish", ko: "메뉴 추가" },
  menu_mgmt_delete_confirm: {
    vi: "Xoá {count} món khỏi thực đơn?",
    en: "Remove {count} dish(es) from the menu?",
    ko: "메뉴에서 {count}개 항목을 삭제할까요?",
  },

  // Analytics (admin)
  analytics_title: { vi: "Thống kê", en: "Analytics", ko: "분석" },
  analytics_subtitle: {
    vi: "Doanh thu và hiệu quả thực đơn từ các đơn hàng đã đặt.",
    en: "Revenue and menu performance from orders placed so far.",
    ko: "지금까지 들어온 주문 기준 매출 및 메뉴 성과입니다.",
  },
  analytics_view_chart: { vi: "Biểu đồ", en: "Chart", ko: "차트" },
  analytics_view_table: { vi: "Bảng", en: "Table", ko: "표" },
  analytics_total_revenue: { vi: "Tổng doanh thu", en: "Total revenue", ko: "총 매출" },
  analytics_total_orders: { vi: "Tổng số đơn", en: "Total orders", ko: "총 주문 수" },
  analytics_avg_order: { vi: "Giá trị đơn trung bình", en: "Average order value", ko: "평균 주문 금액" },
  analytics_empty: {
    vi: "Chưa có đơn nào — thống kê sẽ hiện khi khách bắt đầu đặt món.",
    en: "No orders yet — analytics will appear here once customers start ordering.",
    ko: "아직 주문이 없습니다 — 고객이 주문을 시작하면 통계가 표시됩니다.",
  },
  analytics_revenue_by_day: { vi: "Doanh thu theo ngày", en: "Revenue by day", ko: "일별 매출" },
  analytics_top_dishes: { vi: "Món bán chạy theo doanh thu", en: "Top dishes by revenue", ko: "매출 상위 메뉴" },
  analytics_col_day: { vi: "Ngày", en: "Day", ko: "날짜" },
  analytics_col_revenue: { vi: "Doanh thu", en: "Revenue", ko: "매출" },
  analytics_col_dish: { vi: "Món", en: "Dish", ko: "메뉴" },
  analytics_col_qty: { vi: "SL", en: "Qty", ko: "수량" },

  // Seating layout (admin)
  seating_title: { vi: "Sơ đồ bàn", en: "Seating Layout", ko: "좌석 배치" },
  seating_subtitle: {
    vi: "Kéo bàn cho khớp mặt bằng thật, rồi lưu lại.",
    en: "Drag tables to match your floor plan, then save.",
    ko: "실제 매장 배치에 맞게 테이블을 드래그한 후 저장하세요.",
  },
  seating_add_table: { vi: "Thêm bàn", en: "Add table", ko: "테이블 추가" },
  seating_saving: { vi: "Đang lưu…", en: "Saving…", ko: "저장 중…" },
  seating_save: { vi: "Lưu sơ đồ", en: "Save layout", ko: "배치 저장" },
  seating_empty: {
    vi: "Chưa có bàn nào — bấm \"Thêm bàn\" để bắt đầu.",
    en: 'No tables yet — click "Add table" to start.',
    ko: '아직 테이블이 없습니다 — "테이블 추가"를 눌러 시작하세요.',
  },
  seating_field_code: { vi: "Mã bàn", en: "Table code", ko: "테이블 코드" },
  seating_field_status: { vi: "Trạng thái", en: "Status", ko: "상태" },
  seating_field_view: { vi: "Vị trí / khu vực", en: "View / area", ko: "위치 / 구역" },
  seating_field_view_placeholder: { vi: "vd. Sân hiên, Cạnh cửa sổ", en: "e.g. Terrace, Window", ko: "예: 테라스, 창가" },
  seating_field_tag: { vi: "Nhãn", en: "Tag", ko: "태그" },
  seating_field_tag_placeholder: { vi: "vd. Phổ biến", en: "e.g. Popular", ko: "예: 인기" },
  seating_field_capacity: { vi: "Sức chứa", en: "Capacity", ko: "수용 인원" },
  seating_delete_table: { vi: "Xoá bàn", en: "Delete table", ko: "테이블 삭제" },
  seating_select_prompt: { vi: "Chọn một bàn để chỉnh sửa.", en: "Select a table to edit it.", ko: "수정할 테이블을 선택하세요." },
  seating_save_error: { vi: "Không lưu được sơ đồ bàn.", en: "Failed to save the seating layout.", ko: "좌석 배치를 저장하지 못했습니다." },

  // Reviews (admin)
  reviews_mgmt_title: { vi: "Đánh giá", en: "Reviews", ko: "리뷰" },
  reviews_mgmt_subtitle: {
    vi: "Toàn bộ đánh giá của khách, mới nhất trước. Phản hồi sẽ hiển thị công khai cho mọi khách hàng.",
    en: "All customer reviews, newest first. Replies are visible to every customer.",
    ko: "모든 고객 리뷰가 최신순으로 표시됩니다. 답글은 모든 고객에게 공개됩니다.",
  },
  reviews_mgmt_empty: { vi: "Chưa có đánh giá nào.", en: "No reviews yet.", ko: "아직 리뷰가 없습니다." },
  reviews_mgmt_edit_reply: { vi: "Sửa phản hồi", en: "Edit reply", ko: "답글 수정" },
  reviews_mgmt_reply: { vi: "Phản hồi", en: "Reply", ko: "답글" },
  reviews_mgmt_placeholder: {
    vi: "Viết phản hồi công khai cho khách...",
    en: "Write a reply visible to customers...",
    ko: "고객에게 공개될 답글을 작성하세요...",
  },
  reviews_mgmt_save_reply: { vi: "Lưu phản hồi", en: "Save reply", ko: "답글 저장" },
  reviews_mgmt_cancel: { vi: "Huỷ", en: "Cancel", ko: "취소" },
  reviews_mgmt_your_reply: { vi: "Phản hồi của bạn", en: "Your reply", ko: "내 답글" },

  // Store settings (admin)
  store_settings_title: { vi: "Cài đặt quán", en: "Store Settings", ko: "매장 설정" },
  store_settings_subtitle: {
    vi: "Hiển thị cho khách ở tab Thông tin và dùng để AI trả lời có căn cứ. Tiếng Hàn/Việt tự dịch từ tiếng Anh khi lưu.",
    en: "Shown to customers in the Info tab and used to ground AI chat replies. Korean/Vietnamese are auto-translated from English on save.",
    ko: "고객 앱의 정보 탭에 표시되며 AI 답변의 근거로 사용됩니다. 저장 시 한국어/베트남어가 영어에서 자동 번역됩니다.",
  },
  store_settings_save: { vi: "Lưu", en: "Save", ko: "저장" },
  store_settings_saving: { vi: "Đang lưu…", en: "Saving…", ko: "저장 중…" },
  store_settings_loading: { vi: "Đang tải…", en: "Loading…", ko: "불러오는 중…" },
  store_settings_saved: { vi: "Đã lưu.", en: "Saved.", ko: "저장되었습니다." },
  store_settings_field_name: { vi: "Tên quán", en: "Name", ko: "매장명" },
  store_settings_field_hours: { vi: "Giờ mở cửa", en: "Hours", ko: "영업시간" },
  store_settings_field_hours_placeholder: {
    vi: "vd. Các ngày trong tuần 11:30 - 22:00",
    en: "e.g. Weekdays 11:30 - 22:00",
    ko: "예: 평일 11:30 - 22:00",
  },
  store_settings_pickup_window: { vi: "Khung giờ nhận đơn đặt trước", en: "Pickup order window", ko: "픽업 주문 가능 시간" },
  store_settings_pickup_window_desc: {
    vi: "Khách đặt trước chỉ được chọn giờ ra lấy trong khung này.",
    en: "Pickup customers can only choose a collection time inside this window.",
    ko: "픽업 고객은 이 시간 범위 내에서만 수령 시간을 선택할 수 있습니다.",
  },
  store_settings_pickup_window_to: { vi: "đến", en: "to", ko: "~" },
  store_settings_pickup_window_error: {
    vi: "Giờ mở phải trước giờ đóng.",
    en: "Opening time must be before closing time.",
    ko: "오픈 시간은 마감 시간보다 빨라야 합니다.",
  },
  store_settings_field_description: { vi: "Mô tả", en: "Description", ko: "설명" },
  store_settings_field_categories: { vi: "Danh mục món", en: "Menu categories", ko: "메뉴 카테고리" },
  store_settings_field_categories_placeholder: { vi: "vd. Món chính, Khai vị", en: "e.g. Main, Starter", ko: "예: 메인, 애피타이저" },
  store_settings_field_keywords: {
    vi: "Từ khoá gợi ý AI",
    en: "AI recommendation keywords",
    ko: "AI 추천 키워드",
  },
  store_settings_field_keywords_desc: {
    vi: "Được đưa vào chat AI dưới dạng gợi ý kiểu hashtag (tâm trạng/dịp) để gợi ý món.",
    en: "Fed to the AI chat as hashtag-style hints (e.g. mood/occasion) for menu recommendations.",
    ko: "메뉴 추천을 위해 AI 채팅에 해시태그 형태의 힌트(기분/상황 등)로 전달됩니다.",
  },
  store_settings_field_keywords_placeholder: { vi: "vd. #món-ấm-lòng", en: "e.g. #comfort-food", ko: "예: #든든한메뉴" },
  store_settings_error: { vi: "Không lưu được cài đặt quán.", en: "Failed to save store settings.", ko: "매장 설정을 저장하지 못했습니다." },
  store_settings_contact_title: { vi: "Liên hệ & Wifi", en: "Contact & Wifi", ko: "연락처 & 와이파이" },
  store_settings_contact_desc: {
    vi: "Hiện cho khách ở tab Thông tin trong app.",
    en: "Shown to customers on the app's Info tab.",
    ko: "고객에게 앱의 정보 탭에서 표시됩니다.",
  },
  store_settings_address: { vi: "Địa chỉ", en: "Address", ko: "주소" },
  store_settings_phone: { vi: "Số điện thoại / Hotline", en: "Phone / Hotline", ko: "전화번호 / 핫라인" },
  store_settings_wifi_name: { vi: "Tên wifi", en: "Wifi name", ko: "와이파이 이름" },
  store_settings_wifi_password: { vi: "Mật khẩu wifi", en: "Wifi password", ko: "와이파이 비밀번호" },
  store_settings_bank_title: { vi: "Tài khoản ngân hàng (VietQR)", en: "Bank account (VietQR)", ko: "은행 계좌 (VietQR)" },
  store_settings_bank_desc: {
    vi: "Dùng để hiện mã QR chuyển khoản cho khách đặt trước — bỏ trống nếu chỉ dùng VNPay.",
    en: "Used to show a bank-transfer QR code to remote pre-order customers — leave blank if only using VNPay.",
    ko: "원격 사전 주문 고객에게 계좌이체 QR 코드를 표시할 때 사용합니다 — VNPay만 사용한다면 비워두세요.",
  },
  store_settings_bank_name: { vi: "Ngân hàng", en: "Bank", ko: "은행" },
  store_settings_bank_select: { vi: "Chọn ngân hàng…", en: "Select a bank…", ko: "은행 선택…" },
  store_settings_bank_account_number: { vi: "Số tài khoản", en: "Account number", ko: "계좌번호" },
  store_settings_bank_account_holder: { vi: "Tên chủ tài khoản", en: "Account holder name", ko: "예금주" },
  store_settings_bank_qr_upload: { vi: "Ảnh mã QR (tuỳ chọn)", en: "QR code image (optional)", ko: "QR 코드 이미지 (선택)" },
  store_settings_bank_qr_upload_desc: {
    vi: "Chỉ dùng khi chưa điền được số tài khoản ở trên — mã QR tự tạo từ số tài khoản mới nhúng được mã đơn hàng để đối chiếu, ảnh tải lên là ảnh tĩnh nên không nhúng được.",
    en: "Only used as a fallback if you can't fill in the account number above — the auto-generated QR is the only one that embeds an order code for matching against payments; an uploaded image can't.",
    ko: "위 계좌번호를 입력할 수 없을 때만 대체용으로 사용됩니다 — 자동 생성된 QR만 결제 대조용 주문 코드를 포함할 수 있으며, 업로드한 이미지는 불가능합니다.",
  },
  store_settings_bank_qr_choose_file: { vi: "Chọn ảnh", en: "Choose file", ko: "파일 선택" },
  store_settings_bank_qr_remove: { vi: "Xoá ảnh", en: "Remove", ko: "삭제" },

  // Table QR (admin)
  tableqr_desc: {
    vi: "Có 2 loại mã QR: 1 mã \"chung\" cho thực đơn/tờ rơi/mạng xã hội (chỉ xem + hỏi AI, không đặt món được), và 1 mã cho từng bàn thật (đặt món + đặt chỗ đầy đủ) — in ra và dán tại bàn đó. Quản lý bàn ở mục Sơ đồ bàn.",
    en: 'Two kinds of QR code: one general "web" code for menus/flyers/social media (browse + AI only, no ordering), and one per physical table (full ordering + reservations) — printed and left on that table. Manage tables themselves in Seating.',
    ko: '2가지 QR 코드가 있습니다: 메뉴/전단지/SNS용 일반 "web" 코드(둘러보기 + AI만 가능, 주문 불가)와 실제 테이블용 코드(주문 + 예약 전체 가능) — 출력해서 해당 테이블에 두세요. 테이블 관리는 좌석 배치에서 합니다.',
  },
  tableqr_web_heading: { vi: "Mã QR chung", en: 'General "web" QR', ko: '일반 "web" QR' },
  tableqr_download: { vi: "Tải xuống", en: "Download", ko: "다운로드" },
  tableqr_table_heading: { vi: "Mã QR từng bàn", en: 'Per-table "store" QR', ko: '테이블별 "store" QR' },
  tableqr_empty: {
    vi: "Chưa có bàn nào — thêm bàn ở mục Sơ đồ bàn trước.",
    en: "No tables yet — add tables in Seating first.",
    ko: "아직 테이블이 없습니다 — 좌석 배치에서 먼저 테이블을 추가하세요.",
  },

  // Dish form (admin)
  dishform_edit_title: { vi: "Sửa món", en: "Edit Dish", ko: "메뉴 수정" },
  dishform_add_title: { vi: "Thêm món", en: "Add Dish", ko: "메뉴 추가" },
  dishform_name: { vi: "Tên món", en: "Name", ko: "메뉴명" },
  dishform_name_placeholder: { vi: "vd. Hamburger nhà làm", en: "e.g. Handmade Hamburger", ko: "예: 수제 햄버거" },
  dishform_price: { vi: "Giá", en: "Price", ko: "가격" },
  dishform_price_from_variants: {
    vi: "Lấy theo lựa chọn đầu tiên bên dưới",
    en: "Taken from the first option below",
    ko: "아래 첫 번째 옵션 기준",
  },
  dishform_sizes_title: { vi: "Các lựa chọn (tuỳ chọn)", en: "Options (optional)", ko: "옵션 (선택)" },
  dishform_sizes_desc: {
    vi: "Thêm để khách chọn giữa nhiều size (vd. M/L, giá khác nhau) hoặc nhiều vị (vd. Xoài/Dâu, cùng giá) cho cùng 1 món — bỏ trống nếu món chỉ có 1 lựa chọn.",
    en: "Add these to let customers pick between sizes (e.g. M/L, different prices) or flavors (e.g. Mango/Strawberry, same price) on one dish — leave empty for a single-option dish.",
    ko: "고객이 한 메뉴에서 사이즈(예: M/L, 가격 다름) 또는 맛(예: 망고/딸기, 가격 동일)을 선택하게 하려면 추가하세요 — 옵션이 하나뿐이면 비워두세요.",
  },
  dishform_size_label_placeholder: { vi: "vd. M hoặc Xoài", en: "e.g. M or Mango", ko: "예: M 또는 망고" },
  dishform_add_size: { vi: "Thêm lựa chọn", en: "Add option", ko: "옵션 추가" },
  dishform_category: { vi: "Danh mục", en: "Category", ko: "카테고리" },
  dishform_description: { vi: "Mô tả", en: "Description", ko: "설명" },
  dishform_description_placeholder: { vi: "Mô tả ngắn, hấp dẫn", en: "Short, appetizing description", ko: "짧고 먹음직스러운 설명" },
  dishform_photo: { vi: "Ảnh món", en: "Menu photo", ko: "메뉴 사진" },
  dishform_choose_file: { vi: "Chọn ảnh", en: "Choose file", ko: "파일 선택" },
  dishform_image_url: { vi: "Hoặc dán URL ảnh", en: "Or image URL", ko: "또는 이미지 URL" },
  dishform_prep_time: { vi: "Thời gian chuẩn bị (phút, tuỳ chọn)", en: "Prep time (minutes, optional)", ko: "조리 시간(분, 선택)" },
  dishform_ingredients_title: { vi: "Nguyên liệu", en: "Ingredients", ko: "재료" },
  dishform_ingredients_desc: {
    vi: "Nhập nguyên liệu và số gram dùng cho 1 suất. Nguyên liệu có sẵn tự điền dinh dưỡng; nguyên liệu khác thì tự nhập calo/đạm/tinh bột/béo trên 100g.",
    en: "Type any ingredient and how many grams go into one serving. Known ingredients auto-fill their nutrition; for anything else, add its calories/protein/carbs/fat per 100g yourself.",
    ko: "1인분에 들어가는 재료와 그램 수를 입력하세요. 알려진 재료는 영양 정보가 자동으로 채워지며, 그 외 재료는 100g당 칼로리/단백질/탄수화물/지방을 직접 입력하세요.",
  },
  dishform_ingredient_name_placeholder: { vi: "vd. Thịt bò, hoặc tự nhập", en: "e.g. Beef, or type your own", ko: "예: 소고기, 또는 직접 입력" },
  dishform_add_ingredient: { vi: "Thêm nguyên liệu", en: "Add ingredient", ko: "재료 추가" },
  dishform_not_in_db: {
    vi: "Không có sẵn trong danh sách — nhập dinh dưỡng trên 100g, hoặc để trống để bỏ qua khi tính tổng.",
    en: "Not in our database — enter nutrition per 100g, or leave blank to skip it in the total.",
    ko: "목록에 없는 재료입니다 — 100g당 영양 정보를 입력하거나, 합계에서 제외하려면 비워두세요.",
  },
  dishform_kcal: { vi: "kcal", en: "kcal", ko: "kcal" },
  dishform_protein_g: { vi: "Đạm (g)", en: "Protein g", ko: "단백질(g)" },
  dishform_carbs_g: { vi: "Tinh bột (g)", en: "Carbs g", ko: "탄수화물(g)" },
  dishform_fat_g: { vi: "Béo (g)", en: "Fat g", ko: "지방(g)" },
  dishform_allergy_note: { vi: "Ghi chú dị ứng", en: "Allergy note", ko: "알레르기 안내" },
  dishform_allergy_placeholder: { vi: "Có chứa gluten, sữa.", en: "Contains gluten, dairy.", ko: "글루텐, 유제품 함유." },
  dishform_tags: { vi: "Thẻ", en: "Tags", ko: "태그" },
  dishform_cancel: { vi: "Huỷ", en: "Cancel", ko: "취소" },
  dishform_save: { vi: "Lưu món", en: "Save Dish", ko: "메뉴 저장" },

  // Owner login
  ownerlogin_title: { vi: "Đăng nhập trang quản lý", en: "Owner Dashboard login", ko: "사장님 대시보드 로그인" },
  ownerlogin_email: { vi: "Email", en: "Email", ko: "이메일" },
  ownerlogin_password: { vi: "Mật khẩu", en: "Password", ko: "비밀번호" },
  ownerlogin_submit: { vi: "Đăng nhập", en: "Sign in", ko: "로그인" },
  ownerlogin_submitting: { vi: "Đang đăng nhập...", en: "Signing in...", ko: "로그인 중..." },
  ownerlogin_forgot_password: { vi: "Quên mật khẩu?", en: "Forgot password?", ko: "비밀번호를 잊으셨나요?" },
  ownerlogin_back_home: { vi: "Quay lại trang chủ", en: "Back to home", ko: "홈으로 돌아가기" },
  ownerlogin_reset_title: { vi: "Đặt lại mật khẩu", en: "Reset password", ko: "비밀번호 재설정" },
  ownerlogin_reset_desc: {
    vi: "Nhập email tài khoản, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.",
    en: "Enter your account email and we'll send you a link to reset your password.",
    ko: "계정 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.",
  },
  ownerlogin_reset_submit: { vi: "Gửi liên kết đặt lại", en: "Send reset link", ko: "재설정 링크 보내기" },
  ownerlogin_reset_sent: {
    vi: "Nếu email này có tài khoản, một liên kết đặt lại mật khẩu đã được gửi tới. Kiểm tra hộp thư của bạn.",
    en: "If that email has an account, a password reset link has been sent. Check your inbox.",
    ko: "해당 이메일로 계정이 있다면 비밀번호 재설정 링크가 전송되었습니다. 받은편지함을 확인해 주세요.",
  },
  ownerlogin_back_to_login: { vi: "Quay lại đăng nhập", en: "Back to login", ko: "로그인으로 돌아가기" },
  ownerlogin_need_account: {
    vi: "Chưa có tài khoản? Liên hệ quản trị viên để được cấp quyền.",
    en: "Need an account? Contact an administrator.",
    ko: "계정이 필요하신가요? 관리자에게 문의하세요.",
  },

  // Store switcher (admin, multi-store)
  storeswitcher_load_error_title: { vi: "Không tải được danh sách quán", en: "Couldn't load your stores", ko: "매장 목록을 불러오지 못했습니다" },
  storeswitcher_load_error_desc: {
    vi: "Kiểm tra kết nối mạng và thử đăng nhập lại.",
    en: "Check your connection and try signing in again.",
    ko: "연결 상태를 확인하고 다시 로그인해 보세요.",
  },
  storeswitcher_loading: { vi: "Đang tải danh sách quán…", en: "Loading your stores…", ko: "매장 목록을 불러오는 중…" },
  storeswitcher_no_store_title: { vi: "Chưa được cấp quyền quán nào", en: "No store access yet", ko: "아직 매장 접근 권한이 없습니다" },
  storeswitcher_no_store_desc: {
    vi: "Tài khoản này chưa được thêm vào danh sách nhân viên của quán nào. Liên hệ người quản lý hệ thống để được thêm vào.",
    en: "This account isn't linked to any store's staff list yet. Ask whoever manages the platform to add you.",
    ko: "이 계정은 아직 어떤 매장의 직원 목록에도 연결되어 있지 않습니다. 플랫폼 관리자에게 추가를 요청하세요.",
  },
  storeswitcher_select_title: { vi: "Chọn quán", en: "Select a store", ko: "매장 선택" },
  storeswitcher_select_desc: {
    vi: "Bạn đang quản lý nhiều hơn 1 quán — chọn quán muốn mở.",
    en: "You manage more than one — pick which to open.",
    ko: "관리하는 매장이 여러 개입니다 — 열 매장을 선택하세요.",
  },
  storeswitcher_sign_out: { vi: "Đăng xuất", en: "Sign out", ko: "로그아웃" },

  // Change password (admin)
  changepw_title: { vi: "Đổi mật khẩu", en: "Change password", ko: "비밀번호 변경" },
  changepw_forced_title: { vi: "Đặt mật khẩu mới", en: "Set a new password", ko: "새 비밀번호 설정" },
  changepw_forced_desc: {
    vi: "Bạn cần đặt mật khẩu mới trước khi tiếp tục.",
    en: "You need to set a new password before continuing.",
    ko: "계속하려면 새 비밀번호를 설정해야 합니다.",
  },
  changepw_new: { vi: "Mật khẩu mới", en: "New password", ko: "새 비밀번호" },
  changepw_new_placeholder: { vi: "Ít nhất 6 ký tự", en: "At least 6 characters", ko: "6자 이상" },
  changepw_confirm: { vi: "Xác nhận mật khẩu mới", en: "Confirm new password", ko: "새 비밀번호 확인" },
  changepw_min_length_error: {
    vi: "Mật khẩu phải có ít nhất 6 ký tự.",
    en: "Password must be at least 6 characters.",
    ko: "비밀번호는 6자 이상이어야 합니다.",
  },
  changepw_mismatch_error: { vi: "Mật khẩu không khớp.", en: "Passwords don't match.", ko: "비밀번호가 일치하지 않습니다." },
  changepw_saving: { vi: "Đang lưu…", en: "Saving…", ko: "저장 중…" },
  changepw_save: { vi: "Lưu mật khẩu mới", en: "Save new password", ko: "새 비밀번호 저장" },
  changepw_done_title: { vi: "Đã đổi mật khẩu", en: "Password changed", ko: "비밀번호가 변경되었습니다" },
  changepw_close: { vi: "Đóng", en: "Close", ko: "닫기" },

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

  // Store directory (homepage — bare domain root, no ?store= param)
  directory_admin_login: { vi: "Đăng nhập quản lý", en: "Owner login", ko: "사장님 로그인" },
  directory_eyebrow: { vi: "Nền tảng gọi món QR", en: "QR ordering platform", ko: "QR 주문 플랫폼" },
  directory_title: { vi: "Chọn nhà hàng", en: "Choose a restaurant", ko: "매장을 선택하세요" },
  directory_subtitle: {
    vi: "Chọn quán bạn muốn xem thực đơn, đặt món hoặc đặt bàn.",
    en: "Pick a restaurant to view its menu, order, or reserve a table.",
    ko: "메뉴를 보거나 주문, 예약하고 싶은 매장을 선택하세요.",
  },
  directory_view_menu: { vi: "Xem thực đơn", en: "View menu", ko: "메뉴 보기" },
  dining_choice_title: { vi: "Bạn muốn dùng bữa thế nào?", en: "How would you like to dine?", ko: "어떻게 이용하시겠어요?" },
  dining_choice_subtitle: {
    vi: "Chọn 1 trong 2 cách bên dưới",
    en: "Pick one of the options below",
    ko: "아래 옵션 중 하나를 선택하세요",
  },
  dining_choice_dine_in_title: { vi: "Ăn tại quán", en: "Dine in", ko: "매장 식사" },
  dining_choice_dine_in_desc: {
    vi: "Xem menu trước, gọi món trực tiếp khi tới quán.",
    en: "Browse the menu now, order in person once you're at the restaurant.",
    ko: "지금 메뉴를 둘러보고, 매장에 도착하면 직접 주문하세요.",
  },
  dining_choice_pickup_title: { vi: "Đặt trước — lấy sau", en: "Order ahead — pick up later", ko: "미리 주문 — 나중에 픽업" },
  dining_choice_pickup_desc: {
    vi: "Chọn món, thanh toán trước, hẹn giờ ra quán lấy.",
    en: "Choose your food, pay now, and pick a time to collect it.",
    ko: "메뉴를 고르고 결제한 뒤, 수령할 시간을 정하세요.",
  },
  directory_footer: {
    vi: "Powered by MenuPilot",
    en: "Powered by MenuPilot",
    ko: "Powered by MenuPilot",
  },
  directory_load_error: {
    vi: "Không tải được danh sách nhà hàng. Vui lòng thử lại.",
    en: "Couldn't load the restaurant list. Please try again.",
    ko: "매장 목록을 불러오지 못했습니다. 다시 시도해 주세요.",
  },
  directory_empty: {
    vi: "Chưa có nhà hàng nào trên nền tảng.",
    en: "No restaurants on this platform yet.",
    ko: "아직 등록된 매장이 없습니다.",
  },
  directory_hero_line1: {
    vi: "Không chỉ là món ăn,",
    en: "It's not just food,",
    ko: "단순한 음식이 아니라,",
  },
  directory_hero_highlight: {
    vi: "là trải nghiệm",
    en: "it's an experience",
    ko: "하나의 경험입니다",
  },
  directory_cta_view_menu: { vi: "Xem thực đơn", en: "View menu", ko: "메뉴 보기" },
  directory_cta_download_app: { vi: "Tải ứng dụng", en: "Download app", ko: "앱 다운로드" },
  directory_soon_badge: { vi: "Sắp ra mắt", en: "Coming soon", ko: "출시 예정" },
  directory_app_soon_tooltip: {
    vi: "Ứng dụng đang được phát triển, ra mắt sau.",
    en: "The app is still in development — coming later.",
    ko: "앱은 현재 개발 중이며 추후 출시됩니다.",
  },
  directory_stat_stores: {
    vi: "{count} nhà hàng đang hoạt động trên nền tảng",
    en: "{count} restaurants active on the platform",
    ko: "{count}개 매장이 플랫폼에서 운영 중",
  },
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
