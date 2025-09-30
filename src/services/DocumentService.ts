import { promises as fs } from "fs";
import { join, extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";
import {
  DocumentRepository,
  DocumentMetadataRepository,
  DocumentTagRepository,
} from "../repositories/index.js";
import type { Document } from "../types/domain.js";
import type {
  DocumentUploadRequest,
  DocumentSearchRequest,
} from "../types/dto.js";

export interface FileUpload {
  filename: string;
  data: ArrayBuffer;
  size: number;
  type: string;
}

export class DocumentService {
  private documentRepository: DocumentRepository;
  private metadataRepository: DocumentMetadataRepository;
  private tagRepository: DocumentTagRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.metadataRepository = new DocumentMetadataRepository();
    this.tagRepository = new DocumentTagRepository();
  }

  async uploadDocument(
    file: FileUpload,
    uploadData: DocumentUploadRequest,
    uploadedBy: string
  ): Promise<Document> {
    // Validate file size
    if (file.size > parseInt(config.UPLOAD_MAX_SIZE)) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.UPLOAD_MAX_SIZE} bytes`
      );
    }

    // Generate unique filename
    const fileExtension = extname(file.filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = join(config.UPLOAD_DIR, uniqueFilename);

    try {
      // Ensure upload directory exists
      await fs.mkdir(config.UPLOAD_DIR, { recursive: true });

      // Save file to disk
      await fs.writeFile(filePath, new Uint8Array(file.data));

      // Create document record
      const document = await this.documentRepository.create({
        id: uuidv4(),
        filename: uniqueFilename,
        originalName: file.filename,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        uploadedBy,
      });

      // Add metadata if provided
      if (uploadData.metadata && Object.keys(uploadData.metadata).length > 0) {
        for (const [key, value] of Object.entries(uploadData.metadata)) {
          await this.metadataRepository.create({
            id: uuidv4(),
            documentId: document.id,
            key,
            value,
          });
        }
      }

      // Add tags if provided
      if (uploadData.tags && uploadData.tags.length > 0) {
        for (const tag of uploadData.tags) {
          await this.tagRepository.create({
            id: uuidv4(),
            documentId: document.id,
            tag: tag.toLowerCase().trim(),
          });
        }
      }

      return document;
    } catch (error) {
      // Clean up file if document creation failed
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error("Failed to cleanup file after error:", cleanupError);
      }
      throw error;
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documentRepository.findById(id);
  }

  async getUserDocuments(userId: string, page: number = 1, limit: number = 20) {
    return this.documentRepository.findByUserId(userId, { page, limit });
  }

  async searchDocuments(searchOptions: DocumentSearchRequest) {
    return this.documentRepository.search(searchOptions);
  }

  async getDocumentWithMetadata(documentId: string) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      return null;
    }

    const [metadata, tags] = await Promise.all([
      this.metadataRepository.findByDocumentId(documentId),
      this.tagRepository.findByDocumentId(documentId),
    ]);

    return {
      ...document,
      metadata: metadata.reduce((acc, meta) => {
        acc[meta.key] = meta.value;
        return acc;
      }, {} as Record<string, string>),
      tags: tags.map((tag) => tag.tag),
    };
  }

  async updateDocument(
    id: string,
    updates: Partial<Pick<Document, "originalName">>
  ) {
    return this.documentRepository.update(id, updates);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      return false;
    }

    try {
      // Delete file from filesystem
      await fs.unlink(document.path);
    } catch (error) {
      console.error("Failed to delete file from filesystem:", error);
      // Continue with database cleanup even if file deletion fails
    }

    // Delete from database (cascade will handle metadata, tags, permissions)
    return this.documentRepository.delete(id);
  }

  async getFileData(document: Document): Promise<Buffer> {
    return fs.readFile(document.path);
  }
}
