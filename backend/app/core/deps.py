from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import decode_token
from app.models.models import User

security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(401, "Invalid token")
    try:
        user_id = UUID(payload.get("sub", ""))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(401, "Inactive")
    return user

def require_role(*roles):
    def dep(user=Depends(get_current_user)):
        if user.role.value not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return dep
