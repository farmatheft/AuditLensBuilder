from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel
from typing import List, Optional, Literal, Any
from datetime import datetime, timezone

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

    @field_validator('created_at', 'updated_at', check_fields=False)
    def set_utc_timezone(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class UserBase(CamelModel):
    telegram_id: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    username: Optional[str] = ""
    phone: Optional[str] = ""
    is_bot: Optional[bool] = False
    language_code: Optional[str] = "en"

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime

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
    packaging_id: Optional[str] = None
    user_id: Optional[int] = None # Optional in request, filled by backend

class Photo(PhotoBase):
    id: str
    project_id: str
    user_id: int
    created_at: datetime
    packaging_id: Optional[str] = None

class ProjectBase(CamelModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    user_id: Optional[int] = None # Optional in request, filled by backend

class Project(ProjectBase):
    id: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    photos: List[Photo] = []

class PackagingBase(CamelModel):
    name: str
    color: str

class PackagingCreate(PackagingBase):
    user_id: Optional[int] = None # Optional in request, filled by backend

class Packaging(PackagingBase):
    id: str
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
