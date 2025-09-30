import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";
import { UserRepository } from "../repositories/UserRepository.js";
import type { User } from "../types/domain.js";
import { UserRole } from "../types/domain.js";
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
} from "../types/dto.js";
import {
  createUserId,
  createEmail,
  createHashedPassword,
} from "../types/branded.js";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterRequest): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.userRepository.create({
      id: createUserId(uuidv4()),
      email: createEmail(data.email),
      password: createHashedPassword(hashedPassword),
      role: data.role || UserRole.USER,
    });

    return user;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
        issuer: "hdm-api",
        subject: user.id,
      }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; email: string; role: UserRole }> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const userId = createUserId(id);
      return this.userRepository.findById(userId);
    } catch (error) {
      return null;
    }
  }
}
