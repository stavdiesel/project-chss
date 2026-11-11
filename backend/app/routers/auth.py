from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import verify_password, create_access_token
from app.models.models import User
from app.schemas.schemas import LoginIn, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Bad credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenOut(access_token=token, role=user.role.value, full_name=user.full_name)