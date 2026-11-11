def test_login_success(client):
    r = client.post("/api/v1/auth/login", json={"email": "client1@chs.ru", "password": "password123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "client"

def test_login_bad_password(client):
    r = client.post("/api/v1/auth/login", json={"email": "client1@chs.ru", "password": "wrong"})
    assert r.status_code == 401
