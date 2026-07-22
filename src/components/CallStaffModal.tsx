import { useState } from "react";
import { X, Bell, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";

const REASON_KEYS = ["call_reason_help", "call_reason_change_order", "call_reason_bill"] as const;

export function CallStaffModal({ onClose }: { onClose: () => void }) {
  const { callStaff, tableNumber } = useApp();
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  const send = (reason: string) => {
    callStaff(reason);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-sm p-5 pb-8 sm:pb-5 animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
          <X size={14} className="text-[#22201B]" />
        </button>

        {sent ? (
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <div className="w-14 h-14 rounded-full bg-[#E5F3EA] flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#2D5A3D]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#22201B]">{t("call_sent_title")}</h2>
            <p className="text-[13px] text-[#8A8272]">{t("call_sent_desc", { table: tableNumber })}</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              {t("call_close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#2D5A3D] flex items-center justify-center">
                <Bell size={16} className="text-white" />
              </div>
              <h2 className="text-[16px] font-bold text-[#22201B]">{t("info_call_staff")}</h2>
            </div>
            <div className="flex flex-col gap-2">
              {REASON_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => send(t(key))}
                  className="text-left px-4 py-3 rounded-xl bg-[#F5F1E6] text-[13.5px] font-medium text-[#22201B] active:scale-[0.98] transition-transform"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
