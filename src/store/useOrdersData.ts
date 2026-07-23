import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { usePersistentState } from "./usePersistentState";
import { deriveOrderStatus, type Order, type OrderItem, type OrderStatus } from "../data/orders";

interface OrderRow {
  id: string;
  table_number: number;
  items: Order["items"];
  status: OrderStatus;
  created_at: string;
}

/** Orders placed before per-item status existed have items with no `status`
 *  field — default those to the order's own status so old data still renders. */
function normalizeItems(items: OrderItem[], orderStatus: OrderStatus): OrderItem[] {
  return items.map((item) => ({ ...item, status: item.status ?? orderStatus }));
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    tableNumber: row.table_number,
    items: normalizeItems(row.items, row.status),
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export interface OrdersData {
  orders: Order[];
  placeOrder: (tableNumber: number, items: Omit<OrderItem, "status">[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemIndex: number, status: OrderStatus) => void;
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

  const orders = usingCloud
    ? cloud
    : local.map((o) => ({ ...o, items: normalizeItems(o.items, o.status) }));

  const placeOrder = (tableNumber: number, items: Omit<OrderItem, "status">[]) => {
    const itemsWithStatus: OrderItem[] = items.map((i) => ({ ...i, status: "new" }));
    if (usingCloud && supabase && restaurantId) {
      supabase
        .from("orders")
        .insert({ restaurant_id: restaurantId, table_number: tableNumber, items: itemsWithStatus, status: "new" })
        .then();
    } else {
      const order: Order = {
        id: `o${Date.now()}_${localIdCounter++}`,
        tableNumber,
        items: itemsWithStatus,
        status: "new",
        createdAt: Date.now(),
      };
      setLocal((prev) => [order, ...prev]);
    }
  };

  // Whole-order actions (e.g. the customer cancelling before the kitchen
  // starts) cascade the new status to every item too, keeping them in sync.
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    if (usingCloud && supabase) {
      const current = cloud.find((o) => o.id === orderId);
      const items = current ? current.items.map((i) => ({ ...i, status })) : undefined;
      supabase
        .from("orders")
        .update(items ? { status, items } : { status })
        .eq("id", orderId)
        .then();
    } else {
      setLocal((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, items: o.items.map((i) => ({ ...i, status })) } : o))
      );
    }
  };

  const updateItemStatus = (orderId: string, itemIndex: number, status: OrderStatus) => {
    if (usingCloud && supabase) {
      const current = cloud.find((o) => o.id === orderId);
      if (!current) return;
      const items = current.items.map((item, idx) => (idx === itemIndex ? { ...item, status } : item));
      supabase
        .from("orders")
        .update({ items, status: deriveOrderStatus(items) })
        .eq("id", orderId)
        .then();
    } else {
      setLocal((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const items = o.items.map((item, idx) => (idx === itemIndex ? { ...item, status } : item));
          return { ...o, items, status: deriveOrderStatus(items) };
        })
      );
    }
  };

  return { orders, placeOrder, updateOrderStatus, updateItemStatus };
}
