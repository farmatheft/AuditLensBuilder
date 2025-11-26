from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(String, unique=True, nullable=False)
    first_name = Column(String, default="")
    last_name = Column(String, default="")
    username = Column(String, default="")
    phone = Column(String, default="")
    is_bot = Column(Boolean, default=False)
    language_code = Column(String, default='en')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="user")
    packagings = relationship("Packaging", back_populates="user")
    photos = relationship("Photo", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="projects")
    photos = relationship("Photo", back_populates="project", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    stickers = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    packaging_id = Column(String, ForeignKey("packagings.id"), nullable=True)

    user = relationship("User", back_populates="photos")
    project = relationship("Project", back_populates="photos")
    packaging = relationship("Packaging")

class Packaging(Base):
    __tablename__ = "packagings"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for built-in packagings? Or we assign built-ins to a system user? Let's make it nullable for "system" packagings or specific user for custom.
    name = Column(String, nullable=False)
    color = Column(String, nullable=False) # Stores the emoji(s)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="packagings")
