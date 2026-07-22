export interface OrderItem {
  dishId: string;
  dishName: string;
  qty: number;
  price: number;
  note?: string;
}

export type OrderStatus = "new" | "preparing" | "served" | "cancelled";

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
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

/** Only orders in these statuses count toward the kitchen queue. */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing"];
