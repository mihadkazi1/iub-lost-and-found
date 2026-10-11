"""Request and response schemas."""
from __future__ import annotations

import base64
import binascii
import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LoginRequest(BaseModel):
    student_id: str = Field(min_length=4, max_length=32, examples=["DEMO-2026"])
    full_name: str = Field(min_length=2, max_length=100, examples=["Ayesha Rahman"])
    phone_number: str = Field(min_length=7, max_length=25, examples=["01712345678"])
    whatsapp_number: str | None = Field(default=None, max_length=25, examples=["01712345678"])
    extra_contact_info: str | None = Field(default=None, max_length=240, examples=["Usually available after 3 PM"])

    @field_validator("phone_number")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        cleaned = value.strip()
        digits = re.sub(r"\D", "", cleaned)
        if not 7 <= len(digits) <= 15 or not re.fullmatch(r"[+0-9()\-.\s]+", cleaned):
            raise ValueError("Enter a valid phone number with 7 to 15 digits.")
        return cleaned

    @field_validator("whatsapp_number")
    @classmethod
    def normalize_whatsapp_number(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        cleaned = value.strip()
        digits = re.sub(r"\D", "", cleaned)
        if not 7 <= len(digits) <= 15 or not re.fullmatch(r"[+0-9()\-.\s]+", cleaned):
            raise ValueError("Enter a valid WhatsApp number with 7 to 15 digits.")
        return cleaned

    @field_validator("extra_contact_info")
    @classmethod
    def normalize_extra_contact_info(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.strip().split())
        return cleaned or None

    @field_validator("student_id")
    @classmethod
    def normalize_student_id(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned or any(ch.isspace() for ch in cleaned):
            raise ValueError("Student ID cannot be empty or contain spaces.")
        return cleaned

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if len(cleaned) < 2:
            raise ValueError("Please enter your full name.")
        return cleaned


class StudentPublic(BaseModel):
    student_id: str
    full_name: str
    phone_number: str | None = None
    whatsapp_number: str | None = None
    extra_contact_info: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: StudentPublic


class ItemCreate(BaseModel):
    title: str = Field(min_length=4, max_length=100)
    description: str = Field(min_length=10, max_length=1500)
    category: Literal["Electronics", "Cards & IDs", "Bags", "Clothing", "Books", "Keys", "Accessories", "Other"]
    report_type: Literal["lost", "found"]
    location: str = Field(min_length=2, max_length=120)
    incident_date: date | None = None
    contact_info: str = Field(min_length=3, max_length=180)
    image_data: str | None = Field(default=None, max_length=2_850_000)

    @field_validator("image_data")
    @classmethod
    def validate_image_data(cls, value: str | None) -> str | None:
        if value is None or not value:
            return None
        try:
            header, encoded = value.split(",", 1)
        except ValueError as exc:
            raise ValueError("The image upload is not a valid image data URL.") from exc
        if header not in {"data:image/jpeg;base64", "data:image/png;base64", "data:image/webp;base64"}:
            raise ValueError("Upload a JPG, PNG, or WebP image.")
        try:
            decoded = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("The uploaded image data is invalid.") from exc
        if not decoded or len(decoded) > 2 * 1024 * 1024:
            raise ValueError("Images must be smaller than 2 MB.")
        return value

    @field_validator("title", "description", "location", "contact_info")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class ItemStatusUpdate(BaseModel):
    status: Literal["open", "resolved"]


class ItemPublic(BaseModel):
    id: int
    title: str
    description: str
    category: str
    report_type: str
    location: str
    incident_date: date | None
    status: str
    reporter_name: str
    created_at: datetime
    is_owner: bool = False
    contact_available: bool = True
    contact_info: str | None = None
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ContactResponse(BaseModel):
    reporter_name: str
    phone_number: str | None = None
    whatsapp_number: str | None = None
    extra_contact_info: str | None = None
    contact_info: str


class StatsResponse(BaseModel):
    total_reports: int
    open_reports: int
    resolved_reports: int
    lost_reports: int
    found_reports: int
