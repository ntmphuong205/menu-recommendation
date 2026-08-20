import { useMemo, useState } from "react";
import { Search, Receipt } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { ORDER_STATUS_LABEL_KEY, orderTotal, type Order, type OrderStatus, type FulfillmentType } from "../data/orders";
import { formatPrice } from "../lib/currency";
import { STATUS_STYLE } from "./OrdersView";
import type { TranslationKey } from "../i18n/translations";

const STATUS_FILTERS: (OrderStatus | "all")[] = ["all", "new", "preparing", "served", "cancelled", "awaiting_payment"];

/** Short, stable reference code for an order that has no pickup code of its
 *  own (dine-in orders) — the first 8 chars of the order_group_id, upper-
 *  cased, so staff always have *something* to read back to a customer. */
function orderCode(order: Order): string {
  return order.id.slice(0, 8).toUpperCase();
}

function matchesQuery(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (order.tableId?.toLowerCase().includes(q)) return true;
  if (order.pickupCode?.toLowerCase().includes(q)) return true;
  if (orderCode(order).toLowerCase().includes(q)) return true;
  return order.items.some((i) => i.dishName.toLowerCase().includes(q));
}

export function OrderHistoryView() {
  const { orders, currency } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (fulfillmentFilter !== "all" && o.fulfillmentType !== fulfillmentFilter) return false;
      if (fromMs !== null && o.createdAt < fromMs) return false;
      if (toMs !== null && o.createdAt > toMs) return false;
      if (!matchesQuery(o, query)) return false;
      return true;
    });
  }, [orders, statusFilter, fulfillmentFilter, dateFrom, dateTo, query]);

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("history_title")}</h1>
        <p className="text-[13px] text-[#8A8272]">{t("history_subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white rounded-full px-3.5 py-2 border border-black/10 max-w-md">
          <Search size={15} className="text-[#B0A794]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("history_search_placeholder")}
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#B0A794] text-[#22201B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="text-[12.5px] font-medium text-[#5C5240] bg-white border border-black/10 rounded-full px-3 py-1.5 outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("history_filter_status_all") : t(ORDER_STATUS_LABEL_KEY[s])}
              </option>
            ))}
          </select>

          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value as FulfillmentType | "all")}
            className="text-[12.5px] font-medium text-[#5C5240] bg-white border border-black/10 rounded-full px-3 py-1.5 outline-none"
          >
            <option value="all">{t("history_filter_fulfillment_all")}</option>
            <option value="dine_in">{t("history_filter_fulfillment_dine_in")}</option>
            <option value="pickup">{t("history_filter_fulfillment_pickup")}</option>
          </select>

          <label className="flex items-center gap-1.5 text-[12.5px] text-[#8A8272]">
            {t("history_date_from")}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-[12.5px] text-[#5C5240] bg-white border border-black/10 rounded-full px-2.5 py-1.5 outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px] text-[#8A8272]">
            {t("history_date_to")}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-[12.5px] text-[#5C5240] bg-white border border-black/10 rounded-full px-2.5 py-1.5 outline-none"
            />
          </label>

          <span className="text-[12px] text-[#B0A794] ml-auto">{t("history_count_label", { count: filtered.length })}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <Receipt size={26} className="text-[#B0A794]" />
            <p className="text-[13px] text-[#B0A794]">{t("history_no_results")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F1E6] text-[#8A8272] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">{t("history_column_time")}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">{t("history_column_order")}</th>
                  <th className="px-4 py-3 font-medium">{t("history_column_items")}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">{t("history_column_status")}</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">{t("history_column_total")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-t border-black/5 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-[#5C5240]">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-[#22201B]">
                        {order.fulfillmentType === "pickup"
                          ? t("orders_pickup_badge", { code: order.pickupCode ?? orderCode(order) })
                          : `${t("chat_table")} ${order.tableId}`}
                      </p>
                      <p className="text-[11px] text-[#B0A794]">
                        {t("history_order_code")}: {orderCode(order)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[#5C5240] max-w-[320px]">
                      {order.items.map((i, idx) => (
                        <span key={i.id} className={i.status === "cancelled" ? "line-through opacity-60" : ""}>
                          {idx > 0 && ", "}
                          {i.qty}× {i.dishName}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}>
                        {t(ORDER_STATUS_LABEL_KEY[order.status] as TranslationKey)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-[#2D5A3D]">
                      {formatPrice(orderTotal(order), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
