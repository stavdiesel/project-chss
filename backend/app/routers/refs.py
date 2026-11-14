from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import ClassType
from app.schemas.schemas import ClassTypeOut

router = APIRouter(tags=["refs"])

@router.get("/class-types", response_model=list[ClassTypeOut])
def class_types(db: Session = Depends(get_db)):
    return db.query(ClassType).all()