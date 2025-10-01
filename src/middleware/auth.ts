import type { Context, Next } from "hono";
import { AuthService } from "../services/AuthService";
import { UserRole } from "../types/domain";

const authService = new AuthService();

// Extend Hono context to include user information
declare module "hono" {
  interface ContextVariableMap {
    user: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}

export const authenticate = async (c: Context, next: Next) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return c.json({ error: "Invalid authorization format" }, 401);
    }

    // Verify token
    const user = await authService.verifyToken(token);

    // Set user in context
    c.set("user", user);

    await next();
  } catch (error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};

// Middleware to check if user has admin role
export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  if (user.role !== UserRole.ADMIN) {
    return c.json({ error: "Admin access required" }, 403);
  }

  await next();
};

// Middleware to check if user has admin role or is accessing their own resources
export const requireAdminOrOwner = (getUserId: (c: Context) => string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const resourceUserId = getUserId(c);

    if (user.role !== UserRole.ADMIN && user.userId !== resourceUserId) {
      return c.json({ error: "Access denied" }, 403);
    }

    await next();
  };
};
