import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { usePersistentState } from "./usePersistentState";
import type { Review } from "../data/reviews";

interface ReviewRow {
  id: string;
  dish_id: string;
  table_number: number;
  rating: number;
  comment: string;
  created_at: string;
}

function fromRow(row: ReviewRow): Review {
  return {
    id: row.id,
    dishId: row.dish_id,
    tableNumber: row.table_number,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export interface ReviewsData {
  reviews: Review[];
  addReview: (dishId: string, tableNumber: number, rating: number, comment: string) => void;
}

let localIdCounter = 0;

export function useReviewsData(restaurantId: string | null): ReviewsData {
  const [local, setLocal] = usePersistentState<Review[]>("fb_reviews", []);
  const [cloud, setCloud] = useState<Review[]>([]);
  const usingCloud = isSupabaseConfigured && restaurantId != null;

  useEffect(() => {
    if (!usingCloud || !supabase) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase!
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (!cancelled) setCloud((data ?? []).map(fromRow));
    };

    refresh();
    const channel = supabase
      .channel(`reviews-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `restaurant_id=eq.${restaurantId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [usingCloud, restaurantId]);

  const reviews = usingCloud ? cloud : local;

  const addReview = (dishId: string, tableNumber: number, rating: number, comment: string) => {
    if (usingCloud && supabase && restaurantId) {
      supabase
        .from("reviews")
        .insert({ restaurant_id: restaurantId, dish_id: dishId, table_number: tableNumber, rating, comment })
        .then();
    } else {
      const review: Review = {
        id: `rv${Date.now()}_${localIdCounter++}`,
        dishId,
        tableNumber,
        rating,
        comment,
        createdAt: Date.now(),
      };
      setLocal((prev) => [review, ...prev]);
    }
  };

  return { reviews, addReview };
}
