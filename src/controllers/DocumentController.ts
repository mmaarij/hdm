import type { Context } from "hono";
import { DocumentService } from "../services/DocumentService.js";
import { DocumentSearchSchema } from "../types/dto.js";
import { parseMultipartFormData } from "../utils/fileUpload.js";
import { UserRole } from "../types/domain.js";
import {
  handleControllerError,
  convertDocumentForResponse,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  requireAuthenticatedUser,
} from "../utils/responseHelpers.js";

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  upload = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const { files, fields } = await parseMultipartFormData(c.req.raw);

      if (files.length === 0) {
        return c.json({ success: false, error: "No file provided" }, 400);
      }

      if (files.length > 1) {
        return c.json(
          { success: false, error: "Multiple files not supported" },
          400
        );
      }

      const file = files[0];
      if (!file) {
        return c.json({ success: false, error: "No valid file found" }, 400);
      }

      const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};
      const tags = fields.tags ? JSON.parse(fields.tags) : [];
      const uploadData = { file, metadata, tags };

      const document = await this.documentService.uploadDocument(
        file,
        uploadData,
        user.userId
      );

      return c.json(
        createSuccessResponse(
          convertDocumentForResponse(document),
          "Document uploaded successfully"
        ),
        201
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  getDocument = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const document = await this.documentService.getDocumentWithMetadata(id);

      if (!document) {
        return c.json(
          {
            success: false,
            error: "Document not found",
          },
          404
        );
      }

      return c.json(
        createSuccessResponse({
          ...document,
          id: document.id as string,
          filename: document.filename as string,
          originalName: document.originalName as string,
          mimeType: document.mimeType as string,
          size: document.size as number,
          path: document.path as string,
          uploadedBy: document.uploadedBy as string,
        })
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  getUserDocuments = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "20");

      const result = await this.documentService.getUserDocuments(
        user.userId,
        page,
        limit
      );

      return c.json(
        createSuccessResponse({
          ...result,
          data: result.data.map(convertDocumentForResponse),
        })
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  searchDocuments = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const query = c.req.query();
      const searchOptions = DocumentSearchSchema.parse(query);

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

      return c.json(
        createSuccessResponse({
          ...result,
          data: result.data.map(convertDocumentForResponse),
        })
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  downloadDocument = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const document = await this.documentService.getDocument(id);

      if (!document) {
        return c.json(
          {
            success: false,
            error: "Document not found",
          },
          404
        );
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
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const id = c.req.param("id");
      const document = await this.documentService.getDocument(id);

      if (!document) {
        return c.json(
          {
            success: false,
            error: "Document not found",
          },
          404
        );
      }

      if (document.uploadedBy !== user.userId && user.role !== UserRole.ADMIN) {
        return c.json(
          {
            success: false,
            error: "Access denied",
          },
          403
        );
      }

      const deleted = await this.documentService.deleteDocument(id);

      if (!deleted) {
        return c.json(
          {
            success: false,
            error: "Failed to delete document",
          },
          500
        );
      }

      return c.json(
        createSuccessResponseWithoutData("Document deleted successfully")
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
