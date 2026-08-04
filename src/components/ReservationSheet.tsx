import { useState } from "react";
import { X, Users, CheckCircle2, ImageOff } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { isTerrace, localizeTableFeature } from "./FloorPlanView";
import type { ApiTable } from "../lib/apiClient";

const STATUS_DOT: Record<ApiTable["status"], string> = {
  available: "bg-[#4CAF7D]",
  soon: "bg-[#E0A83C]",
  reserved: "bg-[#5B7FA6]",
  occupied: "bg-[#C97456]",
};

function PhotoCard({ label, src }: { label: string; src: string }) {
  const { t } = useI18n();
  return (
    <div className="bg-[#F5F1E6] rounded-xl overflow-hidden flex flex-col">
      <div className="flex-1 min-h-[72px] flex items-center justify-center">
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#B0A794] py-3">
            <ImageOff size={16} />
            <span className="text-[9.5px] text-center px-2">{t("reservation_no_photo")}</span>
          </div>
        )}
      </div>
      <p className="text-[10.5px] font-semibold text-[#5C5240] px-2.5 py-1.5 bg-white">{label}</p>
    </div>
  );
}

export function ReservationSheet({ table, onClose }: { table: ApiTable; onClose: () => void }) {
  const { requestReservation, mode } = useApp();
  const { t } = useI18n();
  const [partySize, setPartySize] = useState(2);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await requestReservation(table.id, partySize);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const feature = isTerrace(table)
    ? t("table_terrace")
    : localizeTableFeature(table.view || table.tag || "—", t);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-[#FBF7EF] rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto p-5 pb-8 sm:pb-5 animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-black/10 rounded-full mx-auto mb-3 sm:hidden" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
          <X size={14} className="text-[#22201B]" />
        </button>

        {sent ? (
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <div className="w-14 h-14 rounded-full bg-[#E5F3EA] flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#2D5A3D]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#22201B]">{t("reservation_submitted")}</h2>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              {t("call_close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4 pr-8">
              <div>
                <p className="text-[12px] font-bold text-[#2D5A3D] mb-0.5">{feature}</p>
                <h2 className="text-[19px] font-bold text-[#22201B]">{t("reservation_title", { table: table.id })}</h2>
              </div>
              <span className="flex items-center gap-1 bg-white shadow-sm px-2.5 py-1.5 rounded-xl text-[12px] font-bold text-[#2D5A3D] shrink-0">
                <Users size={12} />
                {t("reservation_up_to", { count: table.capacity || 4 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="bg-white rounded-xl p-3 border border-black/5">
                <p className="text-[10.5px] text-[#8A8272] mb-1">{t("reservation_status_label")}</p>
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#22201B]">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[table.status]}`} />
                  {t(`table_status_${table.status}`)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-black/5">
                <p className="text-[10.5px] text-[#8A8272] mb-1">{t("reservation_feature_label")}</p>
                <p className="text-[13px] font-bold text-[#22201B] truncate">{feature}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <PhotoCard label={t("reservation_table_photo")} src={table.table_image} />
              <PhotoCard label={t("reservation_view_photo")} src={table.view_image} />
            </div>

            {mode === "web" ? (
              <p className="text-[12.5px] text-[#B0553C] bg-[#F7E9E2] rounded-xl p-3 text-center">
                {t("reservation_web_mode_blocked")}
              </p>
            ) : (
              <>
                {table.status !== "available" && (
                  <p className="text-[11.5px] text-[#8A6B1F] bg-[#FDECC8] rounded-xl p-2.5 mb-3">
                    {t("reservation_waiting_note")}
                  </p>
                )}
                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-black/5 mb-4">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5C5240]">
                    <Users size={13} />
                    {t("reservation_party_size")}
                  </span>
                  <div className="flex items-center gap-3 bg-[#F5F1E6] rounded-full px-2.5 py-1.5">
                    <button
                      onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#2D5A3D] font-bold"
                    >
                      −
                    </button>
                    <span className="text-[14px] font-semibold w-5 text-center">{partySize}</span>
                    <button
                      onClick={() => setPartySize((n) => Math.min(table.capacity || 20, n + 1))}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#2D5A3D] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full bg-[#2D5A3D] text-white font-semibold text-[13.5px] py-3.5 rounded-full active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {t("reservation_request_button")}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
