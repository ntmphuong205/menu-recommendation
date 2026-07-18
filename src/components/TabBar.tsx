import { MessageCircle, UtensilsCrossed, ShoppingBag, Store } from "lucide-react";
import { useApp, type TabKey } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";

const TABS: { key: TabKey; labelKey: TranslationKey; icon: typeof MessageCircle }[] = [
  { key: "chat", labelKey: "tab_chat", icon: MessageCircle },
  { key: "menu", labelKey: "tab_menu", icon: UtensilsCrossed },
  { key: "cart", labelKey: "tab_cart", icon: ShoppingBag },
  { key: "info", labelKey: "tab_info", icon: Store },
];

export function TabBar() {
  const { activeTab, setActiveTab, totalItems } = useApp();
  const { t } = useI18n();

  return (
    <div className="shrink-0 border-t border-black/5 bg-white/90 backdrop-blur-xl px-2 pt-2 pb-7">
      <div className="flex items-center justify-around">
        {TABS.map(({ key, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={active ? "text-[#2D5A3D]" : "text-[#9B9284]"}
                />
                {key === "cart" && totalItems > 0 && (
                  <span className="animate-pop absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E0793C] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {totalItems}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${active ? "text-[#2D5A3D]" : "text-[#9B9284]"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
