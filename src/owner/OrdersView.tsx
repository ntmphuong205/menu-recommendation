import { useMemo, useState } from "react";
import { Clock3, PackageCheck, XCircle, Ban, BellRing, Check, X, CalendarClock, Users, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ORDER_STATUS_LABEL_KEY, ACTIVE_STATUSES, orderTotal, type Order, type OrderStatus } from "../data/orders";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";
import { RESERVATIONS_ENABLED } from "../data/featureFlags";
import { formatPrice } from "../lib/currency";
import { StoreStatusToggle } from "./StoreStatusToggle";
import { useTablesData } from "../store/useTablesData";

export const STATUS_STYLE: Record<OrderStatus, string> = {
  awaiting_payment: "bg-[#F3E9D2] text-[#8A6B3F]",
  new: "bg-[#FDECC8] text-[#8A6B1F]",
  preparing: "bg-[#DCEBFB] text-[#2A5C8A]",
  served: "bg-[#E5F3EA] text-[#2D5A3D]",
  cancelled: "bg-[#F7E9E2] text-[#B0553C]",
};

// Click any of these directly instead of only moving forward one step at a
// time — a misclick can be corrected by clicking the right one back.
const ITEM_STATUS_STEPS: OrderStatus[] = ["new", "preparing", "served"];

/** "Table T3" for dine-in, "Pickup #A1B2C3 · 19:30" for remote pre-orders —
 *  pickup orders aren't tied to a physical table at all. */
export function orderLabel(order: Order, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (order.fulfillmentType === "pickup") {
    const badge = t("orders_pickup_badge", { code: order.pickupCode ?? "" });
    return order.pickupTime ? `${badge} · ${order.pickupTime}` : badge;
  }
  return `${t("chat_table")} ${order.tableId}`;
}

function timeAgo(ts: number, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return t("orders_time_just_now");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("orders_time_min_ago", { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  return t("orders_time_hr_ago", { n: diffHr });
}

export function OrdersView() {
  const {
    orders,
    updateItemStatus,
    updateOrderStatus,
    cancelOrder,
    tableRequests,
    resolveRequest,
    reservations,
    updateReservationStatus,
    currency,
  } = useApp();
  const { t } = useI18n();
  const { clearTable } = useTablesData();
  const [clearingTable, setClearingTable] = useState<string | null>(null);

  const handleClearTable = async (tableCode: string) => {
    if (!window.confirm(t("orders_clear_table_confirm", { table: tableCode }))) return;
    setClearingTable(tableCode);
    try {
      await clearTable(tableCode);
    } catch (err) {
      console.error("[MenuPilot] Failed to clear table", err);
    } finally {
      setClearingTable(null);
    }
  };

  const pendingRequests = useMemo(() => tableRequests.filter((r) => !r.resolved), [tableRequests]);
  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === "reserved" || r.status === "waiting"),
    [reservations]
  );
  const awaitingPayment = useMemo(() => orders.filter((o) => o.status === "awaiting_payment"), [orders]);
  const active = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)), [orders]);
  const served = useMemo(() => orders.filter((o) => o.status === "served"), [orders]);
  const cancelled = useMemo(() => orders.filter((o) => o.status === "cancelled"), [orders]);
  const tablesOccupied = useMemo(
    () => new Set(active.filter((o) => o.fulfillmentType === "dine_in").map((o) => o.tableId)).size,
    [active]
  );
  const revenueToday = useMemo(() => orders.reduce((sum, o) => sum + orderTotal(o), 0), [orders]);

  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of active) {
      // Dine-in orders group by table (a table can build up several orders
      // over a visit); each pickup order gets its own card since it's a
      // one-off transaction, not an ongoing tab.
      const key = o.fulfillmentType === "dine_in" ? o.tableId ?? "" : `pickup-${o.id}`;
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [active]);

  return (
    <div className="p-4 md:p-8 short:p-3! max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 short:mb-3!">
        <div>
          <h1 className="text-[24px] short:text-[18px]! font-bold text-[#22201B] mb-1">{t("orders_title")}</h1>
          <p className="text-[13px] text-[#8A8272] short:hidden">{t("orders_subtitle")}</p>
        </div>
        <StoreStatusToggle />
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-6 short:mb-3! bg-[#FDECC8] border border-[#E0A83C]/30 rounded-2xl p-4 short:p-3!">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#8A6B1F] mb-2.5">
            <BellRing size={14} />
            {t("owner_table_requests")} ({pendingRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[13px] font-semibold text-[#22201B]">
                    {t("chat_table")} {req.tableId}
                  </span>
                  <span className="text-[12px] text-[#8A8272] ml-2">{req.reason}</span>
                </div>
                <button
                  onClick={() => resolveRequest(req.id)}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  <Check size={11} />
                  {t("owner_resolve")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {RESERVATIONS_ENABLED && pendingReservations.length > 0 && (
        <div className="mb-6 short:mb-3! bg-[#DCEBFB] border border-[#2A5C8A]/20 rounded-2xl p-4 short:p-3!">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#2A5C8A] mb-2.5">
            <CalendarClock size={14} />
            {t("orders_reservations_waiting")} ({pendingReservations.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[13px] font-semibold text-[#22201B]">
                    {t("chat_table")} {r.table_id}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold ml-2 px-2 py-0.5 rounded-full ${
                      r.status === "waiting" ? "bg-[#FDECC8] text-[#8A6B1F]" : "bg-[#E5F3EA] text-[#2D5A3D]"
                    }`}
                  >
                    {r.status === "waiting" ? t("orders_status_waiting") : t("orders_status_reserved")}
                  </span>
                  {r.party_size > 0 && (
                    <span className="flex items-center gap-1 text-[11.5px] text-[#8A8272] ml-2 inline-flex">
                      <Users size={11} />
                      {r.party_size}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateReservationStatus(r.id, "accepted")}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    <Check size={11} />
                    {t("orders_accept")}
                  </button>
                  <button
                    onClick={() => updateReservationStatus(r.id, "cancelled")}
                    className="flex items-center justify-center w-7 h-7 rounded-full text-[#B0553C] bg-[#F7E9E2] active:scale-95 transition-transform"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {awaitingPayment.length > 0 && (
        <div className="mb-6 short:mb-3! bg-[#F3E9D2] border border-[#8A6B3F]/25 rounded-2xl p-4 short:p-3!">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#8A6B3F] mb-2.5">
            <Wallet size={14} />
            {t("orders_awaiting_payment_heading")} ({awaitingPayment.length})
          </h2>
          <div className="flex flex-col gap-2">
            {awaitingPayment.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[13px] font-semibold text-[#22201B]">{orderLabel(order, t)}</span>
                  <span className="text-[12px] text-[#5C5240] ml-2 font-medium">{formatPrice(orderTotal(order), currency)}</span>
                </div>
                {order.paymentMethod === "bank_transfer" ? (
                  <button
                    onClick={() => updateOrderStatus(order.id, "new")}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-white bg-[#2D5A3D] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    <Check size={11} />
                    {t("orders_confirm_payment_received")}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-[#8A6B3F]">
                    <Loader2 size={12} className="animate-spin" />
                    {t("orders_awaiting_vnpay_auto")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 short:gap-2! mb-8 short:mb-3!">
        <div className="bg-white rounded-2xl p-4 short:p-2! border border-black/5 shadow-sm short:flex short:items-center short:justify-between">
          <p className="text-[12px] text-[#8A8272] mb-1 short:mb-0!">{t("orders_stat_active")}</p>
          <p className="text-[26px] short:text-[16px]! font-bold text-[#22201B]">{active.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 short:p-2! border border-black/5 shadow-sm short:flex short:items-center short:justify-between">
          <p className="text-[12px] text-[#8A8272] mb-1 short:mb-0!">{t("orders_stat_tables_occupied")}</p>
          <p className="text-[26px] short:text-[16px]! font-bold text-[#22201B]">{tablesOccupied}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 short:p-2! border border-black/5 shadow-sm short:flex short:items-center short:justify-between">
          <p className="text-[12px] text-[#8A8272] mb-1 short:mb-0!">{t("orders_stat_revenue")}</p>
          <p className="text-[26px] short:text-[16px]! font-bold text-[#2D5A3D]">{formatPrice(revenueToday, currency)}</p>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          {t("orders_empty")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 short:gap-3!">
        {grouped.map(([groupKey, tableOrders]) => (
          <div key={groupKey} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-[#1F3D2B] text-white flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold">{orderLabel(tableOrders[0], t)}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-white/70">{t("orders_count_label", { count: tableOrders.length })}</span>
                {tableOrders[0].fulfillmentType === "dine_in" && tableOrders[0].tableId && (
                  <button
                    onClick={() => handleClearTable(tableOrders[0].tableId!)}
                    disabled={clearingTable === tableOrders[0].tableId}
                    title={t("orders_clear_table_title")}
                    className="flex items-center gap-1 text-[11px] font-semibold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <CheckCircle2 size={11} />
                    {t("orders_clear_table_button")}
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {tableOrders.map((order) => (
                <div key={order.id} className="border-b border-black/5 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1 text-[11px] text-[#B0A774]">
                      <Clock3 size={11} />
                      {timeAgo(order.createdAt, t)}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(t("orders_cancel_confirm", { table: order.tableId ?? order.pickupCode ?? "" })))
                          cancelOrder(order.id);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#B0553C]"
                    >
                      <Ban size={11} />
                      {t("orders_cancel_order")}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className={`flex flex-col gap-1.5 ${item.status === "cancelled" ? "opacity-50" : ""}`}>
                        <span className="text-[13px] text-[#22201B] leading-snug">
                          {item.qty}× {item.dishName}
                          {item.note && <span className="text-[#B0553C]"> ({item.note})</span>}
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-[#5C5240]">
                            {formatPrice(item.price * item.qty, currency)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.status === "cancelled" ? (
                              <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[item.status]}`}>
                                {t(ORDER_STATUS_LABEL_KEY[item.status])}
                              </span>
                            ) : (
                              <div className="flex items-center gap-0.5 bg-black/5 rounded-full p-0.5">
                                {ITEM_STATUS_STEPS.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateItemStatus(item.id, s)}
                                    disabled={item.status === s}
                                    title={t(ORDER_STATUS_LABEL_KEY[s])}
                                    className={`px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
                                      item.status === s ? STATUS_STYLE[s] : "text-[#B0A794] active:scale-95"
                                    }`}
                                  >
                                    {t(ORDER_STATUS_LABEL_KEY[s])}
                                  </button>
                                ))}
                              </div>
                            )}
                            {ACTIVE_STATUSES.includes(item.status) && (
                              <button
                                onClick={() => updateItemStatus(item.id, "cancelled")}
                                title={t("orders_cancel_item_title")}
                                className="flex items-center justify-center w-6 h-6 rounded-full text-[#B0553C] bg-[#F7E9E2] active:scale-95 transition-transform shrink-0"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-black/5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}>
                      {t(ORDER_STATUS_LABEL_KEY[order.status])}
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-[#8A8272]">{t("orders_order_total_label")}</span>
                      <span className="text-[13px] font-bold text-[#2D5A3D]">{formatPrice(orderTotal(order), currency)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {served.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <PackageCheck size={14} />
            {t("orders_served_heading")} ({served.length})
          </h2>
          <div className="flex flex-col gap-2">
            {served.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-black/5 px-4 py-2.5 flex items-center justify-between text-[12.5px]"
              >
                <span className="font-medium text-[#22201B]">
                  {orderLabel(order, t)}
                </span>
                <span className="text-[#8A8272]">
                  {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(", ")}
                </span>
                <span className="font-semibold text-[#2D5A3D]">{formatPrice(orderTotal(order), currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <XCircle size={14} />
            {t("orders_cancelled_heading")} ({cancelled.length})
          </h2>
          <div className="flex flex-col gap-2">
            {cancelled.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-black/5 px-4 py-2.5 flex items-center justify-between text-[12.5px] opacity-60"
              >
                <span className="font-medium text-[#22201B]">
                  {orderLabel(order, t)}
                </span>
                <span className="text-[#8A8272]">
                  {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(", ")}
                </span>
                <span className="font-semibold text-[#B0553C]">{formatPrice(orderTotal(order), currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
