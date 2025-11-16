import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertPhotoSchema, type Sticker } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const PHOTOS_DIR = path.join(process.cwd(), "uploads");

async function ensurePhotosDir() {
  try {
    await fs.access(PHOTOS_DIR);
  } catch {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });
  }
}

async function compositeImageWithOverlays(
  imageBuffer: Buffer,
  comment: string | null,
  commentPosition: "top" | "bottom",
  stickers: Sticker[],
  latitude: number | null,
  longitude: number | null
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  const svgOverlays: string[] = [];

  // Modern Comment Overlay with gradient background
  if (comment) {
    const fontSize = Math.max(28, height / 28);
    const padding = fontSize * 0.8;
    const lineHeight = fontSize * 1.4;
    const y = commentPosition === "top" ? padding + fontSize : height - padding - fontSize;
    
    // Escape special characters
    const escapedComment = comment
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const commentSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="commentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.95);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(30,30,30,0.95);stop-opacity:1" />
          </linearGradient>
          <filter id="commentShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background bar with gradient -->
        <rect x="0" y="${y - fontSize - padding}" width="${width}" height="${lineHeight + padding}" 
              fill="url(#commentGradient)" filter="url(#commentShadow)" />
        
        <!-- Accent line -->
        <rect x="0" y="${y - fontSize - padding}" width="${width}" height="4" 
              fill="rgba(59,130,246,0.8)" />
        
        <!-- Comment text with shadow -->
        <text x="${padding * 1.5}" y="${y}" 
              font-family="'Inter', 'Roboto', 'Segoe UI', sans-serif" 
              font-size="${fontSize}" 
              font-weight="600"
              fill="white" 
              filter="url(#commentShadow)">${escapedComment}</text>
      </svg>
    `;
    svgOverlays.push(commentSvg);
  }

  // Premium Location Overlay - Bottom Left
  if (latitude !== null && longitude !== null) {
    const fontSize = Math.max(20, height / 50);
    const padding = fontSize * 0.8;
    const iconSize = fontSize * 1.8;
    const boxWidth = Math.min(width * 0.45, 500);
    const boxHeight = fontSize * 3.5;
    const boxX = padding;
    const boxY = height - boxHeight - padding;

    const locationSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="locationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.92);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(20,20,20,0.92);stop-opacity:1" />
          </linearGradient>
          <filter id="locationGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(16,185,129);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(5,150,105);stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Rounded background box with gradient -->
        <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" 
              rx="16" ry="16"
              fill="url(#locationGradient)" 
              stroke="rgba(16,185,129,0.3)" 
              stroke-width="2"
              filter="url(#locationGlow)" />
        
        <!-- Map pin icon with gradient -->
        <g transform="translate(${boxX + padding * 1.5}, ${boxY + boxHeight / 2})">
          <circle cx="0" cy="-${iconSize * 0.15}" r="${iconSize * 0.35}" 
                  fill="url(#pinGradient)" 
                  filter="url(#locationGlow)" />
          <path d="M 0,${iconSize * 0.25} L -${iconSize * 0.25},-${iconSize * 0.1} L ${iconSize * 0.25},-${iconSize * 0.1} Z" 
                fill="url(#pinGradient)" 
                filter="url(#locationGlow)" />
        </g>
        
        <!-- "LOCATION" label -->
        <text x="${boxX + padding * 1.5 + iconSize}" y="${boxY + padding + fontSize * 0.8}" 
              font-family="'Inter', 'Roboto', sans-serif" 
              font-size="${fontSize * 0.7}" 
              font-weight="700"
              letter-spacing="1.5"
              fill="rgba(16,185,129,0.9)">LOCATION</text>
        
        <!-- Coordinates -->
        <text x="${boxX + padding * 1.5 + iconSize}" y="${boxY + padding + fontSize * 2.2}" 
              font-family="'Roboto Mono', 'Courier New', monospace" 
              font-size="${fontSize * 0.95}" 
              font-weight="600"
              fill="white">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</text>
      </svg>
    `;
    svgOverlays.push(locationSvg);
  }

  // Premium Timestamp Overlay - Bottom Right
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const fontSize = Math.max(18, height / 55);
  const padding = fontSize * 0.8;
  const boxHeight = fontSize * 2.8;
  const boxWidth = fontSize * 12;
  const boxX = width - boxWidth - padding;
  const boxY = height - boxHeight - padding;

  const timestampSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="timestampGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(20,20,20,0.95);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.95);stop-opacity:1" />
        </linearGradient>
        <filter id="timestampShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Rounded background box -->
      <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" 
            rx="12" ry="12"
            fill="url(#timestampGradient)" 
            stroke="rgba(255,255,255,0.1)" 
            stroke-width="1"
            filter="url(#timestampShadow)" />
      
      <!-- Clock icon -->
      <g transform="translate(${boxX + padding}, ${boxY + boxHeight / 2})">
        <circle cx="0" cy="0" r="${fontSize * 0.6}" 
                fill="none" 
                stroke="rgba(147,197,253,0.8)" 
                stroke-width="2" />
        <line x1="0" y1="0" x2="0" y2="-${fontSize * 0.35}" 
              stroke="rgba(147,197,253,0.8)" 
              stroke-width="2" 
              stroke-linecap="round" />
        <line x1="0" y1="0" x2="${fontSize * 0.25}" y2="0" 
              stroke="rgba(147,197,253,0.8)" 
              stroke-width="2" 
              stroke-linecap="round" />
      </g>
      
      <!-- Timestamp text -->
      <text x="${boxX + padding + fontSize * 1.5}" y="${boxY + boxHeight / 2 + fontSize * 0.35}" 
            font-family="'Roboto Mono', 'Courier New', monospace" 
            font-size="${fontSize}" 
            font-weight="600"
            fill="white">${timestamp}</text>
    </svg>
  `;
  svgOverlays.push(timestampSvg);

  // Enhanced Stickers with glow effects
  for (const sticker of stickers) {
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;

    if (sticker.type === "arrow") {
      const lineWidth = Math.max(5, sticker.width / 18);
      const arrowSvg = `
        <svg width="${width}" height="${height}">
          <defs>
            <filter id="arrowGlow${sticker.id}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="0" dy="0" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.8"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="arrowGradient${sticker.id}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgb(251,191,36);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(245,158,11);stop-opacity:1" />
            </linearGradient>
          </defs>
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})" 
             filter="url(#arrowGlow${sticker.id})">
            <!-- Arrow shaft with gradient -->
            <line x1="${sticker.x}" y1="${sticker.y + sticker.height / 2}" 
                  x2="${sticker.x + sticker.width * 0.7}" y2="${sticker.y + sticker.height / 2}" 
                  stroke="url(#arrowGradient${sticker.id})" 
                  stroke-width="${lineWidth}" 
                  stroke-linecap="round" />
            <!-- Arrow head -->
            <polygon points="${sticker.x + sticker.width},${sticker.y + sticker.height / 2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.8}" 
                     fill="url(#arrowGradient${sticker.id})" />
          </g>
        </svg>
      `;
      svgOverlays.push(arrowSvg);
    } else if (sticker.type === "circle") {
      const lineWidth = Math.max(5, sticker.width / 13);
      const circleSvg = `
        <svg width="${width}" height="${height}">
          <defs>
            <filter id="circleGlow${sticker.id}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="0" dy="0" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.8"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="circleGradient${sticker.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(239,68,68);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(220,38,38);stop-opacity:1" />
            </linearGradient>
          </defs>
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})" 
             filter="url(#circleGlow${sticker.id})">
            <ellipse cx="${sticker.x + sticker.width / 2}" cy="${sticker.y + sticker.height / 2}" 
                     rx="${sticker.width / 2}" ry="${sticker.height / 2}" 
                     fill="none" 
                     stroke="url(#circleGradient${sticker.id})" 
                     stroke-width="${lineWidth}" />
          </g>
        </svg>
      `;
      svgOverlays.push(circleSvg);
    }
  }

  if (svgOverlays.length > 0) {
    const composites = svgOverlays.map(svg => ({
      input: Buffer.from(svg),
      top: 0,
      left: 0,
    }));

    return await image.composite(composites).jpeg({ quality: 95 }).toBuffer();
  }

  return await image.jpeg({ quality: 95 }).toBuffer();
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensurePhotosDir();

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/projects/:projectId/photos", async (req, res) => {
    try {
      const photos = await storage.getProjectPhotos(req.params.projectId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Photos endpoints
  app.post("/api/photos", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }

      const comment = req.body.comment || null;
      const commentPosition = req.body.commentPosition || "top";
      const stickers = req.body.stickers ? JSON.parse(req.body.stickers) : [];
      const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
      const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

      const filename = `photo-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(PHOTOS_DIR, filename);

      const compositedImage = await compositeImageWithOverlays(
        req.file.buffer,
        comment,
        commentPosition as "top" | "bottom",
        stickers,
        latitude,
        longitude
      );

      await fs.writeFile(filepath, compositedImage);

      const photoData = {
        projectId: req.body.projectId,
        filename,
        comment,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        stickers,
        commentPosition,
      };

      const validatedData = insertPhotoSchema.parse(photoData);
      const photo = await storage.createPhoto(validatedData);

      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(400).json({ error: "Failed to upload photo" });
    }
  });

  app.get("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      console.error("Error fetching photo:", error);
      res.status(500).json({ error: "Failed to fetch photo" });
    }
  });

  app.get("/api/photos/:id/file", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      const filepath = path.join(PHOTOS_DIR, photo.filename);

      try {
        await fs.access(filepath);
        res.sendFile(filepath);
      } catch {
        res.status(404).json({ error: "Photo file not found" });
      }
    } catch (error) {
      console.error("Error serving photo:", error);
      res.status(500).json({ error: "Failed to serve photo" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      const filepath = path.join(PHOTOS_DIR, photo.filename);

      try {
        await fs.unlink(filepath);
      } catch (error) {
        console.error("Error deleting photo file:", error);
      }

      await storage.deletePhoto(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
