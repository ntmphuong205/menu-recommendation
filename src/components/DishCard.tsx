import { Plus } from "lucide-react";
import type { Dish } from "../data/menu";
import { TagPill } from "./TagPill";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

export function DishCard({ dish, variant = "chat" }: { dish: Dish; variant?: "chat" | "grid" }) {
  const { addToCart, setSelectedDishId } = useApp();
  const { t } = useI18n();

  if (variant === "grid") {
    return (
      <button
        onClick={() => setSelectedDishId(dish.id)}
        className="text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 active:scale-[0.98] transition-transform"
      >
        <div className="h-24 w-full overflow-hidden bg-[#EFE9D8]">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="p-2.5">
          <p className="text-[13px] font-semibold text-[#22201B] leading-tight line-clamp-1">{dish.name}</p>
          <p className="text-[12px] text-[#2D5A3D] font-bold mt-0.5">${dish.price.toFixed(2)}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {dish.tags.slice(0, 2).map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 w-[230px] shrink-0">
      <button onClick={() => setSelectedDishId(dish.id)} className="block w-full h-32 overflow-hidden bg-[#EFE9D8]">
        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" loading="lazy" />
      </button>
      <div className="p-3">
        <p className="text-[14px] font-semibold text-[#22201B] leading-tight">{dish.name}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {dish.tags.slice(0, 3).map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[15px] font-bold text-[#2D5A3D]">${dish.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(dish.id, 1)}
            className="flex items-center gap-1 bg-[#2D5A3D] text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={13} strokeWidth={3} />
            {t("dish_order")}
          </button>
        </div>
      </div>
    </div>
  );
}
