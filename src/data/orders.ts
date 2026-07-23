export type OrderStatus = "new" | "preparing" | "served" | "cancelled";

export interface OrderItem {
  dishId: string;
  dishName: string;
  qty: number;
  price: number;
  note?: string;
  /** Each dish moves through the kitchen independently — one item can be
   *  served while another in the same order is still preparing. */
  status: OrderStatus;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  /** Kept in sync with item statuses via deriveOrderStatus() — convenient
   *  for grouping/analytics, but per-item status is the source of truth. */
  status: OrderStatus;
  createdAt: number;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  served: "Served",
  cancelled: "Cancelled",
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: "preparing",
  preparing: "served",
  served: null,
  cancelled: null,
};

/** Only orders/items in these statuses count toward the kitchen queue. */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing"];

/** Recomputes an order's overall status from its items — served once every
 *  non-cancelled item is served, preparing once any item has started, new
 *  otherwise, cancelled only if every item was cancelled. */
export function deriveOrderStatus(items: OrderItem[]): OrderStatus {
  const relevant = items.filter((i) => i.status !== "cancelled");
  if (relevant.length === 0) return "cancelled";
  if (relevant.every((i) => i.status === "served")) return "served";
  if (relevant.some((i) => i.status === "preparing" || i.status === "served")) return "preparing";
  return "new";
}

/** Total price of an order, excluding any individually-cancelled items. */
export function orderTotal(order: Order): number {
  return order.items.filter((i) => i.status !== "cancelled").reduce((sum, i) => sum + i.price * i.qty, 0);
}
