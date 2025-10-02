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
  handleAsyncOperation,
} from "../utils/responseHelpers";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (c: Context) => {
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = RegisterRequestSchema.parse(body);
        const user = await this.authService.register(validatedData);
        return convertUserForResponse(user);
      },
      "User registered successfully",
      StatusCode.CREATED
    );
  };

  login = async (c: Context) => {
    const body = await c.req.json();

    return handleAsyncOperation(
      c,
      async () => {
        const validatedData = LoginRequestSchema.parse(body);
        const result = await this.authService.login(validatedData);

        return {
          ...result,
          user: {
            ...result.user,
            id: result.user.id as string,
            email: result.user.email as string,
          },
        };
      },
      "Login successful"
    );
  };

  me = async (c: Context) => {
    const authError = requireAuthenticatedUser(c);
    if (authError) return authError;

    const currentUser = c.get("user");

    return handleAsyncOperation(c, async () => {
      const fullUser = await this.authService.getUserById(currentUser.userId);
      if (!fullUser) {
        throw new Error("User not found"); // Auto-mapped to 404 by smart error handling
      }
      return convertUserForResponse(fullUser);
    });
  };
}
