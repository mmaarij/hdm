import { z } from "zod";

const configSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().default("sqlite:./data/hdm.db"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32)
    .default("your-super-secret-jwt-key-change-this-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // File Storage
  UPLOAD_MAX_SIZE: z.string().default("10485760"), // 10MB
  UPLOAD_DIR: z.string().default("./uploads"),

  DOWNLOAD_LINK_EXPIRES_IN: z.string().default("1h"),
});

// Parse and validate environment variables
function loadConfig() {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error("Invalid environment configuration:", error);
    process.exit(1);
  }
}

export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;
