import { useMemo } from "react";
import { Clock3, ArrowRight, PackageCheck, XCircle, Ban, BellRing, Check, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { NEXT_STATUS, ORDER_STATUS_LABEL, ACTIVE_STATUSES, orderTotal, type Order, type OrderStatus } from "../data/orders";
import { useI18n } from "../i18n/I18nContext";

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-[#FDECC8] text-[#8A6B1F]",
  preparing: "bg-[#DCEBFB] text-[#2A5C8A]",
  served: "bg-[#E5F3EA] text-[#2D5A3D]",
  cancelled: "bg-[#F7E9E2] text-[#B0553C]",
};

function timeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hr ago`;
}

export function OrdersView() {
  const { orders, updateItemStatus, cancelOrder, tableRequests, resolveRequest } = useApp();
  const { t } = useI18n();

  const pendingRequests = useMemo(() => tableRequests.filter((r) => !r.resolved), [tableRequests]);
  const active = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)), [orders]);
  const served = useMemo(() => orders.filter((o) => o.status === "served"), [orders]);
  const cancelled = useMemo(() => orders.filter((o) => o.status === "cancelled"), [orders]);
  const tablesOccupied = useMemo(() => new Set(active.map((o) => o.tableNumber)).size, [active]);
  const revenueToday = useMemo(() => orders.reduce((sum, o) => sum + orderTotal(o), 0), [orders]);

  const grouped = useMemo(() => {
    const map = new Map<number, Order[]>();
    for (const o of active) {
      const list = map.get(o.tableNumber) ?? [];
      list.push(o);
      map.set(o.tableNumber, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [active]);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-[24px] font-bold text-[#22201B] mb-1">Orders</h1>
      <p className="text-[13px] text-[#8A8272] mb-6">Live orders coming in from customer tables.</p>

      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-[#FDECC8] border border-[#E0A83C]/30 rounded-2xl p-4">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-[#8A6B1F] mb-2.5">
            <BellRing size={14} />
            {t("owner_table_requests")} ({pendingRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
                <div>
                  <span className="text-[13px] font-semibold text-[#22201B]">Table {req.tableNumber}</span>
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

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[12px] text-[#8A8272] mb-1">Active Orders</p>
          <p className="text-[26px] font-bold text-[#22201B]">{active.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[12px] text-[#8A8272] mb-1">Tables Occupied</p>
          <p className="text-[26px] font-bold text-[#22201B]">{tablesOccupied}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[12px] text-[#8A8272] mb-1">Total Revenue</p>
          <p className="text-[26px] font-bold text-[#2D5A3D]">${revenueToday.toFixed(2)}</p>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          No active orders yet. Once a customer confirms an order from their table, it'll show up here in real time.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {grouped.map(([tableNumber, tableOrders]) => (
          <div key={tableNumber} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-[#1F3D2B] text-white flex items-center justify-between">
              <span className="text-[13px] font-bold">Table {tableNumber}</span>
              <span className="text-[11px] text-white/70">
                {tableOrders.length} order{tableOrders.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {tableOrders.map((order) => (
                <div key={order.id} className="border-b border-black/5 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1 text-[11px] text-[#B0A774]">
                      <Clock3 size={11} />
                      {timeAgo(order.createdAt)}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Cancel this whole order for Table ${order.tableNumber}?`)) cancelOrder(order.id);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#B0553C]"
                    >
                      <Ban size={11} />
                      Cancel order
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mb-2">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 text-[13px] ${item.status === "cancelled" ? "opacity-50" : ""}`}
                      >
                        <div className="min-w-0">
                          <span className="text-[#22201B]">
                            {item.qty}× {item.dishName}
                            {item.note && <span className="text-[#B0553C]"> ({item.note})</span>}
                          </span>
                          <span className="text-[#5C5240] font-medium ml-2">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[item.status]}`}>
                            {ORDER_STATUS_LABEL[item.status]}
                          </span>
                          {NEXT_STATUS[item.status] && (
                            <button
                              onClick={() => updateItemStatus(order.id, i, NEXT_STATUS[item.status]!)}
                              title={`Mark ${ORDER_STATUS_LABEL[NEXT_STATUS[item.status]!]}`}
                              className="flex items-center gap-0.5 text-[10.5px] font-semibold text-white bg-[#2D5A3D] px-2 py-1 rounded-full active:scale-95 transition-transform whitespace-nowrap"
                            >
                              <ArrowRight size={10} />
                            </button>
                          )}
                          {ACTIVE_STATUSES.includes(item.status) && (
                            <button
                              onClick={() => updateItemStatus(order.id, i, "cancelled")}
                              title="Cancel this item"
                              className="flex items-center justify-center w-6 h-6 rounded-full text-[#B0553C] bg-[#F7E9E2] active:scale-95 transition-transform shrink-0"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-[12px] font-bold text-[#2D5A3D]">${orderTotal(order).toFixed(2)}</span>
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
            Served ({served.length})
          </h2>
          <div className="flex flex-col gap-2">
            {served.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-black/5 px-4 py-2.5 flex items-center justify-between text-[12.5px]"
              >
                <span className="font-medium text-[#22201B]">Table {order.tableNumber}</span>
                <span className="text-[#8A8272]">
                  {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(", ")}
                </span>
                <span className="font-semibold text-[#2D5A3D]">${orderTotal(order).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[13px] font-bold text-[#8A8272] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <XCircle size={14} />
            Cancelled ({cancelled.length})
          </h2>
          <div className="flex flex-col gap-2">
            {cancelled.slice(0, 8).map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-black/5 px-4 py-2.5 flex items-center justify-between text-[12.5px] opacity-60"
              >
                <span className="font-medium text-[#22201B]">Table {order.tableNumber}</span>
                <span className="text-[#8A8272]">
                  {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(", ")}
                </span>
                <span className="font-semibold text-[#B0553C]">${orderTotal(order).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
