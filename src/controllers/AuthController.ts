import type { Context } from "hono";
import { AuthService } from "../services/AuthService";
import { RegisterRequestSchema, LoginRequestSchema } from "../types/dto";
import { StatusCode } from "../types/statusCodes";
import {
  handleControllerError,
  convertUserForResponse,
  createSuccessResponse,
  createErrorResponse,
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
        StatusCode.CREATED as any
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
      return handleControllerError(c, error, StatusCode.UNAUTHORIZED);
    }
  };

  me = async (c: Context) => {
    try {
      const authError = requireAuthenticatedUser(c);
      if (authError) return authError;

      const currentUser = c.get("user");
      const fullUser = await this.authService.getUserById(currentUser.userId);

      if (!fullUser) {
        return createErrorResponse(c, "User not found", StatusCode.NOT_FOUND);
      }

      return c.json(createSuccessResponse(convertUserForResponse(fullUser)));
    } catch (error) {
      return handleControllerError(c, error);
    }
  };
}
