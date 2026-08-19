import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useStoreData } from "../store/useStoreData";
import { useI18n } from "../i18n/I18nContext";

/** A same-day "we're closed, stop accepting orders" switch — separate from
 *  Store Settings' opening/closing hours (those only bound what pickup time
 *  a customer can schedule). Flips instantly, no separate Save step, since
 *  this is meant for "we just found out we're closing today", not planning. */
export function StoreStatusToggle() {
  const { store } = useApp();
  const { updateStoreStatus } = useStoreData();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  if (!store) return null;
  const isOpen = store.is_open;

  const toggle = async () => {
    setSaving(true);
    try {
      await updateStoreStatus(!isOpen);
    } catch {
      alert(t("store_status_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
        isOpen ? "bg-[#E5F3EA] text-[#2D5A3D]" : "bg-[#F7E9E2] text-[#B0553C]"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-[#2D5A3D]" : "bg-[#B0553C]"}`} />
      {isOpen ? t("store_status_open") : t("store_status_closed")}
      <span className="text-[11px] font-normal opacity-70">
        {isOpen ? t("store_status_tap_to_close") : t("store_status_tap_to_open")}
      </span>
    </button>
  );
}
