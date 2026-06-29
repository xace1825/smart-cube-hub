from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class SolveSessionCreate(BaseModel):
    user_id: int
    device_id: str
    device_name: Optional[str] = None
    brand: Optional[str] = None
    scramble: Optional[str] = None


class SolveSessionUpdate(BaseModel):
    finished_at: Optional[datetime] = None
    moves: Optional[List[dict]] = None
    inspection_time_ms: Optional[int] = None
    solve_time_ms: Optional[int] = None
    penalty: Optional[str] = "none"


class SolveSessionRead(BaseModel):
    id: int
    user_id: int
    device_id: str
    device_name: Optional[str]
    brand: Optional[str]
    started_at: datetime
    finished_at: Optional[datetime]
    scramble: Optional[str]
    moves: List[dict]
    inspection_time_ms: Optional[int]
    solve_time_ms: Optional[int]
    penalty: Optional[str]

    class Config:
        from_attributes = True
