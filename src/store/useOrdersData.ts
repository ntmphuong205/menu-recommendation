import { useCallback } from "react";
import { apiClient, getCustomerSessionId, type ApiOrder, type ApiOrderStatus } from "../lib/apiClient";
import { usePollingData } from "./usePollingData";
import { deriveOrderStatus, type Order, type OrderItem, type OrderStatus } from "../data/orders";

function itemFromApi(row: ApiOrder): OrderItem {
  return {
    id: row.id,
    dishId: row.menu_id,
    dishName: row.menu_name,
    qty: row.quantity,
    price: row.quantity > 0 ? row.total_price / row.quantity : 0,
    note: row.note || undefined,
    status: row.status,
  };
}

/** Reconstructs ICAPS's "one Order has many items" grouping on top of the
 *  backend's one-row-per-dish schema, keyed by order_group_id. */
function groupOrders(rows: ApiOrder[]): Order[] {
  const groups = new Map<string, ApiOrder[]>();
  for (const row of rows) {
    const list = groups.get(row.order_group_id) ?? [];
    list.push(row);
    groups.set(row.order_group_id, list);
  }
  return Array.from(groups.entries()).map(([groupId, groupRows]) => {
    const items = groupRows.map(itemFromApi);
    return {
      id: groupId,
      tableId: groupRows[0].table_id,
      items,
      status: deriveOrderStatus(items),
      createdAt: Math.min(...groupRows.map((r) => new Date(r.created_at).getTime())),
    };
  });
}

export interface NewOrderItem {
  dishId: string;
  dishName: string;
  qty: number;
  price: number;
  note?: string;
}

export interface OrdersData {
  orders: Order[];
  placeOrder: (tableId: string, items: NewOrderItem[], mode: "web" | "store") => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (itemId: string, status: OrderStatus) => void;
}

export function useOrdersData(): OrdersData {
  const fetcher = useCallback(() => apiClient.getOrders(), []);
  const rows = usePollingData(fetcher);
  const orders = groupOrders(rows ?? []).sort((a, b) => b.createdAt - a.createdAt);

  const placeOrder = (tableId: string, items: NewOrderItem[], mode: "web" | "store") => {
    const sessionId = getCustomerSessionId();
    const groupId = crypto.randomUUID();
    for (const item of items) {
      apiClient
        .createOrder({
          table_id: tableId,
          menu_id: item.dishId,
          quantity: item.qty,
          note: item.note ?? "",
          customer_session_id: sessionId,
          mode,
          order_group_id: groupId,
        })
        .catch((err) => console.error("[MenuPilot] Failed to place order", err));
    }
  };

  // Whole-order actions (e.g. the customer cancelling before the kitchen
  // starts) cascade the new status to every item in the group.
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    for (const item of order.items) {
      apiClient
        .updateOrderStatus(item.id, status as ApiOrderStatus)
        .catch((err) => console.error("[MenuPilot] Failed to update order status", err));
    }
  };

  const updateItemStatus = (itemId: string, status: OrderStatus) => {
    apiClient
      .updateOrderStatus(itemId, status as ApiOrderStatus)
      .catch((err) => console.error("[MenuPilot] Failed to update item status", err));
  };

  return { orders, placeOrder, updateOrderStatus, updateItemStatus };
}
