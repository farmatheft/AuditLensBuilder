from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = crud.get_projects(db, skip=skip, limit=limit)
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: str, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.post("", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@router.patch("/{project_id}", response_model=schemas.Project)
def update_project(project_id: str, project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = crud.update_project(db, project_id=project_id, project=project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, transfer_project_id: str = None, db: Session = Depends(get_db)):
    # Check if project has photos
    photos = crud.get_photos(db, project_id=project_id)
    
    if photos and len(photos) > 0:
        # If there are photos, a transfer project must be specified
        if not transfer_project_id:
            raise HTTPException(
                status_code=400, 
                detail="Project has photos. Please specify transfer_project_id to move photos before deletion."
            )
        
        # Verify transfer project exists
        transfer_project = crud.get_project(db, project_id=transfer_project_id)
        if not transfer_project:
            raise HTTPException(status_code=404, detail="Transfer project not found")
        
        # Transfer all photos to the new project
        for photo in photos:
            photo.project_id = transfer_project_id
        db.commit()
    
    # Now delete the project
    crud.delete_project(db, project_id=project_id)
    return None

@router.get("/{project_id}/photos", response_model=List[schemas.Photo])
def read_project_photos(project_id: str, db: Session = Depends(get_db)):
    return crud.get_photos(db, project_id=project_id)
