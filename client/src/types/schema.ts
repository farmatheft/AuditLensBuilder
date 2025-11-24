import { z } from "zod";

// Sticker type definition
export interface Sticker {
    id: string;
    type: "arrow" | "dpt";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// Geolocation type
export interface Geolocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

// Project type
export interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

// Photo type
export interface Photo {
    id: string;
    projectId: string;
    filename: string;
    comment: string | null;
    latitude: number | null;
    longitude: number | null;
    stickers: Sticker[];
    createdAt: string;
}

// Zod schemas for validation

export const insertProjectSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

export const insertPhotoSchema = z.object({
    projectId: z.string(),
    filename: z.string(),
    comment: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    stickers: z.array(z.object({
        id: z.string(),
        type: z.enum(["arrow", "dpt"]),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        rotation: z.number(),
    })).optional(),
    capturedAt: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export interface Packaging {
    id: string;
    name: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface InsertPackaging {
    name: string;
    color: string;
}

export const insertPackagingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    color: z.string().min(1, "Color is required"),
});
