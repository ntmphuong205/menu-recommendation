import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { usePersistentState } from "./usePersistentState";
import type { Order, OrderStatus } from "../data/orders";

interface OrderRow {
  id: string;
  table_number: number;
  items: Order["items"];
  status: OrderStatus;
  created_at: string;
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    tableNumber: row.table_number,
    items: row.items,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export interface OrdersData {
  orders: Order[];
  placeOrder: (tableNumber: number, items: Order["items"]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

let localIdCounter = 0;

export function useOrdersData(restaurantId: string | null): OrdersData {
  const [local, setLocal] = usePersistentState<Order[]>("fb_orders", []);
  const [cloud, setCloud] = useState<Order[]>([]);
  const usingCloud = isSupabaseConfigured && restaurantId != null;

  useEffect(() => {
    if (!usingCloud || !supabase) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase!
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (!cancelled) setCloud((data ?? []).map(fromRow));
    };

    refresh();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [usingCloud, restaurantId]);

  const orders = usingCloud ? cloud : local;

  const placeOrder = (tableNumber: number, items: Order["items"]) => {
    if (usingCloud && supabase && restaurantId) {
      supabase
        .from("orders")
        .insert({ restaurant_id: restaurantId, table_number: tableNumber, items, status: "new" })
        .then();
    } else {
      const order: Order = {
        id: `o${Date.now()}_${localIdCounter++}`,
        tableNumber,
        items,
        status: "new",
        createdAt: Date.now(),
      };
      setLocal((prev) => [order, ...prev]);
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    if (usingCloud && supabase) {
      supabase.from("orders").update({ status }).eq("id", orderId).then();
    } else {
      setLocal((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  };

  return { orders, placeOrder, updateOrderStatus };
}
