import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, Clock3, Users, Ban, Receipt, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n/I18nContext";
import { ACTIVE_STATUSES, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "../data/orders";
import { getPairingReason, type Dish } from "../data/menu";

const STATUS_BADGE_STYLE: Record<OrderStatus, string> = {
  new: "bg-[#FDECC8] text-[#8A6B1F]",
  preparing: "bg-[#DCEBFB] text-[#2A5C8A]",
  served: "bg-[#E5F3EA] text-[#2D5A3D]",
  cancelled: "bg-[#F7E9E2] text-[#B0553C]",
};

function orderTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function MyOrdersSection() {
  const { orders, tableNumber, cancelOrder, getQueueInfo } = useApp();
  const { t } = useI18n();
  // Everything this table has ordered so far (except cancelled ones, which
  // never happened) stays visible here — including once served — so the
  // customer can always see what they've had and the running bill total.
  const myOrders = orders
    .filter((o) => o.tableNumber === tableNumber && o.status !== "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt);

  if (myOrders.length === 0) return null;

  const billTotal = myOrders.reduce((sum, o) => sum + orderTotal(o), 0);

  return (
    <div className="px-4 pt-3 flex flex-col gap-2.5">
      <h2 className="text-[12px] font-bold text-[#8A8272] uppercase tracking-wide">{t("cart_your_orders")}</h2>
      {myOrders.map((order) => {
        const active = ACTIVE_STATUSES.includes(order.status);
        const queue = active ? getQueueInfo(order) : null;
        return (
          <div key={order.id} className="bg-white rounded-2xl p-3 border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_STYLE[order.status]}`}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
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
            <p className="text-[12.5px] text-[#22201B] mb-1.5">
              {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(", ")}
            </p>
            <div className="flex items-center justify-between">
              {queue ? (
                <div className="flex items-center gap-3 text-[11px] text-[#8A8272]">
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {t("cart_queue_position")}: #{queue.position}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 size={11} />
                    {t("cart_estimated_wait")}: ~{queue.estimatedMinutes} {t("nutrition_minutes")}
                  </span>
                </div>
              ) : (
                <span />
              )}
              <span className="text-[12px] font-bold text-[#2D5A3D]">${orderTotal(order).toFixed(2)}</span>
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
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#22201B] leading-tight line-clamp-1">{dish.name}</p>
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
  const { setActiveTab, tableNumber, getQueueInfo } = useApp();
  const { t } = useI18n();
  const queue = order ? getQueueInfo(order) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-[#E5F3EA] flex items-center justify-center">
        <CheckCircle2 size={34} className="text-[#2D5A3D]" />
      </div>
      <h2 className="text-[17px] font-bold text-[#22201B]">{t("cart_placed_title")}</h2>
      <p className="text-[13px] text-[#8A8272] leading-relaxed">{t("cart_placed_desc", { table: tableNumber })}</p>
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

export function CartScreen() {
  const { cart, updateQty, removeItem, clearCart, findDish, totalPrice, setActiveTab, placeOrder, tableNumber, orders } =
    useApp();
  const { t } = useI18n();
  const [justSubmitted, setJustSubmitted] = useState(false);

  if (justSubmitted) {
    // Recomputed fresh from the live `orders` list on every render, so this
    // picks up the just-created order as soon as it lands (local state
    // updates in the same tick; cloud mode a beat later via realtime).
    const order = [...orders]
      .filter((o) => o.tableNumber === tableNumber)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    return <OrderPlacedScreen order={order} onDone={() => setJustSubmitted(false)} />;
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
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
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF] flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-bold text-[#22201B]">{t("cart_title")}</h1>
          <p className="text-[11px] text-[#8A8272]">
            {t("chat_table")} {tableNumber}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 flex flex-col gap-2.5">
          {cart.map((item) => {
            const dish = findDish(item.dishId);
            if (!dish) return null;
            return (
              <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-black/5 shadow-sm">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#EFE9D8]">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-[#22201B] leading-tight">{dish.name}</p>
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
        <button
          onClick={() => {
            placeOrder(tableNumber);
            clearCart();
            setJustSubmitted(true);
          }}
          className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform"
        >
          {t("cart_confirm_order")}
        </button>
      </div>
    </div>
  );
}
