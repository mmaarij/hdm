import { eq, like, count, desc } from "drizzle-orm";
import { db } from "../models/database.js";
import { documentTags } from "../models/schema.js";
import type {
  IDocumentTagRepository,
  PaginationOptions,
} from "../types/repositories.js";
import type { DocumentTag, PaginatedResponse } from "../types/domain.js";

export class DocumentTagRepository implements IDocumentTagRepository {
  async create(tag: Omit<DocumentTag, "createdAt">): Promise<DocumentTag> {
    const [result] = await db
      .insert(documentTags)
      .values({
        ...tag,
        createdAt: new Date(),
      })
      .returning();

    return this.mapToTag(result);
  }

  async findByDocumentId(documentId: string): Promise<DocumentTag[]> {
    const results = await db
      .select()
      .from(documentTags)
      .where(eq(documentTags.documentId, documentId));

    return results.map((result) => this.mapToTag(result));
  }

  async findByTag(
    tag: string,
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<DocumentTag>> {
    const offset = (options.page - 1) * options.limit;

    // Get total count
    const totalResults = await db
      .select({ count: count() })
      .from(documentTags)
      .where(like(documentTags.tag, `%${tag}%`));

    const total = totalResults[0]?.count || 0;

    // Get tags
    const tagList = await db
      .select()
      .from(documentTags)
      .where(like(documentTags.tag, `%${tag}%`))
      .orderBy(desc(documentTags.createdAt))
      .limit(options.limit)
      .offset(offset);

    const data = tagList.map((tag) => this.mapToTag(tag));

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

  async delete(id: string): Promise<boolean> {
    try {
      const existingTag = await db
        .select()
        .from(documentTags)
        .where(eq(documentTags.id, id))
        .limit(1);

      if (existingTag.length === 0) {
        return false;
      }

      await db.delete(documentTags).where(eq(documentTags.id, id));

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    try {
      const existingTags = await db
        .select()
        .from(documentTags)
        .where(eq(documentTags.documentId, documentId));

      const count = existingTags.length;

      await db
        .delete(documentTags)
        .where(eq(documentTags.documentId, documentId));

      return count;
    } catch (error) {
      return 0;
    }
  }

  private mapToTag(dbTag: any): DocumentTag {
    return {
      id: dbTag.id,
      documentId: dbTag.documentId || dbTag.document_id,
      tag: dbTag.tag,
      createdAt: new Date(dbTag.createdAt * 1000),
    };
  }
}
