# Headless Document Management System

Headless Document Management API built with TypeScript, Bun, Hono, Drizzle and using clean architecture principles.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Authentication & Authorization](#authentication--authorization)
  - [Document Management](#document-management)
  - [Permission System](#permission-system)
  - [Secure Access](#secure-access)
  - [Enterprise Architecture](#enterprise-architecture)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Quick Test](#quick-test)
- [Architecture](#architecture)
  - [Layer Structure](#layer-structure)
  - [Design Principles](#design-principles)
- [File Structure Guide](#file-structure-guide)
  - [What Each File Does and Why It's There](#what-each-file-does-and-why-its-there)
    - [Controllers (HTTP Layer)](#controllers-http-layer)
    - [Services (Business Logic Layer)](#services-business-logic-layer)
    - [Repositories (Data Access Layer)](#repositories-data-access-layer)
    - [Types (Type Definitions & Contracts)](#types-type-definitions--contracts)
    - [Models (Database Layer)](#models-database-layer)
    - [Middleware](#middleware)
    - [Configuration](#configuration)
    - [Utils (Helper Functions)](#utils-helper-functions)
    - [Application Entry](#application-entry)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [Endpoints Overview](#endpoints-overview)
    - [Authentication](#authentication-1)
    - [Document Management](#document-management-1)
    - [Metadata Management](#metadata-management)
    - [Permission Management](#permission-management)
    - [Download Links](#download-links)
  - [Response Format](#response-format)
- [Development](#development)
  - [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
  - [Database Features](#database-features)
- [Advanced TypeScript Features](#advanced-typescript-features)
  - [Branded Types System](#branded-types-system)
- [Security](#security)
  - [Authentication & Authorization](#authentication--authorization-1)
  - [Data Security](#data-security)
  - [API Security](#api-security)

## Overview

The Headless Document Management System is a backend API that demonstrates **clean architecture**, **domain-driven design**, and **modern TypeScript development** practices. It showcases production patterns for building scalable, maintainable, and secure backend systems.

## Features

### Authentication & Authorization

- JWT-based stateless authentication
- Role-based access control (Admin/User)
- Secure password hashing with bcryptjs
- Protected routes with middleware

### Document Management

- Secure file upload with validation
- UUID-based file naming for security
- Multiple file format support
- Metadata and tagging system
- Full-text search capabilities

### Permission System

- Granular document permissions (read/write/delete/admin)
- User-to-user permission sharing
- Permission inheritance and management
- Audit trail for permission changes

### Secure Access

- Temporary download links with expiration
- Token-based secure file access
- Automatic cleanup of expired tokens
- Direct download protection

### Enterprise Architecture

- Clean architecture with separation of concerns
- Repository pattern for data access
- Service layer for business logic
- Type-safe development with TypeScript
- Comprehensive input validation

## Technology Stack

| Category           | Technology                                        | Purpose                                      |
| ------------------ | ------------------------------------------------- | -------------------------------------------- |
| **Runtime**        | [Bun](https://bun.sh/)                            | Fast JavaScript runtime with built-in SQLite |
| **HTTP Framework** | [Hono](https://hono.dev/)                         | Lightweight, fast web framework              |
| **Database**       | SQLite + [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database operations                |
| **Authentication** | JWT + bcryptjs                                    | Secure token-based authentication            |
| **Validation**     | [Zod](https://zod.dev/)                           | TypeScript-first schema validation           |
| **File Storage**   | Local filesystem                                  | UUID-based file storage                      |
| **Development**    | TypeScript                                        | Type-safe development                        |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.0+ installed
- Node.js compatible environment

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hdm
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Initialize database**

   ```bash
   # Create data directory
   mkdir -p data

   # Generate migration files
   bun run db:generate

   # Apply migrations
   bun run db:push
   ```

4. **Start development server**
   ```bash
   bun run dev
   # Server starts on http://localhost:3000
   ```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite:./data/hdm.db

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Download Links
DOWNLOAD_LINK_EXPIRES_IN=1h
```

### Quick Test

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123", "role": "admin"}'

# Login and get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

## Architecture

### Layer Structure

```
src/
├── controllers/        # HTTP request handlers
│   ├── AuthController.ts
│   ├── DocumentController.ts
│   ├── DownloadLinkController.ts
│   └── MetadataPermissionController.ts
├── services/          # Business logic layer
│   ├── AuthService.ts
│   ├── DocumentService.ts
│   ├── DownloadLinkService.ts
│   └── MetadataPermissionService.ts
├── repositories/      # Data access layer
│   ├── index.ts
│   ├── UserRepository.ts
│   ├── DocumentRepository.ts
│   ├── DocumentMetadataRepository.ts
│   ├── DocumentPermissionRepository.ts
│   ├── DocumentTagRepository.ts
│   └── DownloadTokenRepository.ts
├── models/           # Database schema and connection
│   ├── schema.ts
│   └── database.ts
├── types/            # TypeScript interfaces and branded types
│   ├── branded.ts
│   ├── domain.ts
│   ├── dto.ts
│   └── repositories.ts
├── middleware/       # Authentication and authorization
│   └── auth.ts
├── utils/           # Helper functions and utilities
│   ├── fileUpload.ts
│   └── responseHelpers.ts
├── config/          # Environment configuration
│   └── env.ts
└── index.ts         # Application entry point
```

### Design Principles

- **Clean Architecture**: Clear separation between HTTP, business logic, and data layers
- **Repository Pattern**: Interface based data access for easy testing and swapping
- **Service Layer**: Business logic abstraction from HTTP concerns
- **Dependency Injection**: Loose coupling through constructor injection
- **Type Safety**: Comprehensive TypeScript with strict mode enabled
- **Input Validation**: Zod schemas for all API endpoints

## File Structure Guide

### What Each File Does and Why It's There

This section explains the purpose and responsibility of every file in the codebase, organized by architectural layer.

#### Controllers (HTTP Layer)

**Purpose**: Handle HTTP requests/responses, route parameters, and delegate to services

- **`src/controllers/AuthController.ts`**

  - _What_: Authentication endpoints (register, login, me)
  - _Why_: Separates auth HTTP concerns from business logic, handles JWT tokens and user sessions
  - _Responsibility_: Request validation, response formatting, error handling for authentication flows

- **`src/controllers/DocumentController.ts`**

  - _What_: Document CRUD operations, search, upload, download endpoints
  - _Why_: Centralizes all document-related HTTP operations with proper authorization checks
  - _Responsibility_: File upload handling, search parameter validation, pagination, access control

- **`src/controllers/DownloadLinkController.ts`**

  - _What_: Temporary download link generation and token-based file access
  - _Why_: Provides secure, time-limited access to files without exposing direct file paths
  - _Responsibility_: Token generation, expiration management, secure file streaming

- **`src/controllers/MetadataPermissionController.ts`**
  - _What_: Document metadata and permission management endpoints
  - _Why_: Separates metadata/permission operations from core document operations for better organization
  - _Responsibility_: Permission granting/revoking, metadata CRUD, access validation

#### Services (Business Logic Layer)

**Purpose**: Implement core business rules and orchestrate between controllers and repositories

- **`src/services/AuthService.ts`**

  - _What_: Authentication logic, JWT handling, password validation
  - _Why_: Encapsulates complex auth business rules, token management, and security policies
  - _Responsibility_: Password hashing, JWT generation/verification, user registration validation

- **`src/services/DocumentService.ts`**

  - _What_: Document lifecycle management, file operations, search logic
  - _Why_: Complex file handling, search algorithms, and business rules for document management
  - _Responsibility_: File storage, metadata extraction, search indexing, access control logic

- **`src/services/DownloadLinkService.ts`**

  - _What_: Secure token generation, expiration logic, cleanup operations
  - _Why_: Complex token security, expiration algorithms, and cleanup policies require business layer
  - _Responsibility_: Cryptographic token generation, expiration calculation, security policies

- **`src/services/MetadataPermissionService.ts`**
  - _What_: Permission validation, metadata management, access control business logic
  - _Why_: Complex permission inheritance, validation rules, and metadata consistency checks
  - _Responsibility_: Permission algorithms, cascade operations, business rule enforcement

#### Repositories (Data Access Layer)

**Purpose**: Abstract database operations and provide clean interfaces for data manipulation

- **`src/repositories/index.ts`**

  - _What_: Central export point for all repositories
  - _Why_: Barrel pattern for clean imports and dependency management
  - _Responsibility_: Exports all repository classes for easy importing

- **`src/repositories/UserRepository.ts`**

  - _What_: User data operations (CRUD, queries, authentication lookups)
  - _Why_: Isolates user data access, enables testing, and provides clean user operations interface
  - _Responsibility_: User queries, email lookups, user creation/updates with branded types

- **`src/repositories/DocumentRepository.ts`**

  - _What_: Document data operations with search, pagination, and complex queries
  - _Why_: Most complex repository with search algorithms, filtering, and performance optimization
  - _Responsibility_: Document CRUD, full-text search, pagination, complex filtering with branded types

- **`src/repositories/DocumentMetadataRepository.ts`**

  - _What_: Document metadata storage and retrieval operations
  - _Why_: Separate concern from documents for flexible metadata schema and operations
  - _Responsibility_: Key-value metadata operations, document association, cleanup operations

- **`src/repositories/DocumentPermissionRepository.ts`**

  - _What_: Permission management database operations with user/document associations
  - _Why_: Complex permission queries require specialized repository with optimized joins
  - _Responsibility_: Permission CRUD, user-document associations, permission inheritance queries

- **`src/repositories/DocumentTagRepository.ts`**

  - _What_: Document tagging system database operations
  - _Why_: Tags require many-to-many relationship management and tag-based search operations
  - _Responsibility_: Tag creation, document-tag associations, tag-based queries

- **`src/repositories/DownloadTokenRepository.ts`**
  - _What_: Download token storage, validation, and cleanup operations
  - _Why_: Tokens need time-based queries, cleanup operations, and security-focused operations
  - _Responsibility_: Token CRUD, expiration queries, cleanup operations, usage tracking

#### Types (Type Definitions & Contracts)

**Purpose**: Provide type safety, eliminate primitive obsession, and define contracts

- **`src/types/branded.ts`**

  - _What_: Branded type system for compile-time safety and runtime validation
  - _Why_: Eliminates primitive obsession, prevents ID mixing, provides domain-specific validation
  - _Responsibility_: Type brand definitions, validation functions, safe type constructors

- **`src/types/domain.ts`**

  - _What_: Core domain entities, enums, and business object interfaces
  - _Why_: Central truth for domain model, ensures consistency across all layers
  - _Responsibility_: Entity definitions, business enums, domain relationships

- **`src/types/dto.ts`**

  - _What_: Data transfer objects and Zod validation schemas for API endpoints
  - _Why_: Separates API contracts from domain entities, provides request/response validation
  - _Responsibility_: API schemas, validation rules, request/response type definitions

- **`src/types/repositories.ts`**
  - _What_: Repository interface definitions and method signatures
  - _Why_: Enables dependency injection, testing with mocks, and implementation flexibility
  - _Responsibility_: Repository contracts, method signatures, pagination interfaces

#### Models (Database Layer)

**Purpose**: Database schema definitions and connection management

- **`src/models/schema.ts`**

  - _What_: Drizzle ORM database schema definitions and table structures
  - _Why_: Single source of truth for database structure, type-safe queries, migration management
  - _Responsibility_: Table definitions, relationships, constraints, indexes

- **`src/models/database.ts`**
  - _What_: Database connection configuration and setup
  - _Why_: Centralized connection management, environment-based configuration
  - _Responsibility_: Connection pooling, database client setup, connection lifecycle

#### Middleware

**Purpose**: Cross-cutting concerns like authentication and authorization

- **`src/middleware/auth.ts`**
  - _What_: JWT authentication middleware and role-based authorization guards
  - _Why_: Reusable security across all protected routes, centralized auth logic
  - _Responsibility_: Token validation, user context injection, role checking, route protection

#### Configuration

**Purpose**: Environment-specific settings and application configuration

- **`src/config/env.ts`**
  - _What_: Environment variable validation and configuration schema using Zod
  - _Why_: Type-safe configuration, validation at startup, clear configuration contracts
  - _Responsibility_: Environment parsing, validation, type-safe config object creation

#### Utils (Helper Functions)

**Purpose**: Reusable utilities that don't fit in business logic

- **`src/utils/fileUpload.ts`**

  - _What_: Multipart form data parsing and file upload handling utilities
  - _Why_: Complex file upload logic needs reusable utilities separate from business logic
  - _Responsibility_: Form parsing, file extraction, upload validation, stream handling

- **`src/utils/responseHelpers.ts`**
  - _What_: API response formatting and branded type conversion functions
  - _Why_: Consistent response format, branded type serialization for JSON responses
  - _Responsibility_: Response standardization, type conversions, JSON serialization helpers

#### Application Entry

**Purpose**: Application bootstrap and configuration

- **`src/index.ts`**
  - _What_: Main application setup, route definitions, middleware configuration, server startup
  - _Why_: Central orchestration point, dependency wiring, application lifecycle management
  - _Responsibility_: Route registration, middleware setup, server configuration, startup sequence

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Endpoints Overview

#### Authentication

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| `POST` | `/auth/register` | User registration | ✘             |
| `POST` | `/auth/login`    | User login        | ✘             |
| `GET`  | `/auth/me`       | Get current user  | ✔             |

#### Document Management

| Method   | Endpoint                  | Description          | Auth Required |
| -------- | ------------------------- | -------------------- | ------------- |
| `POST`   | `/documents`              | Upload document      | ✔             |
| `GET`    | `/documents`              | Get user documents   | ✔             |
| `GET`    | `/documents/search`       | Search documents     | ✔             |
| `GET`    | `/documents/:id`          | Get document details | ✘             |
| `GET`    | `/documents/:id/download` | Download document    | ✘             |
| `DELETE` | `/documents/:id`          | Delete document      | ✔             |

#### Metadata Management

| Method   | Endpoint                  | Description     | Auth Required |
| -------- | ------------------------- | --------------- | ------------- |
| `POST`   | `/documents/:id/metadata` | Add metadata    | ✔             |
| `GET`    | `/documents/:id/metadata` | Get metadata    | ✘             |
| `PUT`    | `/metadata/:id`           | Update metadata | ✔             |
| `DELETE` | `/metadata/:id`           | Delete metadata | ✔             |

#### Permission Management

| Method   | Endpoint                     | Description          | Auth Required |
| -------- | ---------------------------- | -------------------- | ------------- |
| `POST`   | `/documents/:id/permissions` | Grant permission     | ✔             |
| `GET`    | `/documents/:id/permissions` | Get permissions      | ✘             |
| `GET`    | `/permissions/my`            | Get user permissions | ✔             |
| `PUT`    | `/permissions/:id`           | Update permission    | ✔             |
| `DELETE` | `/permissions/:id`           | Revoke permission    | ✔             |

#### Download Links

| Method | Endpoint                       | Description            | Auth Required  |
| ------ | ------------------------------ | ---------------------- | -------------- |
| `POST` | `/documents/:id/download-link` | Generate temp link     | ✔              |
| `GET`  | `/download/:token`             | Download via token     | ✘              |
| `POST` | `/admin/cleanup-tokens`        | Cleanup expired tokens | ✔ (Admin Only) |

### Response Format

All API responses follow this consistent format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    /* validation errors if applicable */
  ]
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [
    /* items */
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Development

### Available Scripts

```bash
# Development
bun run dev          # Start with hot reload
bun run start        # Production start
bun run build        # Build for production

# Database
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run db:push      # Push schema to database
```

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        text id PK "UUID"
        text email UK "Unique email address"
        text password "Hashed password"
        text role "admin or user"
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENTS {
        text id PK "UUID"
        text filename "Generated unique filename"
        text original_name "User uploaded filename"
        text mime_type "File MIME type"
        integer size "File size in bytes"
        text path "Storage path"
        text uploaded_by FK
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENT_METADATA {
        text id PK "UUID"
        text document_id FK
        text key "Metadata key"
        text value "Metadata value"
        timestamp created_at
    }

    DOCUMENT_PERMISSIONS {
        text id PK "UUID"
        text document_id FK
        text user_id FK
        text permission "read, write, delete, admin"
        text granted_by FK
        timestamp granted_at
    }

    DOCUMENT_TAGS {
        text id PK "UUID"
        text document_id FK
        text tag "Tag name"
        timestamp created_at
    }

    DOWNLOAD_TOKENS {
        text id PK "UUID"
        text document_id FK
        text token UK "Unique access token"
        timestamp expires_at
        timestamp used_at "Nullable"
        text created_by FK
        timestamp created_at
    }

    %% Relationships
    USERS ||--o{ DOCUMENTS : "uploads"
    USERS ||--o{ DOCUMENT_PERMISSIONS : "has_permissions"
    USERS ||--o{ DOCUMENT_PERMISSIONS : "grants_permissions"
    USERS ||--o{ DOWNLOAD_TOKENS : "creates"

    DOCUMENTS ||--o{ DOCUMENT_METADATA : "has"
    DOCUMENTS ||--o{ DOCUMENT_PERMISSIONS : "protected_by"
    DOCUMENTS ||--o{ DOCUMENT_TAGS : "tagged_with"
    DOCUMENTS ||--o{ DOWNLOAD_TOKENS : "accessible_via"
```

### Database Features

- **UUID Primary Keys**: All entities use UUID v4 for security
- **Foreign Key Constraints**: Proper relationships with cascade deletes
- **Indexes**: Optimized queries on email, tokens, and search fields
- **Timestamps**: Automatic creation and update tracking
- **Data Integrity**: NOT NULL constraints and type validations

## Advanced TypeScript Features

### Branded Types System

The application implements a comprehensive **branded types** system to eliminate primitive obsession and enhance type safety:

**Key Benefits:**

- **Compile-time Safety**: Cannot mix different ID types (UserId vs DocumentId)
- **Runtime Validation**: All branded types validate data format at creation
- **Self-documenting Code**: Function signatures clearly show expected types
- **Refactoring Safety**: IDE can track all usages of specific domain concepts

**Example Usage:**

```typescript
// Before: Primitive obsession
function getUser(id: string): User {} // Any string accepted
function grantPermission(docId: string, userId: string) {} // Easy to mix up parameters

// After: Branded types
function getUser(id: UserId): User {} // Only UserId accepted
function grantPermission(docId: DocumentId, userId: UserId) {} // Type-safe parameters

// Creating branded types with validation
const userId = createUserId("550e8400-e29b-41d4-a716-446655440000"); // ✔ Valid UUID
const email = createEmail("user@example.com"); // ✔ Valid email format
const invalidId = createUserId("not-a-uuid"); // ✘ Throws validation error
```

**Available Branded Types:**

- `UserId`, `DocumentId`, `MetadataId`, `PermissionId`, `TagId`, `TokenId` - UUID-validated IDs
- `Email` - Email format validation
- `HashedPassword`, `JwtToken`, `DownloadToken` - Security token types
- `FileName`, `FilePath`, `MimeType`, `FileSize` - File system types

## Security

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with configurable expiration
- **Password Security**: bcryptjs hashing with 12 salt rounds
- **Role-Based Access**: Enum-based Admin and User roles with different permissions
- **Resource Protection**: Middleware-based route protection

### Data Security

- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **UUID Primary Keys**: Non sequential IDs prevent enumeration attacks
- **File Security**: UUID based filenames prevent direct access

### API Security

- **CORS Configuration**: Cross origin request handling
- **Error Handling**: Secure error messages without information leakage
- **Request Validation**: Content type and authorization header validation
