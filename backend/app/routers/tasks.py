from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID as _UUID
from app.core.db import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Task, Client
from app.schemas.schemas import TaskOut, TaskCreateIn

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=list[TaskOut])
def list_tasks(status: str = None, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    q = db.query(Task)
    if status: q = q.filter(Task.status == status)
    return q.order_by(Task.created_at.desc()).all()

@router.post("", response_model=TaskOut)
def create_task(body: TaskCreateIn, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    t = Task(client_id=body.client_id, assigned_to=body.assigned_to, reason=body.reason, action=body.action, due_date=body.due_date)
    db.add(t); db.commit(); db.refresh(t)
    return t

@router.patch("/{tid}/status", response_model=TaskOut)
def update_status(tid: str, status: str, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    try:
        uid = _UUID(tid)
    except (ValueError, TypeError):
        raise HTTPException(404)
    t = db.query(Task).filter(Task.id == uid).first()
    if not t: raise HTTPException(404)
    t.status = status
    db.commit(); db.refresh(t)
    return t