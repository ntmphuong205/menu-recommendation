import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, Clock3, Users, Ban, Receipt, Sparkles, ChevronLeft, X, Ticket } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { QueueInfo } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { LangSwitcher } from "../components/LangSwitcher";
import { ACTIVE_STATUSES, ORDER_STATUS_LABEL_KEY, orderTotal, type Order, type OrderStatus } from "../data/orders";
import { getDishName, getPairingReason, type Dish } from "../data/menu";
import { getCustomerSessionId } from "../lib/apiClient";
import { getStoreSlug } from "../lib/storeSlug";

const STATUS_BADGE_STYLE: Record<OrderStatus, string> = {
  awaiting_payment: "bg-[#F3E9D2] text-[#8A6B3F]",
  new: "bg-[#FDECC8] text-[#8A6B1F]",
  preparing: "bg-[#DCEBFB] text-[#2A5C8A]",
  served: "bg-[#E5F3EA] text-[#2D5A3D]",
  cancelled: "bg-[#F7E9E2] text-[#B0553C]",
};

function MyOrdersSection() {
  const { orders, tableId, cancelOrder, getQueueInfo } = useApp();
  const { t } = useI18n();
  // Dine-in orders aren't tied to any one customer_session_id — everyone
  // seated at the table sees the table's combined orders. Pickup orders
  // have no table at all (tableId is null), so they only ever show up for
  // the customer_session_id that placed them — otherwise a pickup order
  // (and its pickup code) became unfindable the moment the customer left
  // the payment-result page, with no way back to it.
  const mySessionId = getCustomerSessionId();
  const myOrders = orders
    .filter((o) => (o.fulfillmentType === "pickup" ? o.customerSessionId === mySessionId : o.tableId === tableId))
    .sort((a, b) => b.createdAt - a.createdAt);

  if (myOrders.length === 0) return null;

  // Cancelled orders/items never happened — orderTotal() already excludes
  // individually-cancelled items; skip fully-cancelled orders too.
  const billTotal = myOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + orderTotal(o), 0);

  return (
    <div className="px-4 pt-3 flex flex-col gap-2.5">
      <h2 className="text-[12px] font-bold text-[#8A8272] uppercase tracking-wide">{t("cart_your_orders")}</h2>
      {myOrders.map((order) => {
        const firstActiveIdx = order.items.findIndex((i) => ACTIVE_STATUSES.includes(i.status));
        const orderQueue = firstActiveIdx >= 0 ? getQueueInfo(order, firstActiveIdx) : null;
        return (
          <div key={order.id} className="bg-white rounded-2xl p-3 border border-black/5 shadow-sm">
            {order.fulfillmentType === "pickup" && order.pickupCode && (
              <div className="flex items-center justify-between bg-[#F3E9D2] rounded-xl px-3 py-2 mb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8A6B3F]">
                  <Ticket size={13} />
                  {t("cart_pickup_code_label")}
                </span>
                <span className="text-[15px] font-bold text-[#22201B] tracking-widest">{order.pickupCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              {orderQueue ? (
                <span className="flex items-center gap-1 text-[11px] text-[#8A8272]">
                  <Users size={11} />
                  {t("cart_queue_position")}: #{orderQueue.position}
                </span>
              ) : (
                <span />
              )}
              {order.status === "new" && (
                <button
                  onClick={() => {
                    if (window.confirm(t("cart_cancel_confirm"))) cancelOrder(order.id);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#B0553C]"
                >
                  <Ban size={11} />
                  {t("cart_cancel_order")}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {order.items.map((item, idx) => {
                const queue = getQueueInfo(order, idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-2 ${item.status === "cancelled" ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] text-[#22201B] font-medium truncate">
                        {item.qty}× {item.dishName}
                      </p>
                      {queue && (
                        <p className="flex items-center gap-1 text-[10.5px] text-[#8A8272] mt-0.5">
                          <Clock3 size={10} />
                          {t("cart_estimated_wait")}: ~{queue.estimatedMinutes} {t("nutrition_minutes")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE_STYLE[item.status]}`}>
                        {t(ORDER_STATUS_LABEL_KEY[item.status])}
                      </span>
                      <span className="text-[12px] font-bold text-[#2D5A3D]">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between bg-[#1F3D2B] text-white rounded-2xl px-4 py-3 mt-1">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
          <Receipt size={14} />
          {t("cart_total_bill")}
        </span>
        <span className="text-[16px] font-bold">${billTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

function PairingSuggestions() {
  const { cart, menu, findDish, addToCart } = useApp();
  const { t, lang } = useI18n();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    const inCart = new Set(cart.map((i) => i.dishId));
    const seen = new Set<string>();
    const result: { dish: Dish; reason: string }[] = [];
    for (const item of cart) {
      const dish = findDish(item.dishId);
      for (const pairing of dish?.pairings ?? []) {
        if (inCart.has(pairing.dishId) || seen.has(pairing.dishId)) continue;
        const paired = menu.find((d) => d.id === pairing.dishId);
        if (!paired || paired.soldOut) continue;
        seen.add(pairing.dishId);
        result.push({ dish: paired, reason: getPairingReason(pairing, lang) });
      }
    }
    return result.slice(0, 3);
  }, [cart, menu, lang]);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 pt-1 pb-2 flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#8A8272] uppercase tracking-wide">
        <Sparkles size={12} className="text-[#E0A83C]" />
        {t("cart_pairs_title")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {suggestions.map(({ dish, reason }) => (
          <div
            key={dish.id}
            className="shrink-0 w-[168px] bg-white rounded-xl border border-black/5 shadow-sm p-2 flex flex-col gap-1.5"
          >
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#EFE9D8]">
                <img src={dish.image} alt={getDishName(dish, lang)} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#22201B] leading-tight line-clamp-1">{getDishName(dish, lang)}</p>
                <p className="text-[11px] text-[#2D5A3D] font-bold">${dish.price.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-[10.5px] text-[#8A8272] leading-snug line-clamp-2">{reason}</p>
            <button
              onClick={() => {
                addToCart(dish.id, 1);
                setAddedIds((prev) => new Set(prev).add(dish.id));
              }}
              disabled={addedIds.has(dish.id)}
              className="flex items-center justify-center gap-1 bg-[#2D5A3D] text-white text-[11px] font-semibold py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-50"
            >
              {addedIds.has(dish.id) ? t("dish_added") : t("dish_add")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderPlacedScreen({ order, onDone }: { order: Order | undefined; onDone: () => void }) {
  const { setActiveTab, tableId, getQueueInfo } = useApp();
  const { t } = useI18n();
  // All items just went in as "new" — summarize with the first item's queue
  // position and the longest individual wait across the order.
  const itemQueues = order
    ? order.items.map((_, idx) => getQueueInfo(order, idx)).filter((q): q is QueueInfo => q !== null)
    : [];
  const queue =
    itemQueues.length > 0
      ? { position: itemQueues[0].position, estimatedMinutes: Math.max(...itemQueues.map((q) => q.estimatedMinutes)) }
      : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-[#E5F3EA] flex items-center justify-center">
        <CheckCircle2 size={34} className="text-[#2D5A3D]" />
      </div>
      <h2 className="text-[17px] font-bold text-[#22201B]">{t("cart_placed_title")}</h2>
      <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("cart_placed_desc", { table: tableId })}</p>
      {queue && (
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-black/5 shadow-sm px-4 py-3 mt-1">
          <div className="text-center">
            <p className="text-[16px] font-bold text-[#2D5A3D]">#{queue.position}</p>
            <p className="text-[10.5px] text-[#8A8272]">{t("cart_queue_position")}</p>
          </div>
          <div className="w-px h-8 bg-black/10" />
          <div className="text-center">
            <p className="text-[16px] font-bold text-[#2D5A3D]">~{queue.estimatedMinutes} {t("nutrition_minutes")}</p>
            <p className="text-[10.5px] text-[#8A8272]">{t("cart_estimated_wait")}</p>
          </div>
        </div>
      )}
      <button
        onClick={() => {
          onDone();
          setActiveTab("chat");
        }}
        className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
      >
        {t("cart_back_to_chat")}
      </button>
    </div>
  );
}

/** Bottom sheet asking for a pickup time before moving on to the invoice —
 *  a separate step (instead of an inline field in the cart footer) so the
 *  customer explicitly confirms it rather than glancing past a default. */
function PickupTimeSheet({
  pickupTime,
  setPickupTime,
  minPickupTime,
  maxPickupTime,
  pickupTimeInWindow,
  onContinue,
  onClose,
}: {
  pickupTime: string;
  setPickupTime: (value: string) => void;
  minPickupTime: string;
  maxPickupTime: string;
  pickupTimeInWindow: boolean;
  onContinue: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#FBF7EF] rounded-t-[32px] p-5 pb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#22201B]">{t("pickup_time_sheet_title")}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
            <X size={16} className="text-[#22201B]" />
          </button>
        </div>
        <label className="flex items-center justify-between gap-3 bg-white rounded-xl border border-black/10 px-3.5 py-3">
          <span className="text-[12.5px] font-medium text-[#5C5240]">{t("pickup_time_label")}</span>
          <input
            type="time"
            value={pickupTime}
            min={minPickupTime}
            max={maxPickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="text-[15px] font-semibold text-[#22201B] outline-none bg-transparent"
          />
        </label>
        <p
          className={`text-center text-[11px] -mt-2 ${
            pickupTime && !pickupTimeInWindow ? "text-[#B0553C] font-semibold" : "text-[#8A8272]"
          }`}
        >
          {t("pickup_time_window", { start: minPickupTime, end: maxPickupTime })}
        </p>
        <button
          onClick={onContinue}
          disabled={!pickupTime || !pickupTimeInWindow}
          className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {t("pickup_time_sheet_continue")}
        </button>
      </div>
    </div>
  );
}

/** Order review shown after the customer confirms a pickup time, before
 *  actually paying — so they see exactly what they're about to pay for
 *  (and can still back out or change the time) instead of the previous
 *  flow's single "confirm = pay immediately" button. */
function PickupInvoiceScreen({
  onBack,
  onChangeTime,
  pickupTime,
  bankTransferAvailable,
  pickupState,
  onPay,
}: {
  onBack: () => void;
  onChangeTime: () => void;
  pickupTime: string;
  bankTransferAvailable: boolean;
  pickupState: "idle" | "bank" | "error";
  onPay: () => void;
}) {
  const { cart, findDish, totalPrice } = useApp();
  const { t, lang } = useI18n();

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2.5 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF]">
        <button onClick={onBack} className="text-[#5C5240]">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[19px] font-bold text-[#22201B] flex-1">{t("invoice_title")}</h1>
        <LangSwitcher />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-col gap-2.5">
          {cart.map((item) => {
            const dish = findDish(item.dishId);
            if (!dish) return null;
            return (
              <div key={item.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-[#22201B]">
                  {item.qty}× {getDishName(dish, lang)}
                  {item.note && <span className="text-[#B0553C]"> ({item.note})</span>}
                </span>
                <span className="font-semibold text-[#5C5240] shrink-0">${(dish.price * item.qty).toFixed(2)}</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-black/5">
            <span className="text-[13px] font-bold text-[#22201B]">{t("cart_total")}</span>
            <span className="text-[16px] font-bold text-[#2D5A3D]">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onChangeTime}
          className="flex items-center justify-between bg-white rounded-2xl border border-black/5 shadow-sm px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[13px] text-[#5C5240]">
            <Clock3 size={15} className="text-[#2D5A3D]" />
            {t("pickup_time_label")}
          </span>
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#22201B]">
            {pickupTime}
            <span className="text-[11px] font-medium text-[#2D5A3D] underline">{t("invoice_change_time")}</span>
          </span>
        </button>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4 border-t border-black/5 bg-[#FBF7EF] flex flex-col gap-2">
        {pickupState === "error" && (
          <p className="text-center text-[12px] text-[#B0553C] bg-[#F7E9E2] rounded-full py-2 px-4">
            {t("pickup_pay_error")}
          </p>
        )}
        {bankTransferAvailable ? (
          <button
            onClick={onPay}
            disabled={pickupState === "bank"}
            className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {pickupState === "bank" ? t("pickup_pay_loading") : t("pickup_bank_transfer_button")}
          </button>
        ) : (
          <p className="text-center text-[12px] text-[#B0553C] bg-[#F7E9E2] rounded-full py-3 px-4">
            {t("pickup_not_configured")}
          </p>
        )}
      </div>
    </div>
  );
}

export function CartScreen() {
  const {
    cart,
    updateQty,
    removeItem,
    clearCart,
    findDish,
    totalPrice,
    setActiveTab,
    placeOrder,
    placePickupOrder,
    tableId,
    orders,
    mode,
    webOrderIntent,
    resetWebOrderIntent,
    store,
  } = useApp();
  const { t, lang } = useI18n();
  // Holds the exact order_group_id just placed — not just a boolean —
  // so the confirmation screen can look up that specific order instead of
  // "whichever is newest for this table" (which another diner at the same
  // table submitting moments later would otherwise hijack).
  const [justSubmittedGroupId, setJustSubmittedGroupId] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState(false);
  const [pickupState, setPickupState] = useState<"idle" | "bank" | "error">("idle");
  // "cart" -> tap confirm -> "time" (ask pickup time) -> "invoice" (review,
  // then actually pay). Reset whenever the cart empties out from under it
  // (e.g. after a successful order) so a stale invoice doesn't linger.
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "time" | "invoice">("cart");
  // Defaults to 30 minutes from now — a reasonable "ready by" guess the
  // customer can freely change to any time, clamped into the store's
  // pickup window once it's loaded (see the effect below).
  const [pickupTime, setPickupTime] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const minPickupTime = store?.opening_time || "09:00";
  const maxPickupTime = store?.closing_time || "22:00";
  const pickupTimeInWindow = pickupTime >= minPickupTime && pickupTime <= maxPickupTime;

  // store loads asynchronously (polled) — once its pickup window is known,
  // pull the "now + 30min" guess back inside it instead of leaving the
  // customer with an unsubmittable default they'd have to notice and fix
  // themselves.
  useEffect(() => {
    if (!store) return;
    setPickupTime((current) => {
      if (current < minPickupTime) return minPickupTime;
      if (current > maxPickupTime) return maxPickupTime;
      return current;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.opening_time, store?.closing_time]);

  const handleBankTransferCheckout = async () => {
    setPickupState("bank");
    try {
      const groupId = await placePickupOrder("bank_transfer", pickupTime);
      clearCart();
      // Carries the store slug forward — /pickup-result has no other way to
      // know which store's bank details/branding to show, and its own
      // "back to cart" link depends on it too.
      const storeParam = getStoreSlug() ? `&store=${encodeURIComponent(getStoreSlug())}` : "";
      window.location.href = `/pickup-result?order_group_id=${groupId}${storeParam}`;
    } catch {
      setPickupState("error");
    }
  };

  const bankTransferAvailable = Boolean(
    store?.bank_qr_image || (store?.bank_account_number && store?.bank_bin)
  );

  const handleConfirmDineIn = async () => {
    setPlacingOrder(true);
    setPlaceOrderError(false);
    try {
      const groupId = await placeOrder(tableId);
      clearCart();
      setJustSubmittedGroupId(groupId);
    } catch {
      // Cart is left intact so the customer can just retry — nothing was
      // silently lost the way a fire-and-forget failure would.
      setPlaceOrderError(true);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (justSubmittedGroupId) {
    // Looked up by the exact order_group_id just placed — not "whichever
    // order is newest for this table", which another diner at the same
    // table submitting moments later would otherwise hijack this screen
    // into showing instead. Recomputed fresh from the live `orders` list on
    // every render, so this picks up the just-created order as soon as it
    // lands (the next poll tick, at most a few seconds later).
    const order = orders.find((o) => o.id === justSubmittedGroupId);
    return <OrderPlacedScreen order={order} onDone={() => setJustSubmittedGroupId(null)} />;
  }

  if (checkoutStep === "invoice" && cart.length > 0) {
    return (
      <PickupInvoiceScreen
        onBack={() => setCheckoutStep("cart")}
        onChangeTime={() => setCheckoutStep("time")}
        pickupTime={pickupTime}
        bankTransferAvailable={bankTransferAvailable}
        pickupState={pickupState}
        onPay={handleBankTransferCheckout}
      />
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF] flex items-center justify-between">
          <h1 className="text-[19px] font-bold text-[#22201B]">{t("cart_title")}</h1>
          <LangSwitcher />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="flex flex-col items-center justify-center px-8 py-10 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#EFE9D8] flex items-center justify-center">
              <ShoppingBag size={28} className="text-[#B0A794]" />
            </div>
            <h2 className="text-[15px] font-bold text-[#22201B]">{t("cart_empty_title")}</h2>
            <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("cart_empty_desc")}</p>
            <button
              onClick={() => setActiveTab("chat")}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              {t("cart_ask_ai")}
            </button>
          </div>
          <MyOrdersSection />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {checkoutStep === "time" && (
        <PickupTimeSheet
          pickupTime={pickupTime}
          setPickupTime={setPickupTime}
          minPickupTime={minPickupTime}
          maxPickupTime={maxPickupTime}
          pickupTimeInWindow={pickupTimeInWindow}
          onContinue={() => setCheckoutStep("invoice")}
          onClose={() => setCheckoutStep("cart")}
        />
      )}
      <div className="shrink-0 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF] flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-bold text-[#22201B]">{t("cart_title")}</h1>
          {mode === "store" && (
            <p className="text-[11px] text-[#8A8272]">
              {t("chat_table")} {tableId}
            </p>
          )}
        </div>
        <LangSwitcher />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {cart.map((item) => {
            const dish = findDish(item.dishId);
            if (!dish) return null;
            return (
              <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#EFE9D8]">
                  <img src={dish.image} alt={getDishName(dish, lang)} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-[#22201B] leading-tight">{getDishName(dish, lang)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-[#B0A794] shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {item.note && <p className="text-[11px] text-[#B0553C] mt-0.5">{item.note}</p>}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-2 bg-[#F5F1E6] rounded-full px-2 py-1">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-[12px] font-semibold w-3 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-[13px] font-bold text-[#2D5A3D]">
                      ${(dish.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <PairingSuggestions />
        <MyOrdersSection />
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4 border-t border-black/5 bg-[#FBF7EF]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-[#8A8272]">{t("cart_total")}</span>
          <span className="text-[18px] font-bold text-[#22201B]">${totalPrice.toFixed(2)}</span>
        </div>
        {mode === "web" && webOrderIntent !== "pickup" ? (
          <button
            onClick={resetWebOrderIntent}
            className="w-full text-center text-[12px] text-[#8A6B1F] bg-[#FDECC8] rounded-2xl py-3 px-4 flex flex-col gap-0.5"
          >
            <span>{t("reservation_web_mode_blocked")}</span>
            <span className="underline">{t("order_mode_switch_to_pickup")}</span>
          </button>
        ) : mode === "web" ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[11.5px] text-[#8A8272] px-2">{t("pickup_checkout_note")}</p>
            {bankTransferAvailable ? (
              <button
                onClick={() => setCheckoutStep("time")}
                className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform"
              >
                {t("cart_confirm_pickup_button")}
              </button>
            ) : (
              <p className="text-center text-[12px] text-[#B0553C] bg-[#F7E9E2] rounded-full py-3 px-4">
                {t("pickup_not_configured")}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {placeOrderError && (
              <p className="text-center text-[12px] text-[#B0553C] bg-[#F7E9E2] rounded-full py-2 px-4">
                {t("cart_confirm_error")}
              </p>
            )}
            <button
              onClick={handleConfirmDineIn}
              disabled={placingOrder}
              className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {placingOrder ? t("pickup_pay_loading") : t("cart_confirm_order")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
