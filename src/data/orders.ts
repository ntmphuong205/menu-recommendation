import type { TranslationKey } from "../i18n/translations";

export type OrderStatus = "new" | "preparing" | "served" | "cancelled";

export interface OrderItem {
  /** The backend's own order-row id — per-item status updates address this
   *  row directly (PUT /api/orders/{id}/status), not an index into `items`. */
  id: string;
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
  /** = order_group_id: every item confirmed together in one cart checkout
   *  shares this id, reconstructing "one order" on top of the backend's
   *  one-row-per-dish schema. */
  id: string;
  tableId: string;
  items: OrderItem[];
  /** Kept in sync with item statuses via deriveOrderStatus() — convenient
   *  for grouping/analytics, but per-item status is the source of truth. */
  status: OrderStatus;
  createdAt: number;
}

/** Maps a status to its translation key rather than baking in English text,
 *  so both the customer cart and the admin dashboard show it in whichever
 *  language is currently selected — call t(ORDER_STATUS_LABEL_KEY[status]). */
export const ORDER_STATUS_LABEL_KEY: Record<OrderStatus, TranslationKey> = {
  new: "order_status_new",
  preparing: "order_status_preparing",
  served: "order_status_served",
  cancelled: "order_status_cancelled",
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
