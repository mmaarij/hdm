import type { Context } from "hono";
import { DownloadLinkService } from "../services/DownloadLinkService.js";
import { DocumentService } from "../services/DocumentService.js";
import { UserRole } from "../types/domain.js";
import {
  handleControllerError,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  requireAuthenticatedUser,
} from "../utils/responseHelpers.js";

export class DownloadLinkController {
  private downloadLinkService: DownloadLinkService;
  private documentService: DocumentService;

  constructor() {
    this.downloadLinkService = new DownloadLinkService();
    this.documentService = new DocumentService();
  }

  generateDownloadLink = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const documentId = c.req.param("documentId");

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

      const token = await this.downloadLinkService.generateDownloadLink(
        documentId,
        user.userId
      );

      const downloadUrl = `/api/v1/download/${token}`;

      return c.json(
        createSuccessResponse(
          {
            downloadUrl,
            token,
            expiresIn: "1h",
          },
          "Download link generated successfully"
        )
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  downloadWithToken = async (c: Context) => {
    try {
      const token = c.req.param("token");
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

  cleanupExpiredTokens = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user || user.role !== UserRole.ADMIN) {
        return c.json({ success: false, error: "Admin access required" }, 403);
      }

      const cleanedCount =
        await this.downloadLinkService.cleanupExpiredTokens();

      return c.json(
        createSuccessResponseWithoutData(
          `Cleaned up ${cleanedCount} expired tokens`
        )
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
