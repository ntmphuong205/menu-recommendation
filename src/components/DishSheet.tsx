import { useState } from "react";
import { X, Minus, Plus, Flame, TriangleAlert, Clock3, Sparkles } from "lucide-react";
import { TagPill } from "./TagPill";
import { ReviewSection } from "./ReviewSection";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { getDishDescription, getPairingReason } from "../data/menu";

function PairingRow({ dishId, reason }: { dishId: string; reason: string }) {
  const { findDish, addToCart, setSelectedDishId } = useApp();
  const { t } = useI18n();
  const [added, setAdded] = useState(false);
  const paired = findDish(dishId);
  if (!paired || paired.soldOut) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedDishId(paired.id)}
      onKeyDown={(e) => e.key === "Enter" && setSelectedDishId(paired.id)}
      className="w-full flex items-center gap-2.5 bg-white rounded-xl border border-black/5 p-2 text-left cursor-pointer"
    >
      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#EFE9D8]">
        <img src={paired.image} alt={paired.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-[#22201B] leading-tight">{paired.name}</p>
        <p className="text-[11px] text-[#8A8272] leading-snug line-clamp-2">{reason}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          addToCart(paired.id, 1);
          setAdded(true);
        }}
        disabled={added}
        className="shrink-0 flex items-center gap-1 bg-[#2D5A3D] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-50"
      >
        {added ? t("dish_added") : t("dish_add")}
      </button>
    </div>
  );
}

export function DishSheet() {
  const { selectedDishId, setSelectedDishId, addToCart, findDish } = useApp();
  const { t, lang } = useI18n();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  if (!selectedDishId) return null;
  const dish = findDish(selectedDishId);
  if (!dish) return null;

  const close = () => {
    setSelectedDishId(null);
    setQty(1);
    setNote("");
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

          {dish.soldOut && (
            <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wide text-white bg-[#B0553C] px-2.5 py-1 rounded-full">
              {t("dish_sold_out")}
            </span>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {dish.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>

          <p className="text-[13.5px] text-[#5C5240] leading-relaxed mt-3">{getDishDescription(dish, lang)}</p>

          {dish.calories !== undefined && (
            <div className="mt-3 bg-[#F3E9D2] rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#8A6B3F] font-semibold mb-2">
                <Flame size={14} />
                {dish.calories} kcal
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{dish.protein ?? 0}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("nutrition_protein")}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{dish.carbs ?? 0}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("nutrition_carbs")}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#22201B]">{dish.fat ?? 0}g</p>
                  <p className="text-[10px] text-[#8A6B3F]">{t("nutrition_fat")}</p>
                </div>
              </div>
            </div>
          )}

          {dish.prepTimeMinutes !== undefined && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#8A8272]">
              <Clock3 size={12} />
              {t("nutrition_prep_time")}: ~{dish.prepTimeMinutes} {t("nutrition_minutes")}
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

          {dish.pairings && dish.pairings.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#22201B] mb-1.5">
                <Sparkles size={13} className="text-[#E0A83C]" />
                {t("dish_pairs_with")}
              </p>
              <div className="flex flex-col gap-1.5">
                {dish.pairings.map((p) => (
                  <PairingRow key={p.dishId} dishId={p.dishId} reason={getPairingReason(p, lang)} />
                ))}
              </div>
            </div>
          )}

          <ReviewSection dishId={dish.id} />

          <label className="block mt-4">
            <p className="text-[12px] font-semibold text-[#5C5240] mb-1">{t("dish_note_label")}</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("dish_note_placeholder")}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-[13px] text-[#22201B] outline-none focus:border-[#2D5A3D]"
            />
          </label>

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
                addToCart(dish.id, qty, note.trim() || undefined);
                setAdded(true);
                setTimeout(close, 700);
              }}
              className="flex-1 bg-[#2D5A3D] text-white font-semibold text-[14px] py-3 rounded-full active:scale-[0.98] transition-transform disabled:opacity-50"
              disabled={added || dish.soldOut}
            >
              {dish.soldOut ? t("dish_sold_out") : added ? t("dish_added") : `${t("dish_add_to_cart")} · $${(dish.price * qty).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
