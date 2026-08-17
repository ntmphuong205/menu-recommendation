import { ShoppingBag } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

/** Shown on Menu/Chat when browsing via the general "web" QR (no table
 *  assigned) — nudges toward the remote pre-order + pickup flow (Cart),
 *  now the way to order without being physically at a table. */
export function OrderModeNotice() {
  const { mode, setActiveTab } = useApp();
  const { t } = useI18n();

  if (mode !== "web") return null;

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
