# VERDE OS: Master Backend Architecture Blueprint

**Version:** 1.0  
**Stack:** Java Spring Boot, PostgreSQL, JWT, Redis (Cache/PubSub)  
**Objective:** Provide a scalable, secure, and highly performant backend for VERDE OS, acting as the centralized brain for all agency operations (CRM, Projects, Team, Finance).

---

## 1. Architectural Strategy: Monolith vs. Microservices

### Recommendation: Modular Monolith
For VERDE LABS' current agency scale and foreseeable product roadmap, a **Modular Monolith** is the optimal choice. 

**Why not Microservices?**
Microservices introduce immense operational complexity (distributed transactions, service discovery, inter-service latency). Given that VERDE OS relies heavily on highly relational data (e.g., an Invoice belongs to a Project which belongs to a Client managed by an Employee), splitting these into microservices would result in a distributed data nightmare.

**Why Modular Monolith?**
A Modular Monolith keeps deployment simple (a single Spring Boot `.jar` file) while enforcing strict logical boundaries within the codebase. If the Finance module ever needs to scale independently in the future, it can easily be extracted because the internal module boundaries are strictly enforced.

---

## 2. Codebase & Package Structure

The Spring Boot application will follow a **Domain-Driven Design (DDD)** folder structure.

```text
com.verdelabs.os
├── core/                   # Cross-cutting concerns (Security, Auth, Exceptions)
│   ├── config/             # Spring Security, CORS, Swagger configs
│   ├── security/           # JWT Filters, UserDetailsServiceImpl, RBAC evaluation
│   └── exceptions/         # GlobalExceptionHandler, Custom Exceptions
├── modules/                # The isolated domains
│   ├── team/               # Employees, Departments, Roles, Attendance
│   ├── crm/                # Leads, Proposals, Clients
│   ├── projects/           # Epics, Tasks, Milestones, Comments
│   ├── finance/            # Invoices, Quotations, Expenses, Payments
│   └── communication/      # Notifications, Chat, Emails
└── VerdeOsApplication.java
```

### Layered Architecture (Per Module)
Every module strictly adheres to:
- **`controller/`**: REST Endpoints (Validates HTTP requests).
- **`dto/`**: Data Transfer Objects (Request/Response shapes).
- **`service/`**: Business Logic.
- **`model/`**: JPA Entities.
- **`repository/`**: Spring Data JPA Interfaces.

*Rule:* Controllers can only speak to Services. Services can only speak to Repositories.

---

## 3. Database Architecture (PostgreSQL)

The database relies on strict normalization to prevent data anomalies. Soft deletes (`deleted_at`) will be utilized globally instead of hard deletes to preserve audit trails.

### 3.1. Team & IAM (Identity & Access Management)

**Table: `departments`**
- `id` (UUID, PK)
- `name` (VARCHAR, Unique, Indexed)
- `head_id` (UUID, FK -> employees.id)

**Table: `roles`**
- `id` (UUID, PK)
- `name` (VARCHAR, Unique) - e.g., "Managing Director", "Developer"
- `permissions` (JSONB) - e.g., `{"crm": ["READ", "WRITE"], "finance": ["READ"]}`

**Table: `employees`**
- `id` (UUID, PK)
- `department_id` (UUID, FK -> departments.id, Indexed)
- `role_id` (UUID, FK -> roles.id, Indexed)
- `manager_id` (UUID, FK -> employees.id, Nullable)
- `full_name` (VARCHAR)
- `email` (VARCHAR, Unique, Indexed)
- `password_hash` (VARCHAR)
- `employment_status` (ENUM: ACTIVE, ON_LEAVE, INACTIVE)
- `created_at` (TIMESTAMP)

### 3.2. CRM & Sales

**Table: `clients`**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `company_name` (VARCHAR, Indexed)
- `email` (VARCHAR, Unique)
- `status` (ENUM: LEAD, ACTIVE, FORMER)
- `assigned_sales_id` (UUID, FK -> employees.id)

**Table: `leads`**
- `id` (UUID, PK)
- `client_id` (UUID, FK -> clients.id)
- `service_required` (VARCHAR)
- `estimated_value` (DECIMAL)
- `stage` (ENUM: NEW, QUALIFIED, MEETING, NEGOTIATION, WON, LOST)
- `priority` (ENUM: LOW, MEDIUM, HIGH)

### 3.3. Project Execution

**Table: `projects`**
- `id` (UUID, PK)
- `client_id` (UUID, FK -> clients.id, Indexed)
- `manager_id` (UUID, FK -> employees.id)
- `name` (VARCHAR)
- `status` (ENUM: PLANNING, ACTIVE, REVIEW, DELIVERED)
- `start_date` (TIMESTAMP)
- `target_date` (TIMESTAMP)

**Table: `tasks`**
- `id` (UUID, PK)
- `project_id` (UUID, FK -> projects.id, Indexed)
- `assignee_id` (UUID, FK -> employees.id, Indexed)
- `title` (VARCHAR)
- `status` (ENUM: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)
- `priority` (ENUM: LOW, MEDIUM, HIGH, URGENT)
- `due_date` (TIMESTAMP)

**Table: `task_comments`**
- `id` (UUID, PK)
- `task_id` (UUID, FK -> tasks.id)
- `author_id` (UUID, FK -> employees.id)
- `content` (TEXT)
- `created_at` (TIMESTAMP)

### 3.4. Finance Center

**Table: `quotations`**
- `id` (UUID, PK)
- `client_id` (UUID, FK -> clients.id)
- `project_id` (UUID, FK -> projects.id, Nullable)
- `total_amount` (DECIMAL)
- `status` (ENUM: DRAFT, SENT, ACCEPTED, REJECTED)

**Table: `invoices`**
- `id` (UUID, PK)
- `quotation_id` (UUID, FK -> quotations.id, Nullable)
- `client_id` (UUID, FK -> clients.id, Indexed)
- `total_amount` (DECIMAL)
- `amount_paid` (DECIMAL)
- `due_date` (TIMESTAMP)
- `status` (ENUM: PENDING, PARTIALLY_PAID, PAID, OVERDUE)

**Table: `payments`**
- `id` (UUID, PK)
- `invoice_id` (UUID, FK -> invoices.id)
- `amount` (DECIMAL)
- `payment_method` (VARCHAR)
- `payment_date` (TIMESTAMP)

**Table: `expenses`**
- `id` (UUID, PK)
- `category` (ENUM: SOFTWARE, SALARY, MARKETING, OFFICE)
- `vendor` (VARCHAR)
- `amount` (DECIMAL)
- `recorded_by` (UUID, FK -> employees.id)
- `expense_date` (TIMESTAMP)

---

## 4. Security & Role-Based Access Control (RBAC)

### 4.1 Authentication Flow
1. **Login:** Employee POSTs `/api/auth/login` with email/password.
2. **Verify:** Spring Security compares password hashes using `BCrypt`.
3. **Generate:** System issues a short-lived `JWT Access Token` (15 mins) and an HttpOnly, secure `Refresh Token` cookie (7 days).
4. **Subsequent Requests:** Frontend passes JWT in the `Authorization: Bearer <token>` header.

### 4.2 Authorization Flow (RBAC)
Role definitions are stored in the `roles` table as JSONB structures. We will use Spring Security's `@PreAuthorize` annotations on controllers.

```java
// Example Controller Enforcement
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @PreAuthorize("hasAuthority('finance:read')")
    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceDTO>> getInvoices() { ... }

    @PreAuthorize("hasAuthority('finance:write')")
    @PostMapping("/invoices")
    public ResponseEntity<InvoiceDTO> createInvoice(...) { ... }
}
```
*Note:* The "Managing Director" role inherently maps to `*:*` (God Mode).

---

## 5. API Architecture & REST Endpoints

APIs follow strict RESTful conventions, returning standard JSON payloads mapped from DTOs (Data Transfer Objects) to prevent exposing raw database schemas.

### 5.1 Auth & Team APIs
- `POST /api/auth/login` - Authenticate user.
- `POST /api/auth/refresh` - Refresh JWT using cookie.
- `GET /api/employees` - List all employees (supports `?departmentId=` filtering).
- `POST /api/employees` - Create new employee (Auto-generates ID & temporary password).
- `GET /api/employees/{id}/workload` - Fetches active tasks & projects.

### 5.2 CRM APIs
- `GET /api/leads` - Fetch Kanban board data.
- `PATCH /api/leads/{id}/stage` - Move lead across Kanban columns.
- `GET /api/clients/{id}/timeline` - Aggregates meetings, notes, and invoices for Lead Details view.

### 5.3 Project & Task APIs
- `POST /api/projects` - Triggers automated folder provisioning.
- `GET /api/projects/{id}/tasks` - Returns task hierarchy.
- `PATCH /api/tasks/{id}/status` - Move task from Todo -> In Progress.

### 5.4 Finance APIs
- `GET /api/finance/dashboard` - Returns aggregated MTD Revenue, Expenses, Net Profit.
- `POST /api/finance/invoices` - Generate new invoice.
- `POST /api/finance/payments` - Record payment against invoice.

---

## 6. Real-time, Events, and Automations

### 6.1 Event-Driven Architecture (Spring ApplicationEvents)
Instead of tightly coupling modules (e.g., Finance directly calling CRM logic), we use Domain Events.

**Example: Payment Received Automation**
1. Finance user records Advance Payment on `INV-001`.
2. `FinanceService` publishes `InvoicePaidEvent`.
3. `ProjectService` listens to event -> Unlocks Project Creation Workflow.
4. `NotificationService` listens to event -> Sends WebSocket push to Managing Director: *"Advance received from Nova Corp."*

### 6.2 Real-time (WebSockets)
We will use **Spring WebSockets with STOMP** over SockJS.
- **`/topic/notifications/{employeeId}`**: Pushes instant notifications (e.g., "You were assigned Task-14").
- **`/topic/projects/{projectId}`**: Broadcasts task state changes so the Kanban board updates instantly for all observing users without refreshing.

---

## 7. Storage, Logging, & Future-Proofing

### 7.1 File Storage (Attachments, Proposals, Receipts)
- Files will be stored via an `S3StorageService` interface.
- Initially, this can map to local storage (`/var/uploads`).
- For production scalability, this will seamlessly swap to **AWS S3** or **Cloudflare R2** with zero codebase refactoring.

### 7.2 Audit Logging
A global `@Aspect` (AOP) will intercept all `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- Writes to `audit_logs` table: `[Timestamp] | [User UUID] | [Action: UPDATE_TASK] | [Entity ID] | [Old Value -> New Value]`
- Essential for enterprise compliance and tracking who changed a financial record.

### 7.3 Multi-Tenant SaaS Readiness (Future Expansion)
While VERDE OS is currently an internal tool, the database is designed with future SaaS pivoting in mind. 
- Introduce a `tenant_id` to all core tables.
- Implement Hibernate Filters to automatically append `WHERE tenant_id = ?` to every single database query based on the authenticated user's JWT context.
