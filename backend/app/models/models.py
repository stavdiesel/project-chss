import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Boolean, Text, Date, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.db import Base
import enum

def uid():
    return str(uuid.uuid4())

class Role(str, enum.Enum):
    admin = "admin"; trainer = "trainer"; client = "client"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=__import__("datetime").datetime.utcnow)
    client_profile = relationship("Client", back_populates="user", uselist=False)
    trainer_profile = relationship("Trainer", back_populates="user", uselist=False)

class Client(Base):
    __tablename__ = "clients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    notes = Column(Text)
    status = Column(String, default="active")
    segment = Column(String, default="new")
    user = relationship("User", back_populates="client_profile")
    subscriptions = relationship("Subscription", back_populates="client")
    bookings = relationship("Booking", back_populates="client")

class Lead(Base):
    __tablename__ = "leads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    source = Column(String, nullable=True)
    interest = Column(String, nullable=True)
    stage = Column(String, default="new")
    responsible_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    next_step = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    responsible = relationship("User")
    client = relationship("Client")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reason = Column(String, nullable=False)
    action = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="new")
    history = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    client = relationship("Client")
    assignee = relationship("User")

class Waitlist(Base):
    __tablename__ = "waitlist"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    position = Column(Integer, default=1)
    status = Column(String, default="waiting")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    session = relationship("Session")
    client = relationship("Client")

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True)
    value = Column(String, nullable=True)

class Trainer(Base):
    __tablename__ = "trainers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    specialization = Column(String)
    is_active = Column(Boolean, default=True)
    user = relationship("User", back_populates="trainer_profile")
    sessions = relationship("Session", back_populates="trainer")

class ClassType(Base):
    __tablename__ = "class_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    duration_min = Column(Integer, default=60)
    price_single = Column(Float, default=1800)
    color = Column(String, default="#7C9A82")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_type_id = Column(UUID(as_uuid=True), ForeignKey("class_types.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=True)
    weekday = Column(Integer, nullable=False)  # 0-6
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    capacity = Column(Integer, default=10)
    cancel_deadline_hours = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    class_type = relationship("ClassType")
    trainer = relationship("Trainer")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("schedules.id"), nullable=True)
    class_type_id = Column(UUID(as_uuid=True), ForeignKey("class_types.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=True)
    date = Column(Date, nullable=False)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    capacity = Column(Integer, default=10)
    status = Column(String, default="planned")
    class_type = relationship("ClassType")
    trainer = relationship("Trainer")
    bookings = relationship("Booking", back_populates="session")

class BookingStatus(str, enum.Enum):
    booked = "booked"; attended = "attended"; no_show = "no_show"
    cancelled_by_client = "cancelled_by_client"; cancelled_by_admin = "cancelled_by_admin"

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.booked)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=__import__("datetime").datetime.utcnow)
    session = relationship("Session", back_populates="bookings")
    client = relationship("Client", back_populates="bookings")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    type = Column(String, default="package")
    total_visits = Column(Integer, default=8)
    used_visits = Column(Integer, default=0)
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    price = Column(Float, default=0)
    status = Column(String, default="active")
    history = Column(Text, default="[]")
    frozen_until = Column(Date, nullable=True)
    client = relationship("Client", back_populates="subscriptions")


class PaymentStatus(str, enum.Enum):
    pending = "pending"; success = "success"; failed = "failed"; refunded = "refunded"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    amount = Column(Float, default=0)
    purpose = Column(String, default="Разовое занятие")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    status_history = Column(Text, default="[]")
    created_at = Column(DateTime, default=__import__("datetime").datetime.utcnow)
    updated_at = Column(DateTime, default=__import__("datetime").datetime.utcnow)
    client = relationship("Client")

class NotificationStatus(str, enum.Enum):
    pending = "pending"; sent = "sent"; failed = "failed"; not_sent = "not_sent"

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    channel = Column(String, default="telegram")
    message = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.not_sent)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=__import__("datetime").datetime.utcnow)
    client = relationship("Client")
