# Verde OS API Foundation

This document details the Phase 3 implementation of the REST API backend layer for Verde OS.

## 1. Architecture

The API uses a standard Layered Architecture pattern to ensure strict separation of concerns, maintainability, and clean boundaries:

```
Route (Express) -> Middleware -> Controller -> Service -> Supabase -> PostgreSQL
```

- **Routes (`src/routes`)**: Defines the endpoint paths and attaches authentication, validation, and controller methods.
- **Middleware (`src/middleware`)**: 
  - `auth.middleware.js`: Extracts mock headers (or decodes JWTs) to inject `req.user` and `req.organizationId`. Enforces role boundaries.
  - `validate.middleware.js`: Wraps Zod schema validation around incoming requests.
- **Controllers (`src/controllers`)**: Orchestrates the HTTP request/response cycle. Contains no database logic.
- **Services (`src/services`)**: Contains all business logic and executes data access via the `@supabase/supabase-js` service-role client.

## 2. Organization Isolation

**Strict Organization Multi-tenancy** is enforced in the API. 
The database uses `organization_id` as part of composite primary keys across all tables. The API never trusts an `organization_id` provided in a request body by a client.

- The `auth.middleware.js` extracts `req.organizationId`.
- Every Service method receives `organizationId` as its first parameter and chains `.eq('organization_id', organizationId)` onto its Supabase queries.
- A user from Organization A mathematically cannot retrieve or mutate data belonging to Organization B.

### Temporary Authentication Mock
Since Supabase Auth integration (Phase X) is not yet active in the frontend/backend bridge, we use a temporary HTTP header mock strictly to enforce the API boundary in development:
- `x-organization-id`: The UUID of the organization.
- `x-user-id`: The UUID of the requesting user.
- `x-role`: The role of the user (`Admin`, `Member`).

## 3. Response Format

The API standardizes on a unified JSON response structure.

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Collection**:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 10 }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": []
  }
}
```

## 4. Validation

Validation is handled by **Zod** (`zod`). Schemas are defined in `src/validations`.
If validation fails, the API immediately returns HTTP 400 without hitting the service layer:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": "body.email",
        "message": "Invalid email"
      }
    ]
  }
}
```

## 5. Endpoints Implemented

### Organizations
- `GET /api/organizations/:id`: Retrieve own organization.

### Users & Access
- `GET /api/users`: List organization members (includes nested user profiles, roles, and permissions).
- `GET /api/users/:id`: Get specific organization member.

### Clients
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Projects
- `GET /api/projects`: Admins see all, Members see only assigned projects.
- `POST /api/projects`: Admin only.
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`: Admin only.
- `DELETE /api/projects/:id`: Admin only.
- `GET /api/projects/:id/members`
- `POST /api/projects/:id/members`: Admin only.
- `DELETE /api/projects/:id/members/:userId`: Admin only.

### Tasks
- `GET /api/tasks`: Admins see all, Members see only assigned tasks.
- `POST /api/tasks`: Admin only.
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`: Members can update limited fields.
- `DELETE /api/tasks/:id`: Admin only.

## 6. Next Phases
- Implementation of CRM, Finance, Marketing, Attendance, and Chat modules.
- Integrating JWT Supabase authentication.
- Updating the frontend `services.js` to point to `/api` instead of `localStorage`.
