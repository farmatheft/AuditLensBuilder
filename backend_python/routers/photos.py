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

# Hardcoded User ID for now (as requested)
HARDCODED_USER_ID = 1

def get_current_user_id():
    return HARDCODED_USER_ID

router = APIRouter(
    prefix="/api/photos",
    tags=["photos"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[schemas.Photo])
def read_photos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    photos = crud.get_photos(db, user_id=user_id, skip=skip, limit=limit)
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
    packaging_id: Optional[str] = Form(None),
    packaging_name: Optional[str] = Form(None),
    hide_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Validate project exists and belongs to user
    project = crud.get_user_project(db, project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Use project_title if provided, otherwise use project name from DB
    display_name = project_title or project.name

    # Get packaging info if provided
    packaging_info = None
    if packaging_id and packaging_id.strip() and packaging_id != " ":
        if packaging_id.startswith("builtin:"):
            filename = packaging_id.split(":", 1)[1]
            # Always use packaging_name from client if provided, otherwise derive from filename
            name = packaging_name if packaging_name else os.path.splitext(filename)[0].capitalize()
            packaging_info = {
                "name": name,
                "color": filename,
                "type": "builtin"
            }
        else:
            # For custom packages, verify it exists (ownership check handles visibility effectively,
            # but ideally we should verify user owns it if it's custom)
            packaging = crud.get_packaging(db, packaging_id)
            if packaging:
                # Use name from client if provided, otherwise use DB name
                name = packaging_name if packaging_name else packaging.name
                packaging_info = {
                    "name": name,
                    "color": packaging.color,
                    "type": "custom"
                }

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
    should_hide_date = hide_date.lower() == 'true' if hide_date else False
    
    processed_image_data = await composite_image(
        content,
        comment,
        stickers_list,
        latitude,
        longitude,
        display_name,
        captured_at,
        packaging_info,
        should_hide_date
    )
    
    # Save to disk
    filename = f"photo-{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(processed_image_data)
        
    # Create DB entry
    
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
        captured_at=captured_at,
        packaging_id=packaging_id if packaging_id and packaging_id.strip() and packaging_id != " " else None
    )
    
    return crud.create_photo(db=db, photo=photo_create, filename=filename, user_id=user_id)

@router.get("/{photo_id}", response_model=schemas.Photo)
def read_photo(photo_id: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    db_photo = crud.get_photo(db, photo_id=photo_id, user_id=user_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return db_photo

@router.get("/{photo_id}/file")
def get_photo_file(photo_id: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # Verify access
    db_photo = crud.get_photo(db, photo_id=photo_id, user_id=user_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    filepath = os.path.join(UPLOAD_DIR, db_photo.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(filepath)

@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    db_photo = crud.get_photo(db, photo_id=photo_id, user_id=user_id)
    if db_photo:
        filepath = os.path.join(UPLOAD_DIR, db_photo.filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass # Fail silently if file already gone
        crud.delete_photo(db, photo_id=photo_id, user_id=user_id)
    return None
