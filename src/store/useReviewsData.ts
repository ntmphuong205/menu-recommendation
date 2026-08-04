import { useCallback } from "react";
import { apiClient, getCustomerSessionId, type ApiReview } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";
import type { Review } from "../data/reviews";

function fromApi(row: ApiReview): Review {
  return {
    id: row.id,
    dishId: row.menu_id ?? undefined,
    tableId: row.table_id ?? undefined,
    rating: row.rating,
    comment: row.review_text,
    reply: row.reply || undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export interface ReviewsData {
  reviews: Review[];
  addReview: (dishId: string, tableId: string, rating: number, comment: string) => void;
  replyToReview: (id: string, reply: string) => void;
}

export function useReviewsData(): ReviewsData {
  const fetcher = useCallback(() => apiClient.getReviews(), []);
  const rows = usePollingData(fetcher);
  const reviews = (rows ?? []).map(fromApi);

  const addReview = (dishId: string, tableId: string, rating: number, comment: string) => {
    apiClient
      .createReview({
        rating,
        review_text: comment,
        menu_id: dishId,
        table_id: tableId,
        customer_session_id: getCustomerSessionId(),
      })
      .catch((err) => console.error("[MenuPilot] Failed to add review", err));
  };

  const replyToReview = (id: string, reply: string) => {
    apiClient.replyToReview(id, reply).catch((err) => console.error("[MenuPilot] Failed to reply to review", err));
  };

  return { reviews, addReview, replyToReview };
}
