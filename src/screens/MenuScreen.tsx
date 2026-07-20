import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Dish, TagKey } from "../data/menu";
import { DishCard } from "../components/DishCard";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";

const FILTER_KEYS: (TagKey | "all")[] = ["all", "popular", "spicy", "lowCalorie", "vegan", "beverage"];
const CATEGORY_KEY: Record<Dish["category"], TranslationKey> = {
  Main: "menu_category_main",
  Starter: "menu_category_starter",
  Beverage: "menu_category_beverage",
  Side: "menu_category_side",
};

export function MenuScreen() {
  const { menu } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TagKey | "all">("all");

  const filtered = useMemo(() => {
    return menu.filter((d) => {
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || d.tags.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [menu, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const d of filtered) {
      const list = map.get(d.category) ?? [];
      list.push(d);
      map.set(d.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF]">
        <h1 className="text-[19px] font-bold text-[#22201B] mb-2.5">{t("menu_title")}</h1>
        <div className="flex items-center gap-2 bg-white rounded-full px-3.5 py-2 border border-black/10 mb-2.5">
          <Search size={15} className="text-[#B0A794]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("menu_search_placeholder")}
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#B0A794] text-[#22201B]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                filter === key ? "bg-[#2D5A3D] text-white" : "bg-white text-[#5C5240] border border-black/10"
              }`}
            >
              {key === "all" ? t("menu_filter_all") : t(`tag_${key}` as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {grouped.length === 0 && (
          <p className="text-center text-[13px] text-[#B0A794] mt-10">{t("menu_no_results")}</p>
        )}
        {grouped.map(([category, dishes]) => (
          <div key={category} className="mb-5">
            <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-2">
              {t(CATEGORY_KEY[category as Dish["category"]])}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {dishes.map((d) => (
                <DishCard key={d.id} dish={d} variant="grid" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
