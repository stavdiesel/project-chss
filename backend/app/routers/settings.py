from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import require_role
from app.models.models import Setting

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = {
    "segment_at_risk_days": "14",
    "segment_sleeping_days": "30",
    "segment_expiring_days": "7",
    "cancel_deadline_hours": "3",
}

@router.get("")
def list_settings(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    out = {}
    for k, v in DEFAULTS.items():
        s = db.query(Setting).filter(Setting.key == k).first()
        out[k] = s.value if s else v
    # include any extra
    for s in db.query(Setting).all():
        out[s.key] = s.value
    return out

@router.put("/{key}")
def update_setting(key: str, value: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    s = db.query(Setting).filter(Setting.key == key).first()
    if s:
        s.value = value
    else:
        s = Setting(key=key, value=value)
        db.add(s)
    db.commit()
    return {"key": key, "value": value}