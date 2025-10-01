import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  DownloadTokenRepository,
  DocumentRepository,
} from "../repositories/index";
import { config } from "../config/env";
import {
  createDocumentId,
  createTokenId,
  createDownloadToken,
  createUserId,
} from "../types/branded";

export class DownloadLinkService {
  private tokenRepository: DownloadTokenRepository;
  private documentRepository: DocumentRepository;

  constructor() {
    this.tokenRepository = new DownloadTokenRepository();
    this.documentRepository = new DocumentRepository();
  }

  async generateDownloadLink(
    documentId: string,
    userId: string
  ): Promise<string> {
    // Check if document exists
    const document = await this.documentRepository.findById(
      createDocumentId(documentId)
    );
    if (!document) {
      throw new Error("Document not found");
    }

    const tokenString = crypto.randomBytes(32).toString("hex");

    const expiresIn = config.DOWNLOAD_LINK_EXPIRES_IN;
    const expiresAt = this.parseExpirationTime(expiresIn);

    // Store token in database
    await this.tokenRepository.create({
      id: createTokenId(uuidv4()),
      documentId: createDocumentId(documentId),
      token: createDownloadToken(tokenString),
      expiresAt,
      createdBy: createUserId(userId),
    });

    return tokenString;
  }

  async validateAndGetDocument(token: string): Promise<{
    documentId: string;
    isValid: boolean;
    isExpired: boolean;
    isUsed: boolean;
  }> {
    const tokenRecord = await this.tokenRepository.findByToken(
      createDownloadToken(token)
    );

    if (!tokenRecord) {
      return {
        documentId: "",
        isValid: false,
        isExpired: false,
        isUsed: false,
      };
    }

    const now = new Date();
    const isExpired = tokenRecord.expiresAt < now;
    const isUsed = !!tokenRecord.usedAt;

    return {
      documentId: tokenRecord.documentId,
      isValid: !isExpired && !isUsed,
      isExpired,
      isUsed,
    };
  }

  async useDownloadToken(token: string): Promise<string | null> {
    const validation = await this.validateAndGetDocument(token);

    if (!validation.isValid) {
      return null;
    }

    // Mark token as used
    const tokenRecord = await this.tokenRepository.findByToken(
      createDownloadToken(token)
    );
    if (tokenRecord) {
      await this.tokenRepository.markAsUsed(tokenRecord.id);
    }

    return validation.documentId as string;
  }

  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepository.cleanup();
  }

  private parseExpirationTime(expiresIn: string): Date {
    const now = new Date();

    // Parse time units (e.g., "1h", "30m", "24h")
    const timeMatch = expiresIn.match(/^(\d+)([hmsd])$/);

    if (!timeMatch) {
      // Default to 1 hour if parsing fails
      return new Date(now.getTime() + 60 * 60 * 1000);
    }

    const value = parseInt(timeMatch[1] || "1");
    const unit = timeMatch[2] || "h";

    let milliseconds = 0;
    switch (unit) {
      case "s":
        milliseconds = value * 1000;
        break;
      case "m":
        milliseconds = value * 60 * 1000;
        break;
      case "h":
        milliseconds = value * 60 * 60 * 1000;
        break;
      case "d":
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = 60 * 60 * 1000; // 1 hour default
    }

    return new Date(now.getTime() + milliseconds);
  }
}
