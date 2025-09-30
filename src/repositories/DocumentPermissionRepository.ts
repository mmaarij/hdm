import { eq, and } from "drizzle-orm";
import { db } from "../models/database.js";
import { documentPermissions } from "../models/schema.js";
import type { IDocumentPermissionRepository } from "../types/repositories.js";
import type { DocumentPermission } from "../types/domain.js";

export class DocumentPermissionRepository
  implements IDocumentPermissionRepository
{
  async create(
    permission: Omit<DocumentPermission, "grantedAt">
  ): Promise<DocumentPermission> {
    const [result] = await db
      .insert(documentPermissions)
      .values({
        ...permission,
        grantedAt: new Date(),
      })
      .returning();

    return this.mapToPermission(result);
  }

  async findByDocumentId(documentId: string): Promise<DocumentPermission[]> {
    const results = await db
      .select()
      .from(documentPermissions)
      .where(eq(documentPermissions.documentId, documentId));

    return results.map((result) => this.mapToPermission(result));
  }

  async findByUserId(userId: string): Promise<DocumentPermission[]> {
    const results = await db
      .select()
      .from(documentPermissions)
      .where(eq(documentPermissions.userId, userId));

    return results.map((result) => this.mapToPermission(result));
  }

  async findByDocumentAndUser(
    documentId: string,
    userId: string
  ): Promise<DocumentPermission | null> {
    const [result] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId),
          eq(documentPermissions.userId, userId)
        )
      )
      .limit(1);

    return result ? this.mapToPermission(result) : null;
  }

  async update(
    id: string,
    updates: { permission: string }
  ): Promise<DocumentPermission | null> {
    const [result] = await db
      .update(documentPermissions)
      .set({
        permission: updates.permission as "read" | "write" | "delete" | "admin",
      })
      .where(eq(documentPermissions.id, id))
      .returning();

    return result ? this.mapToPermission(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const existingPermission = await db
        .select()
        .from(documentPermissions)
        .where(eq(documentPermissions.id, id))
        .limit(1);

      if (existingPermission.length === 0) {
        return false;
      }

      await db
        .delete(documentPermissions)
        .where(eq(documentPermissions.id, id));

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteByDocumentId(documentId: string): Promise<number> {
    try {
      const existingPermissions = await db
        .select()
        .from(documentPermissions)
        .where(eq(documentPermissions.documentId, documentId));

      const count = existingPermissions.length;

      await db
        .delete(documentPermissions)
        .where(eq(documentPermissions.documentId, documentId));

      return count;
    } catch (error) {
      return 0;
    }
  }

  private mapToPermission(dbPermission: any): DocumentPermission {
    return {
      id: dbPermission.id,
      documentId: dbPermission.documentId || dbPermission.document_id,
      userId: dbPermission.userId || dbPermission.user_id,
      permission: dbPermission.permission,
      grantedBy: dbPermission.grantedBy || dbPermission.granted_by,
      grantedAt: new Date(dbPermission.grantedAt * 1000),
    };
  }
}
