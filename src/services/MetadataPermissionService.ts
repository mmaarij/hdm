import { v4 as uuidv4 } from "uuid";
import {
  DocumentMetadataRepository,
  DocumentPermissionRepository,
} from "../repositories/index.js";
import type { DocumentMetadata, DocumentPermission } from "../types/domain.js";
import type {
  DocumentMetadataCreateRequest,
  DocumentMetadataUpdateRequest,
  DocumentPermissionCreateRequest,
  DocumentPermissionUpdateRequest,
} from "../types/dto.js";
import {
  createDocumentId,
  createMetadataId,
  createPermissionId,
  createUserId,
} from "../types/branded.js";

export class DocumentMetadataService {
  private metadataRepository: DocumentMetadataRepository;

  constructor() {
    this.metadataRepository = new DocumentMetadataRepository();
  }

  async createMetadata(
    documentId: string,
    data: DocumentMetadataCreateRequest
  ): Promise<DocumentMetadata> {
    return this.metadataRepository.create({
      id: createMetadataId(uuidv4()),
      documentId: createDocumentId(documentId),
      key: data.key,
      value: data.value,
    });
  }

  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata[]> {
    return this.metadataRepository.findByDocumentId(
      createDocumentId(documentId)
    );
  }

  async updateMetadata(
    id: string,
    data: DocumentMetadataUpdateRequest
  ): Promise<DocumentMetadata | null> {
    return this.metadataRepository.update(createMetadataId(id), data);
  }

  async deleteMetadata(id: string): Promise<boolean> {
    return this.metadataRepository.delete(createMetadataId(id));
  }

  async deleteDocumentMetadata(documentId: string): Promise<number> {
    return this.metadataRepository.deleteByDocumentId(
      createDocumentId(documentId)
    );
  }
}

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
}
