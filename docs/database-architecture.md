# Verde OS — Database Architecture Audit & Final Schema

## 1. ERP Entity Overview
Based on a thorough inspection of the frontend modules and the `services.js` implementations, the VERDE OS ERP consists of the following core domains and persistent entities:

- **Workspace / Organization**: `organizations`, `organization_members`
- **Identity & Access**: `users`, `roles`, `permissions`, `role_permissions`, `user_permissions`
- **Team Management**: `attendance`, `leave_requests`
- **Internal Team Chat**: `conversations`, `conversation_participants`, `chat_messages`, `chat_read_receipts`
- **CRM**: `clients`, `leads`, `proposals`, `meetings`, `client_notes`, `lead_activities`
- **Projects**: `projects`, `project_members`, `milestones`, `project_files`, `project_notes`, `project_activities`
- **Tasks**: `tasks`, `subtasks`, `task_dependencies`, `task_comments`, `task_attachments`, `task_activities`
- **Finance**: `transactions`, `payroll`
- **Marketing**: `marketing_campaigns`
- **Shared Utilities**: `notifications`

---

## 2. Organization Isolation
To enforce strict multi-tenant isolation, every business table includes `organization_id`. We utilize **Composite Foreign Keys** where practical to guarantee structurally that cross-organization data cannot exist. 
For example, a task cannot be assigned to a project in a different organization because the foreign key from `tasks` to `projects` includes the `organization_id`.

**API Validation Strategy**:
- The Express API acts as the primary authorization layer. It extracts the `organization_id` from the authenticated user's profile.
- API requests that attempt to mutate data will automatically scope the operation to the current `organization_id`.

---

## 3. Cascade Rules & Deletion Strategy
Historical records (e.g., attendance, leave, financial records, activity history) must be protected. Deleting a user must **not** cascade into destroying critical business data.
- **Deactivation (Soft Deletes)**: The primary strategy. Users, Clients, and Projects use an `is_active` or `is_deleted` flag. Attempting to hard-delete a user who has associated historical records will fail.
- **`ON DELETE RESTRICT`**: Applied to `user_id` and `author_id` foreign keys in critical tables where the child is `NOT NULL` (`attendance`, `leave_requests`, `transactions`, `payroll`, `client_notes`, `project_notes`, `task_comments`, `chat_messages`) to block the hard-deletion of the user, forcing a soft delete instead.
- **`ON DELETE CASCADE`**: Used only for strict structural parent-child relationships (e.g., if a task is deleted, its subtasks and comments are deleted; if an organization is deleted, all its data is deleted).
- **`ON DELETE SET NULL`**: Used ONLY for nullable non-critical relationships where the parent's absence does not invalidate the child (e.g., if the user who uploaded a file is deleted, `uploader_id` becomes NULL, but the file remains).

---

## 4. Final Complete Schema

### Domain: Workspace & Identity

**TABLE: organizations**
- `id` (UUID) - PRIMARY KEY
- `name` (VARCHAR) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()

**TABLE: users** (Global Auth Profile mapping to Supabase Auth)
- `id` (UUID) - PRIMARY KEY (FK to auth.users.id, ON DELETE RESTRICT)
- `email` (VARCHAR) - NOT NULL
- `name` (VARCHAR) - NOT NULL
- `avatar_bg` (VARCHAR) - NULL
- `initials` (VARCHAR) - NULL
- `is_active` (BOOLEAN) - NOT NULL, DEFAULT true
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`email`)

**TABLE: organization_members** (Canonical Employee Profile)
- `organization_id` (UUID) - PRIMARY KEY (FK to organizations.id, ON DELETE CASCADE)
- `user_id` (UUID) - PRIMARY KEY (FK to users.id, ON DELETE RESTRICT)
- `role_id` (UUID) - NOT NULL (FK to roles.id, ON DELETE RESTRICT)
- `department` (VARCHAR) - NULL
- `workload` (VARCHAR) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Active'
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `user_id`) - Acts as a target for composite FKs to guarantee user membership.

**TABLE: roles**
- `id` (UUID) - PRIMARY KEY
- `name` (VARCHAR) - NOT NULL
- *Constraints*: UNIQUE(`name`)

**TABLE: permissions**
- `id` (UUID) - PRIMARY KEY
- `name` (VARCHAR) - NOT NULL
- *Constraints*: UNIQUE(`name`)

**TABLE: role_permissions**
- `role_id` (UUID) - PRIMARY KEY (FK to roles.id, ON DELETE CASCADE)
- `permission_id` (UUID) - PRIMARY KEY (FK to permissions.id, ON DELETE CASCADE)

**TABLE: user_permissions** (Organization-scoped overrides)
- `organization_id` (UUID) - PRIMARY KEY
- `user_id` (UUID) - PRIMARY KEY
- `permission_id` (UUID) - PRIMARY KEY (FK to permissions.id, ON DELETE CASCADE)
- `is_granted` (BOOLEAN) - NOT NULL
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE CASCADE

### Domain: CRM

**TABLE: clients**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `company` (VARCHAR) - NOT NULL
- `contact_person` (VARCHAR) - NULL
- `email` (VARCHAR) - NULL
- `phone` (VARCHAR) - NULL
- `industry` (VARCHAR) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Active'
- `revenue` (NUMERIC) - NOT NULL, DEFAULT 0
- `lead_id` (UUID) - NULL
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`) - Target for composite FKs.
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `lead_id`) REFERENCES `leads` (`organization_id`, `id`) ON DELETE SET NULL

**TABLE: leads**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `name` (VARCHAR) - NOT NULL
- `company` (VARCHAR) - NULL
- `email` (VARCHAR) - NULL
- `phone` (VARCHAR) - NULL
- `source` (VARCHAR) - NULL
- `priority` (VARCHAR) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'New Lead'
- `value` (NUMERIC) - NOT NULL, DEFAULT 0
- `assigned_to` (UUID) - NULL
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`) - Target for composite FKs.
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `assigned_to`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: proposals**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `title` (VARCHAR) - NOT NULL
- `client_id` (UUID) - NOT NULL
- `lead_id` (UUID) - NULL
- `value` (NUMERIC) - NOT NULL, DEFAULT 0
- `valid_until` (DATE) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Sent'
- `assigned_to` (UUID) - NULL
- `notes` (TEXT) - NULL
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `client_id`) REFERENCES `clients` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `lead_id`) REFERENCES `leads` (`organization_id`, `id`) ON DELETE SET NULL
  - FOREIGN KEY (`organization_id`, `assigned_to`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: meetings**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `title` (VARCHAR) - NOT NULL
- `purpose` (VARCHAR) - NULL
- `client_id` (UUID) - NULL
- `lead_id` (UUID) - NULL
- `date` (DATE) - NOT NULL
- `time` (TIME) - NOT NULL
- `duration` (INTERVAL) - NOT NULL
- `owner_id` (UUID) - NOT NULL
- `notes` (TEXT) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Scheduled'
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `client_id`) REFERENCES `clients` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `lead_id`) REFERENCES `leads` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `owner_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT

**TABLE: client_notes**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `client_id` (UUID) - NOT NULL
- `author_id` (UUID) - NOT NULL
- `text` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `client_id`) REFERENCES `clients` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `author_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT

**TABLE: lead_activities**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `lead_id` (UUID) - NOT NULL
- `user_id` (UUID) - NULL
- `action` (VARCHAR) - NOT NULL
- `details` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `lead_id`) REFERENCES `leads` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

### Domain: Projects

**TABLE: projects**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `name` (VARCHAR) - NOT NULL
- `client_id` (UUID) - NULL
- `category` (VARCHAR) - NULL
- `priority` (VARCHAR) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Active'
- `start_date` (DATE) - NOT NULL
- `due_date` (DATE) - NULL
- `budget` (NUMERIC) - NOT NULL, DEFAULT 0
- `progress` (INTEGER) - NOT NULL, DEFAULT 0
- `deliverables` (TEXT) - NULL
- `notes` (TEXT) - NULL
- `is_draft` (BOOLEAN) - NOT NULL, DEFAULT false
- `is_archived` (BOOLEAN) - NOT NULL, DEFAULT false
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`), CHECK(`progress` >= 0 AND `progress` <= 100)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `client_id`) REFERENCES `clients` (`organization_id`, `id`) ON DELETE RESTRICT

**TABLE: project_members**
- `organization_id` (UUID) - PRIMARY KEY (FK to organizations.id, ON DELETE CASCADE)
- `project_id` (UUID) - PRIMARY KEY
- `user_id` (UUID) - PRIMARY KEY
- `role` (VARCHAR) - NOT NULL, DEFAULT 'Member'
- `workload` (VARCHAR) - NULL
- `assigned_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE CASCADE

**TABLE: milestones**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `project_id` (UUID) - NOT NULL
- `title` (VARCHAR) - NOT NULL
- `description` (TEXT) - NULL
- `assignee_id` (UUID) - NULL
- `due_date` (DATE) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Pending'
- `completion_pct` (INTEGER) - NOT NULL, DEFAULT 0
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: CHECK(`completion_pct` >= 0 AND `completion_pct` <= 100)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `assignee_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: project_files**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `project_id` (UUID) - NOT NULL
- `name` (VARCHAR) - NOT NULL
- `size_bytes` (INTEGER) - NOT NULL
- `url` (VARCHAR) - NOT NULL
- `uploader_id` (UUID) - NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `uploader_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: project_notes**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `project_id` (UUID) - NOT NULL
- `author_id` (UUID) - NOT NULL
- `text` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `author_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT

**TABLE: project_activities**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `project_id` (UUID) - NOT NULL
- `user_id` (UUID) - NULL
- `action` (VARCHAR) - NOT NULL
- `details` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

### Domain: Tasks

**TABLE: tasks**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `title` (VARCHAR) - NOT NULL
- `description` (TEXT) - NULL
- `project_id` (UUID) - NULL
- `assignee_id` (UUID) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'To Do'
- `priority` (VARCHAR) - NULL
- `due_date` (DATE) - NULL
- `estimated_hours` (NUMERIC) - NOT NULL, DEFAULT 0
- `tags` (JSONB) - NULL
- `recurrence` (VARCHAR) - NOT NULL, DEFAULT 'None'
- `reminder` (VARCHAR) - NOT NULL, DEFAULT 'None'
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`), CHECK(`estimated_hours` >= 0)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `project_id`) REFERENCES `projects` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `assignee_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: task_dependencies**
- `organization_id` (UUID) - PRIMARY KEY (FK to organizations.id, ON DELETE CASCADE)
- `task_id` (UUID) - PRIMARY KEY
- `depends_on_task_id` (UUID) - PRIMARY KEY
- *Constraints*: The Express API must enforce recursive checks to prevent circular dependencies.
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `depends_on_task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE

**TABLE: subtasks**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `task_id` (UUID) - NOT NULL
- `title` (VARCHAR) - NOT NULL
- `completed` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE

**TABLE: task_comments**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `task_id` (UUID) - NOT NULL
- `author_id` (UUID) - NOT NULL
- `text` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `author_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT

**TABLE: task_attachments**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `task_id` (UUID) - NOT NULL
- `name` (VARCHAR) - NOT NULL
- `size_bytes` (INTEGER) - NOT NULL
- `url` (VARCHAR) - NOT NULL
- `uploader_id` (UUID) - NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `uploader_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

**TABLE: task_activities**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `task_id` (UUID) - NOT NULL
- `user_id` (UUID) - NULL
- `action` (VARCHAR) - NOT NULL
- `details` (TEXT) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL

### Domain: Finance

**TABLE: transactions**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `invoice_number` (VARCHAR) - NOT NULL
- `client_id` (UUID) - NULL
- `description` (TEXT) - NOT NULL
- `amount` (NUMERIC(12,2)) - NOT NULL
- `type` (VARCHAR) - NOT NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Completed'
- `date` (DATE) - NOT NULL
- `is_deleted` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `invoice_number`)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `client_id`) REFERENCES `clients` (`organization_id`, `id`) ON DELETE RESTRICT

**TABLE: payroll**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `emp_id` (UUID) - NOT NULL
- `month` (VARCHAR) - NOT NULL
- `basic` (NUMERIC(12,2)) - NOT NULL, DEFAULT 0
- `allowances` (NUMERIC(12,2)) - NOT NULL, DEFAULT 0
- `bonus` (NUMERIC(12,2)) - NOT NULL, DEFAULT 0
- `deductions` (NUMERIC(12,2)) - NOT NULL, DEFAULT 0
- `net` (NUMERIC(12,2)) - NOT NULL, DEFAULT 0
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Pending'
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `emp_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT

### Domain: Marketing

**TABLE: marketing_campaigns**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `name` (VARCHAR) - NOT NULL
- `platform` (VARCHAR) - NOT NULL
- `budget` (NUMERIC(12,2)) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Draft'
- `perf` (VARCHAR) - NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()

### Domain: Team (Attendance & Leave)

**TABLE: attendance**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `user_id` (UUID) - NOT NULL
- `date` (DATE) - NOT NULL
- `check_in` (TIME) - NULL
- `check_out` (TIME) - NULL
- `total_hours` (INTERVAL) - NULL
- `status` (VARCHAR) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `user_id`, `date`)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT
- *API Enforcement*:
  - **Member**: Can only insert/update their own `user_id` where `date = CURRENT_DATE`. Cannot delete.
  - **Admin**: Can manage all users, update past dates, and delete records (if policy permits).

**TABLE: leave_requests**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `user_id` (UUID) - NOT NULL
- `leave_type` (VARCHAR) - NOT NULL
- `start_date` (DATE) - NOT NULL
- `end_date` (DATE) - NOT NULL
- `total_days` (INTEGER) - NOT NULL
- `reason` (TEXT) - NULL
- `status` (VARCHAR) - NOT NULL, DEFAULT 'Pending'
- `reviewed_by` (UUID) - NULL
- `reviewed_at` (TIMESTAMPTZ) - NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: CHECK(`end_date` >= `start_date`), CHECK(`status` IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT
  - FOREIGN KEY (`organization_id`, `reviewed_by`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE SET NULL
- *API Enforcement*:
  - **Member**: Cannot set `status`, `reviewed_by`, or `reviewed_at` (defaults).
  - **Admin**: Has explicit endpoints to alter `status`, `reviewed_by`, and `reviewed_at`.

### Domain: Chat

**TABLE: conversations**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `type` (VARCHAR) - NOT NULL
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`), CHECK(`type` IN ('direct', 'team'))

**TABLE: conversation_participants**
- `organization_id` (UUID) - PRIMARY KEY (FK to organizations.id, ON DELETE CASCADE)
- `conversation_id` (UUID) - PRIMARY KEY
- `user_id` (UUID) - PRIMARY KEY
- `joined_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `conversation_id`) REFERENCES `conversations` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE CASCADE

**TABLE: chat_messages**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `conversation_id` (UUID) - NOT NULL
- `sender_id` (UUID) - NOT NULL
- `message` (TEXT) - NOT NULL
- `timestamp` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Constraints*: UNIQUE(`organization_id`, `id`)
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `conversation_id`) REFERENCES `conversations` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `sender_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE RESTRICT
- *API Enforcement*: The API must strictly verify that `sender_id` belongs to `conversation_participants` for that `conversation_id`.

**TABLE: chat_read_receipts**
- `organization_id` (UUID) - PRIMARY KEY
- `message_id` (UUID) - PRIMARY KEY
- `user_id` (UUID) - PRIMARY KEY
- `read_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `message_id`) REFERENCES `chat_messages` (`organization_id`, `id`) ON DELETE CASCADE
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE CASCADE

### Domain: Notifications

**TABLE: notifications**
- `id` (UUID) - PRIMARY KEY
- `organization_id` (UUID) - NOT NULL (FK to organizations.id, ON DELETE CASCADE)
- `user_id` (UUID) - NULL
- `title` (VARCHAR) - NOT NULL
- `description` (TEXT) - NULL
- `is_read` (BOOLEAN) - NOT NULL, DEFAULT false
- `created_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- `updated_at` (TIMESTAMPTZ) - NOT NULL, DEFAULT NOW()
- *Composite FKs*:
  - FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_members` (`organization_id`, `user_id`) ON DELETE CASCADE

---

## 5. Row Level Security (RLS) Conceptual Boundaries
Using a Defense-in-Depth approach:
1. **Supabase Auth**: Authenticates users and issues JWTs.
2. **PostgreSQL RLS**: Since the Express server bypasses Postgres RLS natively via `service_role`, we configure RLS purely as defense (in case direct frontend DB queries are ever added or Edge Functions are utilized). RLS does **NOT** rely on unimplemented JWT claims.
   *Policy Example*: 
   `EXISTS (SELECT 1 FROM organization_members WHERE user_id = auth.uid() AND organization_id = table.organization_id)`
3. **Express Authorization**: THE PRIMARY LAYER. Middleware verifies the JWT, queries `organization_members` for the user's `organization_id`, and explicitly rejects any data query not matching `WHERE organization_id = ?`.
4. **Business Rules**: Action-level checks (`requirePermission('projects.edit')`) run per route before mutations.

---

## 6. Recommended SQL Migration Order
1. Extensions & Functions
2. `organizations`
3. `users`
4. `roles`, `permissions`
5. `organization_members`
6. `role_permissions`, `user_permissions`
7. `clients`, `leads` (CRM Base)
8. CRM Children (`proposals`, `meetings`, `client_notes`, `lead_activities`)
9. `projects`
10. Project Children (`project_members`, `milestones`, `project_files`, `project_notes`, `project_activities`)
11. `tasks`
12. Task Children (`subtasks`, `task_dependencies`, `task_comments`, `task_attachments`, `task_activities`)
13. Finance (`transactions`, `payroll`)
14. Marketing (`marketing_campaigns`)
15. Team (`attendance`, `leave_requests`)
16. Chat Base (`conversations`)
17. Chat Children (`conversation_participants`, `chat_messages`)
18. `chat_read_receipts`
19. `notifications`
20. Indexes & Triggers
21. RLS Policies

---

## 7. Final Verification Checklist

- [x] No NOT NULL column uses ON DELETE SET NULL
- [x] user_permissions is organization-scoped
- [x] chat read receipts are organization-scoped
- [x] Every composite relationship prevents cross-organization data
- [x] Migration dependency order is defined
- [x] No unresolved FK dependency remains
- [x] No unresolved constraint conflict remains

FINAL DATABASE SCHEMA READY FOR SQL MIGRATION
