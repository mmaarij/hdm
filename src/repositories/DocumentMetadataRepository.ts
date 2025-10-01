import { eq } from "drizzle-orm";
import { db } from "../models/database.js";
import { documentMetadata } from "../models/schema.js";
import type { IDocumentMetadataRepository } from "../types/repositories.js";
import type { DocumentMetadata } from "../types/domain.js";
import {
  createDocumentId,
  createMetadataId,
  type DocumentId,
  type MetadataId,
} from "../types/branded.js";

export class DocumentMetadataRepository implements IDocumentMetadataRepository {
  async create(
    metadata: Omit<DocumentMetadata, "createdAt">
  ): Promise<DocumentMetadata> {
    const [result] = await db
      .insert(documentMetadata)
      .values({
        ...metadata,
        createdAt: new Date(),
      })
      .returning();

    return this.mapToMetadata(result);
  }

  async findByDocumentId(documentId: DocumentId): Promise<DocumentMetadata[]> {
    const results = await db
      .select()
      .from(documentMetadata)
      .where(eq(documentMetadata.documentId, documentId as string));

    return results.map((result) => this.mapToMetadata(result));
  }

  async update(
    id: MetadataId,
    updates: { value: string }
  ): Promise<DocumentMetadata | null> {
    const [result] = await db
      .update(documentMetadata)
      .set({ value: updates.value })
      .where(eq(documentMetadata.id, id as string))
      .returning();

    return result ? this.mapToMetadata(result) : null;
  }

  async delete(id: MetadataId): Promise<boolean> {
    try {
      const existing = await db.query.documentMetadata.findFirst({
        where: eq(documentMetadata.id, id as string),
      });

      if (!existing) {
        return false;
      }

      await db
        .delete(documentMetadata)
        .where(eq(documentMetadata.id, id as string));

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteByDocumentId(documentId: DocumentId): Promise<number> {
    try {
      const result = await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.documentId, documentId as string));

      const count = result.length;

      await db
        .delete(documentMetadata)
        .where(eq(documentMetadata.documentId, documentId as string));

      return count;
    } catch (error) {
      return 0;
    }
  }

  private mapToMetadata(dbMetadata: any): DocumentMetadata {
    return {
      id: createMetadataId(dbMetadata.id),
      documentId: createDocumentId(
        dbMetadata.documentId || dbMetadata.document_id
      ),
      key: dbMetadata.key,
      value: dbMetadata.value,
      createdAt: new Date(dbMetadata.createdAt * 1000),
    };
  }
}
