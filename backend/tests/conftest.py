from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.db import Base, get_db

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)

from app.core.security import hash_password
from app.models.models import User, Role
from app.core.db import SessionLocal

import pytest

@pytest.fixture
def client():
    return TestClient(app)
db = TestingSessionLocal()
if not db.query(User).filter(User.email=="client1@chs.ru").first():
    db.add(User(email="client1@chs.ru", password_hash=hash_password("password123"), role=Role.client, full_name="Иван Петров"))
    db.commit()
db.close()
