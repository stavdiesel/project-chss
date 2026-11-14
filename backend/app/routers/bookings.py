from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from datetime import datetime, timedelta
from app.core.db import get_db
from app.core.deps import get_current_user, require_role, get_trainer
from app.core.config import settings
from app.models.models import Booking, BookingStatus, Session as Sess, Client, Subscription, Waitlist, ClassType, Trainer, Notification, NotificationStatus
from app.schemas.schemas import BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])

def _name(b, db):
    c = db.query(Client).filter(Client.id == b.client_id).first()
    return (c.first_name+" "+c.last_name) if c else None

def _session_info(b, db):
    s = db.query(Sess).filter(Sess.id == b.session_id).first()
    if not s: return {}
    ct = db.query(ClassType).filter(ClassType.id == s.class_type_id).first()
    tr = db.query(Trainer).filter(Trainer.id == s.trainer_id).first()
    return {
        "session_start_at": s.start_at,
        "session_end_at": s.end_at,
        "session_class_type_name": ct.name if ct else None,
        "session_trainer_name": (tr.first_name+" "+tr.last_name) if tr else None,
    }

@router.get("/me", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.user_id == user.id).first()
    if not client: return []
    bs = db.query(Booking).filter(Booking.client_id == client.id).all()
    out=[]
    for b in bs:
        out.append(BookingOut(id=b.id, session_id=b.session_id, client_id=b.client_id, client_name=_name(b,db), status=b.status.value, created_at=b.created_at, **_session_info(b,db)))
    return out

@router.get("/session/{sid}", response_model=list[BookingOut])
def session_bookings(sid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        sid_uid = _UUID(sid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    s = db.query(Sess).filter(Sess.id == sid_uid).first()
    if not s: raise HTTPException(404)
    if user.role.value == "trainer":
        trainer = get_trainer(user, db)
        if not trainer or s.trainer_id != trainer.id:
            raise HTTPException(403)
    bs = db.query(Booking).filter(Booking.session_id == sid_uid).all()
    out=[]
    for b in bs:
        out.append(BookingOut(id=b.id, session_id=b.session_id, client_id=b.client_id, client_name=_name(b,db), status=b.status.value, created_at=b.created_at, **_session_info(b,db)))
    return out

@router.post("", response_model=BookingOut)
def book(session_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.user_id == user.id).first()
    if not client: raise HTTPException(400, "No client profile")
    try:
        sid_uid = _UUID(session_id)
    except (ValueError, TypeError):
        raise HTTPException(404)
    s = db.query(Sess).filter(Sess.id == sid_uid).first()
    if not s: raise HTTPException(404)
    cnt = db.query(Booking).filter(Booking.session_id == sid_uid, Booking.status.in_(["booked","attended"])).count()
    if cnt >= s.capacity: raise HTTPException(400, "Full")
    existing = db.query(Booking).filter(Booking.session_id == s.id, Booking.client_id == client.id, Booking.status.in_(["booked","attended"])).first()
    if existing: raise HTTPException(400, "Already booked")
    b = Booking(session_id=s.id, client_id=client.id)
    db.add(b); db.commit(); db.refresh(b)
    # notification
    n = Notification(client_id=client.id, channel="telegram", message=f"Вы записаны на {s.class_type_name or 'занятие'} {s.start_at.strftime('%d.%m %H:%M')}", status=NotificationStatus.not_sent, reason="Канал не подключён (демо)")
    db.add(n); db.commit()
    return BookingOut(id=b.id, session_id=b.session_id, client_id=b.client_id, client_name=_name(b,db), status=b.status.value, created_at=b.created_at)

@router.post("/{bid}/cancel")
def cancel(bid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        bid_uid = _UUID(bid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    b = db.query(Booking).filter(Booking.id == bid_uid).first()
    if not b: raise HTTPException(404)
    client = db.query(Client).filter(Client.user_id == user.id).first()
    is_admin = user.role.value == "admin"
    if not is_admin and (not client or client.id != b.client_id):
        raise HTTPException(403)
    s = db.query(Sess).filter(Sess.id == b.session_id).first()
    if not is_admin:
        deadline = s.start_at - timedelta(hours=settings.CANCEL_DEADLINE_HOURS)
        if datetime.utcnow() > deadline:
            raise HTTPException(400, f"Cancel only {settings.CANCEL_DEADLINE_HOURS}h before")
    b.status = BookingStatus.cancelled_by_admin if is_admin else BookingStatus.cancelled_by_client
    b.cancelled_at = datetime.utcnow()
    db.commit()
    # notification
    n = Notification(client_id=b.client_id, channel="telegram", message=f"Запись на занятие отменена", status=NotificationStatus.not_sent, reason="Канал не подключён (демо)")
    db.add(n); db.commit()
    # offer waitlist spot
    w = db.query(Waitlist).filter(Waitlist.session_id == b.session_id, Waitlist.status == "waiting").order_by(Waitlist.position).first()
    if w:
        w.status = "offered"
        db.commit()
    # refund visit if subscription
    sub = db.query(Subscription).filter(Subscription.client_id == b.client_id, Subscription.status=="active").first()
    if sub and sub.used_visits > 0:
        sub.used_visits -= 1
        import json
        h = json.loads(sub.history or "[]")
        h.append({"event": "refunded", "at": datetime.utcnow().isoformat(), "booking_id": str(b.id)})
        sub.history = json.dumps(h)
        db.commit()
    return {"ok": True}

@router.post("/{bid}/attend")
def attend(bid: str, db: Session = Depends(get_db), user=Depends(require_role("admin","trainer"))):
    try:
        bid_uid = _UUID(bid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    b = db.query(Booking).filter(Booking.id == bid_uid).first()
    if not b: raise HTTPException(404)
    s = db.query(Sess).filter(Sess.id == b.session_id).first()
    if user.role.value == "trainer":
        trainer = get_trainer(user, db)
        if not trainer or not s or s.trainer_id != trainer.id:
            raise HTTPException(403)
    b.status = BookingStatus.attended
    db.commit()
    # debit subscription
    sub = db.query(Subscription).filter(Subscription.client_id == b.client_id, Subscription.status=="active").first()
    if sub:
        sub.used_visits = min(sub.total_visits, sub.used_visits+1)
        import json
        h = json.loads(sub.history or "[]")
        h.append({"event": "debited", "at": datetime.utcnow().isoformat(), "booking_id": str(b.id)})
        sub.history = json.dumps(h)
        db.commit()
    return {"ok": True}