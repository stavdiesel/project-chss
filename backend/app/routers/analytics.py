from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.core.db import get_db
from app.core.deps import require_role
from app.models.models import Session as Sess, Booking, BookingStatus, ClassType, Trainer, Subscription, Client

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def summary(date_from: Optional[date] = None, date_to: Optional[date] = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Sess)
    if date_from: q = q.filter(Sess.date >= date_from)
    if date_to: q = q.filter(Sess.date <= date_to)
    sessions = q.all()
    session_ids = [s.id for s in sessions]
    bs = db.query(Booking).filter(Booking.session_id.in_(session_ids)).all() if session_ids else []
    attended = [b for b in bs if b.status == BookingStatus.attended]
    no_show = [b for b in bs if b.status == BookingStatus.no_show]
    cancelled = [b for b in bs if b.status in (BookingStatus.cancelled_by_client, BookingStatus.cancelled_by_admin)]
    booked = [b for b in bs if b.status == BookingStatus.booked]
    unique_clients = len(set(b.client_id for b in bs))
    # revenue: price_single per attended session
    revenue = 0.0
    for b in attended:
        s = db.query(Sess).filter(Sess.id == b.session_id).first()
        ct = db.query(ClassType).filter(ClassType.id == s.class_type_id).first() if s else None
        if ct: revenue += ct.price_single
    # subscriptions revenue (active)
    subs = db.query(Subscription).filter(Subscription.status == "active").all()
    subs_revenue = sum(s.price for s in subs)
    return {
        "period": {"from": str(date_from) if date_from else None, "to": str(date_to) if date_to else None},
        "sessions_total": len(sessions),
        "bookings_total": len(bs),
        "attended": len(attended),
        "no_show": len(no_show),
        "cancelled": len(cancelled),
        "booked_pending": len(booked),
        "unique_clients": unique_clients,
        "revenue_attendance": round(revenue, 2),
        "revenue_subscriptions_active": round(subs_revenue, 2),
        "clients_total": db.query(Client).count(),
        "subscriptions_active": len(subs),
    }

@router.get("/by-trainer")
def by_trainer(date_from: Optional[date] = None, date_to: Optional[date] = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Sess)
    if date_from: q = q.filter(Sess.date >= date_from)
    if date_to: q = q.filter(Sess.date <= date_to)
    sessions = q.all()
    trainers = db.query(Trainer).all()
    out = []
    for t in trainers:
        ts = [s for s in sessions if s.trainer_id == t.id]
        tids = [s.id for s in ts]
        bs = db.query(Booking).filter(Booking.session_id.in_(tids)).all() if tids else []
        attended = [b for b in bs if b.status == BookingStatus.attended]
        out.append({
            "trainer_id": str(t.id),
            "trainer_name": f"{t.first_name} {t.last_name}",
            "sessions": len(ts),
            "bookings": len(bs),
            "attended": len(attended),
        })
    return out

@router.get("/by-class-type")
def by_class_type(date_from: Optional[date] = None, date_to: Optional[date] = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Sess)
    if date_from: q = q.filter(Sess.date >= date_from)
    if date_to: q = q.filter(Sess.date <= date_to)
    sessions = q.all()
    cts = db.query(ClassType).all()
    out = []
    for ct in cts:
        cs = [s for s in sessions if s.class_type_id == ct.id]
        cids = [s.id for s in cs]
        bs = db.query(Booking).filter(Booking.session_id.in_(cids)).all() if cids else []
        attended = [b for b in bs if b.status == BookingStatus.attended]
        out.append({
            "class_type_id": str(ct.id),
            "name": ct.name,
            "sessions": len(cs),
            "bookings": len(bs),
            "attended": len(attended),
            "price_single": ct.price_single,
        })
    return out
