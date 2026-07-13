export interface OrderItem {
  dishId: string;
  dishName: string;
  qty: number;
  price: number;
  note?: string;
}

export type OrderStatus = "new" | "preparing" | "served";

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
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: "preparing",
  preparing: "served",
  served: null,
};
