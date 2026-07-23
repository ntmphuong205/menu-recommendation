import { useState } from "react";
import { Plus, Minus, Check, Star } from "lucide-react";
import type { Dish } from "../data/menu";
import { TagPill } from "./TagPill";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

export function DishCard({ dish, variant = "chat" }: { dish: Dish; variant?: "chat" | "grid" }) {
  const { setSelectedDishId, addToCart, getDishRating } = useApp();
  const { t } = useI18n();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const soldOut = !!dish.soldOut;
  const rating = getDishRating(dish.id);

  if (variant === "grid") {
    return (
      <button
        onClick={() => setSelectedDishId(dish.id)}
        className={`text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 active:scale-[0.98] transition-transform relative ${soldOut ? "opacity-60" : ""}`}
      >
        <div className="h-24 w-full overflow-hidden bg-[#EFE9D8] relative">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
          {soldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold uppercase tracking-wide">{t("dish_sold_out")}</span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-[13px] font-semibold text-[#22201B] leading-tight line-clamp-1">{dish.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[12px] text-[#2D5A3D] font-bold">${dish.price.toFixed(2)}</p>
            {rating.count > 0 && (
              <span className="flex items-center gap-0.5 text-[10.5px] text-[#8A8272]">
                <Star size={10} className="text-[#E0A83C] fill-[#E0A83C]" />
                {rating.average.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {dish.tags.slice(0, 2).map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 w-[230px] shrink-0 ${soldOut ? "opacity-60" : ""}`}>
      <button onClick={() => setSelectedDishId(dish.id)} className="block w-full h-32 overflow-hidden bg-[#EFE9D8] relative">
        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
        {soldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-[11px] font-bold uppercase tracking-wide">{t("dish_sold_out")}</span>
          </div>
        )}
      </button>
      <div className="p-3">
        <p className="text-[14px] font-semibold text-[#22201B] leading-tight">{dish.name}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {dish.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[15px] font-bold text-[#2D5A3D]">${dish.price.toFixed(2)}</span>
          {!soldOut && !added && (
            <div className="flex items-center gap-2 bg-[#F5F1E6] rounded-full px-2 py-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
              >
                <Minus size={12} />
              </button>
              <span className="text-[12px] font-semibold w-3 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            addToCart(dish.id, qty);
            setAdded(true);
          }}
          disabled={soldOut || added}
          className="w-full mt-2 flex items-center justify-center gap-1 bg-[#2D5A3D] text-white text-[12px] font-semibold py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-50"
        >
          {added ? <Check size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
          {soldOut ? t("dish_sold_out") : added ? t("dish_added") : t("dish_add")}
        </button>
      </div>
    </div>
  );
}
