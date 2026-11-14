from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Waitlist, Client, Session as Sess, Booking
from app.schemas.schemas import WaitlistOut, WaitlistCreateIn

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

@router.get("/{sid}", response_model=list[WaitlistOut])
def list_waitlist(sid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        sid_uid = _UUID(sid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    return db.query(Waitlist).filter(Waitlist.session_id == sid_uid, Waitlist.status.in_(["waiting","offered"])).order_by(Waitlist.position).all()

@router.post("", response_model=WaitlistOut)
def join_waitlist(body: WaitlistCreateIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.user_id == user.id).first()
    if not client: raise HTTPException(400, "No client profile")
    s = db.query(Sess).filter(Sess.id == body.session_id).first()
    if not s: raise HTTPException(404)
    # check capacity
    cnt = db.query(Booking).filter(Booking.session_id == s.id, Booking.status.in_(["booked","attended"])).count()
    if cnt < s.capacity:
        raise HTTPException(400, "There are free spots, book directly")
    # position
    last = db.query(Waitlist).filter(Waitlist.session_id == s.id).order_by(Waitlist.position.desc()).first()
    pos = (last.position + 1) if last else 1
    w = Waitlist(session_id=s.id, client_id=client.id, position=pos)
    db.add(w); db.commit(); db.refresh(w)
    return w

@router.post("/{wid}/confirm", response_model=dict)
def confirm_waitlist(wid: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        wid_uid = _UUID(wid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    w = db.query(Waitlist).filter(Waitlist.id == wid_uid).first()
    if not w: raise HTTPException(404)
    if w.status != "offered": raise HTTPException(400, "Not offered")
    # book
    s = db.query(Sess).filter(Sess.id == w.session_id).first()
    cnt = db.query(Booking).filter(Booking.session_id == s.id, Booking.status.in_(["booked","attended"])).count()
    if cnt >= s.capacity: raise HTTPException(400, "Full")
    b = Booking(session_id=s.id, client_id=w.client_id)
    db.add(b)
    w.status = "confirmed"
    db.commit()
    return {"ok": True}