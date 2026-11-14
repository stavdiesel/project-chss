from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from datetime import datetime
from app.core.db import get_db
from app.core.deps import get_current_user, require_role, get_trainer
from app.core.security import hash_password
from app.models.models import Client, User, Booking, Session as Sess, Role, Subscription, Setting
from app.schemas.schemas import ClientOut, ClientCreateIn

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), user=Depends(require_role("admin","trainer"))):
    if user.role.value == "admin":
        qs = db.query(Client).all()
    else:
        trainer = get_trainer(user, db)
        if trainer:
            qs = (db.query(Client).join(Booking, Booking.client_id == Client.id)
                  .join(Sess, Sess.id == Booking.session_id)
                  .filter(Sess.trainer_id == trainer.id).distinct().all())
        else:
            qs = []
    out=[]
    for c in qs:
        out.append(ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name,
            phone=c.phone if user.role.value=="admin" else None,
            email=c.email if user.role.value=="admin" else None,
            status=c.status, segment=c.segment, notes=c.notes if user.role.value=="admin" else None))
    return out

@router.get("/{cid}", response_model=ClientOut)
def get_client(cid: str, db: Session = Depends(get_db), user=Depends(require_role("admin","trainer"))):
    try:
        uid = _UUID(cid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    c = db.query(Client).filter(Client.id == uid).first()
    if not c: raise HTTPException(404)
    if user.role.value == "trainer":
        trainer = get_trainer(user, db)
        owned = False
        if trainer:
            owned = db.query(Booking).join(Sess, Sess.id == Booking.session_id).filter(
                Booking.client_id == c.id, Sess.trainer_id == trainer.id).first() is not None
        if not owned:
            raise HTTPException(404)
    return ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name,
        phone=c.phone if user.role.value=="admin" else None,
        email=c.email if user.role.value=="admin" else None,
        status=c.status, segment=c.segment, notes=c.notes if user.role.value=="admin" else None)


@router.post("/auto-segment", response_model=dict)
def auto_segment(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    from datetime import date, timedelta
    # read thresholds
    def get_setting(key, default):
        s = db.query(Setting).filter(Setting.key == key).first()
        return int(s.value) if s and s.value else default
    at_risk_days = get_setting("segment_at_risk_days", 14)
    sleeping_days = get_setting("segment_sleeping_days", 30)
    expiring_days = get_setting("segment_expiring_days", 7)
    clients = db.query(Client).all()
    updated = 0
    for c in clients:
        last_attended = db.query(Booking).filter(Booking.client_id == c.id, Booking.status == "attended").order_by(Booking.created_at.desc()).first()
        last_visit = last_attended.created_at if last_attended else None
        active_sub = db.query(Subscription).filter(Subscription.client_id == c.id, Subscription.status == "active").first()
        if not active_sub:
            seg = "new"
        else:
            if active_sub.valid_until and (active_sub.valid_until - date.today()).days <= expiring_days:
                seg = "expiring"
            elif active_sub.used_visits <= 2:
                seg = "newcomer"
            elif last_visit and (datetime.utcnow() - last_visit).days > sleeping_days:
                seg = "sleeping"
            elif last_visit and (datetime.utcnow() - last_visit).days > at_risk_days:
                seg = "at_risk"
            else:
                seg = "active"
        if c.segment != seg:
            c.segment = seg
            updated += 1
    db.commit()
    return {"updated": updated, "total": len(clients)}
def update_segment(cid: str, segment: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(cid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    c = db.query(Client).filter(Client.id == uid).first()
    if not c: raise HTTPException(404)
    c.segment = segment
    db.commit(); db.refresh(c)
    return ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name, phone=c.phone, email=c.email, status=c.status, segment=c.segment, notes=c.notes)
@router.get("/export")
def export_clients(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    import csv, io
    from fastapi.responses import StreamingResponse
    rows = db.query(Client).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id","first_name","last_name","phone","email","status","segment","notes"])
    for c in rows:
        w.writerow([c.id, c.first_name, c.last_name, c.phone, c.email, c.status, c.segment, c.notes])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=clients.csv"})

@router.post("", response_model=ClientOut)
def create_client(body: ClientCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    u = User(email=body.email, password_hash=hash_password("password123"), role=Role.client, full_name=f"{body.first_name} {body.last_name}")
    db.add(u); db.commit(); db.refresh(u)
    c = Client(user_id=u.id, first_name=body.first_name, last_name=body.last_name, email=body.email, phone=body.phone, notes=body.notes, status="active", segment="new")
    db.add(c); db.commit(); db.refresh(c)
    return ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name, phone=c.phone, email=c.email, status=c.status, segment=c.segment, notes=c.notes)
