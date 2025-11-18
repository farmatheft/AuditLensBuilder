import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertPhotoSchema, type Sticker } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";

// Extend Express Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

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
  longitude: number | null,
  projectName: string,
  capturedAt: string
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  const svgOverlays: string[] = [];

  // Unified font size and fixed height
  const fontSize = Math.max(16, height / 60);
  const boxHeight = fontSize * 2.5;

  // Calculate positions from bottom
  let currentY = height;
  
  // Timestamp Overlay - Bottom, right aligned (use captured timestamp)
  const timestamp = new Date(capturedAt).toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
  
  currentY -= boxHeight;
  const timestampSvg = `
    <svg width="${width}" height="${height}">
      <rect x="0" y="${currentY}" width="${width}" height="${boxHeight}" 
            fill="rgba(0,0,0,1)" />
      <text x="${width - fontSize * 0.8}" y="${currentY + boxHeight / 2 + fontSize * 0.35}" 
            font-family="'Courier New', monospace" 
            font-size="${fontSize}" 
            fill="white"
            text-anchor="end">${timestamp}</text>
    </svg>
  `;
  svgOverlays.push(timestampSvg);

  // Comment Overlay - Above timestamp
  if (comment || projectName) {
    const escapedProjectName = projectName
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    
    const escapedComment = comment
      ? comment
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : "custom comment";

    currentY -= boxHeight;
    const commentSvg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="${currentY}" width="${width}" height="${boxHeight}" 
              fill="rgba(0,0,0,1)" />
        <text x="${fontSize * 0.8}" y="${currentY + boxHeight / 2 + fontSize * 0.35}" 
              font-family="'Courier New', monospace" 
              font-size="${fontSize}" 
              fill="white">
          <tspan font-weight="bold">${escapedProjectName}</tspan><tspan> - ${escapedComment}</tspan>
        </text>
      </svg>
    `;
    svgOverlays.push(commentSvg);
  }

  // Location Overlay - Above comment
  if (latitude !== null && longitude !== null) {
    currentY -= boxHeight;
    const locationSvg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="${currentY}" width="${width}" height="${boxHeight}" 
              fill="rgba(0,0,0,1)" />
        <text x="${fontSize * 0.8}" y="${currentY + boxHeight / 2 + fontSize * 0.35}" 
              font-family="'Courier New', monospace" 
              font-size="${fontSize}" 
              fill="white">${latitude.toFixed(4)},${longitude.toFixed(4)}</text>
      </svg>
    `;
    svgOverlays.push(locationSvg);
  }



  // Simple Stickers
  for (const sticker of stickers) {
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;

    if (sticker.type === "arrow") {
      const lineWidth = Math.max(4, sticker.width / 20);
      const arrowSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <line x1="${sticker.x}" y1="${sticker.y + sticker.height / 2}" 
                  x2="${sticker.x + sticker.width * 0.7}" y2="${sticker.y + sticker.height / 2}" 
                  stroke="rgb(255,200,0)" 
                  stroke-width="${lineWidth}" 
                  stroke-linecap="round" />
            <polygon points="${sticker.x + sticker.width},${sticker.y + sticker.height / 2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.8}" 
                     fill="rgb(255,200,0)" />
          </g>
        </svg>
      `;
      svgOverlays.push(arrowSvg);
    } else if (sticker.type === "arrow-3d") {
      const lineWidth = Math.max(5, sticker.width / 18);
      const arrow3dSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <defs>
              <linearGradient id="arrow3d${sticker.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(255,200,0);stop-opacity:1" />
                <stop offset="50%" style="stop-color:rgb(255,150,0);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(200,100,0);stop-opacity:1" />
              </linearGradient>
            </defs>
            <line x1="${sticker.x}" y1="${sticker.y + sticker.height / 2}" 
                  x2="${sticker.x + sticker.width * 0.65}" y2="${sticker.y + sticker.height / 2}" 
                  stroke="url(#arrow3d${sticker.id})" 
                  stroke-width="${lineWidth * 1.2}" 
                  stroke-linecap="round" />
            <polygon points="${sticker.x + sticker.width},${sticker.y + sticker.height / 2} ${sticker.x + sticker.width * 0.65},${sticker.y + sticker.height * 0.15} ${sticker.x + sticker.width * 0.65},${sticker.y + sticker.height * 0.85}" 
                     fill="url(#arrow3d${sticker.id})" />
          </g>
        </svg>
      `;
      svgOverlays.push(arrow3dSvg);
    } else if (sticker.type === "circle") {
      const lineWidth = Math.max(4, sticker.width / 15);
      const circleSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <ellipse cx="${sticker.x + sticker.width / 2}" cy="${sticker.y + sticker.height / 2}" 
                     rx="${sticker.width / 2}" ry="${sticker.height / 2}" 
                     fill="none" 
                     stroke="rgb(255,50,50)" 
                     stroke-width="${lineWidth}" />
          </g>
        </svg>
      `;
      svgOverlays.push(circleSvg);
    } else if (sticker.type === "circle-filled") {
      const circleSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <ellipse cx="${sticker.x + sticker.width / 2}" cy="${sticker.y + sticker.height / 2}" 
                     rx="${sticker.width / 2}" ry="${sticker.height / 2}" 
                     fill="rgba(255,50,50,0.4)" 
                     stroke="rgb(255,50,50)" 
                     stroke-width="3" />
          </g>
        </svg>
      `;
      svgOverlays.push(circleSvg);
    } else if (sticker.type === "crosshair") {
      const lineWidth = Math.max(3, sticker.width / 25);
      const crosshairSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <circle cx="${centerX}" cy="${centerY}" r="${sticker.width / 2}" 
                    fill="none" stroke="rgb(0,255,100)" stroke-width="${lineWidth}" />
            <line x1="${centerX}" y1="${centerY - sticker.height / 2}" 
                  x2="${centerX}" y2="${centerY + sticker.height / 2}" 
                  stroke="rgb(0,255,100)" stroke-width="${lineWidth}" />
            <line x1="${centerX - sticker.width / 2}" y1="${centerY}" 
                  x2="${centerX + sticker.width / 2}" y2="${centerY}" 
                  stroke="rgb(0,255,100)" stroke-width="${lineWidth}" />
            <circle cx="${centerX}" cy="${centerY}" r="${sticker.width / 8}" 
                    fill="none" stroke="rgb(0,255,100)" stroke-width="${lineWidth}" />
          </g>
        </svg>
      `;
      svgOverlays.push(crosshairSvg);
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
      console.log("Received project data:", req.body);
      const validatedData = insertProjectSchema.parse(req.body);
      console.log("Validated project data:", validatedData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ 
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error)
      });
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
  app.post("/api/photos", upload.single("photo"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }

      const comment = req.body.comment || null;
      const commentPosition = req.body.commentPosition || "top";
      const stickers = req.body.stickers ? JSON.parse(req.body.stickers) : [];
      const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
      const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
      const projectId = req.body.projectId;
      const capturedAt = req.body.capturedAt || new Date().toISOString();

      // Get project name for comment
      let projectName = "";
      if (projectId) {
        const project = await storage.getProject(projectId);
        if (project) {
          projectName = project.name;
        }
      }

      const filename = `photo-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(PHOTOS_DIR, filename);

      const compositedImage = await compositeImageWithOverlays(
        req.file.buffer,
        comment,
        commentPosition as "top" | "bottom",
        stickers,
        latitude,
        longitude,
        projectName,
        capturedAt
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
