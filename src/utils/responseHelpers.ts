import type { Context } from "hono";
import { ZodError } from "zod";
import { Effect } from "effect";
import { StatusCode } from "../types/statusCodes";
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
  defaultStatusCode: number = StatusCode.INTERNAL_SERVER_ERROR
) {
  return Effect.runSync(
    Effect.sync(() => {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.issues,
          },
          StatusCode.BAD_REQUEST as any
        );
      }

      if (error instanceof Error) {
        // Smart error message categorization
        const message = error.message.toLowerCase();
        let statusCode = defaultStatusCode;

        if (
          message.includes("not found") ||
          message.includes("does not exist")
        ) {
          statusCode = StatusCode.NOT_FOUND;
        } else if (
          message.includes("already exists") ||
          message.includes("duplicate") ||
          message.includes("conflict")
        ) {
          statusCode = StatusCode.CONFLICT;
        } else if (
          message.includes("unauthorized") ||
          message.includes("invalid credentials") ||
          message.includes("authentication")
        ) {
          statusCode = StatusCode.UNAUTHORIZED;
        } else if (
          message.includes("forbidden") ||
          message.includes("permission") ||
          message.includes("access denied")
        ) {
          statusCode = StatusCode.FORBIDDEN;
        } else if (statusCode === StatusCode.INTERNAL_SERVER_ERROR) {
          statusCode = StatusCode.BAD_REQUEST;
        }

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
        StatusCode.INTERNAL_SERVER_ERROR as any
      );
    })
  );
}

// Authentication utilities
export function requireAuthenticatedUser(c: Context) {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { success: false, error: "Authentication required" },
      StatusCode.UNAUTHORIZED as any
    );
  }
  return null; // No error, proceed
}

// Success response utilities
export function createSuccessResponse(
  data: any,
  message?: string,
  statusCode: number = StatusCode.OK
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
  statusCode: number = StatusCode.BAD_REQUEST
) {
  return c.json(
    {
      success: false,
      error,
    },
    statusCode as any
  );
}

// Optional Effect-enhanced async operation wrapper
export async function handleAsyncOperation<T>(
  c: Context,
  operation: () => Promise<T>,
  successMessage?: string,
  successStatusCode: number = StatusCode.OK
) {
  return Effect.runPromise(
    Effect.tryPromise({
      try: operation,
      catch: (error) => error,
    }).pipe(
      Effect.match({
        onFailure: (error) => handleControllerError(c, error),
        onSuccess: (data) => {
          if (successMessage) {
            return c.json(
              createSuccessResponse(data, successMessage),
              successStatusCode as any
            );
          }
          return c.json(createSuccessResponse(data), successStatusCode as any);
        },
      })
    )
  );
}
