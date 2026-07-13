import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { findDish } from "../data/menu";

export interface CartItem {
  id: string;
  dishId: string;
  qty: number;
  note?: string;
}

interface AppContextValue {
  cart: CartItem[];
  addToCart: (dishId: string, qty?: number, note?: string) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  selectedDishId: string | null;
  setSelectedDishId: (id: string | null) => void;
  justSubmitted: boolean;
  markSubmitted: () => void;
}

export type TabKey = "chat" | "menu" | "cart" | "info";

const AppContext = createContext<AppContextValue | null>(null);

let itemCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const addToCart = (dishId: string, qty = 1, note?: string) => {
    setCart((prev) => [...prev, { id: `c${Date.now()}_${itemCounter++}`, dishId, qty, note }]);
    setJustSubmitted(false);
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);
  const markSubmitted = () => setJustSubmitted(true);

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const totalPrice = useMemo(
    () => cart.reduce((sum, i) => sum + (findDish(i.dishId)?.price ?? 0) * i.qty, 0),
    [cart]
  );

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        activeTab,
        setActiveTab,
        selectedDishId,
        setSelectedDishId,
        justSubmitted,
        markSubmitted,
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
