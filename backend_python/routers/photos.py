from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import json
import uuid

from .. import crud, models, schemas
from ..database import get_db
from ..image_processing import composite_image

router = APIRouter(
    prefix="/api/photos",
    tags=["photos"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[schemas.Photo])
def read_photos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    photos = db.query(models.Photo).order_by(models.Photo.created_at.desc()).offset(skip).limit(limit).all()
    return photos

@router.post("", response_model=schemas.Photo, status_code=201)
async def create_photo(
    photo: UploadFile = File(...),
    project_id: str = Form(...),
    project_title: Optional[str] = Form(None),
    comment: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    stickers: Optional[str] = Form(None), # JSON string
    captured_at: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate project exists
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Use project_title if provided, otherwise use project name from DB
    display_name = project_title or project.name

    # Parse stickers
    stickers_list = []
    if stickers:
        try:
            stickers_list = json.loads(stickers)
        except json.JSONDecodeError:
            pass # Or raise error
            
    # Read image file
    content = await photo.read()
    
    # Process image (Composite)
    processed_image_data = await composite_image(
        content,
        comment,
        stickers_list,
        latitude,
        longitude,
        display_name,
        captured_at
    )
    
    # Save to disk
    filename = f"photo-{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(processed_image_data)
        
    # Create DB entry
    # We need to construct the Pydantic model for creation
    # Note: stickers_list is a list of dicts, we need to convert to Pydantic models or let validation handle it
    # But crud.create_photo expects schemas.PhotoCreate which expects stickers as List[StickerBase] objects
    
    sticker_objs = []
    for s in stickers_list:
        try:
            sticker_objs.append(schemas.StickerBase(**s))
        except:
            continue

    photo_create = schemas.PhotoCreate(
        filename=filename,
        project_id=project_id,
        comment=comment,
        latitude=latitude,
        longitude=longitude,
        stickers=sticker_objs,
        captured_at=captured_at
    )
    
    return crud.create_photo(db=db, photo=photo_create, filename=filename)

@router.get("/{photo_id}", response_model=schemas.Photo)
def read_photo(photo_id: str, db: Session = Depends(get_db)):
    db_photo = crud.get_photo(db, photo_id=photo_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return db_photo

@router.get("/{photo_id}/file")
def get_photo_file(photo_id: str, db: Session = Depends(get_db)):
    db_photo = crud.get_photo(db, photo_id=photo_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    filepath = os.path.join(UPLOAD_DIR, db_photo.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(filepath)

@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: str, db: Session = Depends(get_db)):
    db_photo = crud.get_photo(db, photo_id=photo_id)
    if db_photo:
        filepath = os.path.join(UPLOAD_DIR, db_photo.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        crud.delete_photo(db, photo_id=photo_id)
    return None
