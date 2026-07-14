# routes/files.py
# Endpoints for listing uploaded files.

import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter()


@router.get("/files/{user_id}", response_model=list[schemas.AttachmentCreate])
def list_files(user_id: int, db: Session = Depends(get_db)):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == user_id)
        .all()
    )
    conversation_ids = [c.id for c in conversations]
    if not conversation_ids:
        return []

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id.in_(conversation_ids))
        .all()
    )

    seen = set()
    files = []
    for m in messages:
        raw = m.attachments
        if not raw:
            continue
        try:
            import json
            items = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            continue
        for item in items:
            url = item.get("url", "")
            if url in seen:
                continue
            seen.add(url)
            files.append(
                schemas.AttachmentCreate(
                    filename=item.get("filename", ""),
                    url=url,
                    content_type=item.get("content_type", ""),
                    size=item.get("size", 0),
                )
            )
    return files
