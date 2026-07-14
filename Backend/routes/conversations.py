# routes/conversations.py
# Endpoints for managing conversations: create, list, get messages, delete.

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models
import schemas

router = APIRouter()


def _parse_attachments(raw):
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return [schemas.AttachmentCreate(**item) for item in data]
    except (json.JSONDecodeError, TypeError):
        return []


# Create a new conversation for a user
@router.post("/conversations", response_model=schemas.ConversationOut)
def create_conversation(payload: schemas.ConversationCreate, db: Session = Depends(get_db)):
    conversation = models.Conversation(user_id=payload.user_id, title=payload.title)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)  # reload it so we get the auto-generated id/created_at
    return conversation


# List all conversations for a given user, most recent first
@router.get("/conversations/{user_id}", response_model=list[schemas.ConversationOut])
def list_conversations(user_id: int, db: Session = Depends(get_db)):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == user_id)
        .order_by(desc(models.Conversation.created_at))
        .all()
    )
    return conversations


# Get all messages inside one conversation, oldest first (so the chat reads top to bottom)
@router.get("/conversations/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return [
        schemas.MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            created_at=m.created_at,
            attachments=_parse_attachments(m.attachments),
        )
        for m in messages
    ]


# Delete a conversation (and all its messages, thanks to cascade in models.py)
@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted"}