import type { Context } from "hono";
import { DocumentPermissionService } from "../services/PermissionService";
import { StatusCode } from "../types/statusCodes";
import {
  DocumentPermissionCreateSchema,
  DocumentPermissionUpdateSchema,
} from "../types/dto";
import {
  handleControllerError,
  convertPermissionForResponse,
  createSuccessResponse,
  createSuccessResponseWithoutData,
  createErrorResponse,
  requireAuthenticatedUser,
} from "../utils/responseHelpers";

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
        StatusCode.CREATED as any
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
        return createErrorResponse(
          c,
          "Permission not found",
          StatusCode.NOT_FOUND
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
        return createErrorResponse(
          c,
          "Permission not found",
          StatusCode.NOT_FOUND
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
