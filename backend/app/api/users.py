from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import User
from app.schemas.schemas import UserCreate, UserRead
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=UserRead)
def create_user(payload: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=pwd_context.hash(payload.password[:72]),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
