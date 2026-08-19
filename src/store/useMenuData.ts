import { useCallback } from "react";
import { apiClient, type ApiMenu } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";
import type { Dish, Pairing, SizeVariant, TagKey } from "../data/menu";

function fromApi(row: ApiMenu): Dish {
  return {
    id: row.id,
    name: row.name.en || row.name.ko || row.name.vi || "",
    names: { vi: row.name.vi || undefined, en: row.name.en || undefined, ko: row.name.ko || undefined },
    price: Number(row.price),
    currency: row.currency || "USD",
    description: row.desc.en || row.desc.ko || row.desc.vi || "",
    descriptions: { vi: row.desc.vi || undefined, ko: row.desc.ko || undefined },
    image: row.img,
    tags: (row.tags ?? []) as TagKey[],
    calories: row.calories ?? undefined,
    protein: row.protein ?? undefined,
    carbs: row.carbs ?? undefined,
    fat: row.fat ?? undefined,
    ingredientLines: row.ingredientLines?.length
      ? row.ingredientLines.map((l) => ({
          name: l.name,
          grams: l.grams,
          custom: l.custom as { calories: number; protein: number; carbs: number; fat: number } | undefined,
        }))
      : undefined,
    ingredients: (row.ingredientLines ?? []).map((l) => l.name),
    allergyNote: row.allergyNote.en || row.allergyNote.ko || row.allergyNote.vi || "",
    allergyNotes: { vi: row.allergyNote.vi || undefined, en: row.allergyNote.en || undefined, ko: row.allergyNote.ko || undefined },
    category: (row.category || "Main") as Dish["category"],
    soldOut: row.isSoldOut,
    prepTimeMinutes: row.prepTimeMinutes,
    pairings: row.pairings?.length
      ? row.pairings.map(
          (p): Pairing => ({
            dishId: p.menu_id,
            reason: p.reason.en || p.reason.ko || p.reason.vi || "",
            reasons: { vi: p.reason.vi || undefined, ko: p.reason.ko || undefined },
          })
        )
      : undefined,
    sizeVariants: row.sizeVariants?.length
      ? row.sizeVariants.map(
          (v): SizeVariant => ({
            id: v.id,
            label: v.label,
            labels: {
              vi: v.labels?.vi || undefined,
              en: v.labels?.en || undefined,
              ko: v.labels?.ko || undefined,
            },
            price: Number(v.price),
            calories: v.calories ?? undefined,
          })
        )
      : undefined,
  };
}

function toPayload(dish: Dish) {
  return {
    name: { en: dish.name, ko: dish.names?.ko ?? "", vi: dish.names?.vi ?? "" },
    price: dish.price,
    currency: dish.currency || "USD",
    desc: { en: dish.description, ko: dish.descriptions?.ko ?? "", vi: dish.descriptions?.vi ?? "" },
    category: dish.category,
    tags: dish.tags,
    img: dish.image,
    isSoldOut: dish.soldOut ?? false,
    calories: dish.calories ?? null,
    protein: dish.protein ?? null,
    carbs: dish.carbs ?? null,
    fat: dish.fat ?? null,
    ingredientLines: dish.ingredientLines ?? [],
    allergyNote: { en: dish.allergyNote, ko: "", vi: "" },
    prepTimeMinutes: dish.prepTimeMinutes ?? 10,
    pairings: (dish.pairings ?? []).map((p) => ({
      menu_id: p.dishId,
      reason: { en: p.reason, ko: p.reasons?.ko ?? "", vi: p.reasons?.vi ?? "" },
    })),
    sizeVariants: dish.sizeVariants ?? [],
  };
}

export interface MenuData {
  menu: Dish[];
  addDish: (dish: Dish) => void;
  updateDish: (id: string, patch: Partial<Dish>) => void;
  deleteDish: (id: string) => void;
}

export function useMenuData(): MenuData {
  const fetcher = useCallback(() => apiClient.getMenus(), []);
  const rows = usePollingData(fetcher);
  const menu = (rows ?? []).map(fromApi);

  const addDish = (dish: Dish) => {
    apiClient.createMenu(toPayload(dish)).catch((err) => console.error("[MenuPilot] Failed to add dish", err));
  };

  const updateDish = (id: string, patch: Partial<Dish>) => {
    const current = menu.find((d) => d.id === id);
    if (!current) return;
    apiClient
      .updateMenu(id, toPayload({ ...current, ...patch }))
      .catch((err) => console.error("[MenuPilot] Failed to update dish", err));
  };

  const deleteDish = (id: string) => {
    apiClient.deleteMenu(id).catch((err) => console.error("[MenuPilot] Failed to delete dish", err));
  };

  return { menu, addDish, updateDish, deleteDish };
}
