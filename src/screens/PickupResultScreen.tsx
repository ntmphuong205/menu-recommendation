import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient, type ApiPaymentMethod } from "../lib/apiClient";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { vietQrImageUrl } from "../lib/vietqr";
import { getStoreSlug } from "../lib/storeSlug";

/** Reverses vnpay_txn_ref() on the backend (order_group_id.hex) — VNPay's
 *  return redirect only carries its own vnp_* params, so this is how the
 *  page figures out which order it's looking at when there's no
 *  order_group_id param directly (the bank-transfer flow navigates here
 *  with one already, since we control that redirect ourselves). */
function hexToOrderGroupId(hex: string): string | null {
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

interface PaymentSnapshot {
  status: string;
  pickupCode: string | null;
  pickupTime: string | null;
  paymentMethod: ApiPaymentMethod | null;
  amountVnd: number;
}

type ResultState =
  | { kind: "loading" }
  | { kind: "waiting"; groupId: string; snapshot: PaymentSnapshot | null }
  | { kind: "success"; pickupCode: string; pickupTime: string | null }
  | { kind: "failed" }
  | { kind: "invalid" };

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100; // bank transfer waits on a human, not a webhook — allow ~5 minutes.

export function PickupResultScreen() {
  const { t } = useI18n();
  const { store } = useApp();
  const [state, setState] = useState<ResultState>({ kind: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("order_group_id") || hexToOrderGroupId(params.get("vnp_TxnRef") ?? "");
    setState(groupId ? { kind: "waiting", groupId, snapshot: null } : { kind: "invalid" });
  }, []);

  useEffect(() => {
    if (state.kind !== "waiting") return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await apiClient.getPaymentStatus(state.groupId);
        if (cancelled) return;
        if (res.status === "cancelled") {
          setState({ kind: "failed" });
          return;
        }
        if (res.status !== "awaiting_payment") {
          setState({ kind: "success", pickupCode: res.pickup_code ?? "", pickupTime: res.pickup_time });
          return;
        }
        setState({
          kind: "waiting",
          groupId: state.groupId,
          snapshot: {
            status: res.status,
            pickupCode: res.pickup_code,
            pickupTime: res.pickup_time,
            paymentMethod: res.payment_method,
            amountVnd: res.amount_vnd,
          },
        });
      } catch {
        // Keep polling — a transient failure or confirmation just hasn't landed yet.
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
    // Only re-run when the groupId itself changes, not on every snapshot
    // update poll() produces — otherwise this would restart the poll loop
    // every 3s instead of scheduling its own next tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind === "waiting" ? state.groupId : null]);

  // Back to this store's Cart tab specifically — not the bare "/", which
  // (having no ?store= of its own) would land on the multi-restaurant
  // directory instead of back into the order the customer just paid for.
  const backHref = (() => {
    const params = new URLSearchParams({ mode: "web", tab: "cart" });
    const slug = getStoreSlug();
    if (slug) params.set("store", slug);
    return `/?${params.toString()}`;
  })();

  const bankSnapshot =
    state.kind === "waiting" && state.snapshot?.paymentMethod === "bank_transfer" ? state.snapshot : null;

  // The auto-generated QR wins whenever it can be built — it's the only
  // one that embeds this order's exact amount and "DH <pickup_code>" note,
  // which is how staff match an incoming bank transfer back to an order.
  // A static owner-uploaded image can't carry either, so it's only a
  // fallback for stores that haven't filled in bank_bin/account_number.
  const qrImageSrc =
    (bankSnapshot && store?.bank_bin && store?.bank_account_number
      ? vietQrImageUrl({
          bankBin: store.bank_bin,
          accountNumber: store.bank_account_number,
          accountHolder: store.bank_account_holder,
          amountVnd: bankSnapshot.amountVnd,
          note: `DH ${bankSnapshot.pickupCode ?? ""}`,
        })
      : null) || store?.bank_qr_image;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E6] p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center flex flex-col items-center gap-3">
        {state.kind === "loading" && <Loader2 size={40} className="text-[#2D5A3D] animate-spin" />}

        {state.kind === "waiting" && !bankSnapshot && (
          <>
            <Loader2 size={40} className="text-[#2D5A3D] animate-spin" />
            <h1 className="text-[17px] font-bold text-[#22201B]">{t("pickup_result_waiting_title")}</h1>
            <p className="text-[13px] text-[#8A8272]">{t("pickup_result_waiting_desc")}</p>
          </>
        )}

        {bankSnapshot && qrImageSrc && (
          <>
            <h1 className="text-[17px] font-bold text-[#22201B]">{t("pickup_bank_transfer_title")}</h1>
            <img src={qrImageSrc} alt="Bank transfer QR" className="w-56 h-auto rounded-xl border border-black/5" />
            <div className="w-full flex flex-col gap-1.5 text-left bg-[#F5F1E6] rounded-xl p-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-[#8A8272]">{t("pickup_bank_transfer_amount")}</span>
                <span className="font-bold text-[#22201B]">
                  {Math.round(bankSnapshot.amountVnd).toLocaleString()} VND
                </span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-[#8A8272]">{t("pickup_bank_transfer_note")}</span>
                <span className="font-bold text-[#22201B]">DH {bankSnapshot.pickupCode}</span>
              </div>
              {bankSnapshot.pickupTime && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A8272]">{t("pickup_time_label")}</span>
                  <span className="font-bold text-[#22201B]">{bankSnapshot.pickupTime}</span>
                </div>
              )}
            </div>
            <p className="text-[12.5px] text-[#8A8272] leading-relaxed">{t("pickup_bank_transfer_instructions")}</p>
            <p className="flex items-center gap-1.5 text-[12px] text-[#2D5A3D] font-medium mt-1">
              <Loader2 size={13} className="animate-spin" />
              {t("pickup_bank_transfer_waiting")}
            </p>
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
              {state.pickupTime && (
                <p className="text-[12.5px] text-[#8A6B3F] mt-1">
                  {t("pickup_time_label")}: <span className="font-bold">{state.pickupTime}</span>
                </p>
              )}
            </div>
            <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("pickup_result_instructions")}</p>
            <p className="text-[11.5px] text-[#B0A794] leading-relaxed">{t("pickup_result_find_later")}</p>
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
          href={backHref}
          className="mt-3 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
        >
          {t("pickup_result_back_button")}
        </a>
      </div>
    </div>
  );
}
