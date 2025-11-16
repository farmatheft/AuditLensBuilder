import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, doublePrecision, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Projects table - represents different objects/jobs being tracked
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Photos table - stores photo metadata and location
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  comment: text("comment"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  stickers: jsonb("stickers").$type<Sticker[]>().default([]),
  commentPosition: text("comment_position").$type<"top" | "bottom">().default("top"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API keys table for external integrations
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const projectsRelations = relations(projects, ({ many }) => ({
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  project: one(projects, {
    fields: [photos.projectId],
    references: [projects.id],
  }),
}));

// Sticker type definition
export interface Sticker {
  id: string;
  type: "arrow" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Zod schemas for validation
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
}).extend({
  stickers: z.array(z.object({
    id: z.string(),
    type: z.enum(["arrow", "circle"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
  })).optional(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Geolocation type
export interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
