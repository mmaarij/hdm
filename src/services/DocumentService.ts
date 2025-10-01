import { promises as fs } from "fs";
import { join, extname, dirname } from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env";
import {
  DocumentRepository,
  DocumentMetadataRepository,
  DocumentTagRepository,
} from "../repositories/index";
import type { Document } from "../types/domain";
import type {
  DocumentUploadRequest,
  DocumentSearchRequest,
} from "../types/dto";
import type {
  DocumentId,
  UserId,
  MetadataId,
  TagId,
  FileName,
  MimeType,
  FileSize,
  FilePath,
} from "../types/branded.js";
import {
  createDocumentId,
  createUserId,
  createMetadataId,
  createTagId,
  createFileName,
  createMimeType,
  createFileSize,
  createFilePath,
} from "../types/branded.js";

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
    if (file.size > parseInt(config.UPLOAD_MAX_SIZE)) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.UPLOAD_MAX_SIZE} bytes`
      );
    }

    const fileExtension = extname(file.filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = join(config.UPLOAD_DIR, uniqueFilename);

    try {
      await fs.mkdir(dirname(filePath), { recursive: true });

      await fs.writeFile(filePath, new Uint8Array(file.data));

      const document = await this.documentRepository.create({
        id: createDocumentId(uuidv4()),
        filename: createFileName(uniqueFilename),
        originalName: createFileName(file.filename),
        mimeType: createMimeType(file.type),
        size: createFileSize(file.size),
        path: createFilePath(filePath),
        uploadedBy: createUserId(uploadedBy),
      });

      // Add metadata if provided
      if (uploadData.metadata && Object.keys(uploadData.metadata).length > 0) {
        for (const [key, value] of Object.entries(uploadData.metadata)) {
          await this.metadataRepository.create({
            id: createMetadataId(uuidv4()),
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
            id: createTagId(uuidv4()),
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
    try {
      const documentId = createDocumentId(id);
      return this.documentRepository.findById(documentId);
    } catch (error) {
      return null;
    }
  }

  async getUserDocuments(userId: string, page: number = 1, limit: number = 20) {
    try {
      const userIdBranded = createUserId(userId);
      return this.documentRepository.findByUserId(userIdBranded, {
        page,
        limit,
      });
    } catch (error) {
      throw new Error("Invalid user ID format");
    }
  }

  async searchDocuments(searchOptions: DocumentSearchRequest) {
    const processedOptions = {
      ...searchOptions,
      uploadedBy: searchOptions.uploadedBy
        ? createUserId(searchOptions.uploadedBy)
        : undefined,
    };
    return this.documentRepository.search(processedOptions);
  }

  async getDocumentWithMetadata(documentId: string) {
    try {
      const docId = createDocumentId(documentId);
      const document = await this.documentRepository.findById(docId);
      if (!document) {
        return null;
      }

      const [metadata, tags] = await Promise.all([
        this.metadataRepository.findByDocumentId(docId),
        this.tagRepository.findByDocumentId(docId),
      ]);

      return {
        ...document,
        metadata: metadata.reduce((acc, meta) => {
          acc[meta.key] = meta.value;
          return acc;
        }, {} as Record<string, string>),
        tags: tags.map((tag) => tag.tag),
      };
    } catch (error) {
      return null;
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<Pick<Document, "originalName">>
  ) {
    try {
      const documentId = createDocumentId(id);
      return this.documentRepository.update(documentId, updates);
    } catch (error) {
      return null;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const documentId = createDocumentId(id);
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        return false;
      }

      try {
        // Delete file from filesystem
        await fs.unlink(document.path as string);
      } catch (error) {
        console.error("Failed to delete file from filesystem:", error);
        // Continue with database cleanup even if file deletion fails
      }

      // Delete from database (cascade will handle metadata, tags, permissions)
      return this.documentRepository.delete(documentId);
    } catch (error) {
      return false;
    }
  }

  async getFileData(document: Document): Promise<Buffer> {
    return fs.readFile(document.path);
  }
}
