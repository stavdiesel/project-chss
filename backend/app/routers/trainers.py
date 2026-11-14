from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import require_role
from app.core.security import hash_password
from app.models.models import Trainer, User, Role
from app.schemas.schemas import TrainerOut

router = APIRouter(prefix="/trainers", tags=["trainers"])

@router.get("", response_model=list[TrainerOut])
def list_trainers(db: Session = Depends(get_db)):
    return db.query(Trainer).all()

@router.post("", response_model=TrainerOut)
def create_trainer(first_name: str, last_name: str, email: str, specialization: str = "", db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    u = User(email=email, password_hash=hash_password("password123"), role=Role.trainer, full_name=f"{first_name} {last_name}")
    db.add(u); db.commit(); db.refresh(u)
    t = Trainer(user_id=u.id, first_name=first_name, last_name=last_name, specialization=specialization)
    db.add(t); db.commit(); db.refresh(t)
    return t

@router.patch("/{tid}", response_model=TrainerOut)
def update_trainer(tid: str, first_name: str = None, last_name: str = None, specialization: str = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(tid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    t = db.query(Trainer).filter(Trainer.id == uid).first()
    if not t: raise HTTPException(404)
    if first_name: t.first_name = first_name
    if last_name: t.last_name = last_name
    if specialization is not None: t.specialization = specialization
    db.commit(); db.refresh(t)
    return t

@router.delete("/{tid}")
def delete_trainer(tid: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(tid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    t = db.query(Trainer).filter(Trainer.id == uid).first()
    if not t: raise HTTPException(404)
    db.delete(t); db.commit()
    return {"ok": True}