import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMenuData } from "../store/useMenuData";
import { useOrdersData } from "../store/useOrdersData";
import { useReviewsData } from "../store/useReviewsData";
import { useTableRequestsData } from "../store/useTableRequestsData";
import { useTablesData } from "../store/useTablesData";
import { useReservationsData } from "../store/useReservationsData";
import { useStoreData } from "../store/useStoreData";
import type { ApiTable, ApiReservation, ApiStore } from "../lib/apiClient";
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
  placeOrder: (tableId: string) => void;
  /** Remote pre-order paid upfront — packages the current cart, returns
   *  the order_group_id once every line item is created. */
  placePickupOrder: (paymentMethod: "vnpay" | "bank_transfer") => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (itemId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  /** Wait/queue info for one item within an order — null once that item is no longer active. */
  getQueueInfo: (order: Order, itemIndex: number) => QueueInfo | null;

  // seating layout + reservations
  tables: ApiTable[];
  reservations: ApiReservation[];
  requestReservation: (tableId: string, partySize: number) => Promise<void>;
  updateReservationStatus: (id: string, status: "accepted" | "cancelled") => void;

  // store info (read side only — StoreSettingsView writes via useStoreData() directly)
  store: ApiStore | null;

  // per-dish ratings & reviews
  reviews: Review[];
  addReview: (dishId: string, rating: number, comment: string) => void;
  replyToReview: (id: string, reply: string) => void;
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
  tableId: string;
  /** "web" QR codes (general/AI browsing only) vs "store" QR codes printed on
   *  a physical table (full ordering + reservation) — see TableQrView. */
  mode: "web" | "store";
}

export type TabKey = "chat" | "menu" | "cart" | "info" | "reserve";

const AppContext = createContext<AppContextValue | null>(null);

let itemCounter = 0;

/** The QR code a table's printout encodes puts its table_code (e.g. "T1")
 *  in `?table=`, matching Wexit's convention. Falls back to "T1" so the app
 *  still works when opened without a table param (e.g. during dev). */
function getTableFromUrl(): string {
  const param = new URLSearchParams(window.location.search).get("table");
  return param?.trim().toUpperCase() || "T1";
}

function getModeFromUrl(): "web" | "store" {
  return new URLSearchParams(window.location.search).get("mode") === "web" ? "web" : "store";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isOwnerRoute = location.pathname.startsWith("/admin");
  const { menu, addDish, updateDish, deleteDish } = useMenuData();
  const {
    orders,
    placeOrder: placeOrderRaw,
    placePickupOrder: placePickupOrderRaw,
    updateOrderStatus,
    updateItemStatus,
  } = useOrdersData();
  const { reviews, addReview: addReviewRaw, replyToReview } = useReviewsData();
  const { tableRequests, callStaff: callStaffRaw, resolveRequest } = useTableRequestsData(isOwnerRoute);
  // Owner views that need to write the layout (SeatLayoutView) call
  // useTablesData() directly for its saveLayout() — only the read side is
  // shared here.
  const { tables } = useTablesData();
  const { reservations, createReservation, updateReservationStatus } = useReservationsData(isOwnerRoute);
  const { store } = useStoreData();
  const [cart, setCart] = useState<CartItem[]>([]);
  // Web-mode QR codes (no table assigned yet) land straight on the
  // reservation screen, since that's the primary thing to do there;
  // table QR codes still land on Chat as before.
  const [activeTab, setActiveTab] = useState<TabKey>(() => (getModeFromUrl() === "web" ? "reserve" : "chat"));
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [tableId] = useState<string>(getTableFromUrl);
  const [mode] = useState<"web" | "store">(getModeFromUrl);

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

  const placeOrder = (tableIdToUse: string) => {
    const items = cart.map((i) => {
      const dish = findDish(i.dishId);
      return { dishId: i.dishId, dishName: dish?.name ?? "Unknown dish", qty: i.qty, price: dish?.price ?? 0, note: i.note };
    });
    placeOrderRaw(tableIdToUse, items, mode);
  };

  const placePickupOrder = (paymentMethod: "vnpay" | "bank_transfer") => {
    const items = cart.map((i) => {
      const dish = findDish(i.dishId);
      return { dishId: i.dishId, dishName: dish?.name ?? "Unknown dish", qty: i.qty, price: dish?.price ?? 0, note: i.note };
    });
    return placePickupOrderRaw(items, paymentMethod);
  };

  const requestReservation = async (tableIdToReserve: string, partySize: number) => {
    const table = tables.find((t) => t.id === tableIdToReserve);
    await createReservation(tableIdToReserve, table?.status ?? "available", partySize, mode);
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

  const addReview = (dishId: string, rating: number, comment: string) => addReviewRaw(dishId, tableId, rating, comment);
  const getDishRating = (dishId: string) => summarizeRatings(reviews, dishId);
  const callStaff = (reason: string) => callStaffRaw(tableId, reason);

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
        placePickupOrder,
        updateOrderStatus,
        updateItemStatus,
        cancelOrder,
        getQueueInfo,
        tables,
        reservations,
        requestReservation,
        updateReservationStatus,
        store,
        reviews,
        addReview,
        replyToReview,
        getDishRating,
        tableRequests,
        callStaff,
        resolveRequest,
        activeTab,
        setActiveTab,
        selectedDishId,
        setSelectedDishId,
        tableId,
        mode,
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
