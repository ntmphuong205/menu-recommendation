import { Clock3 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

/** Shown whenever the store's manual open/closed switch (Owner > Orders or
 *  Store Settings) is off — on every screen a customer could try to order
 *  from, regardless of table/web mode. Purely informational; the actual
 *  ordering block is enforced separately via isStoreOpen in canOrder checks
 *  and server-side in create_order. */
export function StoreClosedBanner() {
  const { isStoreOpen } = useApp();
  const { t } = useI18n();

  if (isStoreOpen) return null;

  return (
    <div className="mx-4 mt-2 flex items-start gap-2 bg-[#F7E9E2] border border-[#B0553C]/20 rounded-xl px-3 py-2.5">
      <Clock3 size={15} className="text-[#B0553C] shrink-0 mt-0.5" />
      <p className="text-[11.5px] text-[#B0553C] leading-snug">{t("store_status_closed_banner")}</p>
    </div>
  );
}
