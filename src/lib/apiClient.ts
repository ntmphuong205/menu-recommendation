import { supabase } from "./supabaseClient";
import { getStoreSlug } from "./storeSlug";

const SESSION_KEY = "mp_customer_session_id";

/** Stable per-browser id sent with every order/reservation/review so the
 *  customer can later ask "my orders" without an account (mirrors Wexit's
 *  customer_session_id pattern). */
export function getCustomerSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const slug = getStoreSlug();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(slug ? { "X-Store-Slug": slug } : {}),
    ...(await authHeader()),
  };
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data && typeof data === "object" ? data.detail ?? data.message : null;
    throw new ApiError(res.status, typeof detail === "string" ? detail : `Request failed (${res.status})`);
  }
  return data as T;
}

// ---- Shapes matching api/index.py's *_to_public() responses ----

export interface ApiMenu {
  id: string;
  name: Record<string, string>;
  price: number;
  currency: string;
  desc: Record<string, string>;
  category: string;
  tags: string[];
  img: string;
  isSoldOut: boolean;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredientLines: { name: string; grams: number; custom?: Record<string, number> }[];
  allergyNote: Record<string, string>;
  prepTimeMinutes: number;
  pairings: { menu_id: string; reason: Record<string, string> }[];
  sizeVariants: ApiVariant[];
  flavorVariants: ApiVariant[];
  toppings: ApiVariant[];
}

type ApiVariant = { id: string; label: string; labels?: Record<string, string>; price: number; calories?: number | null };

export interface ApiTable {
  id: string; // table_code, e.g. "T1"
  db_id: string;
  x: number;
  y: number;
  status: "available" | "soon" | "reserved" | "occupied";
  view: string;
  tag: string;
  capacity: number;
  table_image: string;
  view_image: string;
}

export type ApiOrderStatus = "awaiting_payment" | "new" | "preparing" | "served" | "cancelled";
export type ApiFulfillmentType = "dine_in" | "pickup";
export type ApiPaymentMethod = "vnpay" | "bank_transfer";

export interface ApiOrder {
  id: string;
  table_id: string | null;
  menu_id: string;
  menu_name: string;
  quantity: number;
  total_price: number;
  currency: string;
  note: string;
  status: ApiOrderStatus;
  order_group_id: string;
  fulfillment_type: ApiFulfillmentType;
  pickup_code: string | null;
  pickup_time: string | null;
  payment_method: ApiPaymentMethod | null;
  customer_session_id: string;
  created_at: string;
  updated_at: string | null;
}

export type ApiReservationStatus = "reserved" | "waiting" | "accepted" | "cancelled";

export interface ApiReservation {
  id: string;
  table_id: string;
  status: ApiReservationStatus;
  customer_session_id: string;
  party_size: number;
  created_at: string;
  updated_at: string | null;
}

export interface ApiReview {
  id: string;
  rating: number;
  review_text: string;
  image: string;
  reply: string;
  menu_id: string | null;
  table_id: string | null;
  customer_session_id: string;
  created_at: string;
}

export interface ApiTableRequest {
  id: string;
  table_id: string;
  reason: string;
  resolved: boolean;
  customer_session_id: string | null;
  created_at: string;
}

export interface ApiChatMessage {
  id: string;
  customer_session_id: string;
  table_id: string | null;
  sender: "customer" | "staff";
  message: string;
  created_at: string;
}

/** One row per customer_session_id — the admin's inbox list, not the full
 *  message history (see getChatMessages for that). */
export interface ApiChatThread {
  customer_session_id: string;
  table_id: string | null;
  last_message: string;
  last_sender: "customer" | "staff";
  last_at: string;
  needs_reply: boolean;
}

export interface ApiStore {
  id: string;
  slug: string;
  name: string;
  hours: string;
  description: string;
  name_en: string;
  hours_en: string;
  description_en: string;
  menu_categories: string[];
  name_i18n: Record<string, string>;
  hours_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
  // VietQR bank transfer details — empty strings until the owner fills
  // them in via Store Settings.
  bank_bin: string;
  bank_account_number: string;
  bank_account_holder: string;
  // Owner-uploaded QR image (data URL) — fallback only, used when
  // bank_bin/bank_account_number aren't set. The auto-generated VietQR
  // image is preferred since it embeds each order's amount + tracking
  // code (a static uploaded image can't).
  bank_qr_image: string;
  // Daily "HH:MM" window remote pickup orders may be scheduled into.
  opening_time: string;
  closing_time: string;
  // Shown on the customer app's Info tab.
  phone: string;
  wifi_name: string;
  wifi_password: string;
  address: string;
  cover_image: string;
  filter_tags: string[];
  /** Manual "closed today" switch — independent of opening_time/
   *  closing_time, which only bound what pickup slot can be scheduled. */
  is_open: boolean;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  recommended_menu_ids: string[];
  suggested_cart_items: { menu_id: string; qty: number }[];
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ApiStoreSummary {
  store_id: string;
  slug: string;
  name: string;
}

/** Public homepage directory entry — deliberately excludes bank/private
 *  fields ApiStore carries (see store_to_directory_entry() in api/index.py). */
export interface ApiStoreDirectoryEntry {
  id: string;
  slug: string;
  name_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
  hours_i18n: Record<string, string>;
}

export const apiClient = {
  health: () =>
    request<{ success: boolean; database: string; gemini_configured: boolean }>("GET", "/health"),

  // Public — every store on this deployment, for the homepage's "choose a
  // restaurant" list. Not scoped to any particular store.
  getStores: () => request<ApiStoreDirectoryEntry[]>("GET", "/stores"),

  // Independent of the current X-Store-Slug — lists every store this
  // logged-in user is staff of, for the admin store switcher.
  getMyStores: () => request<{ stores: ApiStoreSummary[] }>("GET", "/my-stores"),

  getStore: () => request<ApiStore>("GET", "/store"),
  updateStore: (payload: {
    name: string;
    hours: string;
    description: string;
    menu_categories: string[];
    bank_bin?: string;
    bank_account_number?: string;
    bank_account_holder?: string;
    bank_qr_image?: string | null;
    opening_time?: string;
    closing_time?: string;
    phone?: string;
    wifi_name?: string;
    wifi_password?: string;
    address?: string;
    cover_image?: string | null;
    filter_tags?: string[];
  }) => request<{ success: boolean; store: ApiStore }>("PUT", "/store", payload),
  updateStoreStatus: (isOpen: boolean) =>
    request<{ success: boolean; store: ApiStore }>("PUT", "/store/status", { is_open: isOpen }),

  getKeywords: () => request<{ keywords: string[] }>("GET", "/keywords"),
  updateKeywords: (keywords: string[]) =>
    request<{ success: boolean; keywords: string[] }>("PUT", "/keywords", { keywords }),

  getMenus: () => request<ApiMenu[]>("GET", "/menus"),
  createMenu: (payload: Record<string, unknown>) =>
    request<{ success: boolean; menu: ApiMenu }>("POST", "/menus", payload),
  updateMenu: (id: string, payload: Record<string, unknown>) =>
    request<{ success: boolean; menu: ApiMenu }>("PUT", `/menus/${id}`, payload),
  deleteMenu: (id: string) => request<{ success: boolean }>("DELETE", `/menus/${id}`),

  getTables: () => request<ApiTable[]>("GET", "/tables"),
  updateTables: (tables: unknown[]) =>
    request<{ success: boolean; tables: ApiTable[] }>("PUT", "/tables", { tables }),

  getOrders: (customerSessionId?: string) =>
    request<ApiOrder[]>(
      "GET",
      `/orders${customerSessionId ? `?customer_session_id=${customerSessionId}` : ""}`
    ),
  createOrder: (payload: Record<string, unknown>) =>
    request<{ success: boolean; order: ApiOrder }>("POST", "/orders", payload),
  updateOrderStatus: (id: string, status: ApiOrderStatus) =>
    request<{ success: boolean; order: ApiOrder }>("PUT", `/orders/${id}/status`, { status }),

  initVnpayPayment: (orderGroupId: string) =>
    request<{ success: boolean; payment_url: string }>("POST", "/payments/vnpay/init", {
      order_group_id: orderGroupId,
    }),
  getPaymentStatus: (orderGroupId: string) =>
    request<{
      order_group_id: string;
      status: ApiOrderStatus;
      pickup_code: string | null;
      pickup_time: string | null;
      payment_method: ApiPaymentMethod | null;
      total_price: number;
      currency: string;
      // The actual bank-transfer/VNPay amount, always VND — use this (not
      // total_price, which is in the store's own menu currency) for
      // anything shown on or fed into the payment QR.
      amount_vnd: number;
    }>("GET", `/payments/status?order_group_id=${orderGroupId}`),

  getReservations: (customerSessionId?: string) =>
    request<ApiReservation[]>(
      "GET",
      `/reservations${customerSessionId ? `?customer_session_id=${customerSessionId}` : ""}`
    ),
  createReservation: (payload: Record<string, unknown>) =>
    request<{ success: boolean; reservation: ApiReservation }>("POST", "/reservations", payload),
  updateReservationStatus: (id: string, status: "accepted" | "cancelled") =>
    request<{ success: boolean; reservation: ApiReservation }>(
      "PUT",
      `/reservations/${id}/status`,
      { status }
    ),

  getReviews: () => request<ApiReview[]>("GET", "/reviews"),
  createReview: (payload: Record<string, unknown>) =>
    request<{ success: boolean; review: ApiReview }>("POST", "/reviews", payload),
  replyToReview: (id: string, reply: string) =>
    request<{ success: boolean; review: ApiReview }>("PUT", `/reviews/${id}`, { reply }),

  getTableRequests: () => request<ApiTableRequest[]>("GET", "/table-requests"),
  createTableRequest: (payload: Record<string, unknown>) =>
    request<{ success: boolean; request: ApiTableRequest }>("POST", "/table-requests", payload),
  resolveTableRequest: (id: string) =>
    request<{ success: boolean; request: ApiTableRequest }>(
      "PUT",
      `/table-requests/${id}/resolve`,
      {}
    ),

  getQueueStatus: () =>
    request<{ success: boolean; teams_ahead: number; people_ahead: number; est_time_mins: number }>(
      "GET",
      "/queue/status"
    ),

  getChatMessages: (customerSessionId: string) =>
    request<ApiChatMessage[]>("GET", `/chat-messages?customer_session_id=${customerSessionId}`),
  sendChatMessage: (payload: { customer_session_id: string; table_id?: string | null; message: string }) =>
    request<{ success: boolean; chat_message: ApiChatMessage }>("POST", "/chat-messages", payload),
  // Staff-only (JWT required) — the admin inbox and replying to a thread.
  getChatThreads: () => request<ApiChatThread[]>("GET", "/chat-messages/threads"),
  replyToChatThread: (customerSessionId: string, message: string) =>
    request<{ success: boolean; chat_message: ApiChatMessage }>(
      "POST",
      `/chat-messages/${customerSessionId}/reply`,
      { message }
    ),

  chat: (payload: {
    query: string;
    language: string;
    mode: "web" | "store";
    web_order_intent?: "dine_in" | "pickup" | null;
    history?: ChatHistoryTurn[];
  }) => request<ChatResponse>("POST", "/chat", payload),
};
