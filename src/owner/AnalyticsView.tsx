import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Receipt,
  Wallet,
  Table2,
  BarChart3,
  Sun,
  Cloud,
  CloudRain,
  Sparkles,
  Loader2,
  Users,
  Repeat,
  ShoppingBag,
  ChefHat,
  Link2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { orderTotal } from "../data/orders";
import { useI18n } from "../i18n/I18nContext";
import { formatPrice } from "../lib/currency";
import { apiClient, type BusinessAnalytics, type AnalyticsInsightsResponse } from "../lib/apiClient";
import type { TranslationKey } from "../i18n/translations";

const BRAND_GREEN = "#2D5A3D";

const WEATHER_ICON = { sunny: Sun, cloudy: Cloud, rainy: CloudRain } as const;
const WEATHER_COLOR = { sunny: "#C9A227", cloudy: "#5B7FA6", rainy: "#3E6B8A" } as const;
const WEATHER_LABEL_KEY = {
  sunny: "analytics_weather_sunny",
  cloudy: "analytics_weather_cloudy",
  rainy: "analytics_weather_rainy",
} as const satisfies Record<string, TranslationKey>;
const WEEKDAY_LABEL_KEY: Record<string, TranslationKey> = {
  mon: "weekday_mon",
  tue: "weekday_tue",
  wed: "weekday_wed",
  thu: "weekday_thu",
  fri: "weekday_fri",
  sat: "weekday_sat",
  sun: "weekday_sun",
};
const WEEKDAY_FULL_LABEL_KEY: Record<string, TranslationKey> = {
  mon: "weekday_full_mon",
  tue: "weekday_full_tue",
  wed: "weekday_full_wed",
  thu: "weekday_full_thu",
  fri: "weekday_full_fri",
  sat: "weekday_full_sat",
  sun: "weekday_full_sun",
};

/** "1,2 kg" above 1000g, "350 g" below — grams is what the backend always
 *  sends (raw ingredient_lines unit), this is presentation-only. */
function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} kg`;
  return `${Math.round(grams)} g`;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[11.5px] text-[#8A8272] mb-1">
        <Icon size={13} />
        {label}
      </div>
      <p className="text-[20px] font-bold text-[#22201B]">{value}</p>
    </div>
  );
}

/** Purchase-behavior + ingredient-prep + weather business analytics — real
 *  order data (and, where available, real historical weather + each dish's
 *  ingredient_lines) aggregated server-side (see /api/analytics/*); this
 *  component only renders whatever numbers the backend actually computed. */
function BusinessAnalyticsSection() {
  const { t, lang } = useI18n();
  const [days, setDays] = useState(90);
  const [stats, setStats] = useState<BusinessAnalytics | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsightsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    setStats(null);
    apiClient
      .getBusinessAnalytics(days)
      .then((res) => !cancelled && setStats(res))
      .catch(() => !cancelled && setStats(null))
      .finally(() => !cancelled && setLoadingStats(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  // Separate from the stats fetch above — the AI text is the only part of
  // this section that depends on the admin's chosen display language, so
  // switching language shouldn't re-fetch the (language-agnostic) numbers.
  useEffect(() => {
    let cancelled = false;
    setLoadingInsights(true);
    setInsights(null);
    apiClient
      .getAnalyticsInsights(days, lang)
      .then((res) => !cancelled && setInsights(res))
      .catch(() => !cancelled && setInsights(null))
      .finally(() => !cancelled && setLoadingInsights(false));
    return () => {
      cancelled = true;
    };
  }, [days, lang]);

  const pb = stats?.purchase_behavior;
  const ing = stats?.ingredient_prep;
  const maxItemQty = Math.max(1, ...(pb?.top_items.map((i) => i.qty) ?? [1]));
  const maxCategoryQty = Math.max(1, ...(pb?.top_categories.map((c) => c.qty) ?? [1]));
  const maxWeekdayRevenue = Math.max(1, ...(pb?.revenue_by_weekday.map((d) => d.revenue_vnd) ?? [1]));
  const maxHourQty = Math.max(1, ...(pb?.orders_by_hour.map((h) => h.qty) ?? [1]));
  const maxIngredientGrams = Math.max(1, ...(ing?.top_ingredients.map((i) => i.avg_per_day_grams) ?? [1]));
  const hasEnoughData = !!stats && stats.total_order_groups > 0;
  const hasWeatherData = !!stats && stats.weather.by_condition.some((c) => c.order_lines > 0);

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-[#22201B] mb-1">{t("analytics_business_title")}</h2>
          <p className="text-[12.5px] text-[#8A8272] max-w-lg">{t("analytics_business_subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F1E6] rounded-full p-1 shrink-0">
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                days === d ? "bg-white shadow-sm text-[#22201B]" : "text-[#8A8272]"
              }`}
            >
              {t(`analytics_business_range_${d}` as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      {loadingStats && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794] flex items-center justify-center gap-2">
          <Loader2 size={15} className="animate-spin" />
          {t("analytics_business_loading")}
        </div>
      )}

      {!loadingStats && !hasEnoughData && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          {t("analytics_business_empty")}
        </div>
      )}

      {!loadingStats && hasEnoughData && stats && pb && ing && (
        <>
          {/* AI insights */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-4">
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#22201B] mb-3">
              <Sparkles size={14} className="text-[#2D5A3D]" />
              {t("analytics_insights_title")}
            </h3>
            {loadingInsights ? (
              <p className="flex items-center gap-2 text-[12.5px] text-[#B0A794]">
                <Loader2 size={13} className="animate-spin" />
                {t("analytics_insights_loading")}
              </p>
            ) : insights && insights.insights.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {insights.insights.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#22201B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3D] mt-1.5 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-[#B0A794]">{t("analytics_insights_empty")}</p>
            )}
          </div>

          {/* Purchase behavior */}
          <h3 className="text-[13px] font-bold text-[#22201B] mb-3">{t("analytics_pb_title")}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard icon={Users} label={t("analytics_pb_total_customers")} value={pb.total_customers.toLocaleString("vi-VN")} />
            <StatCard icon={Repeat} label={t("analytics_pb_repeat_rate")} value={`${pb.repeat_customer_rate_pct}%`} />
            <StatCard icon={ShoppingBag} label={t("analytics_pb_avg_items")} value={pb.avg_items_per_order.toLocaleString("vi-VN")} />
            <StatCard icon={Receipt} label={t("analytics_pb_total_orders")} value={stats.total_order_groups.toLocaleString("vi-VN")} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <h4 className="text-[12.5px] font-bold text-[#22201B] mb-3">{t("analytics_pb_top_items")}</h4>
              <div className="flex flex-col gap-2.5">
                {pb.top_items.map((it) => (
                  <div key={it.name}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-[#22201B] truncate pr-2">{it.name}</span>
                      <span className="text-[#5C5240] shrink-0">{it.qty}</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F1E6] rounded-full overflow-hidden" title={formatPrice(it.revenue_vnd, "VND")}>
                      <div style={{ width: `${(it.qty / maxItemQty) * 100}%`, backgroundColor: BRAND_GREEN }} className="h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <h4 className="text-[12.5px] font-bold text-[#22201B] mb-3">{t("analytics_pb_top_categories")}</h4>
              <div className="flex flex-col gap-2.5">
                {pb.top_categories.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-[#22201B] truncate pr-2">{cat.category}</span>
                      <span className="text-[#5C5240] shrink-0">{cat.qty}</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F1E6] rounded-full overflow-hidden" title={formatPrice(cat.revenue_vnd, "VND")}>
                      <div style={{ width: `${(cat.qty / maxCategoryQty) * 100}%`, backgroundColor: "#5B7FA6" }} className="h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-4">
            <h4 className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#22201B] mb-3">
              <Link2 size={13} />
              {t("analytics_pb_pairs_title")}
            </h4>
            {pb.frequently_bought_together.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pb.frequently_bought_together.map((p) => (
                  <div key={`${p.item_a}-${p.item_b}`} className="flex items-center justify-between bg-[#F5F1E6] rounded-xl px-3 py-2 text-[12px]">
                    <span className="text-[#22201B] truncate pr-2">
                      {p.item_a} + {p.item_b}
                    </span>
                    <span className="text-[#8A8272] font-semibold shrink-0">{t("analytics_pb_pairs_count", { count: p.count })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#B0A794]">{t("analytics_pb_pairs_empty")}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <h4 className="text-[12.5px] font-bold text-[#22201B] mb-4">{t("analytics_pb_revenue_by_weekday")}</h4>
              <div className="flex items-end gap-2 h-32">
                {pb.revenue_by_weekday.map((d) => (
                  <div key={d.weekday} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                    <div
                      style={{ height: `${(d.revenue_vnd / maxWeekdayRevenue) * 100}%`, backgroundColor: BRAND_GREEN }}
                      className="w-full rounded-t-[4px] transition-all"
                      title={formatPrice(d.revenue_vnd, "VND")}
                    />
                    <span className="text-[10px] text-[#8A8272]">{t(WEEKDAY_LABEL_KEY[d.weekday])}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <h4 className="text-[12.5px] font-bold text-[#22201B] mb-4">{t("analytics_pb_orders_by_hour")}</h4>
              <div className="flex items-end gap-[3px] h-32">
                {pb.orders_by_hour.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <div
                      style={{ height: `${(h.qty / maxHourQty) * 100}%`, backgroundColor: "#5B7FA6" }}
                      className="w-full rounded-t-[2px] transition-all"
                      title={`${h.hour}h: ${h.qty}`}
                    />
                    {h.hour % 3 === 0 && <span className="text-[9px] text-[#8A8272]">{h.hour}h</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredient prep */}
          <div className="mb-4">
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#22201B] mb-1">
              <ChefHat size={15} />
              {t("analytics_ing_title")}
            </h3>
            <p className="text-[12px] text-[#8A8272] max-w-lg">{t("analytics_ing_subtitle")}</p>
          </div>

          {ing.top_ingredients.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-black/5 text-center text-[12.5px] text-[#B0A794] mb-8">
              {t("analytics_ing_empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
                <h4 className="text-[12.5px] font-bold text-[#22201B] mb-3">
                  {t("analytics_ing_tomorrow_heading", { weekday: t(WEEKDAY_FULL_LABEL_KEY[ing.tomorrow_weekday]) })}
                </h4>
                <div className="flex flex-col gap-3">
                  {ing.top_ingredients.slice(0, 5).map((i) => (
                    <div key={i.name} className="flex items-center justify-between">
                      <span className="text-[12.5px] text-[#5C5240] truncate pr-2">{i.name}</span>
                      <span className="text-[15px] font-bold text-[#2D5A3D] shrink-0">{formatGrams(i.forecast_tomorrow_grams)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
                <h4 className="text-[12.5px] font-bold text-[#22201B] mb-3">{t("analytics_ing_avg_per_day")}</h4>
                <div className="flex flex-col gap-2.5">
                  {ing.top_ingredients.slice(0, 6).map((i) => (
                    <div key={i.name}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="font-medium text-[#22201B] truncate pr-2">{i.name}</span>
                        <span className="text-[#5C5240] shrink-0">{formatGrams(i.avg_per_day_grams)}</span>
                      </div>
                      <div className="h-1.5 bg-[#F5F1E6] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(i.avg_per_day_grams / maxIngredientGrams) * 100}%`, backgroundColor: "#8A6B1F" }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weather (optional lens) */}
          {hasWeatherData && (
            <div>
              <h3 className="text-[13px] font-bold text-[#22201B] mb-1">{t("analytics_weather_section_title")}</h3>
              <p className="text-[12px] text-[#8A8272] max-w-lg mb-3">{t("analytics_weather_section_subtitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.weather.by_condition.map((cond) => {
                  const Icon = WEATHER_ICON[cond.condition];
                  return (
                    <div key={cond.condition} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#22201B]">
                          <Icon size={15} style={{ color: WEATHER_COLOR[cond.condition] }} />
                          {t(WEATHER_LABEL_KEY[cond.condition])}
                        </div>
                        <span className="text-[10.5px] text-[#B0A794]">
                          {t("analytics_weather_days_count", { count: cond.days })}
                        </span>
                      </div>
                      <p className="text-[19px] font-bold text-[#2D5A3D] mb-2">{formatPrice(cond.revenue_vnd, "VND")}</p>
                      {cond.order_lines === 0 ? (
                        <p className="text-[11.5px] text-[#B0A794]">{t("analytics_weather_no_days")}</p>
                      ) : (
                        <>
                          <p className="text-[10.5px] font-semibold text-[#8A8272] mb-1.5">
                            {t("analytics_weather_top_categories")}
                          </p>
                          <div className="flex flex-col gap-1">
                            {cond.top_categories.slice(0, 3).map((cat) => (
                              <div key={cat.category} className="flex items-center justify-between text-[11.5px]">
                                <span className="text-[#5C5240] truncate pr-2">{cat.category}</span>
                                <span className="text-[#22201B] font-medium shrink-0">{cat.share_pct}%</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AnalyticsView() {
  const { orders, currency } = useApp();
  const formatMoney = (n: number) => formatPrice(n, currency);
  const { t } = useI18n();
  const [view, setView] = useState<"chart" | "table">("chart");

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + orderTotal(o), 0), [orders]);
  // Cancelled orders never happened — don't let them drag down average order value.
  const totalOrders = orders.filter((o) => o.status !== "cancelled").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const revenueByDay = useMemo(() => {
    const map = new Map<string, { day: string; ts: number; revenue: number }>();
    for (const o of orders) {
      const key = new Date(o.createdAt).toDateString();
      const entry = map.get(key) ?? { day: formatDay(o.createdAt), ts: o.createdAt, revenue: 0 };
      entry.revenue += orderTotal(o);
      map.set(key, entry);
    }
    // This quick-glance chart shows the most recent stretch only — the
    // detailed section below covers full history (up to 180 days) properly,
    // with its own horizontally-scrollable/paged rendering.
    return Array.from(map.values())
      .sort((a, b) => a.ts - b.ts)
      .slice(-30);
  }, [orders]);

  const topDishes = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; qty: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        if (item.status === "cancelled") continue;
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
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#22201B] mb-1">{t("analytics_title")}</h1>
          <p className="text-[13px] text-[#8A8272]">{t("analytics_subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F1E6] rounded-full p-1">
          <button
            onClick={() => setView("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              view === "chart" ? "bg-white shadow-sm text-[#22201B]" : "text-[#8A8272]"
            }`}
          >
            <BarChart3 size={13} />
            {t("analytics_view_chart")}
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              view === "table" ? "bg-white shadow-sm text-[#22201B]" : "text-[#8A8272]"
            }`}
          >
            <Table2 size={13} />
            {t("analytics_view_table")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <Wallet size={13} />
            {t("analytics_total_revenue")}
          </div>
          <p className="text-[26px] font-bold text-[#2D5A3D]">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <Receipt size={13} />
            {t("analytics_total_orders")}
          </div>
          <p className="text-[26px] font-bold text-[#22201B]">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8A8272] mb-1">
            <TrendingUp size={13} />
            {t("analytics_avg_order")}
          </div>
          <p className="text-[26px] font-bold text-[#22201B]">{formatMoney(avgOrderValue)}</p>
        </div>
      </div>

      {!hasData && (
        <div className="bg-white rounded-2xl p-10 border border-black/5 text-center text-[13px] text-[#B0A794]">
          {t("analytics_empty")}
        </div>
      )}

      {hasData && view === "chart" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <h2 className="text-[13px] font-bold text-[#22201B] mb-4">{t("analytics_revenue_by_day")}</h2>
            <div className="flex items-end gap-2 h-40 overflow-x-auto">
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
            <h2 className="text-[13px] font-bold text-[#22201B] mb-4">{t("analytics_top_dishes")}</h2>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-[#F5F1E6] text-[#8A8272] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("analytics_col_day")}</th>
                  <th className="px-4 py-2 font-medium text-right">{t("analytics_col_revenue")}</th>
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
                  <th className="px-4 py-2 font-medium">{t("analytics_col_dish")}</th>
                  <th className="px-4 py-2 font-medium text-right">{t("analytics_col_qty")}</th>
                  <th className="px-4 py-2 font-medium text-right">{t("analytics_col_revenue")}</th>
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

      <BusinessAnalyticsSection />
    </div>
  );
}
