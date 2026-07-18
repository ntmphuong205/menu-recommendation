import { useMemo, useState } from "react";
import { TrendingUp, Receipt, Wallet, Table2, BarChart3 } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Order } from "../data/orders";

const BRAND_GREEN = "#2D5A3D";

function orderTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AnalyticsView() {
  const { orders } = useApp();
  const [view, setView] = useState<"chart" | "table">("chart");

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + orderTotal(o), 0), [orders]);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const revenueByDay = useMemo(() => {
    const map = new Map<string, { day: string; ts: number; revenue: number }>();
    for (const o of orders) {
      const key = new Date(o.createdAt).toDateString();
      const entry = map.get(key) ?? { day: formatDay(o.createdAt), ts: o.createdAt, revenue: 0 };
      entry.revenue += orderTotal(o);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [orders]);

  const topDishes = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; qty: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const entry = map.get(item.dishId) ?? { name: item.dishName, revenue: 0, qty: 0 };
        entry.revenue += item.price * item.qty;
        entry.qty += item.qty;
        map.set(item.dishId, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const maxDayRevenue = Math.max(1, ...revenueByDay.map((d) => d.revenue));
  const maxDishRevenue = Math.max(1, ...topDishes.map((d) => d.revenue));

  const hasData = totalOrders > 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">Analytics</h1>
          <p className="text-[13px] text-[#8A8272]">Revenue and menu performance from orders placed so far.</p>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F1E6] rounded-full p-1">
          <button
            onClick={() => setView("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              view === "chart" ? "bg-white shadow-sm text-[#22201B]" : "text-[#8A8272]"
            }`}
          >
            <BarChart3 size={13} />
            Chart
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              view === "table" ? "bg-white shadow-sm text-[#22201B]" : "text-[#8A8272]"
            }`}
          >
            <Table2 size={13} />
            Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <Wallet size={13} />
            Total revenue
          </div>
          <p className="text-[26px] font-bold text-[#2D5A3D]">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <Receipt size={13} />
            Total orders
          </div>
          <p className="text-[26px] font-bold text-[#22201B]">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <TrendingUp size={13} />
            Average order value
          </div>
          <p className="text-[26px] font-bold text-[#22201B]">{formatMoney(avgOrderValue)}</p>
        </div>
      </div>

      {!hasData && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          No orders yet — analytics will appear here once customers start ordering.
        </div>
      )}

      {hasData && view === "chart" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <h2 className="text-[13px] font-bold text-[#22201B] mb-4">Revenue by day</h2>
            <div className="flex items-end gap-2 h-40">
              {revenueByDay.map((d) => {
                const heightPct = (d.revenue / maxDayRevenue) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group relative">
                    <span className="text-[10.5px] font-semibold text-[#22201B] opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatMoney(d.revenue)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%`, backgroundColor: BRAND_GREEN, maxWidth: 24 }}
                      className="w-full rounded-t-[4px] transition-all"
                      title={`${d.day}: ${formatMoney(d.revenue)}`}
                    />
                    <span className="text-[10px] text-[#8A8272]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <h2 className="text-[13px] font-bold text-[#22201B] mb-4">Top dishes by revenue</h2>
            <div className="flex flex-col gap-3">
              {topDishes.map((d) => (
                <div key={d.name} className="group">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-medium text-[#22201B] truncate pr-2">{d.name}</span>
                    <span className="text-[#5C5240] font-semibold shrink-0">{formatMoney(d.revenue)}</span>
                  </div>
                  <div className="h-2 bg-[#F5F1E6] rounded-full overflow-hidden" title={`${d.qty} sold`}>
                    <div
                      style={{ width: `${(d.revenue / maxDishRevenue) * 100}%`, backgroundColor: BRAND_GREEN }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasData && view === "table" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-[#F5F1E6] text-[#8A8272] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueByDay.map((d) => (
                  <tr key={d.day} className="border-t border-black/5">
                    <td className="px-4 py-2 text-[#22201B]">{d.day}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[#2D5A3D]">{formatMoney(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-[#F5F1E6] text-[#8A8272] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Dish</th>
                  <th className="px-4 py-2 font-medium text-right">Qty</th>
                  <th className="px-4 py-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topDishes.map((d) => (
                  <tr key={d.name} className="border-t border-black/5">
                    <td className="px-4 py-2 text-[#22201B]">{d.name}</td>
                    <td className="px-4 py-2 text-right text-[#5C5240]">{d.qty}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[#2D5A3D]">{formatMoney(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
