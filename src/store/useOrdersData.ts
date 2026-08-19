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
      fulfillmentType: groupRows[0].fulfillment_type,
      pickupCode: groupRows[0].pickup_code,
      pickupTime: groupRows[0].pickup_time,
      paymentMethod: groupRows[0].payment_method,
      customerSessionId: groupRows[0].customer_session_id,
    };
  });
}

export interface NewOrderItem {
  dishId: string;
  qty: number;
  note?: string;
  /** Which size_variant (if any) was picked — the backend derives the
   *  actual price and kitchen-facing name from this, never from the client. */
  variantId?: string;
}

export interface OrdersData {
  orders: Order[];
  /** Awaits every line item's creation and returns the shared
   *  order_group_id — the caller needs it to show back exactly the order
   *  just placed (not just "whichever is newest for this table", which
   *  breaks if another diner at the same table submits one moments later),
   *  and to know if any item failed instead of silently declaring success. */
  placeOrder: (tableId: string, items: NewOrderItem[], mode: "web" | "store", lang: string) => Promise<string>;
  /** Remote pre-order, paid upfront — not tied to a table. */
  placePickupOrder: (
    items: NewOrderItem[],
    paymentMethod: "vnpay" | "bank_transfer",
    pickupTime: string,
    lang: string
  ) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (itemId: string, status: OrderStatus) => void;
}

export function useOrdersData(): OrdersData {
  const fetcher = useCallback(() => apiClient.getOrders(), []);
  const rows = usePollingData(fetcher);
  const orders = groupOrders(rows ?? []).sort((a, b) => b.createdAt - a.createdAt);

  const placeOrder = async (
    tableId: string,
    items: NewOrderItem[],
    mode: "web" | "store",
    lang: string
  ): Promise<string> => {
    const sessionId = getCustomerSessionId();
    const groupId = crypto.randomUUID();
    await Promise.all(
      items.map((item) =>
        apiClient.createOrder({
          table_id: tableId,
          menu_id: item.dishId,
          quantity: item.qty,
          note: item.note ?? "",
          customer_session_id: sessionId,
          mode,
          order_group_id: groupId,
          variant_id: item.variantId,
          lang,
        })
      )
    );
    return groupId;
  };

  const placePickupOrder = async (
    items: NewOrderItem[],
    paymentMethod: "vnpay" | "bank_transfer",
    pickupTime: string,
    lang: string
  ): Promise<string> => {
    const sessionId = getCustomerSessionId();
    const groupId = crypto.randomUUID();
    await Promise.all(
      items.map((item) =>
        apiClient.createOrder({
          menu_id: item.dishId,
          quantity: item.qty,
          note: item.note ?? "",
          customer_session_id: sessionId,
          mode: "web",
          fulfillment_type: "pickup",
          payment_method: paymentMethod,
          pickup_time: pickupTime,
          order_group_id: groupId,
          variant_id: item.variantId,
          lang,
        })
      )
    );
    return groupId;
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

  return { orders, placeOrder, placePickupOrder, updateOrderStatus, updateItemStatus };
}
