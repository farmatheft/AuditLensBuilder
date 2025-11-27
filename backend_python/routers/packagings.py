from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

import crud
import models
import schemas
from database import get_db

# Hardcoded User ID for now (as requested)
HARDCODED_USER_ID = 1

def get_current_user_id():
    return HARDCODED_USER_ID

router = APIRouter(
    prefix="/api/packagings",
    tags=["packagings"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[schemas.Packaging])
def read_packagings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    packagings = crud.get_packagings(db, user_id=user_id, skip=skip, limit=limit)
    return packagings

@router.get("/builtin")
def read_builtin_packagings():
    builtin_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "packages", "builtin")
    packages = []
    if os.path.exists(builtin_dir):
        for filename in os.listdir(builtin_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                name = os.path.splitext(filename)[0].capitalize()
                packages.append({
                    "id": f"builtin:{filename}",
                    "name": name,
                    "color": filename,
                    "type": "builtin"
                })
    return packages

@router.get("/custom-assets")
def read_custom_assets():
    custom_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "packages", "custom")
    assets = []
    if os.path.exists(custom_dir):
        for filename in os.listdir(custom_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                assets.append(filename)
    return sorted(assets)

@router.post("", response_model=schemas.Packaging)
def create_packaging(packaging: schemas.PackagingCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return crud.create_packaging(db=db, packaging=packaging, user_id=user_id)

@router.put("/{packaging_id}", response_model=schemas.Packaging)
def update_packaging(packaging_id: str, packaging: schemas.PackagingCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    db_packaging = crud.update_packaging(db, packaging_id=packaging_id, packaging=packaging, user_id=user_id)
    if db_packaging is None:
        raise HTTPException(status_code=404, detail="Packaging not found or access denied")
    return db_packaging

@router.delete("/all", status_code=204)
def delete_all_packagings(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # Only delete user's packagings
    db.query(models.Packaging).filter(models.Packaging.user_id == user_id).delete()
    db.commit()
    return None

@router.delete("/{packaging_id}", status_code=204)
def delete_packaging(packaging_id: str, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    crud.delete_packaging(db, packaging_id=packaging_id, user_id=user_id)
    return None
