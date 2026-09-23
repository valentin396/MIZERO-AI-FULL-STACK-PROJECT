from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, Date, Time,
    DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship, deferred
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(30))
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # 'user' | 'admin'
    profile_image = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("Item", back_populates="user")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String(20), nullable=False)  # LOST | FOUND | RECOVERED | CLOSED
    category = Column(String(50))
    title = Column(String(200))
    description = Column(Text)

    brand = Column(String(100))
    model = Column(String(100))
    color = Column(String(50))

    location = Column(String(200))  # real Rwandan district
    landmark = Column(String(200))  # sector / specific spot
    latitude = Column(Float)
    longitude = Column(Float)

    event_date = Column(Date)
    event_time = Column(Time)

    image_url = Column(String(500))
    image_hash = Column(String(16))  # perceptual hash (dHash), for image similarity

    search_text = Column(Text)  # denormalized text used by the text-matching engine

    # JSON-encoded list of {"question": str, "expected_answer": str}, set
    # optionally by a FOUND-item reporter. `deferred` so a plain `db.query`
    # never loads it into the object's __dict__ — FastAPI's default
    # jsonable_encoder falls back to vars(obj) for non-pydantic objects, so an
    # eagerly-loaded column here would leak expected_answer to anyone viewing
    # the item/match, defeating the whole point of the verification feature.
    # Only app/routers/verification.py (and the create/match-confirm paths)
    # ever touch this attribute directly.
    verification_questions = deferred(Column(Text))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="items")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    step = Column(String(30), default="GREETING")
    draft = Column(Text, default="{}")  # JSON-encoded partial item fields
    # 'llm' (OpenAI-driven conversation) or 'rule' (chat_flow.py FSM). Chosen
    # once when the session starts and can drop from 'llm' to 'rule' mid-chat
    # if an OpenAI call fails — see app/routers/chat.py.
    mode = Column(String(10), default="rule")
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String(20))  # 'user' | 'bot'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    found_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)

    text_score = Column(Float)
    location_score = Column(Float)
    time_score = Column(Float)
    image_score = Column(Float, nullable=True)  # null when no photo to compare
    category_score = Column(Float)
    final_score = Column(Float)

    status = Column(String(30), default="pending")  # pending | confirmed | rejected

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("lost_item_id", "found_item_id", name="uq_match_pair"),)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    title = Column(String(200))
    message = Column(Text)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OwnershipVerification(Base):
    __tablename__ = "ownership_verifications"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text)
    expected_answer = Column(Text)
    user_answer = Column(Text)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
