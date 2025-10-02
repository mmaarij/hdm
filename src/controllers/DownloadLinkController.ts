import type { Context } from "hono";
import { DownloadLinkService } from "../services/DownloadLinkService";
import { DocumentService } from "../services/DocumentService";
import { UserRole } from "../types/domain";
import { StatusCode } from "../types/statusCodes";
import {
  handleControllerError,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  createErrorResponse,
  requireAuthenticatedUser,
  handleAsyncOperation,
} from "../utils/responseHelpers";

export class DownloadLinkController {
  private downloadLinkService: DownloadLinkService;
  private documentService: DocumentService;

  constructor() {
    this.downloadLinkService = new DownloadLinkService();
    this.documentService = new DocumentService();
  }

  generateDownloadLink = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const documentId = c.req.param("documentId");

    return handleAsyncOperation(
      c,
      async () => {
        const document = await this.documentService.getDocument(documentId);
        if (!document) {
          throw new Error("Document not found"); // Auto-mapped to 404
        }

        const token = await this.downloadLinkService.generateDownloadLink(
          documentId,
          user.userId
        );

        const downloadUrl = `/api/v1/download/${token}`;

        return {
          downloadUrl,
          token,
          expiresIn: "1h",
        };
      },
      "Download link generated successfully"
    );
  };

  downloadWithToken = async (c: Context) => {
    try {
      const token = c.req.param("token");
      const documentId = await this.downloadLinkService.useDownloadToken(token);

      if (!documentId) {
        throw new Error("Invalid, expired, or already used download token"); // Auto-mapped to 401/403
      }

      const document = await this.documentService.getDocument(documentId);
      if (!document) {
        throw new Error("Document not found"); // Auto-mapped to 404
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
    const user = c.get("user");
    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Admin access required"); // Auto-mapped to 403
    }

    return handleAsyncOperation(
      c,
      async () => {
        const cleanedCount =
          await this.downloadLinkService.cleanupExpiredTokens();
        return { message: `Cleaned up ${cleanedCount} expired tokens` };
      },
      `Cleanup completed successfully`
    );
  };
}
