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
  stickers: Sticker[]
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  const svgOverlays: string[] = [];

  if (comment) {
    const fontSize = Math.max(24, height / 30);
    const padding = fontSize * 0.5;
    const y = commentPosition === "top" ? padding : height - fontSize - padding;

    const commentSvg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="${y - fontSize - padding / 2}" width="${width}" height="${fontSize + padding}" fill="rgba(0,0,0,0.7)" />
        <text x="${padding}" y="${y}" font-family="Roboto, sans-serif" font-size="${fontSize}" fill="white">${comment.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
      </svg>
    `;
    svgOverlays.push(commentSvg);
  }

  for (const sticker of stickers) {
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;

    if (sticker.type === "arrow") {
      const lineWidth = Math.max(3, sticker.width / 20);
      const arrowSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <line x1="${sticker.x}" y1="${sticker.y + sticker.height / 2}" x2="${sticker.x + sticker.width * 0.7}" y2="${sticker.y + sticker.height / 2}" 
                  stroke="rgba(255,193,7,0.9)" stroke-width="${lineWidth}" />
            <polygon points="${sticker.x + sticker.width},${sticker.y + sticker.height / 2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.2} ${sticker.x + sticker.width * 0.7},${sticker.y + sticker.height * 0.8}" 
                     fill="rgba(255,193,7,0.9)" />
          </g>
        </svg>
      `;
      svgOverlays.push(arrowSvg);
    } else if (sticker.type === "circle") {
      const lineWidth = Math.max(3, sticker.width / 15);
      const circleSvg = `
        <svg width="${width}" height="${height}">
          <g transform="translate(${centerX},${centerY}) rotate(${sticker.rotation}) translate(${-centerX},${-centerY})">
            <ellipse cx="${sticker.x + sticker.width / 2}" cy="${sticker.y + sticker.height / 2}" rx="${sticker.width / 2}" ry="${sticker.height / 2}" 
                     fill="none" stroke="rgba(244,67,54,0.9)" stroke-width="${lineWidth}" />
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

      const filename = `photo-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(PHOTOS_DIR, filename);

      const compositedImage = await compositeImageWithOverlays(
        req.file.buffer,
        comment,
        commentPosition as "top" | "bottom",
        stickers
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
