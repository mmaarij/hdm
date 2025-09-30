import type { Context } from "hono";
import { DownloadLinkService } from "../services/DownloadLinkService.js";
import { DocumentService } from "../services/DocumentService.js";

export class DownloadLinkController {
  private downloadLinkService: DownloadLinkService;
  private documentService: DocumentService;

  constructor() {
    this.downloadLinkService = new DownloadLinkService();
    this.documentService = new DocumentService();
  }

  generateDownloadLink = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const documentId = c.req.param("documentId");

      // Check if document exists and user has access
      const document = await this.documentService.getDocument(documentId);
      if (!document) {
        return c.json(
          {
            success: false,
            error: "Document not found",
          },
          404
        );
      }

      // Generate download token
      const token = await this.downloadLinkService.generateDownloadLink(
        documentId,
        user.userId
      );

      // Create download URL
      const downloadUrl = `/api/v1/download/${token}`;

      return c.json({
        success: true,
        message: "Download link generated successfully",
        data: {
          downloadUrl,
          token,
          expiresIn: "1h", // TODO: Make this configurable
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        500
      );
    }
  };

  downloadWithToken = async (c: Context) => {
    try {
      const token = c.req.param("token");

      // Validate and use token
      const documentId = await this.downloadLinkService.useDownloadToken(token);

      if (!documentId) {
        return c.json(
          {
            success: false,
            error: "Invalid, expired, or already used download token",
          },
          403
        );
      }

      // Get document
      const document = await this.documentService.getDocument(documentId);
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

      // Return file with appropriate headers
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

  cleanupExpiredTokens = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user || user.role !== "admin") {
        return c.json({ success: false, error: "Admin access required" }, 403);
      }

      const cleanedCount =
        await this.downloadLinkService.cleanupExpiredTokens();

      return c.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired tokens`,
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
