import { eq, like, desc, asc, count, and, or, inArray } from "drizzle-orm";
import { db } from "../models/database";
import { documents, documentMetadata, documentTags } from "../models/schema";
import type {
  IDocumentRepository,
  PaginationOptions,
  DocumentSearchOptions,
} from "../types/repositories";
import type { Document, PaginatedResponse } from "../types/domain";
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

    // Check if we have any actual meaningful search criteria (excluding pagination, sorting, and user scope)
    // Note: uploadedBy is a scope filter, not a search criterion
    const hasSearchCriteria = !!(
      (options.filename && options.filename.trim().length >= 2) ||
      (options.mimeType && options.mimeType.trim().length > 0) ||
      (options.tags &&
        options.tags.length > 0 &&
        options.tags.some((tag) => tag.trim().length >= 2)) ||
      (options.metadata &&
        Object.keys(options.metadata).length > 0 &&
        Object.entries(options.metadata).some(
          ([key, value]) => key.trim().length > 0 && value.trim().length >= 2
        ))
    );

    // If no meaningful search criteria provided, return empty results
    if (!hasSearchCriteria) {
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Build where conditions array
    const conditions = [];

    // Filename search (case-insensitive partial match) - minimum 2 characters
    if (options.filename && options.filename.trim().length >= 2) {
      const searchTerm = options.filename.trim().toLowerCase();
      conditions.push(
        or(
          like(documents.filename, `%${searchTerm}%`),
          like(documents.originalName, `%${searchTerm}%`)
        )
      );
    }

    // Exact MIME type match
    if (options.mimeType) {
      conditions.push(eq(documents.mimeType, options.mimeType));
    }

    // Uploaded by user filter
    if (options.uploadedBy) {
      conditions.push(eq(documents.uploadedBy, options.uploadedBy as string));
    }

    // Build main where clause
    const mainWhereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Handle tag and metadata searches with subqueries
    let documentIdsFromTags: string[] | null = null;
    let documentIdsFromMetadata: string[] | null = null;

    // Search by tags if provided - filter meaningful tags
    if (options.tags && options.tags.length > 0) {
      const meaningfulTags = options.tags
        .map((tag) => tag.toLowerCase().trim())
        .filter((tag) => tag.length >= 2);

      if (meaningfulTags.length === 0) {
        documentIdsFromTags = [];
      } else {
        const tagResults = await db
          .selectDistinct({ documentId: documentTags.documentId })
          .from(documentTags)
          .where(inArray(documentTags.tag, meaningfulTags));

        documentIdsFromTags = tagResults.map((r) => r.documentId);
      }

      // If searching by tags but no documents found with those tags, return empty
      if (documentIdsFromTags !== null && documentIdsFromTags.length === 0) {
        return {
          data: [],
          pagination: {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    // Search by metadata if provided - filter meaningful search terms
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      const meaningfulMetadata = Object.entries(options.metadata).filter(
        ([key, value]) => key.trim().length > 0 && value.trim().length >= 2
      );

      if (meaningfulMetadata.length === 0) {
        documentIdsFromMetadata = [];
      } else {
        const metadataConditions = meaningfulMetadata.map(([key, value]) =>
          and(
            eq(documentMetadata.key, key.trim()),
            like(documentMetadata.value, `%${value.trim()}%`)
          )
        );

        const metadataResults = await db
          .selectDistinct({ documentId: documentMetadata.documentId })
          .from(documentMetadata)
          .where(or(...metadataConditions));

        documentIdsFromMetadata = metadataResults.map((r) => r.documentId);
      }

      // If searching by metadata but no documents found, return empty
      if (
        documentIdsFromMetadata !== null &&
        documentIdsFromMetadata.length === 0
      ) {
        return {
          data: [],
          pagination: {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    // Combine document ID filters from tags and metadata
    const additionalIdConditions = [];
    if (documentIdsFromTags !== null) {
      if (documentIdsFromTags.length > 0) {
        additionalIdConditions.push(inArray(documents.id, documentIdsFromTags));
      }
    }
    if (documentIdsFromMetadata !== null) {
      if (documentIdsFromMetadata.length > 0) {
        additionalIdConditions.push(
          inArray(documents.id, documentIdsFromMetadata)
        );
      }
    }

    // Combine all conditions
    const allConditions = [];
    if (mainWhereClause) allConditions.push(mainWhereClause);
    if (additionalIdConditions.length > 0) {
      allConditions.push(and(...additionalIdConditions));
    }

    const finalWhereClause =
      allConditions.length > 0 ? and(...allConditions) : undefined;

    // Get total count
    const totalResults = await db
      .select({ count: count() })
      .from(documents)
      .where(finalWhereClause);

    const total = totalResults[0]?.count || 0;

    // If no results found, return empty
    if (total === 0) {
      return {
        data: [],
        pagination: {
          page: options.page,
          limit: options.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

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
      .where(finalWhereClause)
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
