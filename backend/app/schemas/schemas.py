from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time
import uuid

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    full_name: str
    class Config:
        from_attributes = True

class ClientOut(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    phone: Optional[str]=None
    email: Optional[str]=None
    status: str
    notes: Optional[str]=None
    class Config:
        from_attributes = True

class TrainerOut(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    specialization: Optional[str]=None
    class Config:
        from_attributes = True

class ClassTypeOut(BaseModel):
    id: uuid.UUID
    name: str
    duration_min: int
    price_single: float
    color: str
    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: uuid.UUID
    class_type_id: uuid.UUID
    class_type_name: Optional[str]=None
    trainer_id: uuid.UUID
    trainer_name: Optional[str]=None
    date: date
    start_at: datetime
    end_at: datetime
    capacity: int
    booked_count: int = 0
    status: str
    class Config:
        from_attributes = True

class BookingOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    client_id: uuid.UUID
    client_name: Optional[str]=None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class SubscriptionOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    type: str
    total_visits: int
    used_visits: int
    valid_from: date
    valid_until: date
    price: float
    status: str
    remaining: int = 0
    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    class_type_id: uuid.UUID
    trainer_id: uuid.UUID
    weekday: int
    start_time: time
    end_time: time
    capacity: int = 10
    cancel_deadline_hours: int = 3

class SessionCreate(BaseModel):
    class_type_id: uuid.UUID
    trainer_id: uuid.UUID
    date: date
    start_at: datetime
    end_at: datetime
    capacity: int = 10

class SubscriptionCreate(BaseModel):
    client_id: uuid.UUID
    type: str = "package"
    total_visits: int = 8
    valid_from: date
    valid_until: date
    price: float = 0