from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Lead
from app.schemas.schemas import LeadOut, LeadCreateIn

router = APIRouter(prefix="/leads", tags=["leads"])

@router.get("", response_model=list[LeadOut])
def list_leads(stage: str = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Lead)
    if stage: q = q.filter(Lead.stage == stage)
    return q.order_by(Lead.created_at.desc()).all()

@router.post("", response_model=LeadOut)
def create_lead(body: LeadCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    l = Lead(**body.model_dump())
    db.add(l); db.commit(); db.refresh(l)
    return l

@router.patch("/{lid}/stage", response_model=LeadOut)
def update_stage(lid: str, stage: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(lid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    l = db.query(Lead).filter(Lead.id == uid).first()
    if not l: raise HTTPException(404)
    l.stage = stage
    db.commit(); db.refresh(l)
    return l

@router.post("/{lid}/convert", response_model=dict)
def convert_lead(lid: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(lid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    l = db.query(Lead).filter(Lead.id == uid).first()
    if not l: raise HTTPException(404)
    if l.client_id: return {"ok": True, "client_id": str(l.client_id)}
    from app.models.models import Client, User, Role
    from app.core.security import hash_password
    u = User(email=l.email or f"lead{l.id}@chs.local", password_hash=hash_password("password123"), role=Role.client, full_name=f"{l.first_name} {l.last_name or ''}".strip())
    db.add(u); db.commit(); db.refresh(u)
    c = Client(user_id=u.id, first_name=l.first_name, last_name=l.last_name or "", email=l.email, phone=l.phone, status="active", segment="new")
    db.add(c); db.commit(); db.refresh(c)
    l.client_id = c.id
    l.stage = "converted"
    db.commit()
    return {"ok": True, "client_id": str(c.id)}