import type {
  DocumentMetadata,
  DocumentPermission,
  Document,
  User,
} from "../types/domain.js";

export function convertDocumentForResponse(document: Document) {
  return {
    ...document,
    id: document.id as string,
    filename: document.filename as string,
    originalName: document.originalName as string,
    mimeType: document.mimeType as string,
    size: document.size as number,
    path: document.path as string,
    uploadedBy: document.uploadedBy as string,
  };
}

export function convertUserForResponse(user: User) {
  return {
    ...user,
    id: user.id as string,
    email: user.email as string,
    password: user.password as string,
  };
}

export function convertMetadataForResponse(metadata: DocumentMetadata) {
  return {
    ...metadata,
    id: metadata.id as string,
    documentId: metadata.documentId as string,
  };
}

export function convertPermissionForResponse(permission: DocumentPermission) {
  return {
    ...permission,
    id: permission.id as string,
    documentId: permission.documentId as string,
    userId: permission.userId as string,
  };
}
