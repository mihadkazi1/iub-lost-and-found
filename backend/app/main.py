"""FastAPI application for the IUB Lost & Found demo."""
from __future__ import annotations

import base64
import hashlib
import os
import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, inspect, or_, select, text
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db
from .models import AuthSession, Item, Student
from .schemas import (
    ContactResponse,
    ItemCreate,
    ItemPublic,
    ItemStatusUpdate,
    LoginRequest,
    LoginResponse,
    StatsResponse,
    StudentPublic,
)

def _migrate_schema() -> None:
    """Add newer demo fields to an existing SQLite workspace database."""
    with engine.begin() as connection:
        tables = set(inspect(connection).get_table_names())
        if "students" in tables:
            student_columns = {column["name"] for column in inspect(connection).get_columns("students")}
            additions = {
                "phone_number": "VARCHAR(25)",
                "whatsapp_number": "VARCHAR(25)",
                "extra_contact_info": "VARCHAR(240)",
            }
            for column_name, column_type in additions.items():
                if column_name not in student_columns:
                    connection.execute(text(f"ALTER TABLE students ADD COLUMN {column_name} {column_type}"))
        if "items" in tables:
            item_columns = {column["name"] for column in inspect(connection).get_columns("items")}
            if "image_data" not in item_columns:
                connection.execute(text("ALTER TABLE items ADD COLUMN image_data TEXT"))


def _utcnow_naive() -> datetime:
    """UTC timestamp represented as naive datetime for SQLite's DateTime column."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate_schema()
    with SessionLocal() as db:
        _seed_demo_data(db)
    yield


app = FastAPI(
    title="IUB Lost & Found API",
    description="A CSE309 classroom demonstration API for a campus lost-and-found board.",
    version="1.0.0",
    lifespan=lifespan,
)

configured_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in configured_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

SESSION_DAYS = 7


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _student_payload(student: Student) -> dict[str, str | None]:
    return {
        "student_id": student.student_id,
        "full_name": student.full_name,
        "phone_number": student.phone_number,
        "whatsapp_number": student.whatsapp_number,
        "extra_contact_info": student.extra_contact_info,
    }


def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> Student | None:
    """Resolve an optional bearer session; public board browsing does not require login."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    session_record = db.get(AuthSession, _hash_token(token.strip()))
    if not session_record:
        return None
    if session_record.expires_at < _utcnow_naive():
        db.delete(session_record)
        db.commit()
        return None
    return db.get(Student, session_record.student_pk)


def get_current_user(user: Student | None = Depends(get_optional_user)) -> Student:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in with your student ID to continue.")
    return user


def _serialize_item(item: Item, user: Student | None = None, include_contact: bool = False) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "category": item.category,
        "report_type": item.report_type,
        "location": item.location,
        "incident_date": item.incident_date,
        "status": item.status,
        "reporter_name": item.owner.full_name,
        "created_at": item.created_at,
        "is_owner": bool(user and user.id == item.owner_id),
        "contact_available": True,
        # Contact details are intentionally hidden from guests and revealed through a signed-in endpoint.
        "contact_info": item.contact_info if include_contact and user else None,
        "image_url": f"/api/items/{item.id}/image" if item.image_data else None,
    }


def _seed_demo_data(db: Session) -> None:
    if db.scalar(select(func.count(Item.id))) != 0:
        return

    demo_students = [
        Student(student_id="DEMO-1001", full_name="Ayesha Rahman"),
        Student(student_id="DEMO-1002", full_name="Tanvir Hasan"),
        Student(student_id="DEMO-1003", full_name="Nabila Chowdhury"),
        Student(student_id="DEMO-1004", full_name="Samiul Islam"),
        Student(student_id="DEMO-1005", full_name="Maliha Ahmed"),
    ]
    db.add_all(demo_students)
    db.flush()
    today = date.today()
    samples = [
        Item(
            title="Black wireless earbuds case",
            description="A small black earbuds case was left behind after the afternoon class. Please share the brand or a detail to confirm ownership.",
            category="Electronics", report_type="found", location="Library — 2nd floor study area",
            incident_date=today - timedelta(days=1), contact_info="Ask for the Lost & Found desk at the library counter.", owner_id=demo_students[0].id,
        ),
        Item(
            title="Blue university notebook",
            description="I misplaced a blue spiral notebook with lecture notes inside. It has a small white sticker on the front cover.",
            category="Books", report_type="lost", location="School of Business corridor",
            incident_date=today - timedelta(days=2), contact_info="Send a message through the campus student community.", owner_id=demo_students[1].id,
        ),
        Item(
            title="Silver keyring with two keys",
            description="Found a silver keyring with two keys near the main cafeteria seating area. Kept safe while waiting for its owner.",
            category="Keys", report_type="found", location="Main cafeteria entrance",
            incident_date=today - timedelta(days=1), contact_info="Please describe the keyring at the campus help desk.", owner_id=demo_students[2].id,
        ),
        Item(
            title="Student card in a clear sleeve",
            description="A student card was misplaced around the academic building. The card is inside a clear plastic sleeve.",
            category="Cards & IDs", report_type="lost", location="Academic Building — ground floor",
            incident_date=today - timedelta(days=3), contact_info="Please contact me through the campus help desk. Do not post card details publicly.", owner_id=demo_students[3].id,
        ),
        Item(
            title="Olive green water bottle",
            description="Found an olive green reusable bottle after a morning study session. It has a small round sticker near the bottom.",
            category="Accessories", report_type="found", location="Student lounge",
            incident_date=today - timedelta(days=4), contact_info="Ask for the item at the student lounge reception.", owner_id=demo_students[4].id,
        ),
        Item(
            title="Grey laptop sleeve",
            description="A grey 14-inch laptop sleeve may have been left in a classroom. There is no laptop inside it.",
            category="Bags", report_type="lost", location="Room 402, academic building",
            incident_date=today - timedelta(days=5), contact_info="Message via the student community and mention the sleeve size.", owner_id=demo_students[0].id,
        ),
    ]
    db.add_all(samples)
    db.commit()


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "IUB Lost & Found API"}


@app.post("/api/auth/login", response_model=LoginResponse, tags=["authentication"])
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    """Create a demo session from a student ID and name.

    This is intentionally a teaching/demo flow, not university identity verification.
    A real deployment must integrate with IUB's approved identity provider.
    """
    student_id = payload.student_id
    student = db.scalar(select(Student).where(Student.student_id == student_id))
    if student is None:
        student = Student(
            student_id=student_id,
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            whatsapp_number=payload.whatsapp_number,
            extra_contact_info=payload.extra_contact_info,
        )
        db.add(student)
        db.flush()
    else:
        # Keep the display name current in this small demo. Production identity fields
        # should be controlled by an authoritative university identity provider.
        student.full_name = payload.full_name
        student.phone_number = payload.phone_number
        student.whatsapp_number = payload.whatsapp_number
        student.extra_contact_info = payload.extra_contact_info

    token = secrets.token_urlsafe(32)
    session_record = AuthSession(
        token_hash=_hash_token(token),
        student_pk=student.id,
        expires_at=_utcnow_naive() + timedelta(days=SESSION_DAYS),
    )
    db.add(session_record)
    db.commit()
    db.refresh(student)
    return {"access_token": token, "token_type": "bearer", "user": _student_payload(student)}


@app.get("/api/auth/me", response_model=StudentPublic, tags=["authentication"])
def me(current_user: Student = Depends(get_current_user)) -> dict[str, str | None]:
    return _student_payload(current_user)


@app.post("/api/auth/logout", status_code=204, tags=["authentication"])
def logout(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> None:
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            session_record = db.get(AuthSession, _hash_token(token.strip()))
            if session_record:
                db.delete(session_record)
                db.commit()
    return None


@app.get("/api/stats", response_model=StatsResponse, tags=["board"])
def stats(db: Session = Depends(get_db)) -> dict[str, int]:
    total = db.scalar(select(func.count(Item.id))) or 0
    open_count = db.scalar(select(func.count(Item.id)).where(Item.status == "open")) or 0
    resolved = db.scalar(select(func.count(Item.id)).where(Item.status == "resolved")) or 0
    lost = db.scalar(select(func.count(Item.id)).where(Item.report_type == "lost")) or 0
    found = db.scalar(select(func.count(Item.id)).where(Item.report_type == "found")) or 0
    return {"total_reports": total, "open_reports": open_count, "resolved_reports": resolved, "lost_reports": lost, "found_reports": found}


@app.get("/api/items", response_model=list[ItemPublic], tags=["board"])
def list_items(
    q: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=32),
    report_type: str | None = Query(default=None, pattern="^(lost|found)$"),
    item_status: str | None = Query(default="open", alias="status", pattern="^(open|resolved|all)$"),
    db: Session = Depends(get_db),
    current_user: Student | None = Depends(get_optional_user),
) -> list[dict]:
    query = select(Item).options(joinedload(Item.owner))
    if item_status and item_status != "all":
        query = query.where(Item.status == item_status)
    if category and category != "All items":
        query = query.where(Item.category == category)
    if report_type:
        query = query.where(Item.report_type == report_type)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(or_(Item.title.ilike(term), Item.description.ilike(term), Item.location.ilike(term), Item.category.ilike(term)))
    items = db.scalars(query.order_by(Item.created_at.desc(), Item.id.desc()).limit(100)).unique().all()
    return [_serialize_item(item, current_user) for item in items]


@app.post("/api/items", response_model=ItemPublic, status_code=201, tags=["board"])
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user),
) -> dict:
    item = Item(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        report_type=payload.report_type,
        location=payload.location,
        incident_date=payload.incident_date,
        contact_info=payload.contact_info,
        image_data=payload.image_data,
        owner_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    item = db.scalar(select(Item).options(joinedload(Item.owner)).where(Item.id == item.id))
    return _serialize_item(item, current_user)


@app.get("/api/items/{item_id}/image", tags=["board"])
def get_item_image(item_id: int, db: Session = Depends(get_db)) -> Response:
    """Serve a report photo without embedding its base64 data in every board response."""
    item = db.get(Item, item_id)
    if item is None or not item.image_data:
        raise HTTPException(status_code=404, detail="This report has no photo.")
    try:
        header, encoded = item.image_data.split(",", 1)
        media_type = header.removeprefix("data:").removesuffix(";base64")
        content = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise HTTPException(status_code=500, detail="The stored report photo is invalid.") from exc
    return Response(content=content, media_type=media_type, headers={"Cache-Control": "public, max-age=3600"})


@app.get("/api/items/{item_id}/contact", response_model=ContactResponse, tags=["board"])
def get_contact(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user),
) -> dict[str, str | None]:
    item = db.scalar(select(Item).options(joinedload(Item.owner)).where(Item.id == item_id))
    if item is None:
        raise HTTPException(status_code=404, detail="This report could not be found.")
    return {
        "reporter_name": item.owner.full_name,
        "phone_number": item.owner.phone_number,
        # The login form says blank means "same as phone", so use it for WhatsApp too.
        "whatsapp_number": item.owner.whatsapp_number or item.owner.phone_number,
        "extra_contact_info": item.owner.extra_contact_info,
        "contact_info": item.contact_info,
    }


@app.patch("/api/items/{item_id}/status", response_model=ItemPublic, tags=["board"])
def update_status(
    item_id: int,
    payload: ItemStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user),
) -> dict:
    item = db.scalar(select(Item).options(joinedload(Item.owner)).where(Item.id == item_id))
    if item is None:
        raise HTTPException(status_code=404, detail="This report could not be found.")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own reports.")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    item = db.scalar(select(Item).options(joinedload(Item.owner)).where(Item.id == item_id))
    return _serialize_item(item, current_user)


@app.delete("/api/items/{item_id}", status_code=204, tags=["board"])
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user),
) -> None:
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="This report could not be found.")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reports.")
    db.delete(item)
    db.commit()
    return None
