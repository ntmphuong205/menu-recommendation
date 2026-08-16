import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import { useI18n } from "../i18n/I18nContext";

/** Reverses vnpay_txn_ref() on the backend (order_group_id.hex) — VNPay's
 *  return redirect only carries its own vnp_* params, so this is how the
 *  page figures out which order it's looking at. */
function hexToOrderGroupId(hex: string): string | null {
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

type ResultState =
  | { kind: "loading" }
  | { kind: "waiting"; groupId: string }
  | { kind: "success"; pickupCode: string }
  | { kind: "failed" }
  | { kind: "invalid" };

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~1 minute — the IPN webhook is usually near-instant.

export function PickupResultScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<ResultState>({ kind: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = hexToOrderGroupId(params.get("vnp_TxnRef") ?? "");
    setState(groupId ? { kind: "waiting", groupId } : { kind: "invalid" });
  }, []);

  useEffect(() => {
    if (state.kind !== "waiting") return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await apiClient.getVnpayStatus(state.groupId);
        if (cancelled) return;
        if (res.status === "cancelled") {
          setState({ kind: "failed" });
          return;
        }
        if (res.status !== "awaiting_payment") {
          setState({ kind: "success", pickupCode: res.pickup_code ?? "" });
          return;
        }
      } catch {
        // Keep polling — a transient failure or the IPN just hasn't landed yet.
      }
      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (!cancelled) setState({ kind: "failed" });
        return;
      }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [state]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6] p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center flex flex-col items-center gap-3">
        {(state.kind === "loading" || state.kind === "waiting") && (
          <>
            <Loader2 size={40} className="text-[#2D5A3D] animate-spin" />
            <h1 className="text-[17px] font-bold text-[#22201B]">{t("pickup_result_waiting_title")}</h1>
            <p className="text-[13px] text-[#8A8272]">{t("pickup_result_waiting_desc")}</p>
          </>
        )}
        {state.kind === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#E5F3EA] flex items-center justify-center">
              <CheckCircle2 size={34} className="text-[#2D5A3D]" />
            </div>
            <h1 className="text-[17px] font-bold text-[#22201B]">{t("pickup_result_success_title")}</h1>
            <div className="mt-2 w-full bg-[#F3E9D2] rounded-2xl py-4">
              <p className="text-[11px] text-[#8A6B3F] uppercase tracking-wide">{t("pickup_result_code_label")}</p>
              <p className="text-[32px] font-bold text-[#22201B] tracking-widest">{state.pickupCode}</p>
            </div>
            <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("pickup_result_instructions")}</p>
          </>
        )}
        {(state.kind === "failed" || state.kind === "invalid") && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#F7E9E2] flex items-center justify-center">
              <XCircle size={34} className="text-[#B0553C]" />
            </div>
            <h1 className="text-[17px] font-bold text-[#22201B]">{t("pickup_result_failed_title")}</h1>
            <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("pickup_result_failed_desc")}</p>
          </>
        )}
        <a
          href="/"
          className="mt-3 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
        >
          {t("pickup_result_back_button")}
        </a>
      </div>
    </div>
  );
}
