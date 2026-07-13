import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { usePersistentState } from "../store/usePersistentState";
import { DEFAULT_MENU, type Dish } from "../data/menu";
import type { Order, OrderStatus } from "../data/orders";

export interface CartItem {
  id: string;
  dishId: string;
  qty: number;
  note?: string;
}

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
  placeOrder: (tableNumber: number) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

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
  const [menu, setMenu] = usePersistentState<Dish[]>("fb_menu", DEFAULT_MENU);
  const [orders, setOrders] = usePersistentState<Order[]>("fb_orders", []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [tableNumber] = useState<number>(getTableFromUrl);

  const findDish = (id: string) => menu.find((d) => d.id === id);

  const addDish = (dish: Dish) => setMenu((prev) => [...prev, dish]);
  const updateDish = (id: string, patch: Partial<Dish>) =>
    setMenu((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const deleteDish = (id: string) => setMenu((prev) => prev.filter((d) => d.id !== id));

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

  const placeOrder = (tableNum: number): Order => {
    const order: Order = {
      id: `o${Date.now()}_${itemCounter++}`,
      tableNumber: tableNum,
      items: cart.map((i) => {
        const dish = findDish(i.dishId);
        return { dishId: i.dishId, dishName: dish?.name ?? "Unknown dish", qty: i.qty, price: dish?.price ?? 0, note: i.note };
      }),
      status: "new",
      createdAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

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
