from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import get_current_user, require_role, get_trainer
from app.core.security import hash_password
from app.models.models import Client, User, Booking, Session as Sess, Role
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


@router.patch("/{cid}/segment", response_model=ClientOut)
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
def create_client(body: ClientCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    u = User(email=body.email, password_hash=hash_password("password123"), role=Role.client, full_name=f"{body.first_name} {body.last_name}")
    db.add(u); db.commit(); db.refresh(u)
    c = Client(user_id=u.id, first_name=body.first_name, last_name=body.last_name, email=body.email, phone=body.phone, notes=body.notes, status="active", segment="new")
    db.add(c); db.commit(); db.refresh(c)
    return ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name, phone=c.phone, email=c.email, status=c.status, segment=c.segment, notes=c.notes)
