from sqlalchemy.orm import Session
import models, schemas
import json

# --- User ---

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_telegram_id(db: Session, telegram_id: str):
    return db.query(models.User).filter(models.User.telegram_id == telegram_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Project ---

def get_project(db: Session, project_id: str):
    # This might need to be scoped by user_id in the future or check ownership
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_user_project(db: Session, project_id: str, user_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user_id).first()

def get_projects(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Project).filter(models.Project.user_id == user_id).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate, user_id: int):
    project_data = project.model_dump()
    # Remove user_id if present in input (since we force it)
    project_data.pop('user_id', None) 
    
    db_project = models.Project(**project_data, user_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: str, project: schemas.ProjectCreate, user_id: int):
    db_project = get_user_project(db, project_id, user_id)
    if db_project:
        project_data = project.model_dump()
        project_data.pop('user_id', None)
        
        for key, value in project_data.items():
            setattr(db_project, key, value)
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: str, user_id: int):
    db_project = get_user_project(db, project_id, user_id)
    if db_project:
        db.delete(db_project)
        db.commit()

# --- Photos ---

def get_photos(db: Session, user_id: int, project_id: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Photo).filter(models.Photo.user_id == user_id)
    if project_id:
        query = query.filter(models.Photo.project_id == project_id)
    return query.order_by(models.Photo.created_at.desc()).offset(skip).limit(limit).all()

def get_photo(db: Session, photo_id: str, user_id: int):
    return db.query(models.Photo).filter(models.Photo.id == photo_id, models.Photo.user_id == user_id).first()

def create_photo(db: Session, photo: schemas.PhotoCreate, filename: str, user_id: int):
    # stickers needs to be serialized if it's not already handled by SQLAlchemy JSON type
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
        user_id=user_id,
        filename=filename,
        comment=photo.comment,
        latitude=photo.latitude,
        longitude=photo.longitude,
        stickers=stickers_data,
        created_at=created_at,
        packaging_id=photo.packaging_id
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

def delete_photo(db: Session, photo_id: str, user_id: int):
    db_photo = get_photo(db, photo_id, user_id)
    if db_photo:
        db.delete(db_photo)
        db.commit()

# --- Packaging ---

def get_packagings(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    # Retrieve system packagings (user_id is NULL) OR user's packagings
    return db.query(models.Packaging).filter(
        (models.Packaging.user_id == None) | (models.Packaging.user_id == user_id)
    ).offset(skip).limit(limit).all()

def get_packaging(db: Session, packaging_id: str):
    # General retrieval, access control should probably happen in router
    return db.query(models.Packaging).filter(models.Packaging.id == packaging_id).first()

def create_packaging(db: Session, packaging: schemas.PackagingCreate, user_id: int):
    packaging_data = packaging.model_dump()
    packaging_data.pop('user_id', None)

    db_packaging = models.Packaging(**packaging_data, user_id=user_id)
    db.add(db_packaging)
    db.commit()
    db.refresh(db_packaging)
    return db_packaging

def update_packaging(db: Session, packaging_id: str, packaging: schemas.PackagingCreate, user_id: int):
    db_packaging = get_packaging(db, packaging_id)
    # Only allow updating if it belongs to the user
    if db_packaging and db_packaging.user_id == user_id:
        packaging_data = packaging.model_dump()
        packaging_data.pop('user_id', None)
        
        for key, value in packaging_data.items():
            setattr(db_packaging, key, value)
        db.commit()
        db.refresh(db_packaging)
        return db_packaging
    return None

def delete_packaging(db: Session, packaging_id: str, user_id: int):
    db_packaging = get_packaging(db, packaging_id)
    # Only allow deleting if it belongs to the user
    if db_packaging and db_packaging.user_id == user_id:
        db.delete(db_packaging)
        db.commit()
