type Lang = "vi" | "en" | "ko";

export interface HoursEntry {
  day: string;
  time: string;
  translations?: Partial<Record<"vi" | "ko", { day: string; time: string }>>;
}

export const RESTAURANT = {
  name: "Fresh Bites",
  tagline: "AI Menu Assistant",
  rating: 4.8,
  reviewCount: 326,
  cuisine: "Korean & Vietnamese",
  address: "12 Flavor Street, District 1, Ho Chi Minh City",
  translations: {
    vi: {
      tagline: "Trợ lý Thực đơn AI",
      cuisine: "Hàn Quốc & Việt Nam",
      address: "12 Đường Flavor, Quận 1, Thành phố Hồ Chí Minh",
    },
    ko: {
      tagline: "AI 메뉴 어시스턴트",
      cuisine: "한식 & 베트남 요리",
      address: "호치민시 1군 플레이버 거리 12번지",
    },
  } satisfies Partial<Record<"vi" | "ko", { tagline: string; cuisine: string; address: string }>>,
  hours: [
    {
      day: "Mon - Fri",
      time: "10:30 AM - 10:00 PM",
      translations: {
        vi: { day: "Thứ 2 - Thứ 6", time: "10:30 - 22:00" },
        ko: { day: "월 - 금", time: "오전 10:30 - 오후 10:00" },
      },
    },
    {
      day: "Sat - Sun",
      time: "9:00 AM - 11:00 PM",
      translations: {
        vi: { day: "Thứ 7 - Chủ nhật", time: "9:00 - 23:00" },
        ko: { day: "토 - 일", time: "오전 9:00 - 오후 11:00" },
      },
    },
  ] satisfies HoursEntry[],
};

/** Tagline/cuisine/address in the given language, falling back to English. */
export function getRestaurantText(lang: Lang): { tagline: string; cuisine: string; address: string } {
  const t = lang === "en" ? undefined : RESTAURANT.translations[lang];
  return {
    tagline: t?.tagline ?? RESTAURANT.tagline,
    cuisine: t?.cuisine ?? RESTAURANT.cuisine,
    address: t?.address ?? RESTAURANT.address,
  };
}

export function getHoursLabel(entry: HoursEntry, lang: Lang): { day: string; time: string } {
  const t = lang === "en" ? undefined : entry.translations?.[lang];
  return { day: t?.day ?? entry.day, time: t?.time ?? entry.time };
}

export interface FAQItem {
  question: string;
  answer: string;
  translations?: Partial<Record<"vi" | "ko", { question: string; answer: string }>>;
}

export function getFaqText(item: FAQItem, lang: Lang): { question: string; answer: string } {
  const t = lang === "en" ? undefined : item.translations?.[lang];
  return { question: t?.question ?? item.question, answer: t?.answer ?? item.answer };
}

export const FAQ: FAQItem[] = [
  {
    question: "Do you have vegan options?",
    answer:
      "Yes! Japchae (stir-fried glass noodles) is our vegetarian favorite, and Yuja Cha (Korean citron tea) is a great vegan drink pick.",
    translations: {
      vi: {
        question: "Quán có món chay không?",
        answer:
          "Có chứ! Japchae (miến xào) là món chay được yêu thích nhất, và Yuja Cha (trà quýt Hàn Quốc) là lựa chọn đồ uống thuần chay tuyệt vời.",
      },
      ko: {
        question: "비건 메뉴가 있나요?",
        answer:
          "그럼요! 잡채(볶은 당면)는 저희 채식 인기 메뉴이고, 유자차(한국식 유자차)는 훌륭한 비건 음료 선택이에요.",
      },
    },
  },
  {
    question: "What's your best-selling dish?",
    answer:
      "Cơm Tấm Sườn and Bulgogi are our two best-sellers. If you want something quick, Bánh Mì Thịt Nướng is also a fan favorite.",
    translations: {
      vi: {
        question: "Món bán chạy nhất của quán là gì?",
        answer:
          "Cơm Tấm Sườn và Bulgogi là hai món bán chạy nhất. Nếu muốn ăn nhanh gọn, Bánh Mì Thịt Nướng cũng rất được yêu thích.",
      },
      ko: {
        question: "가장 잘 팔리는 메뉴는 무엇인가요?",
        answer:
          "꼼땀 스언(돼지갈비 덮밥)과 불고기가 저희 2대 베스트셀러예요. 빠르게 드시고 싶다면 반미 팃 느엉(그릴 돼지고기 반미)도 인기 만점이에요.",
      },
    },
  },
  {
    question: "Can I customize my order?",
    answer:
      "Absolutely — just tell Menu AI in the chat, e.g. 'remove onions' or 'add extra spicy sauce', and it'll add a note to your order.",
    translations: {
      vi: {
        question: "Tôi có thể tuỳ chỉnh món ăn không?",
        answer:
          "Được chứ — chỉ cần nói với Menu AI trong khung chat, ví dụ 'bỏ hành' hoặc 'thêm sốt cay', hệ thống sẽ ghi chú vào đơn của bạn.",
      },
      ko: {
        question: "주문을 커스터마이징할 수 있나요?",
        answer:
          "물론이죠 — 채팅창에서 메뉴 AI에게 '양파 빼주세요'나 '매운 소스 추가해주세요'처럼 말씀해 주시면 주문에 메모로 반영돼요.",
      },
    },
  },
  {
    question: "Is parking available?",
    answer: "Yes, free motorbike and car parking right in front of the restaurant.",
    translations: {
      vi: { question: "Quán có chỗ đậu xe không?", answer: "Có, bãi đậu xe máy và ô tô miễn phí ngay trước quán." },
      ko: { question: "주차가 가능한가요?", answer: "네, 매장 바로 앞에 오토바이와 자동차 무료 주차 공간이 있어요." },
    },
  },
  {
    question: "Do you offer delivery?",
    answer: "Yes, delivery is available within a 5km radius through our delivery partner apps.",
    translations: {
      vi: { question: "Quán có giao hàng không?", answer: "Có, giao hàng trong bán kính 5km qua các ứng dụng đối tác giao hàng." },
      ko: { question: "배달이 가능한가요?", answer: "네, 배달 파트너 앱을 통해 반경 5km 이내 배달이 가능해요." },
    },
  },
];
