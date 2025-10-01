import type { Context } from "hono";
import { AuthService } from "../services/AuthService";
import { RegisterRequestSchema, LoginRequestSchema } from "../types/dto";
import {
  handleControllerError,
  convertUserForResponse,
  createSuccessResponse,
  requireAuthenticatedUser,
} from "../utils/responseHelpers";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (c: Context) => {
    try {
      const body = await c.req.json();
      const validatedData = RegisterRequestSchema.parse(body);
      const user = await this.authService.register(validatedData);

      return c.json(
        createSuccessResponse(
          convertUserForResponse(user),
          "User registered successfully"
        ),
        201
      );
    } catch (error) {
      return handleControllerError(c, error);
    }
  };

  login = async (c: Context) => {
    try {
      const body = await c.req.json();
      const validatedData = LoginRequestSchema.parse(body);
      const result = await this.authService.login(validatedData);

      return c.json(
        createSuccessResponse(
          {
            ...result,
            user: {
              ...result.user,
              id: result.user.id as string,
              email: result.user.email as string,
            },
          },
          "Login successful"
        )
      );
    } catch (error) {
      return handleControllerError(c, error, 401);
    }
  };

  me = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const currentUser = c.get("user");
      const fullUser = await this.authService.getUserById(currentUser.userId);

      if (!fullUser) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          404
        );
      }

      return c.json(createSuccessResponse(convertUserForResponse(fullUser)));
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
