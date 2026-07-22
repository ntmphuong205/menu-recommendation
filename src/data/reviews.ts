export interface Review {
  id: string;
  dishId: string;
  tableNumber: number;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
}

export interface DishRatingSummary {
  average: number;
  count: number;
}

export function summarizeRatings(reviews: Review[], dishId: string): DishRatingSummary {
  const forDish = reviews.filter((r) => r.dishId === dishId);
  if (forDish.length === 0) return { average: 0, count: 0 };
  const total = forDish.reduce((sum, r) => sum + r.rating, 0);
  return { average: total / forDish.length, count: forDish.length };
}
