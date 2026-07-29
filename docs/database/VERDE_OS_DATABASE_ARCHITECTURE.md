# VERDE OS: Enterprise Database Architecture Blueprint

**Database Engine:** PostgreSQL 16+  
**Architecture:** Highly Normalized Relational Schema  
**Objective:** Provide a massively scalable, SaaS-ready, single source of truth for VERDE OS encompassing CRM, Execution, Finance, HR, and Communications.

---

## 1. Database Conventions & Best Practices

### 1.1 Standard Naming Conventions
- **Tables:** `snake_case`, pluralized (e.g., `employees`, `project_tasks`).
- **Columns:** `snake_case`, singular (e.g., `first_name`, `status`).
- **Primary Keys:** `id` (Always UUID).
- **Foreign Keys:** `<table_singular>_id` (e.g., `project_id`).
- **Join Tables:** `<tableA>_<tableB>` alphabetically (e.g., `project_members`).

### 1.2 Common Global Columns
Every core entity table must include the following audit and lifecycle columns:
- `id` (UUID, Primary Key, Default `gen_random_uuid()`)
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`)
- `updated_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`)
- `created_by` (UUID, Nullable, FK to `users.id`)
- `updated_by` (UUID, Nullable, FK to `users.id`)
- `deleted_at` (TIMESTAMP WITH TIME ZONE, Nullable)

### 1.3 Soft Delete Strategy
Records are never physically `DELETE`d from the database. Instead, `deleted_at` is set. 
*Constraint:* All `SELECT` queries across the backend must enforce `WHERE deleted_at IS NULL` (via Hibernate `@Where` or standard views).

### 1.4 Tenant Strategy (SaaS Readiness)
To support future SaaS pivoting where multiple agencies use VERDE OS, every table (except global dictionary tables) must include a `tenant_id` (UUID, FK to `tenants`). 
*For the current internal deployment, `tenant_id` will simply default to a single static VERDE LABS UUID.*

---

## 2. Table Definitions & Schemas

### 2.1 Authentication & Identity

**`users`**
- **Purpose:** Centralized identity for login across the entire system. Separated from `employees` to allow future `clients` to log in.
- **Columns:** `id`, `email` (VARCHAR, Unique), `password_hash` (VARCHAR), `is_active` (BOOLEAN), `last_login` (TIMESTAMP).
- **Indexes:** `idx_users_email`.

**`roles`**
- **Purpose:** RBAC group mapping (e.g., "Managing Director", "Developer").
- **Columns:** `id`, `name` (VARCHAR, Unique), `description` (TEXT).

**`permissions`**
- **Purpose:** Granular system capabilities.
- **Columns:** `id`, `resource` (VARCHAR, e.g., 'invoice'), `action` (VARCHAR, e.g., 'create').

**`role_permissions`**
- **Purpose:** Join table resolving M:M relationship between Roles and Permissions.
- **Columns:** `role_id` (UUID), `permission_id` (UUID).
- **Primary Key:** Composite (`role_id`, `permission_id`).

**`refresh_tokens`**
- **Purpose:** Long-lived session management.
- **Columns:** `id`, `user_id` (UUID, FK), `token` (VARCHAR, Unique), `expires_at` (TIMESTAMP), `is_revoked` (BOOLEAN).

### 2.2 Organization & Team

**`departments`**
- **Purpose:** Organizes the company hierarchy.
- **Columns:** `id`, `name` (VARCHAR, Unique), `head_id` (UUID, FK to `employees.id`).

**`employees`**
- **Purpose:** Represents the physical team member and their HR data.
- **Columns:** `id`, `user_id` (UUID, Unique, FK to `users.id`), `department_id` (UUID, FK), `role_id` (UUID, FK), `manager_id` (UUID, Nullable FK to `employees.id`), `first_name` (VARCHAR), `last_name` (VARCHAR), `phone` (VARCHAR), `status` (ENUM: 'ACTIVE', 'ON_LEAVE', 'TERMINATED').
- **Indexes:** `idx_employees_department`, `idx_employees_manager`.

**`skills` & `employee_skills`**
- **Purpose:** Matrix tracking employee proficiencies for intelligent project assignment.
- **Columns (`employee_skills`):** `employee_id` (UUID), `skill_id` (UUID), `proficiency_level` (SMALLINT, 1-5).

### 2.3 CRM (Customer Relationship Management)

**`clients`**
- **Purpose:** Stores established companies.
- **Columns:** `id`, `company_name` (VARCHAR), `industry` (VARCHAR), `website` (VARCHAR), `status` (ENUM: 'LEAD', 'ACTIVE', 'INACTIVE'), `assigned_account_manager_id` (UUID, FK to `employees.id`).

**`client_contacts`**
- **Purpose:** Individuals working at a client company.
- **Columns:** `id`, `client_id` (UUID, FK), `first_name` (VARCHAR), `email` (VARCHAR), `is_primary` (BOOLEAN).

**`leads`**
- **Purpose:** Tracks the sales pipeline journey.
- **Columns:** `id`, `client_id` (UUID, FK), `title` (VARCHAR), `value` (DECIMAL), `stage` (ENUM: 'INQUIRY', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST').
- **Indexes:** `idx_leads_stage`.

### 2.4 Projects & Tasks Execution Engine

**`projects`**
- **Purpose:** The core delivery vehicle connecting sales to execution.
- **Columns:** `id`, `client_id` (UUID, FK), `lead_id` (UUID, FK, Nullable), `manager_id` (UUID, FK to `employees.id`), `name` (VARCHAR), `status` (ENUM: 'KICKOFF', 'ACTIVE', 'REVIEW', 'DELIVERED', 'CLOSED'), `start_date` (DATE), `target_date` (DATE).

**`project_members`**
- **Purpose:** Tracks who is working on what project.
- **Columns:** `project_id` (UUID), `employee_id` (UUID), `project_role` (VARCHAR).

**`milestones`**
- **Purpose:** Major project phases (e.g., "Design Phase").
- **Columns:** `id`, `project_id` (UUID, FK), `name` (VARCHAR), `due_date` (DATE), `is_completed` (BOOLEAN).

**`tasks`**
- **Purpose:** The atomic unit of work in VERDE OS.
- **Columns:** `id`, `project_id` (UUID, FK), `milestone_id` (UUID, FK, Nullable), `assignee_id` (UUID, FK to `employees.id`), `title` (VARCHAR), `description` (TEXT), `status` (ENUM: 'BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'), `priority` (ENUM: 'LOW', 'NORMAL', 'HIGH', 'URGENT'), `due_date` (TIMESTAMP).
- **Indexes:** `idx_tasks_assignee_status` (Composite index for ultra-fast "My Work" dashboard loading).

**`task_comments` & `task_attachments`**
- **Purpose:** Collaboration ledger tied to execution.
- **Columns (`task_comments`):** `id`, `task_id` (UUID, FK), `author_id` (UUID, FK), `content` (TEXT).

### 2.5 Finance Center

**`quotations`**
- **Purpose:** Pre-sales financial commitments.
- **Columns:** `id`, `client_id` (UUID, FK), `project_id` (UUID, FK, Nullable), `quote_number` (VARCHAR, Unique), `subtotal` (DECIMAL), `tax` (DECIMAL), `total` (DECIMAL), `status` (ENUM: 'DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED').

**`invoices`**
- **Purpose:** Active financial receivables.
- **Columns:** `id`, `client_id` (UUID, FK), `project_id` (UUID, FK), `invoice_number` (VARCHAR, Unique), `amount` (DECIMAL), `balance_due` (DECIMAL), `due_date` (DATE), `status` (ENUM: 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE').

**`payments`**
- **Purpose:** Ledger of incoming cash.
- **Columns:** `id`, `invoice_id` (UUID, FK), `amount` (DECIMAL), `payment_method` (VARCHAR), `reference_number` (VARCHAR), `payment_date` (TIMESTAMP).

**`expenses`**
- **Purpose:** Ledger of outgoing cash.
- **Columns:** `id`, `vendor` (VARCHAR), `category_id` (UUID, FK to `expense_categories`), `amount` (DECIMAL), `expense_date` (DATE), `receipt_url` (VARCHAR).

### 2.6 Communication & Files

**`conversations` & `messages`**
- **Purpose:** Internal chat engine (Slack replacement).
- **Columns (`messages`):** `id`, `conversation_id` (UUID, FK), `sender_id` (UUID, FK), `content` (TEXT), `read_by` (JSONB).

**`notifications`**
- **Purpose:** System alerts.
- **Columns:** `id`, `recipient_id` (UUID, FK), `type` (VARCHAR), `message` (TEXT), `entity_type` (VARCHAR, e.g., 'task'), `entity_id` (UUID), `is_read` (BOOLEAN).

**`files`**
- **Purpose:** Centralized document management.
- **Columns:** `id`, `uploader_id` (UUID, FK), `file_name` (VARCHAR), `file_size` (BIGINT), `mime_type` (VARCHAR), `s3_key` (VARCHAR, indexed), `linked_entity_type` (VARCHAR), `linked_entity_id` (UUID).

### 2.7 Reports & Audit

**`audit_logs`**
- **Purpose:** Enterprise compliance tracking.
- **Columns:** `id`, `user_id` (UUID, FK), `action` (VARCHAR), `entity_name` (VARCHAR), `entity_id` (UUID), `old_values` (JSONB), `new_values` (JSONB), `ip_address` (VARCHAR), `created_at` (TIMESTAMP).

---

## 3. Relationship Architecture (Data Flow)

The database strictly flows from Macro (Entity/Organization) down to Micro (Execution/Finances):

```text
Organization Flow:
Department(1) ───(M)──> Employee(1) ───(M)──> EmployeeSkills 

Sales & Client Flow:
Lead(1) ───(M)──> LeadNotes/LeadActivities
Lead(1) ───(1)──> Client(1) ───(M)──> ClientContacts

Execution Flow:
Client(1) ───(M)──> Project(1) ───(M)──> Milestone(1) ───(M)──> Task
Employee(1) ───(M)──> Task(1) ───(M)──> TaskComments / TaskAttachments / TaskTimeLog

Financial Flow:
Client(1) ───(M)──> Quotation(1) ───(1)──> Invoice(1) ───(M)──> Payments
```

---

## 4. Role-Based Access Control (RBAC) Matrix Strategy

The RBAC system relies on the `permissions` table intersecting with the user's `role`.

| Role | CRM Access | Project Access | Task Access | Finance Access | Team/HR Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Managing Director** | `ALL` | `ALL` | `ALL` | `ALL` | `ALL` |
| **Co-Founder** | `ALL` | `ALL` | `ALL` | `ALL` | `ALL` |
| **Sales** | `CREATE, READ, UPDATE` | `READ` | `READ` | `READ (Quotes)` | `READ (Self)` |
| **Developer / SEO**| `NONE` | `READ (Assigned)` | `UPDATE (Assigned)`| `NONE` | `READ (Self)` |
| **Finance** | `READ` | `READ` | `READ` | `ALL` | `READ` |
| **HR** | `NONE` | `NONE` | `NONE` | `READ (Salaries)`| `ALL` |

*Security Rule:* API queries must intercept the Principal UUID. If a Developer queries `/api/tasks`, the DB layer automatically appends `AND assignee_id = :userId` unless they hold the `TASK_READ_ALL` permission.

---

## 5. Performance & Scalability Strategy

### 5.1 Query Optimization (Indexes)
PostgreSQL handles millions of rows effortlessly with proper indexing.
- **B-Tree Indexes:** Applied to all Foreign Keys (`client_id`, `project_id`, `assignee_id`) to optimize `JOIN` operations.
- **Composite Indexes:** Essential for dashboards. Example: The "My Work" dashboard needs an index on `tasks (assignee_id, status)` because the query is always `WHERE assignee_id = ? AND status != 'DONE'`.
- **GIN Indexes:** Applied to JSONB columns (like `audit_logs.old_values` or `roles.permissions`) for rapid unstructured search.

### 5.2 Pagination
To avoid expensive `OFFSET` queries at scale, the API will use **Keyset Pagination** (Cursor-based) for large tables (e.g., `audit_logs`, `messages`).
Query example: `WHERE created_at < :last_seen_timestamp ORDER BY created_at DESC LIMIT 50`.

### 5.3 Full-Text Search
Instead of `LIKE '%search%'` which scans the entire table, PostgreSQL's native `tsvector` and `tsquery` will be implemented on `tasks.title`, `projects.name`, and `clients.company_name` for ultra-fast, index-backed global search without needing an external tool like Elasticsearch immediately.

### 5.4 Archiving
Historical data (completed projects, old messages, expired quotes) older than 24 months should be partitioned or moved to cold storage tables (`tasks_archive_2024`) to keep the "hot" working tables in RAM.

---

## 6. Final Recommendations for Implementation

1. **Database Migrations:** Strictly use **Flyway** or **Liquibase**. No manual SQL alterations in production. Every schema change must be a versioned script.
2. **ORMs:** Use **Hibernate (Spring Data JPA)** for standard CRUD, but rely on **jOOQ** or Native SQL queries for complex analytical dashboard queries (e.g., Finance metrics) to avoid the N+1 select problem.
3. **Connection Pooling:** Use **HikariCP** configured correctly for PostgreSQL to handle high concurrent user load efficiently.
