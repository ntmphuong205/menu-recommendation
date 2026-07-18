import { useState } from "react";
import { X, Minus, Plus, Flame, TriangleAlert } from "lucide-react";
import { TagPill } from "./TagPill";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { getDishDescription } from "../data/menu";

export function DishSheet() {
  const { selectedDishId, setSelectedDishId, addToCart, findDish } = useApp();
  const { t, lang } = useI18n();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!selectedDishId) return null;
  const dish = findDish(selectedDishId);
  if (!dish) return null;

  const close = () => {
    setSelectedDishId(null);
    setQty(1);
    setAdded(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-[#FBF7EF] rounded-t-[32px] animate-sheet-up max-h-[88%] overflow-y-auto">
        <div className="sticky top-0 bg-[#FBF7EF] pt-3 pb-1 flex justify-center z-10">
          <div className="w-9 h-1 rounded-full bg-black/15" />
        </div>
        <button
          onClick={close}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center z-10"
        >
          <X size={16} className="text-[#22201B]" />
        </button>

        <div className="h-52 w-full overflow-hidden">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-5 pb-8">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[19px] font-bold text-[#22201B] leading-tight">{dish.name}</h2>
            <span className="text-[18px] font-bold text-[#2D5A3D] shrink-0">${dish.price.toFixed(2)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {dish.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>

          <p className="text-[13.5px] text-[#5C5240] leading-relaxed mt-3">{getDishDescription(dish, lang)}</p>

          {dish.calories && (
            <div className="flex items-center gap-1.5 mt-3 text-[12.5px] text-[#8A6B3F] bg-[#F3E9D2] px-3 py-2 rounded-xl">
              <Flame size={14} />
              <span className="font-medium">
                {dish.calories} kcal{dish.detail ? ` · ${dish.detail}` : ""}
              </span>
            </div>
          )}

          <div className="mt-4">
            <p className="text-[12.5px] font-semibold text-[#22201B] mb-1.5">{t("dish_ingredients")}</p>
            <p className="text-[13px] text-[#5C5240]">{dish.ingredients.join(", ")}</p>
          </div>

          <div className="flex items-start gap-1.5 mt-3 text-[12px] text-[#8A5A3F] bg-[#F7E9E2] px-3 py-2 rounded-xl">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            <span>{dish.allergyNote}</span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center gap-3 bg-white border border-black/10 rounded-full px-3 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-6 h-6 flex items-center justify-center text-[#2D5A3D]"
              >
                <Minus size={16} />
              </button>
              <span className="text-[14px] font-semibold w-4 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-6 h-6 flex items-center justify-center text-[#2D5A3D]"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                addToCart(dish.id, qty);
                setAdded(true);
                setTimeout(close, 700);
              }}
              className="flex-1 bg-[#2D5A3D] text-white font-semibold text-[14px] py-3 rounded-full active:scale-[0.98] transition-transform disabled:opacity-70"
              disabled={added}
            >
              {added ? t("dish_added") : `${t("dish_add_to_cart")} · $${(dish.price * qty).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
