# routes/settings.py
# Endpoints for user settings/preferences.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter()


@router.get("/settings/{user_id}", response_model=schemas.SettingsOut)
def get_settings(user_id: int, db: Session = Depends(get_db)):
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not settings:
        settings = models.UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/settings/{user_id}", response_model=schemas.SettingsOut)
def update_settings(user_id: int, payload: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if not settings:
        settings = models.UserSettings(user_id=user_id)
        db.add(settings)

    if payload.theme is not None:
        settings.theme = payload.theme
    if payload.model is not None:
        settings.model = payload.model

    db.commit()
    db.refresh(settings)
    return settings
