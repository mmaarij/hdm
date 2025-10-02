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
} from "../utils/responseHelpers";

export class MetadataController {
  private metadataService: DocumentMetadataService;

  constructor() {
    this.metadataService = new DocumentMetadataService();
  }

  createMetadata = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const documentId = c.req.param("documentId");
      const body = await c.req.json();
      const validatedData = DocumentMetadataCreateSchema.parse(body);

      const metadata = await this.metadataService.createMetadata(
        documentId,
        validatedData
      );

      return c.json(
        createSuccessResponse(
          convertMetadataForResponse(metadata),
          "Metadata created successfully"
        ),
        StatusCode.CREATED as any
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  getDocumentMetadata = async (c: Context) => {
    try {
      const documentId = c.req.param("documentId");
      const metadata = await this.metadataService.getDocumentMetadata(
        documentId
      );

      return c.json(
        createSuccessResponse(metadata.map(convertMetadataForResponse))
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  updateMetadata = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const metadataId = c.req.param("metadataId");
      const body = await c.req.json();
      const validatedData = DocumentMetadataUpdateSchema.parse(body);

      const metadata = await this.metadataService.updateMetadata(
        metadataId,
        validatedData
      );

      if (!metadata) {
        return createErrorResponse(
          c,
          "Metadata not found",
          StatusCode.NOT_FOUND
        );
      }

      return c.json(
        createSuccessResponse(
          convertMetadataForResponse(metadata),
          "Metadata updated successfully"
        )
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  deleteMetadata = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const metadataId = c.req.param("metadataId");
      const deleted = await this.metadataService.deleteMetadata(metadataId);

      if (!deleted) {
        return createErrorResponse(
          c,
          "Metadata not found",
          StatusCode.NOT_FOUND
        );
      }

      return c.json(
        createSuccessResponseWithoutData("Metadata deleted successfully")
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
