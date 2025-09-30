import { eq, like, desc, asc, count } from "drizzle-orm";
import { db } from "../models/database.js";
import { documents } from "../models/schema.js";
import type {
  IDocumentRepository,
  PaginationOptions,
  DocumentSearchOptions,
} from "../types/repositories.js";
import type { Document, PaginatedResponse } from "../types/domain.js";
import {
  type DocumentId,
  type UserId,
  type FileName,
  type MimeType,
  type FileSize,
  type FilePath,
  createDocumentId,
  createFileName,
  createMimeType,
  createFileSize,
  createFilePath,
  createUserId,
} from "../types/branded.js";

export class DocumentRepository implements IDocumentRepository {
  async create(
    documentData: Omit<Document, "createdAt" | "updatedAt">
  ): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.mapToDocument(document);
  }

  async findById(id: DocumentId): Promise<Document | null> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id as string))
      .limit(1);

    return document ? this.mapToDocument(document) : null;
  }

  async findByUserId(
    userId: UserId,
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Document>> {
    const offset = (options.page - 1) * options.limit;

    // Get total count
    const totalResults = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.uploadedBy, userId as string));

    const total = totalResults[0]?.count || 0;

    // Get documents
    const documentList = await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedBy, userId as string))
      .orderBy(desc(documents.createdAt))
      .limit(options.limit)
      .offset(offset);

    const data = documentList.map((doc) => this.mapToDocument(doc));

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async search(
    options: DocumentSearchOptions
  ): Promise<PaginatedResponse<Document>> {
    const offset = (options.page - 1) * options.limit;

    // Build base query
    let whereClause = undefined;

    // Simple filtering for now - we'll enhance this later with joins
    if (options.filename) {
      whereClause = like(documents.filename, `%${options.filename}%`);
    } else if (options.mimeType) {
      whereClause = eq(documents.mimeType, options.mimeType);
    } else if (options.uploadedBy) {
      whereClause = eq(documents.uploadedBy, options.uploadedBy as string);
    }

    // Get total count
    const totalResults = await db
      .select({ count: count() })
      .from(documents)
      .where(whereClause);

    const total = totalResults[0]?.count || 0;

    // Get documents with sorting
    const sortColumn =
      options.sortBy === "filename"
        ? documents.filename
        : options.sortBy === "size"
        ? documents.size
        : documents.createdAt;

    const sortOrder = options.sortOrder === "asc" ? asc : desc;

    const documentList = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(options.limit)
      .offset(offset);

    const data = documentList.map((doc) => this.mapToDocument(doc));

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async update(
    id: DocumentId,
    updates: Partial<Omit<Document, "id" | "createdAt">>
  ): Promise<Document | null> {
    const [document] = await db
      .update(documents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id as string))
      .returning();

    return document ? this.mapToDocument(document) : null;
  }

  async delete(id: DocumentId): Promise<boolean> {
    try {
      await db.delete(documents).where(eq(documents.id, id as string));

      // Check if document still exists to determine if deletion was successful
      const deletedDoc = await this.findById(id);
      return deletedDoc === null;
    } catch (error) {
      return false;
    }
  }

  private mapToDocument(dbDocument: any): Document {
    return {
      id: createDocumentId(dbDocument.id),
      filename: createFileName(dbDocument.filename),
      originalName: createFileName(
        dbDocument.originalName || dbDocument.original_name
      ),
      mimeType: createMimeType(dbDocument.mimeType || dbDocument.mime_type),
      size: createFileSize(dbDocument.size),
      path: createFilePath(dbDocument.path),
      uploadedBy: createUserId(dbDocument.uploadedBy || dbDocument.uploaded_by),
      createdAt: new Date(dbDocument.createdAt * 1000),
      updatedAt: new Date(dbDocument.updatedAt * 1000),
    };
  }
}
