from sqlalchemy.orm import Session
from . import models, schemas
import json

def get_project(db: Session, project_id: str):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: str, project: schemas.ProjectCreate):
    db_project = get_project(db, project_id)
    if db_project:
        for key, value in project.model_dump().items():
            setattr(db_project, key, value)
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: str):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()

def get_photos(db: Session, project_id: str):
    return db.query(models.Photo).filter(models.Photo.project_id == project_id).all()

def get_photo(db: Session, photo_id: str):
    return db.query(models.Photo).filter(models.Photo.id == photo_id).first()

def create_photo(db: Session, photo: schemas.PhotoCreate, filename: str):
    # stickers needs to be serialized if it's not already handled by SQLAlchemy JSON type
    # But SQLAlchemy JSON type handles python lists/dicts automatically.
    # Pydantic model has stickers as List[StickerBase], we need to dump it to list of dicts
    stickers_data = [s.model_dump() for s in photo.stickers]
    
    created_at = None
    if photo.captured_at:
        try:
            from datetime import datetime
            # captured_at is ISO string from frontend (e.g. 2023-11-21T08:30:00.000Z)
            created_at = datetime.fromisoformat(photo.captured_at.replace('Z', '+00:00'))
        except ValueError:
            pass

    db_photo = models.Photo(
        project_id=photo.project_id,
        filename=filename,
        comment=photo.comment,
        latitude=photo.latitude,
        longitude=photo.longitude,
        stickers=stickers_data,
        created_at=created_at
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

def delete_photo(db: Session, photo_id: str):
    db_photo = get_photo(db, photo_id)
    if db_photo:
        db.delete(db_photo)
        db.commit()

def get_packagings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Packaging).offset(skip).limit(limit).all()

def get_packaging(db: Session, packaging_id: str):
    return db.query(models.Packaging).filter(models.Packaging.id == packaging_id).first()

def create_packaging(db: Session, packaging: schemas.PackagingCreate):
    db_packaging = models.Packaging(**packaging.model_dump())
    db.add(db_packaging)
    db.commit()
    db.refresh(db_packaging)
    return db_packaging

def update_packaging(db: Session, packaging_id: str, packaging: schemas.PackagingCreate):
    db_packaging = get_packaging(db, packaging_id)
    if db_packaging:
        for key, value in packaging.model_dump().items():
            setattr(db_packaging, key, value)
        db.commit()
        db.refresh(db_packaging)
    return db_packaging

def delete_packaging(db: Session, packaging_id: str):
    db_packaging = get_packaging(db, packaging_id)
    if db_packaging:
        db.delete(db_packaging)
        db.commit()
