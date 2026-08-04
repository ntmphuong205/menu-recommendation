import { useState } from "react";
import { Armchair, MessageCircle, UtensilsCrossed } from "lucide-react";
import { FloorPlanView } from "../components/FloorPlanView";
import { ReservationSheet } from "../components/ReservationSheet";
import { LangSwitcher } from "../components/LangSwitcher";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import type { ApiTable } from "../lib/apiClient";

/**
 * The landing screen for the general "web" QR (see TableQrView): the whole
 * point of scanning that code — as opposed to a table's own QR — is to
 * reserve a table before being seated, so this screen leads with that
 * instead of burying it inside Info.
 */
export function ReserveScreen() {
  const { tables, setActiveTab, store } = useApp();
  const { t, lang } = useI18n();
  const [reservingTable, setReservingTable] = useState<ApiTable | null>(null);
  const storeName = store?.name_i18n[lang] || store?.name;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="relative bg-gradient-to-br from-[#2D5A3D] to-[#1F3D2B] px-4 pt-4 pb-5">
          <div className="absolute top-4 right-4">
            <LangSwitcher dark />
          </div>
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-2.5">
            <Armchair size={20} className="text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-white leading-tight">{t("reserve_screen_title")}</h1>
          <p className="text-[12.5px] text-white/80 mt-1 leading-relaxed max-w-[30ch]">
            {storeName ? t("reserve_screen_desc", { store: storeName }) : t("reserve_screen_desc_generic")}
          </p>
        </div>

        <div className="px-4 py-4">
          {tables.length > 0 ? (
            <FloorPlanView tables={tables} onSelect={setReservingTable} />
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 p-8 text-center text-[13px] text-[#B0A794]">
              {t("reserve_screen_no_tables")}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("menu")}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-[#22201B] font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform"
            >
              <UtensilsCrossed size={15} />
              {t("reserve_screen_browse_menu")}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-[#22201B] font-semibold text-[13px] py-3 rounded-full active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={15} />
              {t("info_ask_chat")}
            </button>
          </div>
        </div>
      </div>

      {reservingTable && <ReservationSheet table={reservingTable} onClose={() => setReservingTable(null)} />}
    </div>
  );
}
