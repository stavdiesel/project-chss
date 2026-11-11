from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Subscription, Client
from app.schemas.schemas import SubscriptionOut, SubscriptionCreate
from datetime import date

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

def _out(s):
    return SubscriptionOut(id=s.id, client_id=s.client_id, type=s.type, total_visits=s.total_visits,
        used_visits=s.used_visits, valid_from=s.valid_from, valid_until=s.valid_until, price=s.price,
        status=s.status, remaining=s.total_visits-s.used_visits)

@router.get("/me", response_model=list[SubscriptionOut])
def my_subs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.user_id == user.id).first()
    if not client: return []
    return [_out(s) for s in db.query(Subscription).filter(Subscription.client_id == client.id).all()]

@router.get("", response_model=list[SubscriptionOut])
def list_subs(client_id: str = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Subscription)
    if client_id:
        try:
            cid_uid = _UUID(client_id)
        except (ValueError, TypeError):
            raise HTTPException(404)
        q = q.filter(Subscription.client_id == cid_uid)
    return [_out(s) for s in q.all()]

@router.get("/{sid}/history")
def sub_history(sid: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(sid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    s = db.query(Subscription).filter(Subscription.id == uid).first()
    if not s: raise HTTPException(404)
    import json
    return {"id": str(s.id), "history": json.loads(s.history or "[]")}

@router.post("", response_model=SubscriptionOut)
def create_sub(body: SubscriptionCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    client = db.query(Client).filter(Client.id == body.client_id).first()
    if not client: raise HTTPException(404, "Client not found")
    s = Subscription(client_id=body.client_id, type=body.type, total_visits=body.total_visits,
        valid_from=body.valid_from, valid_until=body.valid_until, price=body.price,
        history='[{"event":"created","at":"'+__import__("datetime").datetime.utcnow().isoformat()+'"}]')
    db.add(s); db.commit(); db.refresh(s)
    return _out(s)