from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import require_role
from app.models.models import Notification, NotificationStatus, Client
from app.schemas.schemas import NotificationCreateIn
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
def list_notifications(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    out = []
    for n in db.query(Notification).order_by(Notification.created_at.desc()).all():
        c = db.query(Client).filter(Client.id == n.client_id).first() if n.client_id else None
        out.append({
            "id": str(n.id), "client_id": str(n.client_id) if n.client_id else None,
            "client_name": (c.first_name + " " + c.last_name) if c else "—",
            "channel": n.channel, "message": n.message, "status": n.status.value,
            "reason": n.reason, "created_at": n.created_at.isoformat() if n.created_at else None,
        })
    return out

@router.post("")
def create_notification(body: NotificationCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    n = Notification(client_id=body.client_id, channel=body.channel, message=body.message,
                     status=NotificationStatus.not_sent, reason="Канал не подключён (демо)")
    db.add(n); db.commit(); db.refresh(n)
    return {"id": str(n.id), "status": n.status.value, "reason": n.reason}
