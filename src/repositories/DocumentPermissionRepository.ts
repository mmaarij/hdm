import { eq, and } from "drizzle-orm";
import { db } from "../models/database.js";
import { documentPermissions } from "../models/schema.js";
import type { IDocumentPermissionRepository } from "../types/repositories.js";
import type { DocumentPermission } from "../types/domain.js";
import { Permission } from "../types/domain.js";
import {
  type DocumentId,
  type UserId,
  type PermissionId,
  createPermissionId,
  createDocumentId,
  createUserId,
} from "../types/branded.js";

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

  async findByDocumentId(
    documentId: DocumentId
  ): Promise<DocumentPermission[]> {
    const results = await db
      .select()
      .from(documentPermissions)
      .where(eq(documentPermissions.documentId, documentId as string));

    return results.map((result) => this.mapToPermission(result));
  }

  async findByUserId(userId: UserId): Promise<DocumentPermission[]> {
    const results = await db
      .select()
      .from(documentPermissions)
      .where(eq(documentPermissions.userId, userId as string));

    return results.map((result) => this.mapToPermission(result));
  }

  async findByDocumentAndUser(
    documentId: DocumentId,
    userId: UserId
  ): Promise<DocumentPermission | null> {
    const [result] = await db
      .select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId as string),
          eq(documentPermissions.userId, userId as string)
        )
      )
      .limit(1);

    return result ? this.mapToPermission(result) : null;
  }

  async update(
    id: PermissionId,
    updates: { permission: string }
  ): Promise<DocumentPermission | null> {
    const [result] = await db
      .update(documentPermissions)
      .set({
        permission: updates.permission as Permission,
      })
      .where(eq(documentPermissions.id, id as string))
      .returning();

    return result ? this.mapToPermission(result) : null;
  }

  async delete(id: PermissionId): Promise<boolean> {
    try {
      const existingPermission = await db
        .select()
        .from(documentPermissions)
        .where(eq(documentPermissions.id, id as string))
        .limit(1);

      if (existingPermission.length === 0) {
        return false;
      }

      await db
        .delete(documentPermissions)
        .where(eq(documentPermissions.id, id as string));

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteByDocumentId(documentId: DocumentId): Promise<number> {
    try {
      const existingPermissions = await db
        .select()
        .from(documentPermissions)
        .where(eq(documentPermissions.documentId, documentId as string));

      const count = existingPermissions.length;

      await db
        .delete(documentPermissions)
        .where(eq(documentPermissions.documentId, documentId as string));

      return count;
    } catch (error) {
      return 0;
    }
  }

  private mapToPermission(dbPermission: any): DocumentPermission {
    return {
      id: createPermissionId(dbPermission.id),
      documentId: createDocumentId(
        dbPermission.documentId || dbPermission.document_id
      ),
      userId: createUserId(dbPermission.userId || dbPermission.user_id),
      permission: dbPermission.permission,
      grantedBy: createUserId(
        dbPermission.grantedBy || dbPermission.granted_by
      ),
      grantedAt: new Date(dbPermission.grantedAt * 1000),
    };
  }
}
