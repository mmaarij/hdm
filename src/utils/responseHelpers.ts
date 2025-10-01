import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  DocumentMetadata,
  DocumentPermission,
  Document,
  User,
} from "../types/domain.js";

// Response conversion functions
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
  const { password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    id: userWithoutPassword.id as string,
    email: userWithoutPassword.email as string,
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

// Error handling utilities
export function handleControllerError(
  c: Context,
  error: unknown,
  defaultStatusCode: number = 500
) {
  if (error instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: "Validation error",
        details: error.issues,
      },
      400
    );
  }

  if (error instanceof Error) {
    const statusCode = defaultStatusCode === 500 ? 400 : defaultStatusCode;
    return c.json(
      {
        success: false,
        error: error.message,
      },
      statusCode as any
    );
  }

  return c.json(
    {
      success: false,
      error: "Internal server error",
    },
    500
  );
}

// Authentication utilities
export function requireAuthenticatedUser(c: Context) {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }
  return null; // No error, proceed
}

// Success response utilities
export function createSuccessResponse(
  data: any,
  message?: string,
  statusCode: number = 200
) {
  return {
    success: true,
    ...(message && { message }),
    data,
  };
}

export function createSuccessResponseWithoutData(message: string) {
  return {
    success: true,
    message,
  };
}

// Error response utilities
export function createErrorResponse(
  c: Context,
  error: string,
  statusCode: number = 400
) {
  return c.json(
    {
      success: false,
      error,
    },
    statusCode as any
  );
}
