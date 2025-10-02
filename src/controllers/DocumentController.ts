import type { Context } from "hono";
import { DocumentService } from "../services/DocumentService";
import { DocumentPermissionService } from "../services/PermissionService";
import { DocumentSearchSchema } from "../types/dto";
import { parseMultipartFormData } from "../utils/fileUpload";
import { UserRole, Permission, type Document } from "../types/domain";
import { StatusCode } from "../types/statusCodes";
import {
  handleControllerError,
  convertDocumentForResponse,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  createErrorResponse,
  requireAuthenticatedUser,
  handleAsyncOperation,
} from "../utils/responseHelpers";

export class DocumentController {
  private documentService: DocumentService;
  private permissionService: DocumentPermissionService;

  constructor() {
    this.documentService = new DocumentService();
    this.permissionService = new DocumentPermissionService();
  }

  upload = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");

    return handleAsyncOperation(
      c,
      async () => {
        const { files, fields } = await parseMultipartFormData(c.req.raw);

        if (files.length === 0) {
          throw new Error("No file provided");
        }

        if (files.length > 1) {
          throw new Error("Multiple files not supported");
        }

        const file = files[0];
        if (!file) {
          throw new Error("No valid file found");
        }

        const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};
        const tags = fields.tags ? JSON.parse(fields.tags) : [];
        const uploadData = { file, metadata, tags };

        const document = await this.documentService.uploadDocument(
          file,
          uploadData,
          user.userId
        );

        return convertDocumentForResponse(document);
      },
      "Document uploaded successfully",
      StatusCode.CREATED
    );
  };

  getDocument = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const id = c.req.param("id");

    return handleAsyncOperation(
      c,
      async () => {
        const document = await this.documentService.getDocumentWithMetadata(id);

        if (!document) {
          throw new Error("Document not found");
        }

        // Check if user has access to this document
        const hasAccess = await this.permissionService.checkDocumentAccess(
          user.userId,
          user.role,
          document
        );
        if (!hasAccess) {
          throw new Error("Access denied");
        }

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
      },
      "Document retrieved successfully"
    );
  };

  getUserDocuments = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");

    return handleAsyncOperation(
      c,
      async () => {
        const result = await this.documentService.getUserDocuments(
          user.userId,
          page,
          limit
        );

        return {
          ...result,
          data: result.data.map(convertDocumentForResponse),
        };
      },
      "Documents retrieved successfully"
    );
  };

  searchDocuments = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const query = c.req.query();

    return handleAsyncOperation(
      c,
      async () => {
        // Parse metadata query parameters (e.g., metadata[key]=value)
        const processedQuery: Record<string, any> = { ...query };
        const metadata: Record<string, string> = {};

        // Extract metadata parameters and convert to proper object format
        Object.keys(query).forEach((key) => {
          const metadataMatch = key.match(/^metadata\[(.+)\]$/);
          if (metadataMatch && metadataMatch[1]) {
            const metadataKey = metadataMatch[1];
            const metadataValue = query[key];
            if (metadataValue && metadataKey) {
              metadata[metadataKey] = metadataValue;
            }
            delete processedQuery[key];
          }
        });

        // Add parsed metadata to query if any were found
        if (Object.keys(metadata).length > 0) {
          processedQuery.metadata = metadata;
        }

        const searchOptions = DocumentSearchSchema.parse(processedQuery);

        // Check if any actual search criteria were provided (not just pagination/sorting)
        const hasActualSearchCriteria = !!(
          searchOptions.filename ||
          searchOptions.mimeType ||
          (searchOptions.uploadedBy && user.role === UserRole.ADMIN) || // Only admins can search by specific user
          (searchOptions.tags && searchOptions.tags.length > 0) ||
          (searchOptions.metadata &&
            Object.keys(searchOptions.metadata).length > 0)
        );

        // If no search criteria provided, return empty results
        if (!hasActualSearchCriteria) {
          return {
            data: [],
            pagination: {
              page: searchOptions.page,
              limit: searchOptions.limit,
              total: 0,
              totalPages: 0,
            },
          };
        }

        // Scope search based on user role
        let userSearchOptions;
        if (user.role === UserRole.ADMIN) {
          userSearchOptions = searchOptions;
        } else {
          userSearchOptions = {
            ...searchOptions,
            uploadedBy: user.userId,
          };
        }

        const result = await this.documentService.searchDocuments(
          userSearchOptions
        );

        return {
          ...result,
          data: result.data.map(convertDocumentForResponse),
        };
      },
      "Documents searched successfully"
    );
  };

  downloadDocument = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const id = c.req.param("id");
      const document = await this.documentService.getDocument(id);

      if (!document) {
        return createErrorResponse(
          c,
          "Document not found",
          StatusCode.NOT_FOUND
        );
      }

      // Check if user has access to this document
      const hasAccess = await this.permissionService.checkDocumentAccess(
        user.userId,
        user.role,
        document
      );
      if (!hasAccess) {
        return createErrorResponse(c, "Access denied", StatusCode.FORBIDDEN);
      }

      const fileData = await this.documentService.getFileData(document);

      return new Response(fileData, {
        headers: {
          "Content-Type": document.mimeType as string,
          "Content-Length": document.size.toString(),
          "Content-Disposition": `attachment; filename="${document.originalName}"`,
        },
      });
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  deleteDocument = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const id = c.req.param("id");

    return handleAsyncOperation(
      c,
      async () => {
        const document = await this.documentService.getDocument(id);

        if (!document) {
          throw new Error("Document not found");
        }

        if (
          document.uploadedBy !== user.userId &&
          user.role !== UserRole.ADMIN
        ) {
          throw new Error("Access denied");
        }

        const deleted = await this.documentService.deleteDocument(id);

        if (!deleted) {
          throw new Error("Failed to delete document");
        }

        return null; // No data to return for delete operation
      },
      "Document deleted successfully"
    );
  };
}
