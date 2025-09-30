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
import { ZodError } from "zod";

export class MetadataController {
  private metadataService: DocumentMetadataService;

  constructor() {
    this.metadataService = new DocumentMetadataService();
  }

  createMetadata = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const documentId = c.req.param("documentId");
      const body = await c.req.json();

      // Validate input
      const validatedData = DocumentMetadataCreateSchema.parse(body);

      // Create metadata
      const metadata = await this.metadataService.createMetadata(
        documentId,
        validatedData
      );

      return c.json(
        {
          success: true,
          message: "Metadata created successfully",
          data: metadata,
        },
        201
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.issues,
          },
          400
        );
      }

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

  getDocumentMetadata = async (c: Context) => {
    try {
      const documentId = c.req.param("documentId");
      const metadata = await this.metadataService.getDocumentMetadata(
        documentId
      );

      return c.json({
        success: true,
        data: metadata,
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

  updateMetadata = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const metadataId = c.req.param("metadataId");
      const body = await c.req.json();

      // Validate input
      const validatedData = DocumentMetadataUpdateSchema.parse(body);

      // Update metadata
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

      return c.json({
        success: true,
        message: "Metadata updated successfully",
        data: metadata,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
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

  deleteMetadata = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

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

      return c.json({
        success: true,
        message: "Metadata deleted successfully",
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

export class PermissionController {
  private permissionService: DocumentPermissionService;

  constructor() {
    this.permissionService = new DocumentPermissionService();
  }

  grantPermission = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const documentId = c.req.param("documentId");
      const body = await c.req.json();

      // Validate input
      const validatedData = DocumentPermissionCreateSchema.parse(body);

      // Grant permission
      const permission = await this.permissionService.grantPermission(
        documentId,
        validatedData,
        user.userId
      );

      return c.json(
        {
          success: true,
          message: "Permission granted successfully",
          data: permission,
        },
        201
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.issues,
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        400
      );
    }
  };

  getDocumentPermissions = async (c: Context) => {
    try {
      const documentId = c.req.param("documentId");
      const permissions = await this.permissionService.getDocumentPermissions(
        documentId
      );

      return c.json({
        success: true,
        data: permissions,
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

  getUserPermissions = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const permissions = await this.permissionService.getUserPermissions(
        user.userId
      );

      return c.json({
        success: true,
        data: permissions,
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

  updatePermission = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

      const permissionId = c.req.param("permissionId");
      const body = await c.req.json();

      // Validate input
      const validatedData = DocumentPermissionUpdateSchema.parse(body);

      // Update permission
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

      return c.json({
        success: true,
        message: "Permission updated successfully",
        data: permission,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
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

  revokePermission = async (c: Context) => {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(
          { success: false, error: "Authentication required" },
          401
        );
      }

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

      return c.json({
        success: true,
        message: "Permission revoked successfully",
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
