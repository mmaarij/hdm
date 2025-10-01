import type { Context } from "hono";
import {
  DocumentMetadataService,
  DocumentPermissionService,
} from "../services/MetadataPermissionService.js";
import {
  DocumentMetadataCreateSchema,
  DocumentMetadataUpdateSchema,
  DocumentPermissionCreateSchema,
  DocumentPermissionUpdateSchema,
} from "../types/dto.js";
import {
  handleControllerError,
  convertMetadataForResponse,
  convertPermissionForResponse,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  requireAuthenticatedUser,
} from "../utils/responseHelpers.js";

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
        201
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
        return c.json(
          {
            success: false,
            error: "Metadata not found",
          },
          404
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
        return c.json(
          {
            success: false,
            error: "Metadata not found",
          },
          404
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

export class PermissionController {
  private permissionService: DocumentPermissionService;

  constructor() {
    this.permissionService = new DocumentPermissionService();
  }

  grantPermission = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const documentId = c.req.param("documentId");
      const body = await c.req.json();
      const validatedData = DocumentPermissionCreateSchema.parse(body);

      const permission = await this.permissionService.grantPermission(
        documentId,
        validatedData,
        user.userId
      );

      return c.json(
        createSuccessResponse(
          convertPermissionForResponse(permission),
          "Permission granted successfully"
        ),
        201
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  getDocumentPermissions = async (c: Context) => {
    try {
      const documentId = c.req.param("documentId");
      const permissions = await this.permissionService.getDocumentPermissions(
        documentId
      );

      return c.json(createSuccessResponse(permissions));
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  getUserPermissions = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const user = c.get("user");
      const permissions = await this.permissionService.getUserPermissions(
        user.userId
      );

      return c.json(createSuccessResponse(permissions));
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  updatePermission = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const permissionId = c.req.param("permissionId");
      const body = await c.req.json();
      const validatedData = DocumentPermissionUpdateSchema.parse(body);

      const permission = await this.permissionService.updatePermission(
        permissionId,
        validatedData
      );

      if (!permission) {
        return c.json(
          {
            success: false,
            error: "Permission not found",
          },
          404
        );
      }

      return c.json(
        createSuccessResponse(
          convertPermissionForResponse(permission),
          "Permission updated successfully"
        )
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  revokePermission = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const permissionId = c.req.param("permissionId");
      const revoked = await this.permissionService.revokePermission(
        permissionId
      );

      if (!revoked) {
        return c.json(
          {
            success: false,
            error: "Permission not found",
          },
          404
        );
      }

      return c.json(
        createSuccessResponseWithoutData("Permission revoked successfully")
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
