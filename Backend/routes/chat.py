# routes/chat.py
# This is the main endpoint: it saves the user's message, sends the whole
# conversation history to OpenAI, saves the AI's reply, and returns it.

import os
import json
import tempfile
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from openai import OpenAI, OpenAIError

from database import get_db
import models
import schemas

router = APIRouter()

# We use Groq instead of OpenAI directly, because Groq has a genuinely free
# tier (no credit card needed). Groq's API is "OpenAI-compatible", meaning we
# can keep using the same "openai" Python package -- we just point it at
# Groq's servers (base_url) and use a Groq API key instead of an OpenAI one.
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

# Groq's free, fast model. "versatile" = good all-around quality.
MODEL_NAME = "llama-3.3-70b-versatile"


def _serialize_attachments(attachments):
    if not attachments:
        return None
    return json.dumps([a.model_dump() for a in attachments], ensure_ascii=False)


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    # 1. Make sure the conversation exists
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == payload.conversation_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Save the user's new message to the database
    user_message = models.Message(
        conversation_id=payload.conversation_id,
        role="user",
        content=payload.message,
        attachments=_serialize_attachments(payload.attachments),
    )
    db.add(user_message)
    db.commit()

    # 3. Load the full conversation history (so the AI has context of past messages)
    history = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == payload.conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    # Convert our database messages into the format OpenAI expects
    openai_messages = [{"role": m.role, "content": m.content} for m in history]

    # 4. Call OpenAI with the full history
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=openai_messages,
        )
        reply_text = response.choices[0].message.content

    except OpenAIError as e:
        # If OpenAI fails (e.g. quota exceeded, invalid key), return a clean error
        # instead of crashing the server.
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")

    # 5. Save the assistant's reply to the database
    assistant_message = models.Message(
        conversation_id=payload.conversation_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_message)
    db.commit()

    # 6. Return the reply to the frontend
    return schemas.ChatResponse(reply=reply_text)


@router.post("/transcribe")
def transcribe(audio: UploadFile = File(...)):
    """Accept a recorded audio clip, transcribe it with Whisper, and return text."""
    suffix = os.path.splitext(audio.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio.file.read())
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
            )
        text = result.text
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"Transcription error: {str(e)}")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    return {"text": text}
