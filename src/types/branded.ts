declare const __brand: unique symbol;

export type Branded<T, Brand> = T & { readonly [__brand]: Brand };

export type UserId = Branded<string, "UserId">;
export type DocumentId = Branded<string, "DocumentId">;
export type MetadataId = Branded<string, "MetadataId">;
export type PermissionId = Branded<string, "PermissionId">;
export type TagId = Branded<string, "TagId">;
export type TokenId = Branded<string, "TokenId">;

export type Email = Branded<string, "Email">;
export type HashedPassword = Branded<string, "HashedPassword">;
export type JwtToken = Branded<string, "JwtToken">;
export type DownloadToken = Branded<string, "DownloadToken">;

export type FilePath = Branded<string, "FilePath">;
export type FileName = Branded<string, "FileName">;
export type MimeType = Branded<string, "MimeType">;
export type FileSize = Branded<number, "FileSize">;

function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function isValidMimeType(value: string): boolean {
  const parts = value.split(";");
  const mainType = parts[0]?.trim();
  if (!mainType) return false;
  const mimeTypeRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/;
  return mimeTypeRegex.test(mainType);
}

export const createUserId = (value: string): UserId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for UserId: ${value}`);
  }
  return value as UserId;
};

export const createDocumentId = (value: string): DocumentId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for DocumentId: ${value}`);
  }
  return value as DocumentId;
};

export const createMetadataId = (value: string): MetadataId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for MetadataId: ${value}`);
  }
  return value as MetadataId;
};

export const createPermissionId = (value: string): PermissionId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for PermissionId: ${value}`);
  }
  return value as PermissionId;
};

export const createTagId = (value: string): TagId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for TagId: ${value}`);
  }
  return value as TagId;
};

export const createTokenId = (value: string): TokenId => {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID format for TokenId: ${value}`);
  }
  return value as TokenId;
};

export const createEmail = (value: string): Email => {
  if (!isValidEmail(value)) {
    throw new Error(`Invalid email format: ${value}`);
  }
  return value as Email;
};

export const createHashedPassword = (value: string): HashedPassword => {
  if (!value || value.length < 8) {
    throw new Error("Invalid hashed password");
  }
  return value as HashedPassword;
};

export const createJwtToken = (value: string): JwtToken => {
  if (!value || value.length < 20) {
    throw new Error("Invalid JWT token format");
  }
  return value as JwtToken;
};

export const createDownloadToken = (value: string): DownloadToken => {
  if (!value || value.length < 32) {
    throw new Error("Invalid download token format");
  }
  return value as DownloadToken;
};

export const createFilePath = (value: string): FilePath => {
  if (!value || value.length === 0) {
    throw new Error("File path cannot be empty");
  }
  return value as FilePath;
};

export const createFileName = (value: string): FileName => {
  if (!value || value.length === 0) {
    throw new Error("File name cannot be empty");
  }
  return value as FileName;
};

export const createMimeType = (value: string): MimeType => {
  if (!isValidMimeType(value)) {
    throw new Error(`Invalid MIME type format: ${value}`);
  }
  return value as MimeType;
};

export const createFileSize = (value: number): FileSize => {
  if (value < 0) {
    throw new Error("File size cannot be negative");
  }
  return value as FileSize;
};
