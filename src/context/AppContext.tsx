import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMenuData } from "../store/useMenuData";
import { useOrdersData } from "../store/useOrdersData";
import { useReviewsData } from "../store/useReviewsData";
import { useTableRequestsData } from "../store/useTableRequestsData";
import { useRestaurantId } from "../store/useRestaurantId";
import type { Dish } from "../data/menu";
import type { Order, OrderStatus } from "../data/orders";
import { ACTIVE_STATUSES } from "../data/orders";
import type { Review, DishRatingSummary } from "../data/reviews";
import { summarizeRatings } from "../data/reviews";
import type { TableRequest } from "../data/tableRequests";

export interface CartItem {
  id: string;
  dishId: string;
  qty: number;
  note?: string;
}

export interface QueueInfo {
  position: number;
  estimatedMinutes: number;
}

const AVG_MINUTES_PER_ORDER_AHEAD = 6;

interface AppContextValue {
  // menu (shared, editable by the owner dashboard, read by the customer app)
  menu: Dish[];
  findDish: (id: string) => Dish | undefined;
  addDish: (dish: Dish) => void;
  updateDish: (id: string, patch: Partial<Dish>) => void;
  deleteDish: (id: string) => void;

  // customer cart
  cart: CartItem[];
  addToCart: (dishId: string, qty?: number, note?: string) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;

  // orders (shared, created by customer app, managed by owner dashboard)
  orders: Order[];
  placeOrder: (tableNumber: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemIndex: number, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  /** Wait/queue info for one item within an order — null once that item is no longer active. */
  getQueueInfo: (order: Order, itemIndex: number) => QueueInfo | null;

  // per-dish ratings & reviews
  reviews: Review[];
  addReview: (dishId: string, rating: number, comment: string) => void;
  getDishRating: (dishId: string) => DishRatingSummary;

  // "call staff" table requests
  tableRequests: TableRequest[];
  callStaff: (reason: string) => void;
  resolveRequest: (id: string) => void;

  // customer app navigation
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  selectedDishId: string | null;
  setSelectedDishId: (id: string | null) => void;
  tableNumber: number;
}

export type TabKey = "chat" | "menu" | "cart" | "info";

const AppContext = createContext<AppContextValue | null>(null);

let itemCounter = 0;

function getTableFromUrl(): number {
  const param = new URLSearchParams(window.location.search).get("table");
  const n = param ? parseInt(param, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const restaurantId = useRestaurantId();
  const { menu, addDish, updateDish, deleteDish } = useMenuData(restaurantId);
  const { orders, placeOrder: placeOrderRaw, updateOrderStatus, updateItemStatus } = useOrdersData(restaurantId);
  const { reviews, addReview: addReviewRaw } = useReviewsData(restaurantId);
  const { tableRequests, callStaff: callStaffRaw, resolveRequest } = useTableRequestsData(restaurantId);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [tableNumber] = useState<number>(getTableFromUrl);

  const findDish = (id: string) => menu.find((d) => d.id === id);

  const addToCart = (dishId: string, qty = 1, note?: string) => {
    setCart((prev) => [...prev, { id: `c${Date.now()}_${itemCounter++}`, dishId, qty, note }]);
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const totalPrice = useMemo(
    () => cart.reduce((sum, i) => sum + (findDish(i.dishId)?.price ?? 0) * i.qty, 0),
    [cart, menu]
  );

  const placeOrder = (tableNum: number) => {
    const items = cart.map((i) => {
      const dish = findDish(i.dishId);
      return { dishId: i.dishId, dishName: dish?.name ?? "Unknown dish", qty: i.qty, price: dish?.price ?? 0, note: i.note };
    });
    placeOrderRaw(tableNum, items);
  };

  const cancelOrder = (orderId: string) => updateOrderStatus(orderId, "cancelled");

  const getQueueInfo = (order: Order, itemIndex: number): QueueInfo | null => {
    const item = order.items[itemIndex];
    if (!item || !ACTIVE_STATUSES.includes(item.status)) return null;
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).sort((a, b) => a.createdAt - b.createdAt);
    const position = active.findIndex((o) => o.id === order.id) + 1;
    const ordersAhead = Math.max(0, position - 1);
    const prepTime = findDish(item.dishId)?.prepTimeMinutes ?? 10;
    return {
      position: position > 0 ? position : active.length + 1,
      estimatedMinutes: ordersAhead * AVG_MINUTES_PER_ORDER_AHEAD + prepTime,
    };
  };

  const addReview = (dishId: string, rating: number, comment: string) => addReviewRaw(dishId, tableNumber, rating, comment);
  const getDishRating = (dishId: string) => summarizeRatings(reviews, dishId);
  const callStaff = (reason: string) => callStaffRaw(tableNumber, reason);

  return (
    <AppContext.Provider
      value={{
        menu,
        findDish,
        addDish,
        updateDish,
        deleteDish,
        cart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        orders,
        placeOrder,
        updateOrderStatus,
        updateItemStatus,
        cancelOrder,
        getQueueInfo,
        reviews,
        addReview,
        getDishRating,
        tableRequests,
        callStaff,
        resolveRequest,
        activeTab,
        setActiveTab,
        selectedDishId,
        setSelectedDishId,
        tableNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
