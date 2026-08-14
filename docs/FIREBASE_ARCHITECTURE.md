# VERDE OS - Proposed Firestore Data Model (Phase 1)

This document outlines the proposed target architecture for migrating localStorage entities to Firestore.
*Note: This is documentation/planning only. No data has been migrated yet.*

## Root Collections

### `organizations/`
- **Document ID**: `{organizationId}` (e.g., `org-1`)
- **Fields**:
  - `name`: string (e.g., "VERDE LABS")
  - `industry`: string
  - `website`: string
  - `email`: string
  - `phone`: string
  - `logoUrl`: string
  - `createdAt`: timestamp
  - `updatedAt`: timestamp
  
### `users/`
- **Document ID**: `{userId}`
- **Fields**:
  - `organizationId`: string (Reference to `organizations`)
  - `name`: string
  - `email`: string
  - `role`: string (e.g., "admin", "user")
  - `avatarUrl`: string
  - `createdAt`: timestamp
  - `lastActive`: timestamp
  
### `projects/`
- **Document ID**: `{projectId}`
- **Fields**:
  - `organizationId`: string
  - `name`: string
  - `status`: string (e.g., "active", "completed")
  - `clientId`: string (Reference to `clients`)
  - `teamMembers`: array of strings (`userId`s)
  - `progress`: number
  - `createdAt`: timestamp
  - `updatedAt`: timestamp
  
### `tasks/`
- **Document ID**: `{taskId}`
- **Fields**:
  - `projectId`: string
  - `title`: string
  - `description`: string
  - `status`: string (e.g., "todo", "in_progress", "done")
  - `assigneeId`: string
  - `dueDate`: timestamp
  - `createdAt`: timestamp
  
### `clients/`
- **Document ID**: `{clientId}`
- **Fields**:
  - `organizationId`: string
  - `name`: string
  - `contactPerson`: string
  - `email`: string
  - `phone`: string
  - `createdAt`: timestamp

### `teamMembers/` (or mapped to `users/`)
- **Document ID**: `{memberId}`
- **Fields**:
  - `userId`: string
  - `department`: string
  - `jobTitle`: string
  - `hourlyRate`: number

### `invoices/`
- **Document ID**: `{invoiceId}`
- **Fields**:
  - `organizationId`: string
  - `clientId`: string
  - `amount`: number
  - `status`: string (e.g., "draft", "sent", "paid")
  - `dueDate`: timestamp
  - `createdAt`: timestamp

### `campaigns/`
- **Document ID**: `{campaignId}`
- **Fields**:
  - `organizationId`: string
  - `name`: string
  - `platform`: string
  - `budget`: number
  - `status`: string

## Migration Strategy
Migrations will happen one module at a time. The first module to be migrated will be **Projects**. During migration, existing `localStorage` data will be seeded into Firestore, and the `VerdeServices` implementation will be updated to use `VerdeFirebaseService` instead of local storage reads/writes.
