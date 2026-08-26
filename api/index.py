from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from contextvars import ContextVar
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional
from urllib.parse import urlencode
from uuid import UUID

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, field_validator, model_validator
from supabase import Client, create_client


load_dotenv()
logger = logging.getLogger("qmenu")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
DEFAULT_STORE_ID = os.getenv("DEFAULT_STORE_ID", "").strip()
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# VNPay (remote pre-order + prepay pickup). The sandbox defaults let the
# whole flow be exercised end-to-end before a real merchant account exists —
# swap in production values via env vars only, no code change needed.
VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "").strip()
VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "").strip()
VNPAY_PAYMENT_URL = os.getenv(
    "VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
).strip()
VNPAY_RETURN_URL = os.getenv("VNPAY_RETURN_URL", "").strip()
VN_TIMEZONE = timezone(timedelta(hours=7))  # Vietnam has no DST, so this is exact year-round.
# VNPay only settles in VND. Menu prices in this deployment are stored as
# USD — this is a placeholder conversion for demo/pilot use, not a real FX
# feed. Set a store's currency to VND directly for accurate production
# pricing instead of relying on this rate.
USD_TO_VND_RATE = float(os.getenv("USD_TO_VND_RATE", "25000"))
# Same kind of placeholder rate, for the handful of leftover KRW-priced
# menu items (from before this deployment standardized on USD/VND) that
# still show up in analytics totals — informational display only.
KRW_TO_USD_RATE = float(os.getenv("KRW_TO_USD_RATE", "1350"))

# Business-analytics weather correlation (see /api/analytics/*) keys its
# daily weather off one fixed point rather than each store's own address —
# every store on this deployment is currently in Hanoi, and daily
# rain/temperature doesn't vary enough within one city to matter for this
# feature. Revisit (real geocoding) once a store outside Hanoi is added.
WEATHER_LAT = 21.0285
WEATHER_LON = 105.8542

TABLE_STATUSES = {"available", "reserved", "occupied"}
# Per-item kitchen status (replaces the old pending/completed/cancelled model
# with ICAPS's finer-grained new -> preparing -> served flow). awaiting_payment
# is a pre-kitchen holding state for remote pickup orders, only ever set by
# order creation and cleared by the VNPay IPN webhook — staff never set it.
ORDER_STATUSES = {"awaiting_payment", "new", "preparing", "served", "cancelled"}
RESERVATION_STATUSES = {"reserved", "waiting", "accepted", "cancelled"}
ACTIVE_RESERVATION_STATUSES = {"reserved", "waiting", "accepted"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_DATA_PATTERN = re.compile(
    r"^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$",
    re.IGNORECASE,
)

app = FastAPI(
    title="Q-Menu API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )


@app.get("/", include_in_schema=False)
def redirect_to_login() -> RedirectResponse:
    return RedirectResponse(url="/index.html", status_code=307)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_number(value: Any) -> float | int:
    number = float(value)
    return int(number) if number.is_integer() else number


def order_group_amount(rows: List[Dict[str, Any]]) -> float:
    """Sums an order group's line items in the store's own currency."""
    return sum(float(row["total_price"]) for row in rows)


def order_group_amount_vnd(rows: List[Dict[str, Any]]) -> int:
    """Same total, converted to VND if needed — VNPay only settles in VND,
    but menu prices in this deployment are USD. See USD_TO_VND_RATE's
    definition for the caveat this papers over."""
    total = order_group_amount(rows)
    if rows and rows[0].get("currency") == "USD":
        total *= USD_TO_VND_RATE
    return round(total)


def to_usd(amount: Any, currency: str) -> float:
    """Normalizes one order line's amount to USD for the business-analytics
    dashboard — a foreign audience reads USD far more easily than VND, and
    every store on this deployment prices most items in USD already."""
    value = float(amount)
    if currency == "VND":
        return value / USD_TO_VND_RATE
    if currency == "KRW":
        return value / KRW_TO_USD_RATE
    return value  # USD, or an unrecognized currency — best effort as-is


def vnpay_txn_ref(order_group_id: UUID) -> str:
    """VNPay's vnp_TxnRef must be plain alphanumeric — a hyphen-free UUID
    hex string round-trips cleanly via UUID(hex=...) on the way back."""
    return order_group_id.hex


def vnpay_txn_ref_to_group_id(txn_ref: str) -> Optional[str]:
    try:
        return str(UUID(hex=txn_ref))
    except (ValueError, AttributeError, TypeError):
        return None


def vnpay_sign(params: Dict[str, str]) -> str:
    hash_data = urlencode(sorted(params.items()))
    return hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def vnpay_verify(params: Dict[str, str]) -> bool:
    received_hash = params.get("vnp_SecureHash", "")
    signable = {
        k: v for k, v in params.items() if k not in ("vnp_SecureHash", "vnp_SecureHashType")
    }
    computed_hash = vnpay_sign(signable)
    return bool(received_hash) and hmac.compare_digest(computed_hash.lower(), received_hash.lower())


def validate_image_value(value: Optional[str]) -> Optional[str]:
    if value in (None, ""):
        return value
    if value.startswith("data:"):
        match = IMAGE_DATA_PATTERN.fullmatch(value)
        if not match:
            raise ValueError("Image must be JPEG, PNG, or WEBP format.")
        encoded = re.sub(r"\s+", "", match.group(2))
        decoded_size = (len(encoded) * 3) // 4
        if decoded_size > MAX_IMAGE_BYTES:
            raise ValueError("Image must be 5MB or smaller.")
    elif len(value) > 2048:
        raise ValueError("Image URL is too long.")
    return value


class StoreUpdate(BaseModel):
    # English is the admin form's single input language, like MenuPayload —
    # ko/vi are auto-translated from it (see auto_translate_fields).
    name: str = Field(min_length=1, max_length=120)
    hours: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=500)
    menu_categories: List[str] = Field(default_factory=list, max_length=50)
    # VietQR bank transfer details for remote pre-orders — optional, not
    # translated (bank details are the same in every language).
    bank_bin: str = Field(default="", max_length=20)
    bank_account_number: str = Field(default="", max_length=50)
    bank_account_holder: str = Field(default="", max_length=120)
    # Owner-uploaded QR image — fallback only (see PickupResultScreen.tsx);
    # the auto-generated VietQR image is preferred since it embeds each
    # order's amount + tracking code, which a static image can't.
    bank_qr_image: Optional[str] = None
    # Daily window remote pickup orders may be scheduled into — separate
    # from `hours` (freeform display text) since this needs to be a single
    # comparable HH:MM pair to validate pickup_time against in create_order.
    opening_time: str = Field(default="09:00")
    closing_time: str = Field(default="22:00")
    # Shown on the customer app's Info tab — plain text, same in every
    # language (a phone number and a wifi password don't need translating).
    phone: str = Field(default="", max_length=100)
    wifi_name: str = Field(default="", max_length=100)
    wifi_password: str = Field(default="", max_length=100)
    address: str = Field(default="", max_length=300)
    # Cover photo behind the store name/description on the customer app's
    # Info tab — same data-URL/hosted-URL convention as bank_qr_image.
    cover_image: Optional[str] = None
    # Which TagKey slugs (src/data/menu.ts) show as quick filter chips on
    # the customer Menu screen — empty means "use the built-in default set".
    # Not validated against the fixed TagKey enum here, same as menus.tags —
    # the frontend only ever offers valid slugs and ignores anything else.
    filter_tags: List[str] = Field(default_factory=list, max_length=20)

    @field_validator(
        "name", "hours", "description", "bank_bin", "bank_account_number",
        "bank_account_holder", "phone", "wifi_name", "wifi_password", "address",
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("menu_categories", "filter_tags")
    @classmethod
    def strip_categories(cls, values: List[str]) -> List[str]:
        return [str(item).strip() for item in values if str(item).strip()]

    @field_validator("bank_qr_image", "cover_image")
    @classmethod
    def validate_image_fields(cls, value: Optional[str]) -> Optional[str]:
        return validate_image_value(value)

    @field_validator("opening_time", "closing_time")
    @classmethod
    def validate_time_of_day(cls, value: str) -> str:
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError("Time must be in HH:MM 24-hour format.")
        return value

    @model_validator(mode="after")
    def check_hours_order(self) -> "StoreUpdate":
        if self.opening_time >= self.closing_time:
            raise ValueError("Opening time must be before closing time.")
        return self


class StoreStatusUpdate(BaseModel):
    # A separate, single-field endpoint on purpose — staff need to flip
    # this the moment they know they're closing early/unexpectedly, not
    # dig through the full Store Settings form and hit Save.
    is_open: bool


class IngredientLine(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    grams: float = Field(ge=0, le=5000)
    custom: Optional[Dict[str, float]] = None


class MenuPairing(BaseModel):
    menu_id: str = Field(min_length=1, max_length=64)
    reason: Dict[str, str] = Field(default_factory=dict)


class SizeVariant(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=1, max_length=60)
    labels: Dict[str, str] = Field(default_factory=dict)
    price: float = Field(ge=0)
    calories: Optional[int] = Field(default=None, ge=0)


class MenuPayload(BaseModel):
    name: Dict[str, str]
    price: float = Field(ge=0)
    currency: str = Field(min_length=1, max_length=8)
    desc: Dict[str, str]
    category: str = Field(default="", max_length=100)
    # Fixed TagKey slugs (e.g. "spicy", "popular") used by the customer app's
    # filter UI and the rule-based recommendation engine — not freeform
    # translated hashtags. Store-level AI recommendation hashtags are a
    # separate concept, already covered by stores.recommendation_keywords.
    tags: List[str] = Field(default_factory=list, max_length=30)
    img: Optional[str] = None
    isSoldOut: bool = False
    # Owner enters ingredients + grams; calories/protein/carbs/fat are
    # computed client-side from these and stored alongside them.
    calories: Optional[int] = Field(default=None, ge=0)
    protein: Optional[int] = Field(default=None, ge=0)
    carbs: Optional[int] = Field(default=None, ge=0)
    fat: Optional[int] = Field(default=None, ge=0)
    ingredientLines: List[IngredientLine] = Field(default_factory=list, max_length=30)
    allergyNote: Dict[str, str] = Field(default_factory=dict)
    prepTimeMinutes: int = Field(default=10, ge=1, le=240)
    pairings: List[MenuPairing] = Field(default_factory=list, max_length=10)
    sizeVariants: List[SizeVariant] = Field(default_factory=list, max_length=6)
    # Second independent single-pick choice, no price effect (e.g. Oolong /
    # Black tea / Jasmine milk tea as one dish) — see SizeVariant's shape.
    flavorVariants: List[SizeVariant] = Field(default_factory=list, max_length=10)
    # Optional add-ons, any number pickable — each adds its own price on top.
    toppings: List[SizeVariant] = Field(default_factory=list, max_length=15)

    @field_validator("name", "desc")
    @classmethod
    def require_source_text(cls, value: Dict[str, str]) -> Dict[str, str]:
        # English is the admin form's single input language; ko/vi are
        # auto-translated from it (see auto_translate_fields).
        if not str(value.get("en", "")).strip():
            raise ValueError("Name and description cannot be empty.")
        return {str(key): str(text).strip() for key, text in value.items()}

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return str(value or "").strip()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("img")
    @classmethod
    def validate_image(cls, value: Optional[str]) -> Optional[str]:
        return validate_image_value(value)


class TablePayload(BaseModel):
    id: str = Field(min_length=1, max_length=32)
    db_id: Optional[str] = None
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    status: Literal["available", "reserved", "occupied"]
    view: str = Field(default="", max_length=100)
    tag: str = Field(default="", max_length=100)
    capacity: int = Field(default=4, ge=1, le=50)
    table_image: Optional[str] = None
    view_image: Optional[str] = None

    @field_validator("id")
    @classmethod
    def normalize_table_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("table_image", "view_image")
    @classmethod
    def validate_table_images(cls, value: Optional[str]) -> Optional[str]:
        return validate_image_value(value)


class TableLayoutUpdate(BaseModel):
    tables: List[TablePayload] = Field(max_length=200)

    @model_validator(mode="after")
    def unique_table_codes(self) -> "TableLayoutUpdate":
        codes = [table.id for table in self.tables]
        if len(codes) != len(set(codes)):
            raise ValueError("Duplicate table codes are not allowed.")
        return self


class KeywordUpdate(BaseModel):
    keywords: List[str] = Field(max_length=50)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, values: List[str]) -> List[str]:
        normalized: List[str] = []
        for value in values:
            keyword = value.strip()
            if not keyword:
                continue
            keyword = keyword if keyword.startswith("#") else f"#{keyword}"
            if len(keyword) > 40:
                raise ValueError("Recommendation keywords must be 40 characters or fewer.")
            if keyword not in normalized:
                normalized.append(keyword)
        return normalized


class OrderCreate(BaseModel):
    # Required for fulfillment_type="dine_in" (validated below), unused and
    # left null for "pickup" — those orders aren't tied to a physical table.
    table_id: Optional[str] = Field(default=None, max_length=32)
    menu_id: UUID
    quantity: int = Field(ge=1, le=100)
    note: str = Field(default="", max_length=300)
    customer_session_id: UUID
    mode: Literal["web", "store"]
    fulfillment_type: Literal["dine_in", "pickup"] = "dine_in"
    # vnpay = confirmed automatically by the IPN webhook. bank_transfer =
    # VietQR, confirmed manually by staff. Required for pickup, unused for
    # dine_in.
    payment_method: Optional[Literal["vnpay", "bank_transfer"]] = None
    # Customer-chosen "HH:MM" collection time — required for pickup.
    pickup_time: Optional[str] = None
    # Shared across every line the client posts from one cart checkout, so
    # the frontend can regroup rows back into a single "order" for display.
    # Required for pickup orders — it's also what derives the pickup_code.
    order_group_id: Optional[UUID] = None
    # Which of the dish's size_variants (if any) was picked — the price and
    # kitchen-facing name are derived server-side from this, never trusted
    # directly from the client (see create_order).
    variant_id: Optional[str] = Field(default=None, max_length=32)
    # Which of the dish's flavor_variants (if any) was picked — no price
    # effect, just recorded in the kitchen-facing name.
    flavor_id: Optional[str] = Field(default=None, max_length=32)
    # Which of the dish's toppings (if any) were picked — any number; each
    # one's price is added on top, resolved server-side same as variant_id.
    topping_ids: List[str] = Field(default_factory=list, max_length=15)
    # The customer's selected language when they placed the order — baked
    # into menu_name once and frozen from then on (order history isn't
    # re-translated later). Falls back to English if omitted.
    lang: Optional[Literal["vi", "en", "ko"]] = None

    @field_validator("table_id")
    @classmethod
    def normalize_order_table_code(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value else value

    @field_validator("note")
    @classmethod
    def strip_note(cls, value: str) -> str:
        return value.strip()

    @field_validator("pickup_time")
    @classmethod
    def validate_pickup_time(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError("pickup_time must be in HH:MM 24-hour format.")
        return value

    @model_validator(mode="after")
    def check_fulfillment_requirements(self) -> "OrderCreate":
        if self.fulfillment_type == "dine_in" and not self.table_id:
            raise ValueError("table_id is required for dine-in orders.")
        if self.fulfillment_type == "pickup":
            if self.order_group_id is None:
                raise ValueError("order_group_id is required for pickup orders.")
            if self.payment_method is None:
                raise ValueError("payment_method is required for pickup orders.")
            if self.pickup_time is None:
                raise ValueError("pickup_time is required for pickup orders.")
        return self


class OrderStatusUpdate(BaseModel):
    # awaiting_payment is deliberately excluded — only order creation and
    # the VNPay IPN webhook ever set/clear it, never staff.
    status: Literal["new", "preparing", "served", "cancelled"]


class VnpayInitRequest(BaseModel):
    order_group_id: UUID


class ReservationCreate(BaseModel):
    table_id: str = Field(min_length=1, max_length=32)
    status: Literal["reserved", "waiting"]
    customer_session_id: UUID
    mode: Literal["web", "store"]
    party_size: int = Field(default=0, ge=0, le=50)

    @field_validator("table_id")
    @classmethod
    def normalize_reservation_table_code(cls, value: str) -> str:
        return value.strip().upper()


class ReservationStatusUpdate(BaseModel):
    status: Literal["accepted", "cancelled"]


class ReviewCreate(BaseModel):
    rating: float = Field(ge=0.5, le=5, multiple_of=0.5)
    review_text: str = Field(min_length=1, max_length=2000)
    image: Optional[str] = None
    menu_id: Optional[UUID] = None
    table_id: Optional[str] = Field(default=None, max_length=32)
    customer_session_id: UUID

    @field_validator("table_id")
    @classmethod
    def normalize_review_table_code(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value else value

    @field_validator("review_text")
    @classmethod
    def strip_review_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter review text.")
        return value

    @field_validator("image")
    @classmethod
    def validate_review_image(cls, value: Optional[str]) -> Optional[str]:
        return validate_image_value(value)


class ReviewReplyUpdate(BaseModel):
    reply: str = Field(max_length=1000)

    @field_validator("reply")
    @classmethod
    def strip_reply(cls, value: str) -> str:
        return str(value or "").strip()


class TableRequestCreate(BaseModel):
    table_id: str = Field(min_length=1, max_length=32)
    reason: str = Field(default="", max_length=200)
    customer_session_id: Optional[UUID] = None

    @field_validator("table_id")
    @classmethod
    def normalize_request_table_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class ChatMessageCreate(BaseModel):
    customer_session_id: UUID
    table_id: Optional[str] = Field(default=None, max_length=32)
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("table_id")
    @classmethod
    def normalize_chat_table_code(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value else value

    @field_validator("message")
    @classmethod
    def strip_chat_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message can't be empty.")
        return value


class StaffChatReply(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def strip_staff_reply(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message can't be empty.")
        return value


class ChatHistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="ko", min_length=2, max_length=10)
    mode: Literal["web", "store"] = "store"
    # Only meaningful when mode=="web" — mirrors DiningChoiceScreen's choice
    # on the frontend. "pickup" may order (paid upfront); "dine_in" (or
    # unset, before choosing) may not, same restriction as mode=="web" alone
    # used to mean before pickup ordering existed.
    web_order_intent: Optional[Literal["dine_in", "pickup"]] = None
    # Prior turns in this conversation (oldest first), excluding `query`
    # itself — lets the model handle follow-ups like "the second one" or
    # "make that spicier" instead of answering each message in isolation.
    history: List[ChatHistoryTurn] = Field(default_factory=list, max_length=20)

    @field_validator("query")
    @classmethod
    def strip_query(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please enter a question for the AI.")
        return value


class SuggestedCartItem(BaseModel):
    menu_id: str
    qty: int = Field(default=1, ge=1, le=20)


class GeminiChatResponse(BaseModel):
    reply: str
    recommended_menu_ids: List[str] = Field(default_factory=list)
    # AI-proposed cart additions; the frontend renders these as tappable
    # chips the customer must confirm — the model never mutates the cart
    # directly (see ChatScreen).
    suggested_cart_items: List[SuggestedCartItem] = Field(default_factory=list)


def menu_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "name": row.get("name") or {},
        "price": public_number(row.get("price", 0)),
        "currency": row.get("currency", "KRW"),
        "desc": row.get("description") or {},
        "category": row.get("category") or "",
        "tags": row.get("tags") or [],
        "img": row.get("image_data") or row.get("image_url") or "",
        "isSoldOut": bool(row.get("is_sold_out", False)),
        "calories": row.get("calories"),
        "protein": row.get("protein"),
        "carbs": row.get("carbs"),
        "fat": row.get("fat"),
        "ingredientLines": row.get("ingredient_lines") or [],
        "allergyNote": row.get("allergy_note") or {},
        "prepTimeMinutes": row.get("prep_time_minutes") or 10,
        "pairings": row.get("pairings") or [],
        "sizeVariants": row.get("size_variants") or [],
        "flavorVariants": row.get("flavor_variants") or [],
        "toppings": row.get("toppings") or [],
    }


def table_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["table_code"],
        "db_id": str(row["id"]),
        "x": public_number(row.get("x", 0)),
        "y": public_number(row.get("y", 0)),
        "status": row.get("status", "available"),
        "view": row.get("view_name") or "",
        "tag": row.get("tag") or "",
        "capacity": int(row.get("capacity", 4)),
        "table_image": row.get("table_image") or "",
        "view_image": row.get("view_image") or "",
        # Everything before this moment belongs to a previous sitting at
        # this table — see MyOrdersSection on the frontend, which uses it
        # to stop showing a new party the last group's orders.
        "session_started_at": row.get("session_started_at"),
    }


def order_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "table_id": row.get("table_id"),
        "menu_id": str(row["menu_id"]),
        "menu_name": row["menu_name"],
        "quantity": int(row["quantity"]),
        "total_price": public_number(row["total_price"]),
        "currency": row["currency"],
        "note": row.get("note") or "",
        "status": row["status"],
        "order_group_id": str(row["order_group_id"]),
        "fulfillment_type": row.get("fulfillment_type") or "dine_in",
        "pickup_code": row.get("pickup_code"),
        "pickup_time": row.get("pickup_time"),
        "payment_method": row.get("payment_method"),
        "customer_session_id": row["customer_session_id"],
        "created_at": row["created_at"],
        "updated_at": row.get("updated_at"),
    }


def reservation_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "table_id": row["table_id"],
        "status": row["status"],
        "customer_session_id": row["customer_session_id"],
        "party_size": int(row.get("party_size") or 0),
        "created_at": row["created_at"],
        "updated_at": row.get("updated_at"),
    }


def review_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "rating": public_number(row["rating"]),
        "review_text": row["review_text"],
        "image": row.get("image_data") or "",
        "reply": row.get("reply") or "",
        "menu_id": str(row["menu_id"]) if row.get("menu_id") else None,
        "table_id": row.get("table_id"),
        "customer_session_id": row["customer_session_id"],
        "created_at": row["created_at"],
    }


def table_request_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "table_id": row["table_id"],
        "reason": row.get("reason") or "",
        "resolved": bool(row.get("resolved", False)),
        "customer_session_id": row.get("customer_session_id"),
        "created_at": row["created_at"],
    }


def chat_message_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "customer_session_id": row["customer_session_id"],
        "table_id": row.get("table_id"),
        "sender": row["sender"],
        "message": row["message"],
        "created_at": row["created_at"],
    }


class SupabaseRepository:
    def __init__(self, client: Client, store_id: str) -> None:
        self.client = client
        self.store_id = store_id

    def _run(self, operation: Any, message: str) -> Any:
        try:
            return operation()
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("%s", message)
            raise HTTPException(status_code=502, detail=message) from exc

    def health(self) -> bool:
        try:
            self.client.table("stores").select("id").eq(
                "id", self.store_id
            ).limit(1).execute()
            return True
        except Exception:
            logger.exception("Supabase health check failed")
            return False

    def get_store(self) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("stores")
            .select("*")
            .eq("id", self.store_id)
            .limit(1)
            .execute(),
            "Failed to load store information.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Store information not found.")
        return response.data[0]

    def update_store(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("stores")
            .update({**payload, "updated_at": utc_now()})
            .eq("id", self.store_id)
            .execute(),
            "Failed to save store information.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Store information not found.")
        return response.data[0]

    def get_menus(self) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("menus")
            .select("*")
            .eq("store_id", self.store_id)
            .order("created_at", desc=True)
            .execute(),
            "Failed to load menus.",
        )
        return response.data or []

    def get_menu(self, menu_id: str) -> Optional[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("menus")
            .select("*")
            .eq("store_id", self.store_id)
            .eq("id", menu_id)
            .limit(1)
            .execute(),
            "Failed to load menus.",
        )
        return response.data[0] if response.data else None

    def create_menu(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("menus")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to create the menu item.",
        )
        return response.data[0]

    def update_menu(self, menu_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("menus")
            .update({**payload, "updated_at": utc_now()})
            .eq("store_id", self.store_id)
            .eq("id", menu_id)
            .execute(),
            "Failed to update the menu item.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Menu item not found.")
        return response.data[0]

    def delete_menu(self, menu_id: str) -> None:
        if not self.get_menu(menu_id):
            raise HTTPException(status_code=404, detail="Menu item not found.")
        self._run(
            lambda: self.client.table("menus")
            .delete()
            .eq("store_id", self.store_id)
            .eq("id", menu_id)
            .execute(),
            "Failed to delete the menu item.",
        )

    def get_tables(self) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("tables")
            .select("*")
            .eq("store_id", self.store_id)
            .order("sort_order")
            .execute(),
            "Failed to load the seating layout.",
        )
        return response.data or []

    def get_table(self, table_code: str) -> Optional[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("tables")
            .select("*")
            .eq("store_id", self.store_id)
            .eq("table_code", table_code)
            .limit(1)
            .execute(),
            "Failed to load table information.",
        )
        return response.data[0] if response.data else None

    def mark_table_occupied(self, table_code: str) -> None:
        self._run(
            lambda: self.client.table("tables")
            .update({"status": "occupied", "session_started_at": utc_now(), "updated_at": utc_now()})
            .eq("store_id", self.store_id)
            .eq("table_code", table_code)
            .execute(),
            "Failed to update table status.",
        )

    def clear_table(self, table_code: str) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("tables")
            .update({"status": "available", "session_started_at": utc_now(), "updated_at": utc_now()})
            .eq("store_id", self.store_id)
            .eq("table_code", table_code)
            .execute(),
            "Failed to clear the table.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Table not found.")
        return response.data[0]

    def replace_tables(self, tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        payload = [
            {
                "id": table.get("db_id"),
                "table_code": table["id"],
                "x": table["x"],
                "y": table["y"],
                "status": table["status"],
                "view_name": table.get("view", ""),
                "tag": table.get("tag", ""),
                "capacity": table.get("capacity", 4),
                "table_image": table.get("table_image") or None,
                "view_image": table.get("view_image") or None,
                "sort_order": index,
            }
            for index, table in enumerate(tables, start=1)
        ]
        self._run(
            lambda: self.client.rpc(
                "replace_store_tables",
                {"p_store_id": self.store_id, "p_tables": payload},
            ).execute(),
            "Failed to save the seating layout.",
        )
        return self.get_tables()

    def get_keywords(self) -> List[str]:
        return list(self.get_store().get("recommendation_keywords") or [])

    def update_keywords(self, keywords: List[str]) -> List[str]:
        self.update_store({"recommendation_keywords": keywords})
        return keywords

    def get_orders(
        self, customer_session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # PostgREST caps a single response at 1000 rows regardless of any
        # .limit() passed — a store with more history than that (the norm
        # once a restaurant's been live a while) would otherwise silently
        # lose its oldest orders here, same issue get_orders_since had.
        # customer_session_id-scoped calls (a diner's own order history)
        # never come close to that, but paging unconditionally is simpler
        # and just as correct as branching on which case this is.
        page_size = 1000
        rows: List[Dict[str, Any]] = []
        start = 0
        while True:
            def operation(start=start) -> Any:
                query = (
                    self.client.table("orders")
                    .select("*")
                    .eq("store_id", self.store_id)
                )
                if customer_session_id:
                    query = query.eq("customer_session_id", customer_session_id)
                return query.order("created_at", desc=True).range(start, start + page_size - 1).execute()

            response = self._run(operation, "Failed to load orders.")
            page = response.data or []
            rows.extend(page)
            if len(page) < page_size:
                break
            start += page_size
        return rows

    def get_orders_by_group(self, order_group_id: str) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("orders")
            .select("*")
            .eq("store_id", self.store_id)
            .eq("order_group_id", order_group_id)
            .execute(),
            "Failed to load the order.",
        )
        return response.data or []

    def create_order(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("orders")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to create the order.",
        )
        return response.data[0]

    def update_order_status(
        self, order_id: str, status: str
    ) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("orders")
            .update({"status": status, "updated_at": utc_now()})
            .eq("store_id", self.store_id)
            .eq("id", order_id)
            .execute(),
            "Failed to update order status.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found.")
        return response.data[0]

    def get_orders_since(self, since_iso: str) -> List[Dict[str, Any]]:
        """Order lines for business analytics — embeds each item's menu
        category and ingredient_lines via the orders.menu_id FK so revenue/
        quantity/ingredient-consumption can be broken down without a
        per-row round-trip. PostgREST caps a single response at 1000 rows
        regardless of any .limit() passed, which a 90-day window comfortably
        exceeds even for a mid-size restaurant — page through with .range()
        until a page comes back short."""
        page_size = 1000
        rows: List[Dict[str, Any]] = []
        start = 0
        while True:
            response = self._run(
                lambda start=start: self.client.table("orders")
                .select("*, menus(category, ingredient_lines)")
                .eq("store_id", self.store_id)
                .neq("status", "cancelled")
                .gte("created_at", since_iso)
                .order("created_at")
                .range(start, start + page_size - 1)
                .execute(),
                "Failed to load order history.",
            )
            page = response.data or []
            rows.extend(page)
            if len(page) < page_size:
                break
            start += page_size
        return rows

    def get_weather_daily(self, since_date: str) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("weather_daily")
            .select("*")
            .eq("store_id", self.store_id)
            .gte("date", since_date)
            .order("date")
            .execute(),
            "Failed to load weather history.",
        )
        return response.data or []

    def get_reservations(
        self, customer_session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        def operation() -> Any:
            query = (
                self.client.table("reservations")
                .select("*")
                .eq("store_id", self.store_id)
            )
            if customer_session_id:
                query = query.eq("customer_session_id", customer_session_id)
            return query.order("created_at", desc=True).execute()

        response = self._run(operation, "Failed to load reservations.")
        return response.data or []

    def has_active_reservation(self, table_id: str) -> bool:
        response = self._run(
            lambda: self.client.table("reservations")
            .select("id")
            .eq("store_id", self.store_id)
            .eq("table_id", table_id)
            .in_("status", list(ACTIVE_RESERVATION_STATUSES))
            .limit(1)
            .execute(),
            "Failed to check for a duplicate reservation.",
        )
        return bool(response.data)

    def create_reservation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("reservations")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to create the reservation.",
        )
        return response.data[0]

    def update_reservation_status(
        self, reservation_id: str, status: str
    ) -> Dict[str, Any]:
        existing = self._run(
            lambda: self.client.table("reservations")
            .select("id")
            .eq("store_id", self.store_id)
            .eq("id", reservation_id)
            .limit(1)
            .execute(),
            "Failed to verify the reservation.",
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Reservation not found.")
        response = self._run(
            lambda: self.client.rpc(
                "update_reservation_and_table",
                {
                    "p_store_id": self.store_id,
                    "p_reservation_id": reservation_id,
                    "p_status": status,
                },
            ).execute(),
            "Failed to update reservation status.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Reservation not found.")
        return response.data

    def get_reviews(self) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("reviews")
            .select("*")
            .eq("store_id", self.store_id)
            .order("created_at", desc=True)
            .execute(),
            "Failed to load reviews.",
        )
        return response.data or []

    def create_review(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("reviews")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to create the review.",
        )
        if not response.data:
            raise HTTPException(
                status_code=502,
                detail="Could not confirm the review was saved.",
            )
        return response.data[0]

    def update_review_reply(self, review_id: str, reply: str) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("reviews")
            .update({"reply": reply})
            .eq("store_id", self.store_id)
            .eq("id", review_id)
            .execute(),
            "Failed to save the review reply.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found.")
        return response.data[0]

    def get_table_requests(self) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("table_requests")
            .select("*")
            .eq("store_id", self.store_id)
            .order("created_at", desc=True)
            .execute(),
            "Failed to load staff call requests.",
        )
        return response.data or []

    def create_table_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("table_requests")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to create the staff call request.",
        )
        return response.data[0]

    def resolve_table_request(self, request_id: str) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("table_requests")
            .update({"resolved": True})
            .eq("store_id", self.store_id)
            .eq("id", request_id)
            .execute(),
            "Failed to resolve the staff call request.",
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Request not found.")
        return response.data[0]

    def get_chat_messages(self, customer_session_id: str) -> List[Dict[str, Any]]:
        response = self._run(
            lambda: self.client.table("chat_messages")
            .select("*")
            .eq("store_id", self.store_id)
            .eq("customer_session_id", customer_session_id)
            .order("created_at")
            .execute(),
            "Failed to load chat messages.",
        )
        return response.data or []

    def create_chat_message(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._run(
            lambda: self.client.table("chat_messages")
            .insert({"store_id": self.store_id, **payload})
            .execute(),
            "Failed to send the message.",
        )
        return response.data[0]

    def get_chat_threads(self) -> List[Dict[str, Any]]:
        """One summary per customer_session_id — last message, who sent it
        (needs_reply=True means the customer's waiting on staff), and
        whichever table_id was last seen for that session, if any."""
        response = self._run(
            lambda: self.client.table("chat_messages")
            .select("*")
            .eq("store_id", self.store_id)
            .order("created_at")
            .execute(),
            "Failed to load chat threads.",
        )
        threads: Dict[str, Dict[str, Any]] = {}
        for row in response.data or []:
            sid = row["customer_session_id"]
            existing_table_id = threads.get(sid, {}).get("table_id")
            threads[sid] = {
                "customer_session_id": sid,
                "table_id": row.get("table_id") or existing_table_id,
                "last_message": row["message"],
                "last_sender": row["sender"],
                "last_at": row["created_at"],
                "needs_reply": row["sender"] == "customer",
            }
        return sorted(threads.values(), key=lambda t: t["last_at"], reverse=True)

    def is_staff(self, user_id: str) -> bool:
        response = self._run(
            lambda: self.client.table("staff")
            .select("id")
            .eq("id", user_id)
            .eq("store_id", self.store_id)
            .limit(1)
            .execute(),
            "Failed to verify permissions.",
        )
        return bool(response.data)


REPOSITORY_ERROR = ""

# One Supabase client, shared by every request/store — cheap to reuse, no
# per-request network cost. Which store a given request operates on is
# resolved per-request (see resolve_store_middleware) instead of being
# fixed at import time, so one deployment can serve many restaurants.
supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception:
        logger.exception("Supabase client initialization failed")
        REPOSITORY_ERROR = "Failed to initialize the Supabase client."
else:
    missing = [
        name
        for name, value in (
            ("SUPABASE_URL", SUPABASE_URL),
            ("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY),
        )
        if not value
    ]
    REPOSITORY_ERROR = "Missing required Supabase environment variables: " + ", ".join(missing)

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Set once per request by resolve_store_middleware, read by get_repository().
# ContextVars are task-scoped, so concurrent requests for different stores
# never see each other's value — this is what makes per-request store
# resolution safe under FastAPI's async concurrency.
_current_store_id: ContextVar[Optional[str]] = ContextVar("current_store_id", default=None)
# True only when a slug was explicitly sent but didn't match any store — as
# opposed to no slug being sent at all, which legitimately falls back to
# DEFAULT_STORE_ID. Without this distinction a mistyped/unknown ?store=
# slug would silently show a *different* restaurant's data instead of
# erroring, which would be a real cross-tenant data leak.
_store_not_found: ContextVar[bool] = ContextVar("store_not_found", default=False)
_slug_cache: Dict[str, str] = {}


def resolve_store_id_by_slug(slug: str) -> Optional[str]:
    """Looks up a store's id from its URL slug (?store=<slug> on customer
    links, or the admin's selected store). Cached in-process since slugs
    rarely change once a restaurant is provisioned."""
    if slug in _slug_cache:
        return _slug_cache[slug]
    if not supabase_client:
        return None
    try:
        response = (
            supabase_client.table("stores").select("id").eq("slug", slug).limit(1).execute()
        )
    except Exception:
        logger.exception("Store slug lookup failed")
        return None
    if not response.data:
        return None
    store_id = response.data[0]["id"]
    _slug_cache[slug] = store_id
    return store_id


@app.middleware("http")
async def resolve_store_middleware(request: Request, call_next):
    slug = request.headers.get("x-store-slug", "").strip()
    if slug:
        store_id = resolve_store_id_by_slug(slug)
        not_found_token = _store_not_found.set(store_id is None)
    else:
        # No slug header at all — fall back to DEFAULT_STORE_ID. Keeps
        # already-printed QR codes and any client that predates
        # multi-tenancy working unchanged.
        store_id = DEFAULT_STORE_ID or None
        not_found_token = _store_not_found.set(False)
    id_token = _current_store_id.set(store_id)
    try:
        return await call_next(request)
    finally:
        _current_store_id.reset(id_token)
        _store_not_found.reset(not_found_token)


def get_repository() -> SupabaseRepository:
    if _store_not_found.get():
        raise HTTPException(status_code=404, detail="Store not found.")
    store_id = _current_store_id.get()
    if not supabase_client or not store_id:
        raise HTTPException(
            status_code=503,
            detail=REPOSITORY_ERROR or "The database is not configured.",
        )
    return SupabaseRepository(supabase_client, store_id)


def require_staff(authorization: str = Header(default="")) -> Dict[str, Any]:
    """Verify a Supabase Auth JWT and require a matching `staff` row for this
    store. Applied to every admin write route — without this, any of them
    is reachable by anyone who can hit the deployed URL."""
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Login required.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Login required.")

    repo = get_repository()
    try:
        user_response = repo.client.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.") from exc

    user = getattr(user_response, "user", None)
    if not user or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    if not repo.is_staff(user.id):
        raise HTTPException(status_code=403, detail="You do not have admin access to this store.")
    return {"id": user.id, "email": getattr(user, "email", None)}


def menu_payload_to_row(payload: MenuPayload, include_image: bool) -> Dict[str, Any]:
    translatable = {
        "name": payload.name.get("en", ""),
        "description": payload.desc.get("en", ""),
        "allergy_note": payload.allergyNote.get("en", ""),
    }
    generated = auto_translate_fields(translatable)
    name = complete_translation(payload.name, generated, "name")
    description = complete_translation(payload.desc, generated, "description")
    allergy_note = complete_translation(
        payload.allergyNote, generated, "allergy_note"
    )
    row: Dict[str, Any] = {
        "name": name,
        "price": payload.price,
        "currency": payload.currency,
        "description": description,
        "category": payload.category,
        "tags": payload.tags,
        "is_sold_out": payload.isSoldOut,
        "calories": payload.calories,
        "protein": payload.protein,
        "carbs": payload.carbs,
        "fat": payload.fat,
        "ingredient_lines": [line.model_dump() for line in payload.ingredientLines],
        "allergy_note": allergy_note,
        "prep_time_minutes": payload.prepTimeMinutes,
        "pairings": [pairing.model_dump() for pairing in payload.pairings],
        "size_variants": [variant.model_dump() for variant in payload.sizeVariants],
        "flavor_variants": [variant.model_dump() for variant in payload.flavorVariants],
        "toppings": [variant.model_dump() for variant in payload.toppings],
    }
    if include_image:
        row["image_data"] = payload.img or None
    return row


def auto_translate_fields(
    fields: Dict[str, str], *, strict: bool = False
) -> Dict[str, Dict[str, str]]:
    """Translate English source fields (the admin form's only input language)
    into Korean and Vietnamese in one AI request, with a safe source fallback."""
    fallback = {
        language: {key: value for key, value in fields.items()}
        for language in ("ko", "vi")
    }
    if not any(fields.values()):
        return fallback
    if not gemini_client:
        if strict:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Automatic translation is unavailable. Enter the Korean/Vietnamese "
                    "text yourself or check the AI configuration."
                ),
            )
        return fallback
    try:
        field_schema = {
            "type": "object",
            "properties": {
                key: {"type": "string"} for key in fields
            },
            "required": list(fields),
            "additionalProperties": False,
        }
        translation_schema = {
            "type": "object",
            "properties": {
                "ko": field_schema,
                "vi": field_schema,
            },
            "required": ["ko", "vi"],
            "additionalProperties": False,
        }
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=json.dumps(fields, ensure_ascii=False),
            config=types.GenerateContentConfig(
                system_instruction=(
                    "Translate every JSON value from English into natural restaurant-context "
                    "Korean and Vietnamese. Preserve keys, numbers, time ranges, and hashtag "
                    "prefixes. Return JSON only in this exact shape: "
                    '{"ko":{"key":"translation"},"vi":{"key":"translation"}}.'
                ),
                response_mime_type="application/json",
                response_json_schema=translation_schema,
                thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.MINIMAL),
            ),
        )
        parsed = (
            response.parsed
            if isinstance(response.parsed, dict)
            else json.loads(response.text or "{}")
        )
        translated: Dict[str, Dict[str, str]] = {}
        for language in ("ko", "vi"):
            language_values = parsed.get(language)
            if not isinstance(language_values, dict):
                raise ValueError(f"Missing {language} translation object")
            translated[language] = {}
            for key, value in fields.items():
                translated_value = str(language_values.get(key) or "").strip()
                if value and not translated_value:
                    raise ValueError(
                        f"Missing {language} translation for {key}"
                    )
                translated[language][key] = translated_value or value
        return translated
    except Exception as exc:
        logger.exception("Automatic translation failed")
        if strict:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Automatic translation failed. Enter the Korean/Vietnamese text "
                    "yourself or check the AI configuration."
                ),
            ) from exc
        return fallback


def complete_translation(
    current: Dict[str, str], generated: Dict[str, Dict[str, str]], field: str
) -> Dict[str, str]:
    english = str(current.get("en", "")).strip()
    return {
        "en": english,
        "ko": str(current.get("ko", "")).strip()
        or generated.get("ko", {}).get(field, english),
        "vi": str(current.get("vi", "")).strip()
        or generated.get("vi", {}).get(field, english),
    }


def store_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "slug": row.get("slug") or "",
        "name": row["name"],
        "hours": row.get("hours") or "",
        "description": row.get("description") or "",
        "name_en": row.get("name_en") or "",
        "hours_en": row.get("hours_en") or "",
        "description_en": row.get("description_en") or "",
        "menu_categories": row.get("menu_categories") or [],
        "name_i18n": {
            "ko": row["name"],
            "en": row.get("name_en") or row["name"],
            "vi": row.get("name_vi") or row["name"],
        },
        "hours_i18n": {
            "ko": row.get("hours") or "",
            "en": row.get("hours_en") or row.get("hours") or "",
            "vi": row.get("hours_vi") or row.get("hours") or "",
        },
        "description_i18n": {
            "ko": row.get("description") or "",
            "en": row.get("description_en") or row.get("description") or "",
            "vi": row.get("description_vi") or row.get("description") or "",
        },
        "bank_bin": row.get("bank_bin") or "",
        "bank_account_number": row.get("bank_account_number") or "",
        "bank_account_holder": row.get("bank_account_holder") or "",
        "bank_qr_image": row.get("bank_qr_image") or "",
        "opening_time": row.get("opening_time") or "09:00",
        "closing_time": row.get("closing_time") or "22:00",
        "phone": row.get("phone") or "",
        "wifi_name": row.get("wifi_name") or "",
        "wifi_password": row.get("wifi_password") or "",
        "address": row.get("address") or "",
        "cover_image": row.get("cover_image") or "",
        "filter_tags": row.get("filter_tags") or [],
        "is_open": row.get("is_open") if row.get("is_open") is not None else True,
    }


def store_to_directory_entry(row: Dict[str, Any]) -> Dict[str, Any]:
    """Public, unauthenticated listing (GET /api/stores) — deliberately
    excludes bank details and anything else store_to_public() exposes that
    isn't safe to hand out to anyone browsing the homepage."""
    return {
        "id": str(row["id"]),
        "slug": row.get("slug") or "",
        "name_i18n": {
            "ko": row["name"],
            "en": row.get("name_en") or row["name"],
            "vi": row.get("name_vi") or row["name"],
        },
        "description_i18n": {
            "ko": row.get("description") or "",
            "en": row.get("description_en") or row.get("description") or "",
            "vi": row.get("description_vi") or row.get("description") or "",
        },
        "hours_i18n": {
            "ko": row.get("hours") or "",
            "en": row.get("hours_en") or row.get("hours") or "",
            "vi": row.get("hours_vi") or row.get("hours") or "",
        },
    }


@app.get("/api/health")
def health() -> Dict[str, Any]:
    database = "misconfigured"
    try:
        database = "connected" if get_repository().health() else "disconnected"
    except HTTPException:
        pass
    return {
        "success": database == "connected",
        "message": "Q-Menu API is running",
        "database": database,
        "ai_provider": "gemini",
        "gemini_configured": bool(gemini_client),
        "gemini_model": GEMINI_MODEL,
    }


@app.get("/api/my-stores")
def get_my_stores(authorization: str = Header(default="")) -> Dict[str, Any]:
    """Every store a logged-in user is staff of, independent of whichever
    store the current request happens to be scoped to — this is how the
    admin app discovers where to send someone after login (see
    src/store/useMyStores.ts)."""
    if not authorization.lower().startswith("bearer ") or not supabase_client:
        raise HTTPException(status_code=401, detail="Login required.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Login required.")
    try:
        user_response = supabase_client.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.") from exc
    user = getattr(user_response, "user", None)
    if not user or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")

    try:
        response = (
            supabase_client.table("staff")
            .select("store_id, stores(slug, name, name_en)")
            .eq("id", user.id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to load your stores.") from exc

    stores = [
        {
            "store_id": row["store_id"],
            "slug": (row.get("stores") or {}).get("slug"),
            "name": (row.get("stores") or {}).get("name_en") or (row.get("stores") or {}).get("name"),
        }
        for row in (response.data or [])
        if row.get("stores")
    ]
    return {"stores": stores}


@app.get("/api/stores")
def list_stores() -> List[Dict[str, Any]]:
    """Public homepage directory — every store on this deployment, not
    scoped by X-Store-Slug (there isn't one yet; the customer is choosing
    which store to enter). Bypasses get_repository() on purpose since that
    requires a resolved store_id."""
    if not supabase_client:
        raise HTTPException(status_code=503, detail="The database is not configured.")
    response = (
        supabase_client.table("stores")
        .select("id, slug, name, name_en, name_vi, description, description_en, description_vi, hours, hours_en, hours_vi")
        .order("name_en")
        .execute()
    )
    return [store_to_directory_entry(row) for row in (response.data or [])]


@app.get("/api/store")
def get_store() -> Dict[str, Any]:
    return store_to_public(get_repository().get_store())


@app.put("/api/store")
def update_store(
    payload: StoreUpdate, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    generated = auto_translate_fields(
        {"name": payload.name, "hours": payload.hours, "description": payload.description}
    )
    row = get_repository().update_store(
        {
            "name": generated.get("ko", {}).get("name", payload.name),
            "hours": generated.get("ko", {}).get("hours", payload.hours),
            "description": generated.get("ko", {}).get("description", payload.description),
            "name_en": payload.name,
            "hours_en": payload.hours,
            "description_en": payload.description,
            "name_vi": generated.get("vi", {}).get("name", payload.name),
            "hours_vi": generated.get("vi", {}).get("hours", payload.hours),
            "description_vi": generated.get("vi", {}).get("description", payload.description),
            "menu_categories": payload.menu_categories,
            "bank_bin": payload.bank_bin or None,
            "bank_account_number": payload.bank_account_number or None,
            "bank_account_holder": payload.bank_account_holder or None,
            "bank_qr_image": payload.bank_qr_image or None,
            "opening_time": payload.opening_time,
            "closing_time": payload.closing_time,
            "phone": payload.phone,
            "wifi_name": payload.wifi_name,
            "wifi_password": payload.wifi_password,
            "address": payload.address,
            "cover_image": payload.cover_image or None,
            "filter_tags": payload.filter_tags,
        }
    )
    return {
        "success": True,
        "message": "Store information saved.",
        "store": store_to_public(row),
    }


@app.put("/api/store/status")
def update_store_status(
    payload: StoreStatusUpdate, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    row = get_repository().update_store({"is_open": payload.is_open})
    return {
        "success": True,
        "message": "Store status saved.",
        "store": store_to_public(row),
    }


@app.get("/api/menus")
def get_menus() -> List[Dict[str, Any]]:
    return [menu_to_public(row) for row in get_repository().get_menus()]


@app.post("/api/menus", status_code=201)
def create_menu(
    payload: MenuPayload, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    row = get_repository().create_menu(
        menu_payload_to_row(payload, include_image=True)
    )
    return {
        "success": True,
        "message": "Menu item created.",
        "menu": menu_to_public(row),
    }


@app.put("/api/menus/{menu_id}")
def update_menu(
    menu_id: UUID,
    payload: MenuPayload,
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    repo = get_repository()
    if not repo.get_menu(str(menu_id)):
        raise HTTPException(status_code=404, detail="Menu item not found.")
    row = repo.update_menu(
        str(menu_id),
        menu_payload_to_row(payload, include_image=payload.img is not None),
    )
    return {
        "success": True,
        "message": "Menu item updated.",
        "menu": menu_to_public(row),
    }


@app.delete("/api/menus/{menu_id}")
def delete_menu(
    menu_id: UUID, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    get_repository().delete_menu(str(menu_id))
    return {"success": True, "message": "Menu item deleted."}


@app.get("/api/tables")
def get_tables() -> List[Dict[str, Any]]:
    return [table_to_public(row) for row in get_repository().get_tables()]


@app.put("/api/tables")
def update_tables(
    payload: TableLayoutUpdate, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    rows = get_repository().replace_tables(
        [table.model_dump() for table in payload.tables]
    )
    return {
        "success": True,
        "message": "Seating layout saved.",
        "tables": [table_to_public(row) for row in rows],
    }


@app.put("/api/tables/{table_code}/clear")
def clear_table(
    table_code: str, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    """Staff marks a table paid up and free — flips it back to available
    and starts a fresh session boundary, so the next party to scan that
    table's QR doesn't see the previous group's orders (see
    MyOrdersSection on the frontend)."""
    row = get_repository().clear_table(table_code)
    return {
        "success": True,
        "message": "Table cleared.",
        "table": table_to_public(row),
    }


@app.get("/api/keywords")
def get_keywords() -> Dict[str, Any]:
    return {"keywords": get_repository().get_keywords()}


@app.put("/api/keywords")
def update_keywords(
    payload: KeywordUpdate, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    keywords = get_repository().update_keywords(payload.keywords)
    return {
        "success": True,
        "message": "Recommendation keywords saved.",
        "keywords": keywords,
    }


@app.get("/api/orders")
def get_orders(
    customer_session_id: Optional[UUID] = Query(default=None),
) -> List[Dict[str, Any]]:
    session_id = str(customer_session_id) if customer_session_id else None
    return [
        order_to_public(row)
        for row in get_repository().get_orders(session_id)
    ]


@app.post("/api/orders", status_code=201)
def create_order(payload: OrderCreate) -> Dict[str, Any]:
    # Dine-in ordering still requires being physically at a table (mode
    # "store"). Remote pickup orders are the whole reason "web" mode exists
    # for ordering purposes — no table involved, paid upfront via VNPay.
    if payload.mode == "web" and payload.fulfillment_type != "pickup":
        raise HTTPException(
            status_code=403,
            detail="Ordering isn't available in web browsing mode.",
        )
    repo = get_repository()
    store = repo.get_store()
    # Manual "closed today" switch — independent of opening_time/
    # closing_time, which only bound what pickup slot can be *scheduled*.
    # Checked for dine_in too: a stale table QR could still be scanned
    # while the store is shut.
    if store.get("is_open") is False:
        raise HTTPException(
            status_code=403,
            detail="This store isn't accepting orders right now.",
        )
    if payload.fulfillment_type == "pickup":
        opening_time = store.get("opening_time") or "09:00"
        closing_time = store.get("closing_time") or "22:00"
        # Plain string comparison works here since both sides are always
        # "HH:MM" 24-hour — lexicographic order matches chronological order.
        if not (opening_time <= payload.pickup_time <= closing_time):
            raise HTTPException(
                status_code=400,
                detail=f"Pickup time must be between {opening_time} and {closing_time}.",
            )
    menu = repo.get_menu(str(payload.menu_id))
    if not menu:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    if menu.get("is_sold_out"):
        raise HTTPException(status_code=409, detail="This item is sold out and can't be ordered.")

    # The price actually charged always comes from the menu item itself
    # (base price, a matched size_variant's price, plus each matched
    # topping's price) — never trusted directly from the client, so a
    # tampered request can't undercharge.
    variant = None
    if payload.variant_id is not None:
        variant = next(
            (v for v in (menu.get("size_variants") or []) if v.get("id") == payload.variant_id),
            None,
        )
        if not variant:
            raise HTTPException(status_code=400, detail="Invalid size/option selected.")
    unit_price = variant["price"] if variant else menu["price"]

    flavor = None
    if payload.flavor_id is not None:
        flavor = next(
            (v for v in (menu.get("flavor_variants") or []) if v.get("id") == payload.flavor_id),
            None,
        )
        if not flavor:
            raise HTTPException(status_code=400, detail="Invalid flavor selected.")

    selected_toppings = []
    known_toppings = {t.get("id"): t for t in (menu.get("toppings") or [])}
    for topping_id in payload.topping_ids:
        topping = known_toppings.get(topping_id)
        if not topping:
            raise HTTPException(status_code=400, detail="Invalid topping selected.")
        selected_toppings.append(topping)
    unit_price = float(unit_price) + sum(float(t["price"]) for t in selected_toppings)

    lang = payload.lang or "en"
    name_dict = menu.get("name") or {}
    menu_name = name_dict.get(lang) or name_dict.get("en") or ""
    if variant:
        variant_label = (variant.get("labels") or {}).get(lang) or variant.get("label") or ""
        if variant_label:
            menu_name = f"{menu_name} ({variant_label})"
    if flavor:
        flavor_label = (flavor.get("labels") or {}).get(lang) or flavor.get("label") or ""
        if flavor_label:
            menu_name = f"{menu_name} - {flavor_label}"
    if selected_toppings:
        topping_labels = [
            (t.get("labels") or {}).get(lang) or t.get("label") or "" for t in selected_toppings
        ]
        menu_name = f"{menu_name} +{', +'.join(l for l in topping_labels if l)}"

    order_row: Dict[str, Any] = {
        "menu_id": str(payload.menu_id),
        "menu_name": menu_name,
        "quantity": payload.quantity,
        "total_price": float(unit_price) * payload.quantity,
        "currency": menu.get("currency", "KRW"),
        "note": payload.note,
        "customer_session_id": str(payload.customer_session_id),
        "fulfillment_type": payload.fulfillment_type,
        "order_group_id": str(payload.order_group_id) if payload.order_group_id is not None else None,
    }
    if payload.fulfillment_type == "pickup":
        # Held until payment is confirmed — automatically by VNPay's IPN
        # webhook, or manually by staff for bank_transfer — never enters
        # the kitchen queue before that. Same code for every line item in
        # the group since it's derived from the shared order_group_id.
        order_row["status"] = "awaiting_payment"
        order_row["pickup_code"] = payload.order_group_id.hex[-6:].upper()
        order_row["payment_method"] = payload.payment_method
        order_row["pickup_time"] = payload.pickup_time
    else:
        table = repo.get_table(payload.table_id)
        if not table:
            raise HTTPException(status_code=404, detail="Table not found.")
        order_row["table_id"] = payload.table_id
        order_row["status"] = "new"
    order_row = {k: v for k, v in order_row.items() if v is not None}
    row = repo.create_order(order_row)
    # First order of a new sitting: flip the table to occupied and start a
    # fresh session boundary (see MyOrdersSection on the frontend) — but
    # only on that first order, so later items in the same visit don't keep
    # pushing the boundary forward and orphaning the earlier ones from it.
    # Best-effort: the order itself has already been placed successfully,
    # so a hiccup updating the table's bookkeeping shouldn't fail the whole
    # request out from under the customer.
    if payload.fulfillment_type != "pickup" and table.get("status") != "occupied":
        try:
            repo.mark_table_occupied(payload.table_id)
        except HTTPException:
            pass  # already logged inside _run() — the order itself still succeeds
    order = order_to_public(row)
    return {
        "success": True,
        "message": "Order placed.",
        "order_id": order["id"],
        "order": order,
    }


@app.put("/api/orders/{order_id}/status")
def update_order_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    row = get_repository().update_order_status(str(order_id), payload.status)
    return {
        "success": True,
        "message": "Order status updated.",
        "order": order_to_public(row),
    }


@app.post("/api/payments/vnpay/init")
def init_vnpay_payment(payload: VnpayInitRequest, request: Request) -> Dict[str, Any]:
    """Called by the customer's browser (carries the usual X-Store-Slug
    header) right after the pickup order rows are created. Builds and signs
    the redirect URL to VNPay's payment page."""
    if not VNPAY_TMN_CODE or not VNPAY_HASH_SECRET:
        raise HTTPException(status_code=503, detail="Online payment isn't configured yet.")
    if not VNPAY_RETURN_URL:
        raise HTTPException(status_code=503, detail="Payment return URL isn't configured yet.")

    repo = get_repository()
    rows = repo.get_orders_by_group(str(payload.order_group_id))
    if not rows:
        raise HTTPException(status_code=404, detail="Order not found.")
    if any(row["status"] != "awaiting_payment" for row in rows):
        raise HTTPException(
            status_code=409,
            detail="This order isn't awaiting payment (already paid or cancelled).",
        )

    amount_vnd = order_group_amount_vnd(rows)
    if amount_vnd < 5000:
        raise HTTPException(
            status_code=400,
            detail="Order total is below VNPay's minimum payable amount (5,000 VND).",
        )

    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",")[0].strip() or (
        request.client.host if request.client else "127.0.0.1"
    )
    txn_ref = vnpay_txn_ref(payload.order_group_id)
    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_Amount": str(amount_vnd * 100),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": f"Thanh toan don hang {txn_ref}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": VNPAY_RETURN_URL,
        "vnp_IpAddr": client_ip,
        "vnp_CreateDate": datetime.now(VN_TIMEZONE).strftime("%Y%m%d%H%M%S"),
    }
    secure_hash = vnpay_sign(params)
    query = urlencode(sorted(params.items())) + f"&vnp_SecureHash={secure_hash}"
    return {"success": True, "payment_url": f"{VNPAY_PAYMENT_URL}?{query}"}


@app.get("/api/payments/vnpay/ipn")
def vnpay_ipn(request: Request) -> Dict[str, str]:
    """VNPay's server calls this directly (no X-Store-Slug header, no
    browser involved) — the authoritative payment confirmation. Looks the
    order up globally by order_group_id since store context isn't
    available here. Must reply in VNPay's exact expected JSON shape."""
    if not supabase_client:
        return {"RspCode": "99", "Message": "Unknown error"}
    params = dict(request.query_params)
    if not vnpay_verify(params):
        return {"RspCode": "97", "Message": "Invalid signature"}

    group_id = vnpay_txn_ref_to_group_id(params.get("vnp_TxnRef", ""))
    if not group_id:
        return {"RspCode": "01", "Message": "Order not found"}

    rows = (
        supabase_client.table("orders")
        .select("*")
        .eq("order_group_id", group_id)
        .execute()
        .data
        or []
    )
    if not rows:
        return {"RspCode": "01", "Message": "Order not found"}

    expected_amount = order_group_amount_vnd(rows) * 100
    if str(params.get("vnp_Amount", "")) != str(expected_amount):
        return {"RspCode": "04", "Message": "Invalid amount"}

    if rows[0]["status"] != "awaiting_payment":
        # Already processed — VNPay retries IPN delivery, ack idempotently.
        return {"RspCode": "00", "Message": "Confirm Success"}

    if params.get("vnp_ResponseCode") == "00":
        supabase_client.table("orders").update(
            {
                "status": "new",
                "payment_ref": params.get("vnp_TransactionNo", ""),
                "paid_at": utc_now(),
                "updated_at": utc_now(),
            }
        ).eq("order_group_id", group_id).execute()
    else:
        supabase_client.table("orders").update(
            {"status": "cancelled", "updated_at": utc_now()}
        ).eq("order_group_id", group_id).execute()
    return {"RspCode": "00", "Message": "Confirm Success"}


@app.get("/api/payments/status")
def payment_status(order_group_id: str = Query(...)) -> Dict[str, Any]:
    """Polled by the customer's browser while a pickup order is awaiting
    payment — for VNPay this reflects whatever the IPN webhook has
    confirmed so far (the return-URL redirect itself isn't authoritative);
    for bank_transfer it reflects staff's manual confirmation."""
    if not supabase_client:
        raise HTTPException(status_code=503, detail="The database is not configured.")
    rows = (
        supabase_client.table("orders")
        .select("*")
        .eq("order_group_id", order_group_id)
        .execute()
        .data
        or []
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Order not found.")
    return {
        "order_group_id": order_group_id,
        "status": rows[0]["status"],
        "pickup_code": rows[0].get("pickup_code"),
        "pickup_time": rows[0].get("pickup_time"),
        "payment_method": rows[0].get("payment_method"),
        "total_price": order_group_amount(rows),
        "currency": rows[0].get("currency", "USD"),
        # The actual amount the bank-transfer QR is generated for (and what
        # VNPay would charge) — always VND, converted from total_price/
        # currency when those aren't already VND. Frontend must use this,
        # not total_price, for anything VND-denominated (see
        # PickupResultScreen.tsx) — total_price is in the store's own menu
        # currency and was previously being passed to the QR builder as if
        # it were already VND, requesting amounts off by ~25,000x.
        "amount_vnd": order_group_amount_vnd(rows),
    }


@app.get("/api/reservations")
def get_reservations(
    customer_session_id: Optional[UUID] = Query(default=None),
) -> List[Dict[str, Any]]:
    session_id = str(customer_session_id) if customer_session_id else None
    return [
        reservation_to_public(row)
        for row in get_repository().get_reservations(session_id)
    ]


@app.post("/api/reservations", status_code=201)
def create_reservation(payload: ReservationCreate) -> Dict[str, Any]:
    # Unlike orders, reservations ARE allowed in web mode — the general
    # store-wide QR is meant precisely for browsing the floor plan and
    # requesting a table before being seated. Only food ordering requires
    # an actual assigned table (mode=store).
    repo = get_repository()
    table = repo.get_table(payload.table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found.")
    session_id = str(payload.customer_session_id)
    if repo.has_active_reservation(payload.table_id):
        raise HTTPException(
            status_code=409,
            detail="There's already an active reservation or waitlist request for this table.",
        )

    requested_status = (
        "reserved" if table.get("status") == "available" else "waiting"
    )
    row = repo.create_reservation(
        {
            "table_id": payload.table_id,
            "status": requested_status,
            "customer_session_id": session_id,
            "party_size": payload.party_size,
        }
    )
    reservation = reservation_to_public(row)
    return {
        "success": True,
        "message": (
            "Reservation request submitted."
            if requested_status == "reserved"
            else "Waitlist request submitted."
        ),
        "reservation_id": reservation["id"],
        "reservation": reservation,
    }


@app.put("/api/reservations/{reservation_id}/status")
def update_reservation_status(
    reservation_id: UUID,
    payload: ReservationStatusUpdate,
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    # The Supabase RPC changes the reservation and its table's status together.
    row = get_repository().update_reservation_status(
        str(reservation_id), payload.status
    )
    return {
        "success": True,
        "message": "Reservation status updated.",
        "reservation": reservation_to_public(row),
    }


@app.get("/api/reviews")
def get_reviews() -> List[Dict[str, Any]]:
    return [review_to_public(row) for row in get_repository().get_reviews()]


@app.post("/api/reviews", status_code=201)
def create_review(payload: ReviewCreate) -> Dict[str, Any]:
    repo = get_repository()
    if payload.menu_id is not None:
        # Reviews are only open to someone who actually ordered this dish
        # and was served it — not anyone just browsing the menu.
        orders = repo.get_orders(str(payload.customer_session_id))
        has_served_order = any(
            o.get("menu_id") == str(payload.menu_id) and o.get("status") == "served"
            for o in orders
        )
        if not has_served_order:
            raise HTTPException(
                status_code=403,
                detail="You can only review a dish after ordering it and having it served.",
            )
    row = repo.create_review(
        {
            "rating": payload.rating,
            "review_text": payload.review_text,
            "image_data": payload.image or None,
            "menu_id": str(payload.menu_id) if payload.menu_id else None,
            "table_id": payload.table_id,
            "customer_session_id": str(payload.customer_session_id),
        }
    )
    return {
        "success": True,
        "message": "Review submitted.",
        "review": review_to_public(row),
    }

@app.put("/api/reviews/{review_id}")
def update_review(
    review_id: UUID,
    payload: ReviewReplyUpdate,
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    row = get_repository().update_review_reply(str(review_id), payload.reply)
    return {
        "success": True,
        "message": "Review reply saved.",
        "review": review_to_public(row),
    }


@app.get("/api/table-requests")
def get_table_requests(
    _staff: Dict[str, Any] = Depends(require_staff),
) -> List[Dict[str, Any]]:
    return [
        table_request_to_public(row)
        for row in get_repository().get_table_requests()
    ]


@app.post("/api/table-requests", status_code=201)
def create_table_request(payload: TableRequestCreate) -> Dict[str, Any]:
    repo = get_repository()
    if not repo.get_table(payload.table_id):
        raise HTTPException(status_code=404, detail="Table not found.")
    row = repo.create_table_request(
        {
            "table_id": payload.table_id,
            "reason": payload.reason,
            "customer_session_id": (
                str(payload.customer_session_id)
                if payload.customer_session_id
                else None
            ),
        }
    )
    return {
        "success": True,
        "message": "Staff call request received.",
        "request": table_request_to_public(row),
    }


@app.put("/api/table-requests/{request_id}/resolve")
def resolve_table_request(
    request_id: UUID, _staff: Dict[str, Any] = Depends(require_staff)
) -> Dict[str, Any]:
    row = get_repository().resolve_table_request(str(request_id))
    return {
        "success": True,
        "message": "Staff call request resolved.",
        "request": table_request_to_public(row),
    }


def classify_weather(precip_mm: Optional[float], weathercode: Optional[int]) -> str:
    """Open-Meteo's daily precipitation_sum (mm) + WMO weathercode collapsed
    down to the 3 buckets the analytics feature correlates menu choices
    against. 1mm/day is a light-but-real threshold, well above drizzle
    rounding noise."""
    if (precip_mm or 0) >= 1.0:
        return "rainy"
    if weathercode in (0, 1):
        return "sunny"
    return "cloudy"


def ensure_weather_backfilled(repo: "SupabaseRepository", days: int) -> None:
    """Tops up weather_daily with real Hanoi weather so analytics always has
    something genuine to correlate against, even for a store with no
    history yet. Open-Meteo's forecast endpoint serves up to 92 past days
    (plus today) in one free, keyless call, so this is cheap enough to call
    on every analytics request; it's a no-op whenever today is already
    cached, which is true for the rest of a given day after the first hit.
    Never raises — a failed refresh just leaves analytics running on
    whatever was already cached."""
    try:
        existing = {
            row["date"]
            for row in repo.get_weather_daily(
                (datetime.now(timezone.utc).date() - timedelta(days=days)).isoformat()
            )
        }
        today = datetime.now(VN_TIMEZONE).date()
        if today.isoformat() in existing and (today - timedelta(days=1)).isoformat() in existing:
            return
        response = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": WEATHER_LAT,
                "longitude": WEATHER_LON,
                "daily": "temperature_2m_mean,precipitation_sum,weathercode",
                "timezone": "Asia/Ho_Chi_Minh",
                "past_days": min(days, 92),
                "forecast_days": 1,
            },
            timeout=8.0,
        )
        response.raise_for_status()
        daily = response.json().get("daily", {})
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_mean", [])
        precs = daily.get("precipitation_sum", [])
        codes = daily.get("weathercode", [])
        rows = []
        for i, day in enumerate(dates):
            if day in existing:
                continue
            precip = precs[i] if i < len(precs) else None
            rows.append(
                {
                    "store_id": repo.store_id,
                    "date": day,
                    "temp_avg_c": temps[i] if i < len(temps) else None,
                    "precip_mm": precip,
                    "condition": classify_weather(precip, codes[i] if i < len(codes) else None),
                }
            )
        if rows and supabase_client:
            supabase_client.table("weather_daily").upsert(rows, on_conflict="store_id,date").execute()
    except Exception:
        logger.exception("Weather backfill failed")


WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def compute_business_analytics(
    orders: List[Dict[str, Any]], weather_rows: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Aggregates raw order lines into everything the admin Analytics tab
    and /api/analytics/insights (the AI summary's only source of numbers)
    are built from: purchase-behavior (top items/categories, what sells
    together, repeat-customer rate, peak hour/weekday), ingredient prep
    (real grams consumed per menu item's ingredient_lines, so the kitchen
    knows roughly how much of each ingredient to have ready), and — same
    as before — a weather correlation, now just one section among several
    rather than the whole feature. Every figure here is a real count/sum
    over `orders`/menu ingredient data — nothing here is estimated."""
    weather_by_date = {row["date"]: row for row in weather_rows}
    conditions = ["sunny", "cloudy", "rainy"]
    condition_days = {c: 0 for c in conditions}
    for row in weather_rows:
        condition_days[row["condition"]] = condition_days.get(row["condition"], 0) + 1
    condition_stats = {
        c: {"order_lines": 0, "revenue_usd": 0.0, "categories": {}, "items": {}} for c in conditions
    }

    weekday_revenue = {k: 0.0 for k in WEEKDAY_KEYS}
    weekday_days_seen: Dict[str, set] = {k: set() for k in WEEKDAY_KEYS}
    hour_counts = [0] * 24
    item_totals: Dict[str, Dict[str, Any]] = {}
    category_totals: Dict[str, Dict[str, Any]] = {}
    ingredient_totals: Dict[str, float] = {}
    ingredient_by_weekday: Dict[str, Dict[str, float]] = {k: {} for k in WEEKDAY_KEYS}
    days_seen: set = set()
    group_items: Dict[str, set] = {}
    group_customer: Dict[str, str] = {}
    order_line_count = 0

    for row in orders:
        created = datetime.fromisoformat(str(row["created_at"]).replace("Z", "+00:00"))
        local = created.astimezone(VN_TIMEZONE)
        date_str = local.date().isoformat()
        weekday = WEEKDAY_KEYS[local.weekday()]
        qty = int(row.get("quantity") or 0)
        amount = to_usd(row.get("total_price", 0), row.get("currency", "KRW"))
        menu_info = row.get("menus") or {}
        category = menu_info.get("category") or "Khác"
        name = row.get("menu_name") or "?"
        group_id = str(row.get("order_group_id") or row["id"])

        days_seen.add(date_str)
        weekday_revenue[weekday] += amount
        weekday_days_seen[weekday].add(date_str)
        hour_counts[local.hour] += qty
        order_line_count += 1

        item = item_totals.setdefault(name, {"name": name, "qty": 0, "revenue_usd": 0.0})
        item["qty"] += qty
        item["revenue_usd"] += amount

        cat = category_totals.setdefault(category, {"category": category, "qty": 0, "revenue_usd": 0.0})
        cat["qty"] += qty
        cat["revenue_usd"] += amount

        for ing in menu_info.get("ingredient_lines") or []:
            ing_name = ing.get("name")
            grams_each = float(ing.get("grams") or 0)
            if not ing_name or grams_each <= 0:
                continue
            grams_used = grams_each * qty
            ingredient_totals[ing_name] = ingredient_totals.get(ing_name, 0.0) + grams_used
            wd_map = ingredient_by_weekday[weekday]
            wd_map[ing_name] = wd_map.get(ing_name, 0.0) + grams_used

        group_items.setdefault(group_id, set()).add(name)
        group_customer[group_id] = str(row.get("customer_session_id") or "")

        weather = weather_by_date.get(date_str)
        if weather:
            stat = condition_stats[weather["condition"]]
            stat["order_lines"] += 1
            stat["revenue_usd"] += amount
            stat["categories"][category] = stat["categories"].get(category, 0) + qty
            stat["items"][name] = stat["items"].get(name, 0) + qty

    for item in item_totals.values():
        item["revenue_usd"] = round(item["revenue_usd"], 2)
    for cat in category_totals.values():
        cat["revenue_usd"] = round(cat["revenue_usd"], 2)

    # --- purchase behavior ---
    pair_counts: Dict[tuple, int] = {}
    for items_set in group_items.values():
        names = sorted(items_set)
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                key = (names[i], names[j])
                pair_counts[key] = pair_counts.get(key, 0) + 1
    top_pairs = [
        {"item_a": a, "item_b": b, "count": c}
        for (a, b), c in sorted(pair_counts.items(), key=lambda kv: kv[1], reverse=True)
        if c >= 2
    ][:8]

    customer_group_count: Dict[str, int] = {}
    for cust in group_customer.values():
        customer_group_count[cust] = customer_group_count.get(cust, 0) + 1
    total_customers = len(customer_group_count)
    repeat_customers = sum(1 for v in customer_group_count.values() if v >= 2)
    repeat_customer_rate_pct = round(repeat_customers / total_customers * 100, 1) if total_customers else 0.0
    total_order_groups = len(group_items)

    # --- ingredient prep ---
    tomorrow_weekday = WEEKDAY_KEYS[(datetime.now(VN_TIMEZONE).date() + timedelta(days=1)).weekday()]
    days_analyzed = len(days_seen) or 1
    top_ingredient_names = sorted(ingredient_totals.items(), key=lambda kv: kv[1], reverse=True)[:12]
    top_ingredients = []
    for ing_name, total_grams in top_ingredient_names:
        tomorrow_days = weekday_days_seen[tomorrow_weekday]
        tomorrow_grams = ingredient_by_weekday[tomorrow_weekday].get(ing_name, 0.0)
        forecast_g = round(tomorrow_grams / len(tomorrow_days)) if tomorrow_days else round(total_grams / days_analyzed)
        top_ingredients.append(
            {
                "name": ing_name,
                "total_grams": round(total_grams),
                "avg_per_day_grams": round(total_grams / days_analyzed),
                "forecast_tomorrow_grams": forecast_g,
            }
        )

    # --- weather correlation ---
    def top_n(counter: Dict[str, int], n: int = 5) -> List[Dict[str, Any]]:
        return [{"name": k, "qty": v} for k, v in sorted(counter.items(), key=lambda kv: kv[1], reverse=True)[:n]]

    by_condition = []
    for c in conditions:
        stat = condition_stats[c]
        total_qty = sum(stat["categories"].values()) or 1
        by_condition.append(
            {
                "condition": c,
                "days": condition_days.get(c, 0),
                "order_lines": stat["order_lines"],
                "revenue_usd": round(stat["revenue_usd"], 2),
                "top_categories": [
                    {"category": k, "qty": v, "share_pct": round(v / total_qty * 100, 1)}
                    for k, v in sorted(stat["categories"].items(), key=lambda kv: kv[1], reverse=True)[:5]
                ],
                "top_items": top_n(stat["items"]),
            }
        )

    return {
        "days_analyzed": len(days_seen),
        "total_order_groups": total_order_groups,
        "total_order_lines": order_line_count,
        "purchase_behavior": {
            "top_items": sorted(item_totals.values(), key=lambda v: v["qty"], reverse=True)[:10],
            "top_categories": sorted(category_totals.values(), key=lambda v: v["qty"], reverse=True)[:10],
            "frequently_bought_together": top_pairs,
            "avg_items_per_order": round(order_line_count / total_order_groups, 2) if total_order_groups else 0.0,
            "total_customers": total_customers,
            "repeat_customer_rate_pct": repeat_customer_rate_pct,
            "revenue_by_weekday": [{"weekday": k, "revenue_usd": round(v, 2)} for k, v in weekday_revenue.items()],
            "orders_by_hour": [{"hour": h, "qty": hour_counts[h]} for h in range(24)],
        },
        "ingredient_prep": {
            "days_analyzed": len(days_seen),
            "tomorrow_weekday": tomorrow_weekday,
            "top_ingredients": top_ingredients,
        },
        "weather": {
            "days_with_weather": len(weather_rows),
            "by_condition": by_condition,
        },
    }


class AnalyticsInsights(BaseModel):
    insights: List[str] = Field(default_factory=list)


# Gemini call is slow-ish (~2-4s) and the underlying numbers only change as
# fast as new orders come in — cache each store's generated insights for a
# while instead of re-calling the model on every dashboard load.
_insights_cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
INSIGHTS_CACHE_TTL_SECONDS = 600


def _load_analytics_stats(repo: "SupabaseRepository", days: int) -> Dict[str, Any]:
    ensure_weather_backfilled(repo, days)
    since_date = (datetime.now(timezone.utc).date() - timedelta(days=days)).isoformat()
    with ThreadPoolExecutor(max_workers=2) as pool:
        orders_future = pool.submit(repo.get_orders_since, f"{since_date}T00:00:00+00:00")
        weather_future = pool.submit(repo.get_weather_daily, since_date)
        orders = orders_future.result()
        weather_rows = weather_future.result()
    return compute_business_analytics(orders, weather_rows)


@app.get("/api/analytics/business")
def get_business_analytics(
    days: int = Query(default=90, ge=7, le=365),
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    return _load_analytics_stats(get_repository(), days)


ANALYTICS_LANGUAGE_NAMES = {"ko": "Korean", "en": "English", "vi": "Vietnamese"}


@app.get("/api/analytics/insights")
def get_analytics_insights(
    days: int = Query(default=90, ge=7, le=365),
    lang: str = Query(default="vi", min_length=2, max_length=10),
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    repo = get_repository()
    cache_key = f"{repo.store_id}:{days}:{lang}"
    now = time.monotonic()
    cached = _insights_cache.get(cache_key)
    if cached and now - cached[0] < INSIGHTS_CACHE_TTL_SECONDS:
        return cached[1]

    stats = _load_analytics_stats(repo, days)

    # Too little order history to say anything real — an honest "not enough
    # data yet" beats letting the model guess. This is the common case for
    # a brand-new store that hasn't taken enough orders yet.
    fallback: Dict[str, Any] = {
        "insights": [],
        "generated": False,
        "days_analyzed": stats["days_analyzed"],
        "total_order_groups": stats["total_order_groups"],
    }
    if not gemini_client or stats["total_order_groups"] < 20:
        _insights_cache[cache_key] = (now, fallback)
        return fallback

    try:
        language_name = ANALYTICS_LANGUAGE_NAMES.get(lang, "Vietnamese")
        prompt = f"""
You are a business analyst for a Vietnamese restaurant. Below is real, pre-aggregated
data from its orders (and, where available, matched daily weather and each dish's
ingredient list) over the last {days} days:

{json.dumps(stats, ensure_ascii=False, default=str)}

Write 5-8 short, concrete business insights in {language_name} (the owner's chosen
display language — do not mix in any other language), one sentence each, for the
owner to skim quickly. Use ONLY the numbers present in the data above (percentages,
quantities, grams, revenue) — copy each number exactly from its field, never invent one
and never combine two different fields into a new number. In particular: a "days" field
is a count of calendar days (small, at most `days_analyzed`) and must never be confused
with an "qty"/"order_lines"/"total_grams" field (item or gram counts, which can be much
larger) — double-check every number you write actually appears in the JSON under the
field you're describing before including it. Cover a mix of:
- purchase behavior: best-selling items/categories, items frequently bought together,
  repeat-customer rate, busiest hour(s) and weekday
- ingredient prep: which ingredients are used in the largest quantity, and how much of
  the top 2-3 ingredients to prepare tomorrow (weekday code "{stats['ingredient_prep']['tomorrow_weekday']}",
  translate this to a real day name in {language_name}) based on forecast_tomorrow_grams
  — phrase this as a concrete kg/g amount
- weather (only if by_condition data is non-empty and shows a real difference): how
  rainy/sunny/cloudy days differ in what sells — the "days" field there is how many of
  the {days} calendar days had that weather, not how many items sold
If a category above has no usable data (e.g. ingredient_prep.top_ingredients is empty,
or weather.by_condition is all zeros), skip that category entirely instead of forcing
a sentence about it. If the data doesn't clearly support a conclusion, don't make one up.
Formatting: write natural {language_name} sentences only — never print a raw JSON
field/key name like "revenue_usd" or "order_lines" in the output, describe what the
number means in words instead. All money figures in the data are already in USD —
write them as USD (e.g. "$1,234"), never convert to or label them as VND or any other
currency. Always translate the 3-letter weekday codes (mon/tue/wed/thu/fri/sat/sun) to
real day names in {language_name} — never print a raw weekday code.
Respond with exactly this JSON shape, nothing else:
{{"insights": ["insight 1", "insight 2"]}}
""".strip()
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalyticsInsights,
                # Getting every number right matters more than latency here
                # (the result is cached for 10 minutes either way) — MINIMAL
                # was measured mixing up a day-count field with an item-
                # count field in testing, so this uses one thinking level up.
                thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW),
                # 5-8 short sentences, nothing more — caps a runaway
                # generation's cost without ever truncating a real answer.
                max_output_tokens=800,
            ),
        )
        if isinstance(response.parsed, AnalyticsInsights):
            parsed = response.parsed.model_dump()
        elif isinstance(response.parsed, dict):
            parsed = response.parsed
        else:
            parsed = json.loads(response.text or "{}")
        result: Dict[str, Any] = {
            "insights": [str(s) for s in (parsed.get("insights") or [])][:8],
            "generated": True,
            "days_analyzed": stats["days_analyzed"],
            "total_order_groups": stats["total_order_groups"],
        }
    except Exception:
        logger.exception("Analytics insight generation failed")
        result = fallback
    _insights_cache[cache_key] = (now, result)
    return result


@app.get("/api/chat-messages")
def get_chat_messages(customer_session_id: UUID = Query(...)) -> List[Dict[str, Any]]:
    return [
        chat_message_to_public(row)
        for row in get_repository().get_chat_messages(str(customer_session_id))
    ]


@app.post("/api/chat-messages", status_code=201)
def create_chat_message(payload: ChatMessageCreate) -> Dict[str, Any]:
    row = get_repository().create_chat_message(
        {
            "customer_session_id": str(payload.customer_session_id),
            "table_id": payload.table_id,
            "sender": "customer",
            "message": payload.message,
        }
    )
    return {"success": True, "chat_message": chat_message_to_public(row)}


@app.get("/api/chat-messages/threads")
def get_chat_threads(_staff: Dict[str, Any] = Depends(require_staff)) -> List[Dict[str, Any]]:
    return get_repository().get_chat_threads()


@app.post("/api/chat-messages/{customer_session_id}/reply", status_code=201)
def reply_chat_message(
    customer_session_id: UUID,
    payload: StaffChatReply,
    _staff: Dict[str, Any] = Depends(require_staff),
) -> Dict[str, Any]:
    row = get_repository().create_chat_message(
        {
            "customer_session_id": str(customer_session_id),
            "sender": "staff",
            "message": payload.message,
        }
    )
    return {"success": True, "chat_message": chat_message_to_public(row)}


@app.get("/api/queue/status")
def get_queue_status() -> Dict[str, Any]:
    repo = get_repository()
    waiting = [
        row for row in repo.get_reservations() if row["status"] == "waiting"
    ]
    tables = repo.get_tables()
    occupied_count = sum(
        1 for table in tables if table.get("status") == "occupied"
    )
    teams_ahead = len(waiting)
    people_ahead = sum(int(row.get("party_size") or 0) for row in waiting)
    turnover_base = max(1, occupied_count)
    est_time = (
        max(5, round(teams_ahead * 60 / turnover_base))
        if teams_ahead
        else 0
    )
    return {
        "success": True,
        "teams_ahead": teams_ahead,
        "people_ahead": people_ahead,
        "est_time_mins": est_time,
    }


@app.post("/api/chat")
def chat(payload: ChatRequest) -> Dict[str, Any]:
    language_names = {"ko": "Korean", "en": "English", "vi": "Vietnamese"}
    fallback_messages = {
        "ko": "현재 AI 추천 서비스를 이용할 수 없습니다. 전체 메뉴에서 직접 확인해주세요.",
        "en": "The AI recommendation service is currently unavailable. Please check the full menu.",
        "vi": "Dịch vụ gợi ý AI hiện không khả dụng. Vui lòng xem toàn bộ thực đơn.",
    }
    fallback = {
        "success": False,
        "reply": fallback_messages.get(payload.language, fallback_messages["en"]),
        "recommended_menu_ids": [],
        "suggested_cart_items": [],
    }
    if not gemini_client:
        return fallback

    try:
        repo = get_repository()
        # Strip embedded photo data (cover_image/bank_qr_image on the store,
        # img on every dish) before it goes anywhere near the prompt — these
        # are base64 image blobs, sometimes megabytes each across a full
        # menu, and Gemini has no use for them as text. Left in, a normal
        # menu blew straight through the model's 1,048,576-token input
        # limit on every single message, so /api/chat failed 100% of the
        # time and silently fell back to the generic "AI unavailable" reply
        # — from the customer's side indistinguishable from "doesn't know
        # anything about the menu".
        # These three are independent Supabase round-trips — run them
        # concurrently instead of back-to-back (~3s serially vs ~1.7s for
        # whichever is slowest) since none depends on another's result.
        with ThreadPoolExecutor(max_workers=3) as pool:
            store_future = pool.submit(repo.get_store)
            menus_future = pool.submit(repo.get_menus)
            tables_future = pool.submit(repo.get_tables)
            store_row = store_future.result()
            menu_rows = menus_future.result()
            table_rows = tables_future.result()

        store = {k: v for k, v in store_row.items() if k not in ("cover_image", "bank_qr_image")}
        # toppings/isSoldOut stripped too: toppings alone was measured at
        # ~60% of this whole payload's size on a menu Freddo's size (every
        # topping's full {id, label, labels{en,ko,vi}, price, calories}
        # repeated on every single drink) — real token cost on every chat
        # message, for data the model never uses (topping selection happens
        # on the customer's own screen after adding to cart, never something
        # the AI is asked to reason about). isSoldOut is always false here
        # since sold-out items are already filtered out above.
        available_menus = [
            {k: v for k, v in menu_to_public(row).items() if k not in ("img", "toppings", "isSoldOut")}
            for row in menu_rows
            if not row.get("is_sold_out")
        ]
        tables = [
            {k: v for k, v in table_to_public(row).items() if k not in ("table_image", "view_image")}
            for row in table_rows
        ]
        table_summary: Dict[str, Dict[str, int]] = {
            "indoor": {},
            "terrace": {},
            "total": {},
        }
        for table in tables:
            area = (
                "terrace"
                if "terrace" in str(table.get("view", "")).lower()
                or "테라스" in str(table.get("view", ""))
                or float(table["x"]) >= 70
                else "indoor"
            )
            status = table["status"]
            table_summary[area][status] = (
                table_summary[area].get(status, 0) + 1
            )
            table_summary["total"][status] = (
                table_summary["total"].get(status, 0) + 1
            )

        # Mirrors the frontend's DishSheet/DishCard/CartScreen gating: dine-in
        # ordering still requires being physically at a table (mode=="store");
        # web-mode ordering is only allowed once the customer has chosen
        # "pickup" on DiningChoiceScreen (paid upfront, collected later).
        can_order = payload.mode == "store" or payload.web_order_intent == "pickup"
        if payload.mode == "store":
            mode_instruction = (
                "This is store mode (scanned at their own table): you may help "
                "with menu and seating questions, and they can order food now. "
                "Only add to suggested_cart_items when the customer clearly asks "
                "for a specific dish to be added."
            )
        elif can_order:
            mode_instruction = (
                "This is web browsing mode, and the customer has chosen remote "
                "pickup: they pay upfront and collect the order later, no table "
                "involved. You may help with menu questions and they can order "
                "now for pickup. Only add to suggested_cart_items when the "
                "customer clearly asks for a specific dish to be added. Never "
                "discuss table reservations or seating — pickup has no table."
            )
        else:
            mode_instruction = (
                "This is web browsing mode (general QR, no table assigned yet, "
                "and the customer hasn't chosen remote pickup): they can browse "
                "the menu, but cannot place a food order yet — tell them to "
                "order once seated at their table, or choose remote pickup "
                "instead. Always return an empty suggested_cart_items array."
            )
        system_prompt = f"""
You are Q-Menu's friendly AI assistant for menu recommendations and seating info at this restaurant.
Reply language: {language_names.get(payload.language, payload.language)}. Do not mix languages.
Mode: {payload.mode}. {mode_instruction}

Store info:
{json.dumps(store, ensure_ascii=False, default=str)}

Menus currently for sale:
{json.dumps(available_menus, ensure_ascii=False)}

Current seating layout:
{json.dumps(tables, ensure_ascii=False)}

Seating status summary:
{json.dumps(table_summary, ensure_ascii=False)}

Answer seating questions only from the current seating layout above.
Recommend 1-3 menu items at most, chosen only from the menus above, and return their ids.
Never invent a menu id that isn't in the list. suggested_cart_items must also only use ids from that list.
Never add to the cart yourself — only suggest; the customer taps to confirm on their screen.
Respond with exactly this JSON shape, nothing else:
{{
  "reply": "the reply to show the user",
  "recommended_menu_ids": ["menu UUID"],
  "suggested_cart_items": [{{"menu_id": "menu UUID", "qty": 1}}]
}}
""".strip()
        contents = [
            types.Content(
                role="user" if turn.role == "user" else "model",
                parts=[types.Part(text=turn.text)],
            )
            for turn in payload.history
        ]
        contents.append(types.Content(role="user", parts=[types.Part(text=payload.query)]))
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=GeminiChatResponse,
                # This is a quick, structured menu Q&A, not an open-ended
                # reasoning task — minimal thinking cuts real-world latency
                # roughly in half (measured ~7s -> ~4s) with no noticeable
                # quality loss on the questions this endpoint actually gets.
                thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.MINIMAL),
                # A chat reply is a short conversational answer, not an
                # essay — caps a runaway/looping generation's cost without
                # ever truncating a normal reply in practice.
                max_output_tokens=600,
            ),
        )
        if isinstance(response.parsed, GeminiChatResponse):
            parsed = response.parsed.model_dump()
        elif isinstance(response.parsed, dict):
            parsed = response.parsed
        else:
            parsed = json.loads(response.text or "{}")
        valid_ids = {menu["id"] for menu in available_menus}
        recommended_ids = [
            str(menu_id)
            for menu_id in parsed.get("recommended_menu_ids", [])
            if str(menu_id) in valid_ids
        ][:3]
        suggested_cart_items = []
        if can_order:
            for item in parsed.get("suggested_cart_items", []):
                menu_id = str(item.get("menu_id", ""))
                if menu_id not in valid_ids:
                    continue
                qty = int(item.get("qty") or 1)
                suggested_cart_items.append(
                    {"menu_id": menu_id, "qty": max(1, min(qty, 20))}
                )
        return {
            "success": True,
            "reply": str(parsed.get("reply") or fallback_messages.get(payload.language, fallback_messages["en"])),
            "recommended_menu_ids": recommended_ids,
            "suggested_cart_items": suggested_cart_items[:3],
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini chat request failed")
        return fallback
