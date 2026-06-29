from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, JSON, Column


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SolveSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    device_id: str
    device_name: Optional[str] = None
    brand: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None
    scramble: Optional[str] = None
    moves: List[dict] = Field(default_factory=list, sa_column=Column(JSON))
    inspection_time_ms: Optional[int] = None
    solve_time_ms: Optional[int] = None
    penalty: Optional[str] = "none"
