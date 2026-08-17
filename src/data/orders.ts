import type { TranslationKey } from "../i18n/translations";

export type OrderStatus = "awaiting_payment" | "new" | "preparing" | "served" | "cancelled";
export type FulfillmentType = "dine_in" | "pickup";
export type PaymentMethod = "vnpay" | "bank_transfer";

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
  /** Null for fulfillmentType "pickup" — not tied to a physical table. */
  tableId: string | null;
  items: OrderItem[];
  /** Kept in sync with item statuses via deriveOrderStatus() — convenient
   *  for grouping/analytics, but per-item status is the source of truth. */
  status: OrderStatus;
  createdAt: number;
  fulfillmentType: FulfillmentType;
  /** Shown to the customer and to staff at handoff — set once payment is
   *  confirmed. Null for dine_in orders and for pickup orders still
   *  awaiting payment. */
  pickupCode: string | null;
  /** Customer-chosen "HH:MM" collection time. Null for dine_in. */
  pickupTime: string | null;
  /** Null for dine_in. For pickup: vnpay confirms itself via IPN, staff
   *  must manually confirm bank_transfer (see OrdersView). */
  paymentMethod: PaymentMethod | null;
  /** Same anonymous id used for chat threads — lets the admin chat inbox
   *  show a guest's real pickupCode instead of a made-up label. */
  customerSessionId: string;
}

/** Maps a status to its translation key rather than baking in English text,
 *  so both the customer cart and the admin dashboard show it in whichever
 *  language is currently selected — call t(ORDER_STATUS_LABEL_KEY[status]). */
export const ORDER_STATUS_LABEL_KEY: Record<OrderStatus, TranslationKey> = {
  awaiting_payment: "order_status_awaiting_payment",
  new: "order_status_new",
  preparing: "order_status_preparing",
  served: "order_status_served",
  cancelled: "order_status_cancelled",
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  awaiting_payment: null,
  new: "preparing",
  preparing: "served",
  served: null,
  cancelled: null,
};

/** Only orders/items in these statuses count toward the kitchen queue —
 *  awaiting_payment orders haven't been paid for yet, so the kitchen
 *  shouldn't see them at all. */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing"];

/** Recomputes an order's overall status from its items — awaiting_payment
 *  while every item is still unpaid, served once every non-cancelled item
 *  is served, preparing once any item has started, new otherwise,
 *  cancelled only if every item was cancelled. */
export function deriveOrderStatus(items: OrderItem[]): OrderStatus {
  const relevant = items.filter((i) => i.status !== "cancelled");
  if (relevant.length === 0) return "cancelled";
  if (relevant.every((i) => i.status === "awaiting_payment")) return "awaiting_payment";
  if (relevant.every((i) => i.status === "served")) return "served";
  if (relevant.some((i) => i.status === "preparing" || i.status === "served")) return "preparing";
  return "new";
}

/** Total price of an order, excluding any individually-cancelled items. */
export function orderTotal(order: Order): number {
  return order.items.filter((i) => i.status !== "cancelled").reduce((sum, i) => sum + i.price * i.qty, 0);
}
