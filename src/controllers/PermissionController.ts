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
  handleAsyncOperation,
} from "../utils/responseHelpers";

export class PermissionController {
  private permissionService: DocumentPermissionService;

  constructor() {
    this.permissionService = new DocumentPermissionService();
  }

  grantPermission = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");
    const documentId = c.req.param("documentId");
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = DocumentPermissionCreateSchema.parse(body);
        const permission = await this.permissionService.grantPermission(
          documentId,
          validatedData,
          user.userId
        );
        return convertPermissionForResponse(permission);
      },
      "Permission granted successfully",
      StatusCode.CREATED
    );
  };

  getDocumentPermissions = async (c: Context) => {
    const documentId = c.req.param("documentId");

    return handleAsyncOperation(c, async () => {
      const permissions = await this.permissionService.getDocumentPermissions(
        documentId
      );
      return permissions;
    });
  };

  getUserPermissions = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const user = c.get("user");

    return handleAsyncOperation(c, async () => {
      const permissions = await this.permissionService.getUserPermissions(
        user.userId
      );
      return permissions;
    });
  };

  updatePermission = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const permissionId = c.req.param("permissionId");
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = DocumentPermissionUpdateSchema.parse(body);
        const permission = await this.permissionService.updatePermission(
          permissionId,
          validatedData
        );

        if (!permission) {
          throw new Error("Permission not found"); // Auto-mapped to 404
        }

        return convertPermissionForResponse(permission);
      },
      "Permission updated successfully"
    );
  };

  revokePermission = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const permissionId = c.req.param("permissionId");

    return handleAsyncOperation(
      c,
      async () => {
        const revoked = await this.permissionService.revokePermission(
          permissionId
        );

        if (!revoked) {
          throw new Error("Permission not found"); // Auto-mapped to 404
        }

        return { message: "Permission revoked successfully" };
      },
      "Permission revoked successfully"
    );
  };
}
