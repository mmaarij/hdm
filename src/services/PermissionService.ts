import { v4 as uuidv4 } from "uuid";
import { DocumentPermissionRepository } from "../repositories/index";
import type { DocumentPermission } from "../types/domain";
import { UserRole } from "../types/domain";
import type {
  DocumentPermissionCreateRequest,
  DocumentPermissionUpdateRequest,
} from "../types/dto";
import {
  createDocumentId,
  createPermissionId,
  createUserId,
} from "../types/branded";

export class DocumentPermissionService {
  private permissionRepository: DocumentPermissionRepository;

  constructor() {
    this.permissionRepository = new DocumentPermissionRepository();
  }

  async grantPermission(
    documentId: string,
    data: DocumentPermissionCreateRequest,
    grantedBy: string
  ): Promise<DocumentPermission> {
    // Check if permission already exists
    const existing = await this.permissionRepository.findByDocumentAndUser(
      createDocumentId(documentId),
      createUserId(data.userId)
    );
    if (existing) {
      throw new Error("Permission already exists for this user and document");
    }

    return this.permissionRepository.create({
      id: createPermissionId(uuidv4()),
      documentId: createDocumentId(documentId),
      userId: createUserId(data.userId),
      permission: data.permission,
      grantedBy: createUserId(grantedBy),
    });
  }

  async getDocumentPermissions(
    documentId: string
  ): Promise<DocumentPermission[]> {
    return this.permissionRepository.findByDocumentId(
      createDocumentId(documentId)
    );
  }

  async getUserPermissions(userId: string): Promise<DocumentPermission[]> {
    return this.permissionRepository.findByUserId(createUserId(userId));
  }

  async updatePermission(
    id: string,
    data: DocumentPermissionUpdateRequest
  ): Promise<DocumentPermission | null> {
    return this.permissionRepository.update(createPermissionId(id), {
      permission: data.permission,
    });
  }

  async revokePermission(id: string): Promise<boolean> {
    return this.permissionRepository.delete(createPermissionId(id));
  }

  async revokeDocumentPermissions(documentId: string): Promise<number> {
    return this.permissionRepository.deleteByDocumentId(
      createDocumentId(documentId)
    );
  }

  async checkPermission(
    documentId: string,
    userId: string
  ): Promise<DocumentPermission | null> {
    return this.permissionRepository.findByDocumentAndUser(
      createDocumentId(documentId),
      createUserId(userId)
    );
  }

  async checkDocumentAccess(
    userId: string,
    userRole: UserRole,
    document: { id: string; uploadedBy: string }
  ): Promise<boolean> {
    // Admin users can access any document
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Document owner can access their own documents
    if (document.uploadedBy === userId) {
      return true;
    }

    // Check if user has explicit permission to access this document
    try {
      const permissions = await this.getDocumentPermissions(document.id);

      // User has access if they have any permission (read, write, delete, admin)
      return permissions.some((permission) => permission.userId === userId);
    } catch (error) {
      // If there's an error checking permissions, deny access for security
      return false;
    }
  }
}
