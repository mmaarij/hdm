# Headless Document Management System - API Documentation

## Overview

A comprehensive backend system built with TypeScript, Bun, and clean architecture principles for document management with authentication, permissions, and metadata support.

## 🏗️ Architecture

### Layer Structure

```
src/
├── controllers/     # HTTP request handlers (thin controllers)
├── services/       # Business logic layer
├── repositories/   # Data access layer with interfaces
├── models/        # Database schema and connection
├── types/         # TypeScript interfaces and DTOs
├── middleware/    # Authentication and authorization
├── utils/         # Helper functions
└── config/        # Environment configuration
```

### Design Principles

- **Clean Architecture**: Separated concerns with clear boundaries
- **Repository Pattern**: Interface-based data access for testability
- **Service Layer**: Business logic abstraction from HTTP concerns
- **Type Safety**: Comprehensive TypeScript throughout
- **Input Validation**: Zod schemas for all API endpoints

## 🔧 Technology Stack

- **Runtime**: Bun (JavaScript runtime with built-in SQLite)
- **HTTP Framework**: Hono (lightweight, fast web framework)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: JWT with bcryptjs password hashing
- **Validation**: Zod schemas
- **File Storage**: Local filesystem with UUID filenames

## 🛡️ Security Features

- JWT-based authentication with configurable expiration
- Role-based access control (Admin/User)
- Password hashing with bcryptjs (12 rounds)
- Short-lived download tokens for secure file access
- Input validation on all endpoints
- UUID primary keys (no sequential IDs)

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login (returns JWT)
- `GET /api/v1/auth/me` - Get current user info (protected)

### Document Management

- `POST /api/v1/documents` - Upload document with metadata/tags (protected)
- `GET /api/v1/documents` - Get user's documents with pagination (protected)
- `GET /api/v1/documents/search` - Search documents with filters
- `GET /api/v1/documents/:id` - Get document details with metadata/tags
- `GET /api/v1/documents/:id/download` - Direct document download
- `DELETE /api/v1/documents/:id` - Delete document (owner/admin only)

### Metadata Management

- `POST /api/v1/documents/:documentId/metadata` - Add metadata (protected)
- `GET /api/v1/documents/:documentId/metadata` - Get document metadata
- `PUT /api/v1/metadata/:metadataId` - Update metadata (protected)
- `DELETE /api/v1/metadata/:metadataId` - Delete metadata (protected)

### Permission Management

- `POST /api/v1/documents/:documentId/permissions` - Grant permission (protected)
- `GET /api/v1/documents/:documentId/permissions` - Get document permissions
- `GET /api/v1/permissions/my` - Get user's permissions (protected)
- `PUT /api/v1/permissions/:permissionId` - Update permission (protected)
- `DELETE /api/v1/permissions/:permissionId` - Revoke permission (protected)

### Download Links

- `POST /api/v1/documents/:documentId/download-link` - Generate temporary download link (protected)
- `GET /api/v1/download/:token` - Download via temporary token
- `POST /api/v1/admin/cleanup-tokens` - Cleanup expired tokens (admin only)

## 🗃️ Database Schema

### Core Tables

- **users**: User accounts with roles
- **documents**: File metadata and storage info
- **document_metadata**: Key-value metadata pairs
- **document_permissions**: User permissions per document
- **document_tags**: Categorization tags
- **download_tokens**: Temporary download access tokens

### Features

- UUID primary keys throughout
- Proper foreign key relationships with cascade deletes
- Timestamp tracking (created/updated)
- SQLite with WAL mode for better concurrency

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Setup database:**

   ```bash
   bun run db:push
   ```

3. **Start development server:**

   ```bash
   bun run dev
   ```

4. **Test endpoints:**

   ```bash
   # Register admin user
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@hdm.com", "password": "password123", "role": "admin"}'

   # Login and get token
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@hdm.com", "password": "password123"}'
   ```

## 🔍 Search & Filtering

The search system supports:

- Filename filtering
- MIME type filtering
- User-based filtering
- Tag-based filtering (TODO: enhance with joins)
- Metadata filtering (TODO: enhance with joins)
- Pagination with configurable limits
- Sorting by filename, creation date, or file size

## 📁 File Storage

- Files stored in configurable upload directory
- UUID-based unique filenames to prevent conflicts
- Original filenames preserved in database
- MIME type detection and storage
- File size tracking and limits
- Automatic cleanup on document deletion

## 🔐 Permission System

- **Roles**: Admin (full access) and User (restricted)
- **Document Permissions**: read, write, delete, admin
- **Access Control**: Owner-based + granted permissions
- **Hierarchical**: Admins can access all documents

## 📊 Current Status

✅ **Completed Features:**

- Complete authentication system with JWT
- Document upload/download with metadata and tags
- Permission management (grant, revoke, update)
- Metadata CRUD operations
- Short-lived download links with tokens
- Search and filtering system (basic implementation)
- Clean architecture with proper separation of concerns
- Comprehensive error handling and validation

## 🎯 Key Achievements

1. **Clean Architecture**: Proper separation between controllers, services, and repositories
2. **Type Safety**: Complete TypeScript coverage with proper interfaces
3. **Security**: JWT authentication, RBAC, and secure file access
4. **Scalability**: Interface-based design allows easy testing and implementation swapping
5. **Modern Stack**: Leveraging Bun's performance and built-in features

This system demonstrates production-ready backend development with modern TypeScript patterns, security best practices, and clean code principles.
