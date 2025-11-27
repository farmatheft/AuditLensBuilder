from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

import models
from database import engine
from routers import projects, photos, packagings, auth

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AuditLens Builder API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers FIRST - before any catch-all routes
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(photos.router)
app.include_router(packagings.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve static files from the built frontend
STATIC_DIR = os.path.join(os.path.dirname(__file__), "dist", "public")
app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

# Mount packages directory
packages_dir = os.path.join(os.path.dirname(__file__), "assets", "packages")
app.mount("/assets/packages", StaticFiles(directory=packages_dir), name="packages")

# Catch-all route for SPA
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")

    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
