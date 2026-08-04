import { QrCode } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

/** Shown on Menu/Chat when browsing via the general "web" QR (no table
 *  assigned) — customers can look around and ask the AI, but ordering
 *  requires scanning the QR code printed on their own table. */
export function OrderModeNotice() {
  const { mode, setActiveTab } = useApp();
  const { t } = useI18n();

  if (mode !== "web") return null;

  return (
    <button
      onClick={() => setActiveTab("reserve")}
      className="mx-4 mt-2 flex items-start gap-2 bg-[#FDECC8] border border-[#E0A83C]/30 rounded-xl px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
    >
      <QrCode size={15} className="text-[#8A6B1F] shrink-0 mt-0.5" />
      <p className="text-[11.5px] text-[#8A6B1F] leading-snug">{t("order_mode_banner")}</p>
    </button>
  );
}
