import { v4 as uuidv4 } from "uuid";
import { DocumentMetadataRepository } from "../repositories/index";
import type { DocumentMetadata } from "../types/domain";
import type {
  DocumentMetadataCreateRequest,
  DocumentMetadataUpdateRequest,
} from "../types/dto";
import { createDocumentId, createMetadataId } from "../types/branded";

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
