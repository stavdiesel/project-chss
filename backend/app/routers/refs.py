from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import ClassType, Trainer
from app.schemas.schemas import ClassTypeOut, TrainerOut

router = APIRouter(tags=["refs"])

@router.get("/class-types", response_model=list[ClassTypeOut])
def class_types(db: Session = Depends(get_db)):
    return db.query(ClassType).all()

@router.get("/trainers", response_model=list[TrainerOut])
def trainers(db: Session = Depends(get_db)):
    return db.query(Trainer).all()