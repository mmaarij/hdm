import { eq, lt } from "drizzle-orm";
import { db } from "../models/database.js";
import { downloadTokens } from "../models/schema.js";
import type { IDownloadTokenRepository } from "../types/repositories.js";
import {
  type TokenId,
  type DocumentId,
  type DownloadToken,
  type UserId,
  createTokenId,
  createDocumentId,
} from "../types/branded.js";

export class DownloadTokenRepository implements IDownloadTokenRepository {
  async create(token: {
    id: TokenId;
    documentId: DocumentId;
    token: DownloadToken;
    expiresAt: Date;
    createdBy: UserId;
  }): Promise<void> {
    await db.insert(downloadTokens).values({
      id: token.id as string,
      documentId: token.documentId as string,
      token: token.token as string,
      expiresAt: token.expiresAt,
      createdBy: token.createdBy as string,
      createdAt: new Date(),
    });
  }

  async findByToken(token: DownloadToken): Promise<{
    id: TokenId;
    documentId: DocumentId;
    expiresAt: Date;
    usedAt?: Date;
  } | null> {
    const [result] = await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.token, token as string))
      .limit(1);

    if (!result) return null;

    return {
      id: createTokenId(result.id),
      documentId: createDocumentId(result.documentId),
      expiresAt: result.expiresAt,
      usedAt: result.usedAt || undefined,
    };
  }

  async markAsUsed(id: TokenId): Promise<boolean> {
    try {
      const [result] = await db
        .update(downloadTokens)
        .set({ usedAt: new Date() })
        .where(eq(downloadTokens.id, id as string))
        .returning();

      return !!result;
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<number> {
    try {
      // Get expired tokens first
      const now = new Date();
      const expiredTokens = await db
        .select()
        .from(downloadTokens)
        .where(lt(downloadTokens.expiresAt, now));

      const count = expiredTokens.length;

      // Remove expired tokens
      await db.delete(downloadTokens).where(lt(downloadTokens.expiresAt, now));

      return count;
    } catch (error) {
      return 0;
    }
  }

  async delete(id: TokenId): Promise<boolean> {
    try {
      // Check if token exists first
      const existing = await db
        .select()
        .from(downloadTokens)
        .where(eq(downloadTokens.id, id as string))
        .limit(1);

      if (existing.length === 0) {
        return false;
      }

      await db
        .delete(downloadTokens)
        .where(eq(downloadTokens.id, id as string));

      return true;
    } catch (error) {
      return false;
    }
  }
}
