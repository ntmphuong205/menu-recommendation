from __future__ import annotations

import json
import logging
import os
import re
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

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

TABLE_STATUSES = {"available", "soon", "reserved", "occupied"}
# Per-item kitchen status (replaces the old pending/completed/cancelled model
# with ICAPS's finer-grained new -> preparing -> served flow).
ORDER_STATUSES = {"new", "preparing", "served", "cancelled"}
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

    @field_validator("name", "hours", "description")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("menu_categories")
    @classmethod
    def strip_categories(cls, values: List[str]) -> List[str]:
        return [str(item).strip() for item in values if str(item).strip()]


class IngredientLine(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    grams: float = Field(ge=0, le=5000)
    custom: Optional[Dict[str, float]] = None


class MenuPairing(BaseModel):
    menu_id: str = Field(min_length=1, max_length=64)
    reason: Dict[str, str] = Field(default_factory=dict)


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
    status: Literal["available", "soon", "reserved", "occupied"]
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
    table_id: str = Field(min_length=1, max_length=32)
    menu_id: UUID
    quantity: int = Field(ge=1, le=100)
    note: str = Field(default="", max_length=300)
    customer_session_id: UUID
    mode: Literal["web", "store"]
    # Shared across every line the client posts from one cart checkout, so
    # the frontend can regroup rows back into a single "order" for display.
    order_group_id: Optional[UUID] = None

    @field_validator("table_id")
    @classmethod
    def normalize_order_table_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("note")
    @classmethod
    def strip_note(cls, value: str) -> str:
        return value.strip()


class OrderStatusUpdate(BaseModel):
    status: Literal["new", "preparing", "served", "cancelled"]


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


class ChatHistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="ko", min_length=2, max_length=10)
    mode: Literal["web", "store"] = "store"
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
    }


def order_to_public(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "table_id": row["table_id"],
        "menu_id": str(row["menu_id"]),
        "menu_name": row["menu_name"],
        "quantity": int(row["quantity"]),
        "total_price": public_number(row["total_price"]),
        "currency": row["currency"],
        "note": row.get("note") or "",
        "status": row["status"],
        "order_group_id": str(row["order_group_id"]),
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
        def operation() -> Any:
            query = (
                self.client.table("orders")
                .select("*")
                .eq("store_id", self.store_id)
            )
            if customer_session_id:
                query = query.eq("customer_session_id", customer_session_id)
            return query.order("created_at", desc=True).execute()

        response = self._run(operation, "Failed to load orders.")
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
        }
    )
    return {
        "success": True,
        "message": "Store information saved.",
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
    if payload.mode == "web":
        raise HTTPException(
            status_code=403,
            detail="Ordering isn't available in web browsing mode.",
        )
    repo = get_repository()
    menu = repo.get_menu(str(payload.menu_id))
    if not menu:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    if menu.get("is_sold_out"):
        raise HTTPException(status_code=409, detail="This item is sold out and can't be ordered.")
    if not repo.get_table(payload.table_id):
        raise HTTPException(status_code=404, detail="Table not found.")

    order_row: Dict[str, Any] = {
        "table_id": payload.table_id,
        "menu_id": str(payload.menu_id),
        "menu_name": (menu.get("name") or {}).get("en", ""),
        "quantity": payload.quantity,
        "total_price": float(menu["price"]) * payload.quantity,
        "currency": menu.get("currency", "KRW"),
        "note": payload.note,
        "status": "new",
        "customer_session_id": str(payload.customer_session_id),
    }
    if payload.order_group_id is not None:
        order_row["order_group_id"] = str(payload.order_group_id)
    row = repo.create_order(order_row)
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
    row = get_repository().create_review(
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
        store = repo.get_store()
        available_menus = [
            menu_to_public(row)
            for row in repo.get_menus()
            if not row.get("is_sold_out")
        ]
        tables = [table_to_public(row) for row in repo.get_tables()]
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

        mode_instruction = (
            "This is web browsing mode (general QR, no table assigned yet): the "
            "customer can browse the menu and seating, and request a table "
            "reservation or join the waitlist, but cannot place a food order yet "
            "— tell them to order once seated at their table. Always return an "
            "empty suggested_cart_items array."
            if payload.mode == "web"
            else (
                "This is store mode (scanned at their own table): you may help "
                "with menu and seating questions, and they can order food now. "
                "Only add to suggested_cart_items when the customer clearly asks "
                "for a specific dish to be added."
            )
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
        if payload.mode == "store":
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
