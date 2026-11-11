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
from app.models.models import (User, Role, Client, Trainer, ClassType, Session as Sess, Booking, BookingStatus)
import uuid
from datetime import date, datetime, timedelta

db = TestingSessionLocal()

def get_or_create_user(email, password, role, full_name):
    u = db.query(User).filter(User.email == email).first()
    if u:
        return u
    u = User(email=email, password_hash=hash_password(password), role=role, full_name=full_name, is_active=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

# admin
admin = get_or_create_user("admin@chs.ru", "password123", Role.admin, "Админ")
# trainers
tr_user1 = get_or_create_user("trainer1@chs.ru", "password123", Role.trainer, "Тренер Один")
tr_user2 = get_or_create_user("trainer2@chs.ru", "password123", Role.trainer, "Тренер Два")
# clients
client1_user = get_or_create_user("client1@chs.ru", "password123", Role.client, "Иван Петров")
client2_user = get_or_create_user("client2@chs.ru", "password123", Role.client, "Мария Сидорова")
client3_user = get_or_create_user("client3@chs.ru", "password123", Role.client, "Пётр Иванов")

# trainer profiles
def get_or_create_trainer(user, first, last):
    t = db.query(Trainer).filter(Trainer.user_id == user.id).first()
    if t:
        return t
    t = Trainer(user_id=user.id, first_name=first, last_name=last, is_active=True)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

t1 = get_or_create_trainer(tr_user1, "Один", "Тренеров")
t2 = get_or_create_trainer(tr_user2, "Два", "Тренеров")

# client profiles
def get_or_create_client(user, first, last):
    c = db.query(Client).filter(Client.user_id == user.id).first()
    if c:
        return c
    c = Client(user_id=user.id, first_name=first, last_name=last, status="active")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

c1 = get_or_create_client(client1_user, "Иван", "Петров")
c2 = get_or_create_client(client2_user, "Мария", "Сидорова")
c3 = get_or_create_client(client3_user, "Пётр", "Иванов")

# class type
ct = db.query(ClassType).first()
if not ct:
    ct = ClassType(name="Йога", duration_min=60, price_single=1800, color="#7C9A82")
    db.add(ct)
    db.commit()
    db.refresh(ct)

# sessions (one per trainer)
s1 = db.query(Sess).filter(Sess.trainer_id == t1.id).first()
if not s1:
    s1 = Sess(class_type_id=ct.id, trainer_id=t1.id, date=date.today(),
              start_at=datetime.utcnow()+timedelta(hours=1),
              end_at=datetime.utcnow()+timedelta(hours=2), capacity=10, status="planned")
    db.add(s1)
    db.commit()
    db.refresh(s1)
s2 = db.query(Sess).filter(Sess.trainer_id == t2.id).first()
if not s2:
    s2 = Sess(class_type_id=ct.id, trainer_id=t2.id, date=date.today(),
              start_at=datetime.utcnow()+timedelta(hours=3),
              end_at=datetime.utcnow()+timedelta(hours=4), capacity=10, status="planned")
    db.add(s2)
    db.commit()
    db.refresh(s2)

# bookings: c2 on s1, c3 on s2
b1 = db.query(Booking).filter(Booking.session_id == s1.id, Booking.client_id == c2.id).first()
if not b1:
    b1 = Booking(session_id=s1.id, client_id=c2.id, status=BookingStatus.booked)
    db.add(b1)
    db.commit()
    db.refresh(b1)
b2 = db.query(Booking).filter(Booking.session_id == s2.id, Booking.client_id == c3.id).first()
if not b2:
    b2 = Booking(session_id=s2.id, client_id=c3.id, status=BookingStatus.booked)
    db.add(b2)
    db.commit()
    db.refresh(b2)

db.close()

import pytest

@pytest.fixture
def client():
    return TestClient(app)
