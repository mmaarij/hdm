import type {
  User,
  Document,
  DocumentMetadata,
  DocumentPermission,
  DocumentTag,
  PaginatedResponse,
} from "../types/domain.js";

// Common pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Search and filter options
export interface DocumentSearchOptions extends PaginationOptions {
  filename?: string;
  mimeType?: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  sortBy?: "filename" | "createdAt" | "size";
  sortOrder?: "asc" | "desc";
}

// Repository interfaces following the contract pattern
export interface IUserRepository {
  create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDocumentRepository {
  create(
    document: Omit<Document, "createdAt" | "updatedAt">
  ): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Document>>;
  search(options: DocumentSearchOptions): Promise<PaginatedResponse<Document>>;
  update(
    id: string,
    updates: Partial<Omit<Document, "id" | "createdAt">>
  ): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDocumentMetadataRepository {
  create(
    metadata: Omit<DocumentMetadata, "createdAt">
  ): Promise<DocumentMetadata>;
  findByDocumentId(documentId: string): Promise<DocumentMetadata[]>;
  update(
    id: string,
    updates: { value: string }
  ): Promise<DocumentMetadata | null>;
  delete(id: string): Promise<boolean>;
  deleteByDocumentId(documentId: string): Promise<number>;
}

export interface IDocumentPermissionRepository {
  create(
    permission: Omit<DocumentPermission, "grantedAt">
  ): Promise<DocumentPermission>;
  findByDocumentId(documentId: string): Promise<DocumentPermission[]>;
  findByUserId(userId: string): Promise<DocumentPermission[]>;
  findByDocumentAndUser(
    documentId: string,
    userId: string
  ): Promise<DocumentPermission | null>;
  update(
    id: string,
    updates: { permission: string }
  ): Promise<DocumentPermission | null>;
  delete(id: string): Promise<boolean>;
  deleteByDocumentId(documentId: string): Promise<number>;
}

export interface IDocumentTagRepository {
  create(tag: Omit<DocumentTag, "createdAt">): Promise<DocumentTag>;
  findByDocumentId(documentId: string): Promise<DocumentTag[]>;
  findByTag(
    tag: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<DocumentTag>>;
  delete(id: string): Promise<boolean>;
  deleteByDocumentId(documentId: string): Promise<number>;
}

// Download token repository interface
export interface IDownloadTokenRepository {
  create(token: {
    id: string;
    documentId: string;
    token: string;
    expiresAt: Date;
    createdBy: string;
  }): Promise<void>;
  findByToken(
    token: string
  ): Promise<{
    id: string;
    documentId: string;
    expiresAt: Date;
    usedAt?: Date;
  } | null>;
  markAsUsed(id: string): Promise<boolean>;
  cleanup(): Promise<number>; // Remove expired tokens
}
