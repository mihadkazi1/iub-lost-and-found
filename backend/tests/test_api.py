"""Small smoke tests. The database is the local demo database by default."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    # Entering the TestClient context runs the FastAPI startup hook (tables + seed data).
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_public_board_returns_seeded_demo_items(client: TestClient):
    response = client.get("/api/items")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1
    assert "contact_info" not in response.json()[0] or response.json()[0]["contact_info"] is None


def test_login_and_me(client: TestClient):
    response = client.post(
        "/api/auth/login",
        json={"student_id": "TEST-309-001", "full_name": "CSE Test Student", "phone_number": "01712345678", "whatsapp_number": "01712345679", "extra_contact_info": "Available after 3 PM"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["student_id"] == "TEST-309-001"



def test_guest_cannot_create_report(client: TestClient):
    payload = {
        "title": "Guest report should be blocked",
        "description": "This post must not be created without signing in first.",
        "category": "Other",
        "report_type": "lost",
        "location": "Library",
        "incident_date": None,
        "contact_info": "Please sign in before making a report.",
    }
    for headers in ({}, {"Authorization": "Bearer invalid-token"}):
        response = client.post("/api/items", headers=headers, json=payload)
        assert response.status_code == 401
        assert "sign in" in response.json()["detail"].lower()


def test_report_lifecycle_and_contact_privacy(client: TestClient):
    owner_login = client.post(
        "/api/auth/login",
        json={"student_id": "OWNER-309-TEST", "full_name": "Report Owner", "phone_number": "01712345678", "whatsapp_number": "01712345679", "extra_contact_info": "Available after 3 PM"},
    )
    assert owner_login.status_code == 200
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    created = client.post(
        "/api/items",
        headers=owner_headers,
        json={
            "title": "Test privacy item",
            "description": "This item exists for an API test and will be deleted afterwards.",
            "category": "Other",
            "report_type": "lost",
            "location": "Test room",
            "incident_date": None,
            "contact_info": "Contact the report owner for the test.",
            "image_data": "data:image/png;base64,aGVsbG8=",
        },
    )
    assert created.status_code == 201
    assert created.json()["image_url"] is not None
    item_id = created.json()["id"]
    photo_response = client.get(f"/api/items/{item_id}/image")
    assert photo_response.status_code == 200
    assert photo_response.content == b"hello"

    public_list = client.get("/api/items", params={"q": "Test privacy item", "status": "all"})
    assert public_list.status_code == 200
    public_item = next(item for item in public_list.json() if item["id"] == item_id)
    assert public_item["contact_info"] is None
    assert public_item["image_url"] == f"/api/items/{item_id}/image"
    assert "image_data" not in public_item

    assert client.get(f"/api/items/{item_id}/contact").status_code == 401
    contact = client.get(f"/api/items/{item_id}/contact", headers=owner_headers)
    assert contact.status_code == 200
    assert contact.json()["contact_info"] == "Contact the report owner for the test."
    assert contact.json()["phone_number"] == "01712345678"
    assert contact.json()["whatsapp_number"] == "01712345679"

    other_login = client.post(
        "/api/auth/login",
        json={"student_id": "OTHER-309-TEST", "full_name": "Another Student", "phone_number": "01812345678"},
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    assert client.patch(f"/api/items/{item_id}/status", headers=other_headers, json={"status": "resolved"}).status_code == 403
    assert client.delete(f"/api/items/{item_id}", headers=other_headers).status_code == 403

    resolved = client.patch(f"/api/items/{item_id}/status", headers=owner_headers, json={"status": "resolved"})
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert client.delete(f"/api/items/{item_id}", headers=owner_headers).status_code == 204


def test_login_requires_phone_number(client: TestClient):
    response = client.post(
        "/api/auth/login",
        json={"student_id": "NO-PHONE-001", "full_name": "Missing Phone"},
    )
    assert response.status_code == 422

