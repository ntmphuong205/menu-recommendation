export const RESTAURANT = {
  name: "Fresh Bites",
  tagline: "AI Menu Assistant",
  rating: 4.8,
  reviewCount: 326,
  cuisine: "European-Asian fusion, healthy",
  hours: [
    { day: "Mon - Fri", time: "10:30 AM - 10:00 PM" },
    { day: "Sat - Sun", time: "9:00 AM - 11:00 PM" },
  ],
  address: "12 Flavor Street, District 1, Ho Chi Minh City",
};

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ: FAQItem[] = [
  {
    question: "Do you have vegan options?",
    answer:
      "Yes! Quinoa Buddha Bowl and Carrot Ginger Soup are our two favorite vegan dishes, both under 350 calories.",
  },
  {
    question: "What's your best-selling dish?",
    answer:
      "Handmade Hamburger and Crispy Fried Chicken are our two best-sellers. If you want something lighter, the Spicy Grilled Chicken Salad is also very popular.",
  },
  {
    question: "Can I customize my order?",
    answer:
      "Absolutely — just tell Menu AI in the chat, e.g. 'remove onions' or 'add extra spicy sauce', and it'll add a note to your order.",
  },
  {
    question: "Is parking available?",
    answer: "Yes, free motorbike and car parking right in front of the restaurant.",
  },
  {
    question: "Do you offer delivery?",
    answer: "Yes, delivery is available within a 5km radius through our delivery partner apps.",
  },
];
