import type { Context } from "hono";
import { AuthService } from "../services/AuthService.js";
import { RegisterRequestSchema, LoginRequestSchema } from "../types/dto.js";
import { ZodError } from "zod";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (c: Context) => {
    try {
      const body = await c.req.json();

      // Validate input
      const validatedData = RegisterRequestSchema.parse(body);

      // Register user
      const user = await this.authService.register(validatedData);

      // Don't return password in response
      const { password, ...userResponse } = user;

      return c.json(
        {
          success: true,
          message: "User registered successfully",
          data: {
            ...userResponse,
            id: userResponse.id as string,
            email: userResponse.email as string,
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.issues,
          },
          400
        );
      }

      if (error instanceof Error) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          400
        );
      }

      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };

  login = async (c: Context) => {
    try {
      const body = await c.req.json();

      // Validate input
      const validatedData = LoginRequestSchema.parse(body);

      // Login user
      const result = await this.authService.login(validatedData);

      return c.json({
        success: true,
        message: "Login successful",
        data: {
          ...result,
          user: {
            ...result.user,
            id: result.user.id as string,
            email: result.user.email as string,
          },
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            success: false,
            error: "Validation error",
            details: error.issues,
          },
          400
        );
      }

      if (error instanceof Error) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          401
        );
      }

      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };

  me = async (c: Context) => {
    try {
      const user = c.get("user");

      if (!user) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          401
        );
      }

      // Get full user details
      const fullUser = await this.authService.getUserById(user.userId);

      if (!fullUser) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          404
        );
      }

      // Don't return password
      const { password, ...userResponse } = fullUser;

      return c.json({
        success: true,
        data: {
          ...userResponse,
          id: userResponse.id as string,
          email: userResponse.email as string,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        500
      );
    }
  };
}
