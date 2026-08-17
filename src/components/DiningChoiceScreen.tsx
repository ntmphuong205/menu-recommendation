import { QrCode, ShoppingBag, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "./LangSwitcher";
import { RESTAURANT } from "../data/restaurant";

/** Shown once, right after the welcome splash, whenever the customer
 *  arrived without a table QR already scanned (mode=web — homepage or a
 *  general/shared QR). Makes the two real options explicit instead of
 *  silently defaulting to one: dine-in still requires scanning a physical
 *  table's own QR (there's no table id to attach an order to otherwise),
 *  while pickup can be done entirely from here. */
export function DiningChoiceScreen({ onChoose }: { onChoose: (choice: "dine_in" | "pickup") => void }) {
  const { mode } = useApp();
  const { t } = useI18n();

  if (mode !== "web") return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#F5F1E6] px-6 py-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <p className="text-[13px] font-semibold text-[#8A8272]">{RESTAURANT.name}</p>
        <LangSwitcher />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        <h1 className="text-[19px] font-bold text-[#22201B] mb-1 text-center text-balance">
          {t("dining_choice_title")}
        </h1>
        <p className="text-[12.5px] text-[#8A8272] text-center mb-4">{t("dining_choice_subtitle")}</p>

        <button
          onClick={() => onChoose("dine_in")}
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-black/5 shadow-sm p-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#DCEBFB] flex items-center justify-center shrink-0">
            <QrCode size={20} className="text-[#2A5C8A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#22201B]">{t("dining_choice_dine_in_title")}</p>
            <p className="text-[11.5px] text-[#8A8272] mt-0.5 leading-relaxed">{t("dining_choice_dine_in_desc")}</p>
          </div>
          <ArrowRight size={16} className="text-[#B0A794] shrink-0" />
        </button>

        <button
          onClick={() => onChoose("pickup")}
          className="flex items-center gap-3.5 bg-white rounded-2xl border border-black/5 shadow-sm p-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#E5F3EA] flex items-center justify-center shrink-0">
            <ShoppingBag size={20} className="text-[#2D5A3D]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#22201B]">{t("dining_choice_pickup_title")}</p>
            <p className="text-[11.5px] text-[#8A8272] mt-0.5 leading-relaxed">{t("dining_choice_pickup_desc")}</p>
          </div>
          <ArrowRight size={16} className="text-[#B0A794] shrink-0" />
        </button>
      </div>
    </div>
  );
}
