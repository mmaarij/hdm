import type {
  UserId,
  DocumentId,
  MetadataId,
  PermissionId,
  TagId,
  TokenId,
  Email,
  HashedPassword,
  FileName,
  MimeType,
  FileSize,
  FilePath,
  DownloadToken,
} from "./branded.js";

export interface User {
  id: UserId;
  email: Email;
  password: HashedPassword;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface Document {
  id: DocumentId;
  filename: FileName;
  originalName: FileName;
  mimeType: MimeType;
  size: FileSize;
  path: FilePath;
  uploadedBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  id: MetadataId;
  documentId: DocumentId;
  key: string;
  value: string;
  createdAt: Date;
}

export interface DocumentPermission {
  id: PermissionId;
  documentId: DocumentId;
  userId: UserId;
  permission: Permission;
  grantedBy: UserId;
  grantedAt: Date;
}

export enum Permission {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  ADMIN = "admin",
}

export interface DocumentTag {
  id: TagId;
  documentId: DocumentId;
  tag: string;
  createdAt: Date;
}

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
