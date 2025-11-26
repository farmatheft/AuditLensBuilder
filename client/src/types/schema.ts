import { z } from "zod";

// Sticker type definition
export interface Sticker {
    id: string;
    type: "arrow" | "dpt" | "packaging";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    packagingId?: string; // For packaging stickers
    packagingFilename?: string; // Image filename for packaging stickers
}

// Geolocation type
export interface Geolocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

// User type
export interface User {
    id: number;
    telegramId: string;
    firstName: string;
    lastName: string;
    username: string;
    isBot: boolean;
    languageCode: string;
    createdAt: string;
}

// Project type
export interface Project {
    id: string;
    userId: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

// Photo type
export interface Photo {
    id: string;
    userId: number;
    projectId: string;
    filename: string;
    comment: string | null;
    latitude: number | null;
    longitude: number | null;
    stickers: Sticker[];
    createdAt: string;
    packagingId?: string;
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
    packagingId: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export interface Packaging {
    id: string;
    userId?: number;
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
