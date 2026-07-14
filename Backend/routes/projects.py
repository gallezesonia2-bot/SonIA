# routes/projects.py
# Endpoints for managing projects: list and create.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models
import schemas

router = APIRouter()


@router.post("/projects", response_model=schemas.ProjectOut)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    project = models.Project(
        user_id=payload.user_id,
        title=payload.title,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/projects/{user_id}", response_model=list[schemas.ProjectOut])
def list_projects(user_id: int, db: Session = Depends(get_db)):
    projects = (
        db.query(models.Project)
        .filter(models.Project.user_id == user_id)
        .order_by(desc(models.Project.created_at))
        .all()
    )
    return projects
