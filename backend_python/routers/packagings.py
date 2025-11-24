from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/packagings",
    tags=["packagings"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[schemas.Packaging])
def read_packagings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    packagings = crud.get_packagings(db, skip=skip, limit=limit)
    return packagings

@router.post("", response_model=schemas.Packaging)
def create_packaging(packaging: schemas.PackagingCreate, db: Session = Depends(get_db)):
    return crud.create_packaging(db=db, packaging=packaging)

@router.put("/{packaging_id}", response_model=schemas.Packaging)
def update_packaging(packaging_id: str, packaging: schemas.PackagingCreate, db: Session = Depends(get_db)):
    db_packaging = crud.update_packaging(db, packaging_id=packaging_id, packaging=packaging)
    if db_packaging is None:
        raise HTTPException(status_code=404, detail="Packaging not found")
    return db_packaging

@router.delete("/{packaging_id}", status_code=204)
def delete_packaging(packaging_id: str, db: Session = Depends(get_db)):
    crud.delete_packaging(db, packaging_id=packaging_id)
    return None
