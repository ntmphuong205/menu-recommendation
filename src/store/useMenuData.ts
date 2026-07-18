import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { usePersistentState } from "./usePersistentState";
import { DEFAULT_MENU, type Dish } from "../data/menu";

interface MenuRow {
  id: string;
  name: string;
  price: number;
  description: string;
  descriptions: Partial<Record<"vi" | "en" | "ko", string>> | null;
  image: string;
  tags: Dish["tags"];
  calories: number | null;
  detail: string | null;
  ingredients: string[];
  allergy_note: string;
  category: Dish["category"];
  sold_out: boolean;
}

function fromRow(row: MenuRow): Dish {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    descriptions: row.descriptions ?? undefined,
    image: row.image,
    tags: row.tags,
    calories: row.calories ?? undefined,
    detail: row.detail ?? undefined,
    ingredients: row.ingredients,
    allergyNote: row.allergy_note,
    category: row.category,
    soldOut: row.sold_out,
  };
}

function toRow(restaurantId: string, dish: Dish) {
  return {
    id: dish.id,
    restaurant_id: restaurantId,
    name: dish.name,
    price: dish.price,
    description: dish.description,
    descriptions: dish.descriptions ?? {},
    image: dish.image,
    tags: dish.tags,
    calories: dish.calories ?? null,
    detail: dish.detail ?? null,
    ingredients: dish.ingredients,
    allergy_note: dish.allergyNote,
    category: dish.category,
    sold_out: dish.soldOut ?? false,
  };
}

export interface MenuData {
  menu: Dish[];
  addDish: (dish: Dish) => void;
  updateDish: (id: string, patch: Partial<Dish>) => void;
  deleteDish: (id: string) => void;
}

export function useMenuData(restaurantId: string | null): MenuData {
  const [local, setLocal] = usePersistentState<Dish[]>("fb_menu", DEFAULT_MENU);
  const [cloud, setCloud] = useState<Dish[] | null>(null);
  const usingCloud = isSupabaseConfigured && restaurantId != null;

  useEffect(() => {
    if (!usingCloud || !supabase) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase!.from("menu_items").select("*").eq("restaurant_id", restaurantId);
      if (cancelled) return;
      if (data && data.length === 0) {
        // First time this restaurant has been opened: seed from the app's default menu.
        await supabase!.from("menu_items").insert(DEFAULT_MENU.map((d) => toRow(restaurantId!, d)));
        const { data: seeded } = await supabase!.from("menu_items").select("*").eq("restaurant_id", restaurantId);
        if (!cancelled) setCloud((seeded ?? []).map(fromRow));
      } else {
        setCloud((data ?? []).map(fromRow));
      }
    };

    refresh();
    const channel = supabase
      .channel(`menu-items-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items", filter: `restaurant_id=eq.${restaurantId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [usingCloud, restaurantId]);

  const menu = usingCloud ? cloud ?? [] : local;

  const addDish = (dish: Dish) => {
    if (usingCloud && supabase && restaurantId) {
      supabase.from("menu_items").insert(toRow(restaurantId, dish)).then();
    } else {
      setLocal((prev) => [...prev, dish]);
    }
  };

  const updateDish = (id: string, patch: Partial<Dish>) => {
    if (usingCloud && supabase && restaurantId) {
      const current = (cloud ?? []).find((d) => d.id === id);
      if (!current) return;
      supabase
        .from("menu_items")
        .update(toRow(restaurantId, { ...current, ...patch }))
        .eq("id", id)
        .then();
    } else {
      setLocal((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    }
  };

  const deleteDish = (id: string) => {
    if (usingCloud && supabase) {
      supabase.from("menu_items").delete().eq("id", id).then();
    } else {
      setLocal((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return { menu, addDish, updateDish, deleteDish };
}
