import { eq } from "drizzle-orm";
import { db } from "../models/database.js";
import { users } from "../models/schema.js";
import type { IUserRepository } from "../types/repositories.js";
import type { User } from "../types/domain.js";

export class UserRepository implements IUserRepository {
  async create(userData: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.mapToUser(user);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ? this.mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ? this.mapToUser(user) : null;
  }

  async update(
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>
  ): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user ? this.mapToUser(user) : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      // Check if user still exists to determine if deletion was successful
      const deletedUser = await this.findById(id);
      return deletedUser === null;
    } catch (error) {
      return false;
    }
  }

  // Helper method to map database record to domain entity
  private mapToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password,
      role: dbUser.role,
      createdAt: new Date(dbUser.createdAt * 1000), // SQLite timestamp to Date
      updatedAt: new Date(dbUser.updatedAt * 1000),
    };
  }
}
