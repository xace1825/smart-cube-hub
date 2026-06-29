from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.models.models import SolveSession
from app.schemas.schemas import SolveSessionCreate, SolveSessionRead, SolveSessionUpdate

router = APIRouter()


@router.post("/", response_model=SolveSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(payload: SolveSessionCreate, session: Session = Depends(get_session)):
    db_session = SolveSession(**payload.model_dump())
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


@router.get("/", response_model=List[SolveSessionRead])
def list_sessions(user_id: int, skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    stmt = select(SolveSession).where(SolveSession.user_id == user_id).offset(skip).limit(limit)
    return session.exec(stmt).all()


@router.get("/{session_id}", response_model=SolveSessionRead)
def get_session_by_id(session_id: int, session: Session = Depends(get_session)):
    db_session = session.get(SolveSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.patch("/{session_id}", response_model=SolveSessionRead)
def update_session(session_id: int, payload: SolveSessionUpdate, session: Session = Depends(get_session)):
    db_session = session.get(SolveSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_session, key, value)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session
