import type { Context } from "hono";
import { DocumentService } from "../services/DocumentService.js";
import { DocumentSearchSchema } from "../types/dto.js";
import { parseMultipartFormData } from "../utils/fileUpload.js";
import { ZodError } from "zod";

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  upload = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      // Parse multipart form data
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

      // Parse metadata and tags from form fields
      const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};
      const tags = fields.tags ? JSON.parse(fields.tags) : [];

      const uploadData = { file, metadata, tags };

      // Upload document
      const document = await this.documentService.uploadDocument(
        file,
        uploadData,
        user.userId
      );

      return c.json(
        {
          success: true,
          message: "Document uploaded successfully",
          data: document,
        },
        201
      );
    } catch (error) {
      if (error instanceof Error) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          400
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

      return c.json({
        success: true,
        data: document,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };

  getUserDocuments = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "20");

      const result = await this.documentService.getUserDocuments(
        user.userId,
        page,
        limit
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };

  searchDocuments = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const query = c.req.query();

      // Validate search parameters
      const searchOptions = DocumentSearchSchema.parse(query);

      // Scope search based on user role
      let userSearchOptions;
      if (user.role === "admin") {
        // Admins can search all documents
        userSearchOptions = searchOptions;
      } else {
        // Regular users can only search their own documents
        userSearchOptions = {
          ...searchOptions,
          uploadedBy: user.userId,
        };
      }

      const result = await this.documentService.searchDocuments(
        userSearchOptions
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Invalid search parameters",
            details: error.issues,
          },
          400
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

      // Get file data
      const fileData = await this.documentService.getFileData(document);

      // Set appropriate headers
      c.header("Content-Type", document.mimeType);
      c.header("Content-Length", document.size.toString());
      c.header(
        "Content-Disposition",
        `attachment; filename="${document.originalName}"`
      );

      return new Response(fileData, {
        headers: {
          "Content-Type": document.mimeType,
          "Content-Length": document.size.toString(),
          "Content-Disposition": `attachment; filename="${document.originalName}"`,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };

  deleteDocument = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

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

      // Check if user owns the document (or is admin)
      if (document.uploadedBy !== user.userId && user.role !== "admin") {
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

      return c.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };
}
