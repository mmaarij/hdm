import type {
  User,
  Document,
  DocumentMetadata,
  DocumentPermission,
  DocumentTag,
  PaginatedResponse,
} from "../types/domain.js";
import type {
  UserId,
  DocumentId,
  MetadataId,
  PermissionId,
  TagId,
  TokenId,
  DownloadToken,
} from "../types/branded.js";

// Common pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Search and filter options
export interface DocumentSearchOptions extends PaginationOptions {
  filename?: string;
  mimeType?: string;
  uploadedBy?: UserId;
  tags?: string[];
  metadata?: Record<string, string>;
  sortBy?: "filename" | "createdAt" | "size";
  sortOrder?: "asc" | "desc";
}

// Repository interfaces following the contract pattern
export interface IUserRepository {
  create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(
    id: UserId,
    updates: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User | null>;
  delete(id: UserId): Promise<boolean>;
}

export interface IDocumentRepository {
  create(
    document: Omit<Document, "createdAt" | "updatedAt">
  ): Promise<Document>;
  findById(id: DocumentId): Promise<Document | null>;
  findByUserId(
    userId: UserId,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<Document>>;
  search(options: DocumentSearchOptions): Promise<PaginatedResponse<Document>>;
  update(
    id: DocumentId,
    updates: Partial<Omit<Document, "id" | "createdAt">>
  ): Promise<Document | null>;
  delete(id: DocumentId): Promise<boolean>;
}

export interface IDocumentMetadataRepository {
  create(
    metadata: Omit<DocumentMetadata, "createdAt">
  ): Promise<DocumentMetadata>;
  findByDocumentId(documentId: DocumentId): Promise<DocumentMetadata[]>;
  update(
    id: MetadataId,
    updates: { value: string }
  ): Promise<DocumentMetadata | null>;
  delete(id: MetadataId): Promise<boolean>;
  deleteByDocumentId(documentId: DocumentId): Promise<number>;
}

export interface IDocumentPermissionRepository {
  create(
    permission: Omit<DocumentPermission, "grantedAt">
  ): Promise<DocumentPermission>;
  findByDocumentId(documentId: DocumentId): Promise<DocumentPermission[]>;
  findByUserId(userId: UserId): Promise<DocumentPermission[]>;
  findByDocumentAndUser(
    documentId: DocumentId,
    userId: UserId
  ): Promise<DocumentPermission | null>;
  update(
    id: PermissionId,
    updates: { permission: string }
  ): Promise<DocumentPermission | null>;
  delete(id: PermissionId): Promise<boolean>;
  deleteByDocumentId(documentId: DocumentId): Promise<number>;
}

export interface IDocumentTagRepository {
  create(tag: Omit<DocumentTag, "createdAt">): Promise<DocumentTag>;
  findByDocumentId(documentId: DocumentId): Promise<DocumentTag[]>;
  findByTag(
    tag: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<DocumentTag>>;
  delete(id: TagId): Promise<boolean>;
  deleteByDocumentId(documentId: DocumentId): Promise<number>;
}

// Download token repository interface
export interface IDownloadTokenRepository {
  create(token: {
    id: TokenId;
    documentId: DocumentId;
    token: DownloadToken;
    expiresAt: Date;
    createdBy: UserId;
  }): Promise<void>;
  findByToken(token: DownloadToken): Promise<{
    id: TokenId;
    documentId: DocumentId;
    expiresAt: Date;
    usedAt?: Date;
  } | null>;
  markAsUsed(id: TokenId): Promise<boolean>;
  cleanup(): Promise<number>; // Remove expired tokens
}
