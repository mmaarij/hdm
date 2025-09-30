// Core domain entities

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  id: string;
  documentId: string;
  key: string;
  value: string;
  createdAt: Date;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId: string;
  permission: Permission;
  grantedBy: string;
  grantedAt: Date;
}

export enum Permission {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  ADMIN = "admin",
}

export interface DocumentTag {
  id: string;
  documentId: string;
  tag: string;
  createdAt: Date;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
