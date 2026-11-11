from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    if client_id: q = q.filter(Subscription.client_id == client_id)
    return [_out(s) for s in q.all()]

@router.post("", response_model=SubscriptionOut)
def create_sub(body: SubscriptionCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    s = Subscription(client_id=body.client_id, type=body.type, total_visits=body.total_visits,
        valid_from=body.valid_from, valid_until=body.valid_until, price=body.price)
    db.add(s); db.commit(); db.refresh(s)
    return _out(s)