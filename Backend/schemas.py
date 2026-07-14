# schemas.py
# This file defines the "shape" of the data our API accepts and returns.
# These are called Pydantic schemas. They are DIFFERENT from models.py:
# - models.py = database tables
# - schemas.py = what JSON looks like when it comes in/out of the API

from pydantic import BaseModel
from datetime import datetime


# ---------- Conversation schemas ----------

class ConversationCreate(BaseModel):
    user_id: int
    title: str | None = "New Conversation"


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True  # allows converting SQLAlchemy objects directly


# ---------- Message schemas ----------

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    attachments: list["AttachmentCreate"] = []

    class Config:
        from_attributes = True


# ---------- Chat endpoint schemas ----------

class ChatRequest(BaseModel):
    conversation_id: int
    message: str
    attachments: list["AttachmentCreate"] = []


class ChatResponse(BaseModel):
    reply: str


class AttachmentCreate(BaseModel):
    filename: str
    url: str
    content_type: str
    size: int


class UserSignIn(BaseModel):
    email: str
    name: str | None = None


class UserVerify(BaseModel):
    email: str
    code: str


class UserResend(BaseModel):
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    verified: bool = False

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    user_id: int
    title: str
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    title: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    theme: str | None = None
    model: str | None = None


class SettingsOut(BaseModel):
    id: int
    user_id: int
    theme: str
    model: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True