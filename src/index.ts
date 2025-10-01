import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AuthController } from "./controllers/AuthController";
import { DocumentController } from "./controllers/DocumentController";
import { MetadataController } from "./controllers/MetadataController";
import { PermissionController } from "./controllers/PermissionController";
import { DownloadLinkController } from "./controllers/DownloadLinkController";
import { authenticate, requireAdmin } from "./middleware/auth";

const app = new Hono();

// Basic middleware
app.use("*", cors());
app.use("*", logger());

// Initialize controllers
const authController = new AuthController();
const documentController = new DocumentController();
const metadataController = new MetadataController();
const permissionController = new PermissionController();
const downloadLinkController = new DownloadLinkController();

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.get("/api/v1", (c) => {
  return c.json({ message: "Headless Document Management API v1" });
});

// Auth routes (public)
app.post("/api/v1/auth/register", authController.register);
app.post("/api/v1/auth/login", authController.login);

// Auth routes (protected)
app.get("/api/v1/auth/me", authenticate, authController.me);

// Document routes (protected)
app.post("/api/v1/documents", authenticate, documentController.upload);
app.get("/api/v1/documents", authenticate, documentController.getUserDocuments);
app.get(
  "/api/v1/documents/search",
  authenticate,
  documentController.searchDocuments
);
app.get("/api/v1/documents/:id", authenticate, documentController.getDocument);
app.get(
  "/api/v1/documents/:id/download",
  authenticate,
  documentController.downloadDocument
);
app.delete(
  "/api/v1/documents/:id",
  authenticate,
  documentController.deleteDocument
);

// Metadata routes (protected)
app.post(
  "/api/v1/documents/:documentId/metadata",
  authenticate,
  metadataController.createMetadata
);
app.get(
  "/api/v1/documents/:documentId/metadata",
  metadataController.getDocumentMetadata
);
app.put(
  "/api/v1/metadata/:metadataId",
  authenticate,
  metadataController.updateMetadata
);
app.delete(
  "/api/v1/metadata/:metadataId",
  authenticate,
  metadataController.deleteMetadata
);

// Permission routes (protected)
app.post(
  "/api/v1/documents/:documentId/permissions",
  authenticate,
  permissionController.grantPermission
);
app.get(
  "/api/v1/documents/:documentId/permissions",
  permissionController.getDocumentPermissions
);
app.get(
  "/api/v1/permissions/my",
  authenticate,
  permissionController.getUserPermissions
);
app.put(
  "/api/v1/permissions/:permissionId",
  authenticate,
  permissionController.updatePermission
);
app.delete(
  "/api/v1/permissions/:permissionId",
  authenticate,
  permissionController.revokePermission
);

// Download link routes
app.post(
  "/api/v1/documents/:documentId/download-link",
  authenticate,
  downloadLinkController.generateDownloadLink
);
app.get("/api/v1/download/:token", downloadLinkController.downloadWithToken);
app.post(
  "/api/v1/admin/cleanup-tokens",
  authenticate,
  requireAdmin,
  downloadLinkController.cleanupExpiredTokens
);

const port = process.env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
};
