from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date, time


# --- Auth ---

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Items ---

class ItemCreate(BaseModel):
    status: str  # LOST | FOUND
    category: str
    title: str
    description: str
    color: Optional[str] = None
    location: str  # district
    landmark: Optional[str] = None
    event_date: date
    event_time: Optional[time] = None
    image_url: Optional[str] = None
    image_hash: Optional[str] = None


class ItemOut(BaseModel):
    id: int
    user_id: int
    status: str
    category: Optional[str]
    title: Optional[str]
    description: Optional[str]
    color: Optional[str]
    location: Optional[str]
    landmark: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    event_date: Optional[date]
    event_time: Optional[time]
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ItemUpdate(BaseModel):
    status: Optional[str] = None
    image_url: Optional[str] = None
    image_hash: Optional[str] = None


# --- Matches ---

class MatchBreakdown(BaseModel):
    text: float
    location: float
    time: float
    image: Optional[float]
    category: float


class MatchOut(BaseModel):
    id: int
    lost_item_id: int
    found_item_id: int
    text_score: float
    location_score: float
    time_score: float
    image_score: Optional[float]
    category_score: float
    final_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MatchStatusUpdate(BaseModel):
    status: str  # confirmed | rejected


# --- Chat ---

class ChatMessageIn(BaseModel):
    session_id: Optional[int] = None
    message: str


class ChatMessageOut(BaseModel):
    session_id: int
    reply: str
    step: str
    options: Optional[list[str]] = None
    done: bool
    item_id: Optional[int] = None


# --- Notifications ---

class NotificationOut(BaseModel):
    id: int
    title: Optional[str]
    message: Optional[str]
    read_status: bool
    match_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
