import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { config } from "../config/env";
import * as schema from "./schema";

// Extract database path from URL (e.g., "sqlite:./data/hdm.db" -> "./data/hdm.db")
const dbPath = config.DATABASE_URL.replace("sqlite:", "");

// Create SQLite database instance using Bun's native SQLite
const sqlite = new Database(dbPath);

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Export schema for use in repositories
export { schema };
