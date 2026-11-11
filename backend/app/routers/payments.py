from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import require_role
from app.models.models import Payment, PaymentStatus, Client
from app.schemas.schemas import PaymentCreateIn, PaymentStatusUpdateIn
from datetime import datetime
import json

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("")
def list_payments(status: str = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Payment)
    if status:
        q = q.filter(Payment.status == status)
    out = []
    for p in q.order_by(Payment.created_at.desc()).all():
        c = db.query(Client).filter(Client.id == p.client_id).first() if p.client_id else None
        out.append({
            "id": str(p.id), "client_id": str(p.client_id) if p.client_id else None,
            "client_name": (c.first_name + " " + c.last_name) if c else "—",
            "amount": p.amount, "purpose": p.purpose, "status": p.status.value,
            "status_history": json.loads(p.status_history or "[]"),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return out

@router.post("")
def create_payment(body: PaymentCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    p = Payment(client_id=body.client_id, amount=body.amount, purpose=body.purpose, status=PaymentStatus.pending,
                status_history=json.dumps([{"status": "pending", "at": datetime.utcnow().isoformat(), "note": "Создан вручную (демо)"}]))
    db.add(p); db.commit(); db.refresh(p)
    return {"id": str(p.id), "status": p.status.value}

@router.patch("/{pid}/status")
def update_status(pid: str, body: PaymentStatusUpdateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(pid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    p = db.query(Payment).filter(Payment.id == uid).first()
    if not p: raise HTTPException(404)
    p.status = PaymentStatus(body.status)
    p.updated_at = datetime.utcnow()
    hist = json.loads(p.status_history or "[]")
    hist.append({"status": body.status, "at": datetime.utcnow().isoformat(), "note": body.note or ""})
    p.status_history = json.dumps(hist)
    db.commit()
    return {"ok": True, "status": p.status.value}
