import { ShoppingBag, QrCode } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

/** Shown on Menu/Chat when browsing via the general "web" QR (no table
 *  assigned). Behavior depends on which choice the customer made on
 *  DiningChoiceScreen: "pickup" nudges toward the remote pre-order +
 *  pay-ahead flow (Cart); "dine_in" (or not yet chosen) restores the
 *  original restriction — actually ordering still requires scanning a
 *  table's own QR code. */
export function OrderModeNotice() {
  const { mode, webOrderIntent, setActiveTab, resetWebOrderIntent } = useApp();
  const { t } = useI18n();

  if (mode !== "web") return null;

  if (webOrderIntent === "pickup") {
    return (
      <button
        onClick={() => setActiveTab("cart")}
        className="mx-4 mt-2 flex items-start gap-2 bg-[#E5F3EA] border border-[#2D5A3D]/20 rounded-xl px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
      >
        <ShoppingBag size={15} className="text-[#2D5A3D] shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-[#2D5A3D] leading-snug">{t("order_mode_banner")}</p>
      </button>
    );
  }

  // dine_in chose to browse only, on purpose — but this is also the only
  // place they'd discover pickup exists as an alternative if they picked
  // dine_in by mistake, so make it a way back to DiningChoiceScreen instead
  // of a dead end.
  return (
    <button
      onClick={resetWebOrderIntent}
      className="mx-4 mt-2 flex items-start gap-2 bg-[#FDECC8] border border-[#8A6B1F]/20 rounded-xl px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
    >
      <QrCode size={15} className="text-[#8A6B1F] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] text-[#8A6B1F] leading-snug">{t("reservation_web_mode_blocked")}</p>
        <p className="text-[11px] text-[#8A6B1F] underline mt-0.5">{t("order_mode_switch_to_pickup")}</p>
      </div>
    </button>
  );
}
