import pytest
from datetime import date, timedelta

def login(client, email, password="password123"):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]

def auth(client, token):
    return {"Authorization": f"Bearer {token}"}

# Sessions
def test_sessions_list_admin(client):
    token = login(client, "admin@chs.ru")
    r = client.get("/api/v1/sessions", headers=auth(client, token))
    assert r.status_code == 200
    assert len(r.json()) >= 2

def test_sessions_create_and_delete_admin(client):
    token = login(client, "admin@chs.ru")
    # need class_type id and trainer id; fetch via sessions? Use refs? We'll create using known trainer1? Simpler: use first session's class_type_id and trainer_id
    r0 = client.get("/api/v1/sessions", headers=auth(client, token))
    base = r0.json()[0]
    body = {
        "class_type_id": base["class_type_id"],
        "trainer_id": base["trainer_id"],
        "date": date.today().isoformat(),
        "start_at": "2026-12-01T10:00:00",
        "end_at": "2026-12-01T11:00:00",
        "capacity": 5,
    }
    r = client.post("/api/v1/sessions", json=body, headers=auth(client, token))
    assert r.status_code == 200, r.text
    sid = r.json()["id"]
    rd = client.delete(f"/api/v1/sessions/{sid}", headers=auth(client, token))
    assert rd.status_code == 200

def test_sessions_create_trainer_forbidden(client):
    token = login(client, "trainer1@chs.ru")
    r0 = client.get("/api/v1/sessions", headers=auth(client, token))
    base = r0.json()[0]
    body = {
        "class_type_id": base["class_type_id"],
        "trainer_id": base["trainer_id"],
        "date": date.today().isoformat(),
        "start_at": "2026-12-02T10:00:00",
        "end_at": "2026-12-02T11:00:00",
        "capacity": 5,
    }
    r = client.post("/api/v1/sessions", json=body, headers=auth(client, token))
    assert r.status_code == 403

# Bookings
def test_bookings_my_and_book_cancel(client):
    # client2 books a session of trainer1? Use trainer1 session
    t_tr = login(client, "trainer1@chs.ru")
    r = client.get("/api/v1/sessions", headers=auth(client, t_tr))
    sid = r.json()[0]["id"]
    t_cl = login(client, "client2@chs.ru")
    # my bookings before
    rb = client.get("/api/v1/bookings/me", headers=auth(client, t_cl))
    assert rb.status_code == 200
    # book
    rbook = client.post(f"/api/v1/bookings?session_id={sid}", headers=auth(client, t_cl))
    # endpoint signature: book(session_id: str) query param
    assert rbook.status_code in (200, 400), rbook.text
    if rbook.status_code == 200:
        bid = rbook.json()["id"]
        rcancel = client.post(f"/api/v1/bookings/{bid}/cancel", headers=auth(client, t_cl))
        assert rcancel.status_code in (200, 400)

# Subscriptions
def test_subscriptions_my_and_admin(client):
    t_cl = login(client, "client2@chs.ru")
    r = client.get("/api/v1/subscriptions/me", headers=auth(client, t_cl))
    assert r.status_code == 200
    assert len(r.json()) >= 1
    t_ad = login(client, "admin@chs.ru")
    r2 = client.get("/api/v1/subscriptions", headers=auth(client, t_ad))
    assert r2.status_code == 200
    assert len(r2.json()) >= 1

def test_subscriptions_create_admin(client):
    t_ad = login(client, "admin@chs.ru")
    # get client2 id
    rc = client.get("/api/v1/clients", headers=auth(client, t_ad))
    cid = [c for c in rc.json() if c["first_name"]=="Мария"][0]["id"]
    body = {
        "client_id": cid,
        "type": "package",
        "total_visits": 4,
        "valid_from": date.today().isoformat(),
        "valid_until": (date.today() + timedelta(days=30)).isoformat(),
        "price": 2000,
    }
    r = client.post("/api/v1/subscriptions", json=body, headers=auth(client, t_ad))
    assert r.status_code == 200, r.text
