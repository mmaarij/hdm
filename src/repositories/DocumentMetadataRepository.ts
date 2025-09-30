import { eq } from "drizzle-orm";
import { db } from "../models/database.js";
import { documentMetadata } from "../models/schema.js";
import type { IDocumentMetadataRepository } from "../types/repositories.js";
import type { DocumentMetadata } from "../types/domain.js";

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

  async findByDocumentId(documentId: string): Promise<DocumentMetadata[]> {
    const results = await db
      .select()
      .from(documentMetadata)
      .where(eq(documentMetadata.documentId, documentId));

    return results.map((result) => this.mapToMetadata(result));
  }

  async update(
    id: string,
    updates: { value: string }
  ): Promise<DocumentMetadata | null> {
    const [result] = await db
      .update(documentMetadata)
      .set({ value: updates.value })
      .where(eq(documentMetadata.id, id))
      .returning();

    return result ? this.mapToMetadata(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Get the metadata first to check if it exists
      const existingMetadata = await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.id, id))
        .limit(1);

      if (existingMetadata.length === 0) {
        return false;
      }

      await db.delete(documentMetadata).where(eq(documentMetadata.id, id));

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    try {
      // Get count of metadata items before deletion
      const existingMetadata = await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.documentId, documentId));

      const count = existingMetadata.length;

      await db
        .delete(documentMetadata)
        .where(eq(documentMetadata.documentId, documentId));

      return count;
    } catch (error) {
      return 0;
    }
  }

  private mapToMetadata(dbMetadata: any): DocumentMetadata {
    return {
      id: dbMetadata.id,
      documentId: dbMetadata.documentId || dbMetadata.document_id,
      key: dbMetadata.key,
      value: dbMetadata.value,
      createdAt: new Date(dbMetadata.createdAt * 1000),
    };
  }
}
