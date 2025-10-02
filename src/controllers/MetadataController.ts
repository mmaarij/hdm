import type { Context } from "hono";
import { DocumentMetadataService } from "../services/MetadataService";
import { StatusCode } from "../types/statusCodes";
import {
  DocumentMetadataCreateSchema,
  DocumentMetadataUpdateSchema,
} from "../types/dto";
import {
  handleControllerError,
  convertMetadataForResponse,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  createErrorResponse,
  requireAuthenticatedUser,
  handleAsyncOperation,
} from "../utils/responseHelpers";

export class MetadataController {
  private metadataService: DocumentMetadataService;

  constructor() {
    this.metadataService = new DocumentMetadataService();
  }

  createMetadata = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const documentId = c.req.param("documentId");
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = DocumentMetadataCreateSchema.parse(body);
        const metadata = await this.metadataService.createMetadata(
          documentId,
          validatedData
        );
        return convertMetadataForResponse(metadata);
      },
      "Metadata created successfully",
      StatusCode.CREATED
    );
  };

  getDocumentMetadata = async (c: Context) => {
    const documentId = c.req.param("documentId");

    return handleAsyncOperation(c, async () => {
      const metadata = await this.metadataService.getDocumentMetadata(
        documentId
      );
      return metadata.map(convertMetadataForResponse);
    });
  };

  updateMetadata = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const metadataId = c.req.param("metadataId");
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = DocumentMetadataUpdateSchema.parse(body);
        const metadata = await this.metadataService.updateMetadata(
          metadataId,
          validatedData
        );

        if (!metadata) {
          throw new Error("Metadata not found"); // Auto-mapped to 404
        }

        return convertMetadataForResponse(metadata);
      },
      "Metadata updated successfully"
    );
  };

  deleteMetadata = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const metadataId = c.req.param("metadataId");

    return handleAsyncOperation(
      c,
      async () => {
        const deleted = await this.metadataService.deleteMetadata(metadataId);
        if (!deleted) {
          throw new Error("Metadata not found"); // Auto-mapped to 404
        }
        return { message: "Metadata deleted successfully" };
      },
      "Metadata deleted successfully"
    );
  };
}
