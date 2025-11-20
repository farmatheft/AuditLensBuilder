from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Optional, Literal, Any
from datetime import datetime

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class StickerBase(CamelModel):
    id: str
    type: Literal["arrow", "circle", "circle-filled", "crosshair", "arrow-3d"]
    x: float
    y: float
    width: float
    height: float
    rotation: float
    color: Optional[Literal["red", "yellow", "green", "blue", "cyan", "gray", "black"]] = "red"

class PhotoBase(CamelModel):
    filename: str
    comment: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    stickers: List[StickerBase] = []

class PhotoCreate(PhotoBase):
    project_id: str
    captured_at: Optional[str] = None

class Photo(PhotoBase):
    id: str
    project_id: str
    created_at: datetime

class ProjectBase(CamelModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    photos: List[Photo] = []
