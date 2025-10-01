import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { UserRole } from "../types/domain.js";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: [UserRole.ADMIN, UserRole.USER] })
    .notNull()
    .default(UserRole.USER),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Documents table
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(), // UUID
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  path: text("path").notNull(), // Storage path
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Document metadata (key-value pairs)
export const documentMetadata = sqliteTable("document_metadata", {
  id: text("id").primaryKey(), // UUID
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Document permissions
export const documentPermissions = sqliteTable("document_permissions", {
  id: text("id").primaryKey(), // UUID
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission", {
    enum: ["read", "write", "delete", "admin"],
  }).notNull(),
  grantedBy: text("granted_by")
    .notNull()
    .references(() => users.id),
  grantedAt: integer("granted_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Document tags for easy categorization
export const documentTags = sqliteTable("document_tags", {
  id: text("id").primaryKey(), // UUID
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Download tokens for secure temporary access
export const downloadTokens = sqliteTable("download_tokens", {
  id: text("id").primaryKey(), // UUID
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
