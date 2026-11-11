from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Client, User
from app.schemas.schemas import ClientOut

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db), user=Depends(require_role("admin","trainer"))):
    qs = db.query(Client).all()
    out=[]
    for c in qs:
        out.append(ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name,
            phone=c.phone if user.role.value=="admin" else None,
            email=c.email if user.role.value=="admin" else None,
            status=c.status, notes=c.notes if user.role.value=="admin" else None))
    return out

@router.get("/{cid}", response_model=ClientOut)
def get_client(cid: str, db: Session = Depends(get_db), user=Depends(require_role("admin","trainer"))):
    c = db.query(Client).filter(Client.id == cid).first()
    if not c: raise HTTPException(404)
    return ClientOut(id=c.id, first_name=c.first_name, last_name=c.last_name,
        phone=c.phone if user.role.value=="admin" else None,
        email=c.email if user.role.value=="admin" else None,
        status=c.status, notes=c.notes if user.role.value=="admin" else None)