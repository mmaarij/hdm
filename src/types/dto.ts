// Request/Response DTOs for API validation with Zod

import { z } from "zod";
import { UserRole, Permission } from "./domain";
import type { UserId, Email } from "./branded";

// Auth DTOs
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().transform((val) => val as UserId),
    email: z
      .string()
      .email()
      .transform((val) => val as Email),
    role: z.nativeEnum(UserRole),
  }),
});

// Document DTOs
export const DocumentUploadSchema = z.object({
  file: z.any(),
  metadata: z.record(z.string(), z.string()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
});

export const DocumentSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  filename: z
    .string()
    .min(1)
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  mimeType: z
    .string()
    .min(1)
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  uploadedBy: z
    .string()
    .uuid()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : undefined
    ),
  tags: z
    .array(z.string().min(1))
    .or(
      z.string().transform((s) =>
        s
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      )
    )
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  metadata: z
    .record(z.string().min(1), z.string().min(1))
    .optional()
    .transform((val) => {
      if (!val || Object.keys(val).length === 0) return undefined;
      const filtered = Object.fromEntries(
        Object.entries(val)
          .filter(
            ([key, value]) => key.trim().length > 0 && value.trim().length > 0
          )
          .map(([key, value]) => [key.trim(), value.trim()])
      );
      return Object.keys(filtered).length > 0 ? filtered : undefined;
    }),
  sortBy: z.enum(["filename", "createdAt", "size"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Metadata DTOs
export const DocumentMetadataCreateSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string().min(1).max(1000),
});

export const DocumentMetadataUpdateSchema = z.object({
  value: z.string().min(1).max(1000),
});

// Permission DTOs
export const DocumentPermissionCreateSchema = z.object({
  userId: z
    .string()
    .uuid()
    .transform((val) => val as UserId),
  permission: z.nativeEnum(Permission),
});

export const DocumentPermissionUpdateSchema = z.object({
  permission: z.nativeEnum(Permission),
});

// Tag DTOs
export const DocumentTagCreateSchema = z.object({
  tag: z.string().min(1).max(100).toLowerCase(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Export types
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type DocumentUploadRequest = z.infer<typeof DocumentUploadSchema>;
export type DocumentSearchRequest = z.infer<typeof DocumentSearchSchema>;
export type DocumentMetadataCreateRequest = z.infer<
  typeof DocumentMetadataCreateSchema
>;
export type DocumentMetadataUpdateRequest = z.infer<
  typeof DocumentMetadataUpdateSchema
>;
export type DocumentPermissionCreateRequest = z.infer<
  typeof DocumentPermissionCreateSchema
>;
export type DocumentPermissionUpdateRequest = z.infer<
  typeof DocumentPermissionUpdateSchema
>;
export type DocumentTagCreateRequest = z.infer<typeof DocumentTagCreateSchema>;
export type PaginationRequest = z.infer<typeof PaginationSchema>;
