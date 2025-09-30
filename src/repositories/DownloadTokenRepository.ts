import { eq, lt } from "drizzle-orm";
import { db } from "../models/database.js";
import { downloadTokens } from "../models/schema.js";
import type { IDownloadTokenRepository } from "../types/repositories.js";

export class DownloadTokenRepository implements IDownloadTokenRepository {
  async create(token: {
    id: string;
    documentId: string;
    token: string;
    expiresAt: Date;
    createdBy: string;
  }): Promise<void> {
    await db.insert(downloadTokens).values({
      ...token,
      createdAt: new Date(),
    });
  }

  async findByToken(token: string): Promise<{
    id: string;
    documentId: string;
    expiresAt: Date;
    usedAt?: Date;
  } | null> {
    const [result] = await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.token, token))
      .limit(1);

    if (!result) return null;

    return {
      id: result.id,
      documentId: result.documentId,
      expiresAt: result.expiresAt,
      usedAt: result.usedAt || undefined,
    };
  }

  async markAsUsed(id: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(downloadTokens)
        .set({ usedAt: new Date() })
        .where(eq(downloadTokens.id, id))
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

  async delete(id: string): Promise<boolean> {
    try {
      // Check if token exists first
      const existing = await db
        .select()
        .from(downloadTokens)
        .where(eq(downloadTokens.id, id))
        .limit(1);

      if (existing.length === 0) {
        return false;
      }

      await db.delete(downloadTokens).where(eq(downloadTokens.id, id));

      return true;
    } catch (error) {
      return false;
    }
  }
}
