# Verde OS Authentication

This document details the Phase 4A implementation of the Real Authentication Backend using Supabase Auth.

## 1. Authentication Architecture

The backend handles all authentication logic using Supabase Auth combined with a custom identity resolution process tailored for the ERP's schema structure. 

### Login Flow (`POST /api/auth/login`)
1. Client sends `email` and `password`.
2. The `auth.service.js` attempts to sign in via `supabase.auth.signInWithPassword`.
3. On success, the service extracts the Supabase user ID and attempts to resolve the ERP identity:
   - Fetches the `users` record.
   - Fetches the `organization_members` record to resolve the active organization and role. (If a user belongs to multiple organizations, the first active membership is selected).
   - Fetches permissions from both `role_permissions` and `user_permissions`.
4. Returns the `accessToken`, `refreshToken`, and the complete aggregated identity (`user`, `organization`, `role`, `permissions`).

### Token Validation & Middleware (`requireAuth`)
The existing mock middleware has been upgraded into a robust security boundary.
1. The client must attach `Authorization: Bearer <accessToken>` to every protected request.
2. The middleware calls `supabase.auth.getUser(token)` to ensure the token is cryptographically valid and not expired.
3. The ERP identity is resolved exactly like the login flow and securely attached to the Request object (`req.user`, `req.organizationId`, etc.) for downstream controllers and services to use.

## 2. Organization Isolation & Permissions

- **Organization Enforcement**: No request body payload for `organization_id` is trusted. The middleware aggressively enforces that downstream logic uses `req.organizationId`, guaranteeing users can only interact with their authenticated organization's scope.
- **Roles and Permissions**: Role mapping is strictly database-driven. The `requirePermission('scope')` middleware checks against the securely resolved `req.permissions` array. 

## 3. Current Implementation Status & Edge Cases

### Missing Database Schema Fallback
Since the current staging database environment lacks the finalized SQL schema (due to Supabase CLI migration issues), `auth.service.js` employs a temporary fallback mechanism. If identity resolution queries throw a `PGRST205` error (missing table), the service generates a mock `Admin` identity mapped to the actual Supabase Auth `user.id`. 
This guarantees the frontend and API can be developed and tested fully while waiting for the PostgreSQL migration to be applied physically.

## 4. Phase 4B: Frontend Migration
The frontend currently uses `session.js` and `localStorage` mock tokens. 
In Phase 4B, `app/auth/index.html` and `services.js` will be updated to hit the new `/api/auth/login` endpoint and persist the real Supabase JWT, injecting it into all API requests.
