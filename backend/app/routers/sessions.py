from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from app.core.db import get_db
from app.core.deps import get_current_user, require_role, get_trainer
from app.models.models import Session as Sess, Schedule, ClassType, Trainer, Booking
from app.schemas.schemas import SessionOut, SessionCreate

router = APIRouter(prefix="/sessions", tags=["sessions"])

def _enrich(s, db):
    ct = db.query(ClassType).filter(ClassType.id == s.class_type_id).first()
    tr = db.query(Trainer).filter(Trainer.id == s.trainer_id).first()
    cnt = db.query(Booking).filter(Booking.session_id == s.id, Booking.status.in_(["booked","attended"])).count()
    return SessionOut(id=s.id, class_type_id=s.class_type_id, class_type_name=ct.name if ct else None,
        trainer_id=s.trainer_id, trainer_name=(tr.first_name+" "+tr.last_name) if tr else None,
        date=s.date, start_at=s.start_at, end_at=s.end_at, capacity=s.capacity, booked_count=cnt, status=s.status)

@router.get("", response_model=list[SessionOut])
def list_sessions(date_from: date = None, date_to: date = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Sess)
    if user.role.value == "trainer":
        trainer = get_trainer(user, db)
        if trainer:
            q = q.filter(Sess.trainer_id == trainer.id)
        else:
            q = q.filter(False)
    if date_from: q = q.filter(Sess.date >= date_from)
    if date_to: q = q.filter(Sess.date <= date_to)
    return [_enrich(s, db) for s in q.order_by(Sess.start_at).all()]

@router.post("", response_model=SessionOut)
def create_session(body: SessionCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    s = Sess(class_type_id=body.class_type_id, trainer_id=body.trainer_id, date=body.date,
             start_at=body.start_at, end_at=body.end_at, capacity=body.capacity)
    db.add(s); db.commit(); db.refresh(s)
    return _enrich(s, db)

@router.delete("/{sid}")
def delete_session(sid: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    s = db.query(Sess).filter(Sess.id == sid).first()
    if not s: raise HTTPException(404)
    db.delete(s); db.commit()
    return {"ok": True}