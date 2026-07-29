# VERDE OS: Master Architecture Blueprint

**Tagline:** The Operating System for Modern Execution.
**Vision:** Become the single source of truth for VERDE LABS, scaling from a digital solutions agency to an "Everything Solutions Company."

---

## 1. Core Product Philosophy & Design Tenets

1. **Execution Over Administration:** Employees shouldn't spend time managing their work; they should spend time doing it. The system must eliminate the question, *"What should I work on?"*
2. **Contextual Isolation:** Data is only shown to those who need it. Employees see execution; Executives see analytics.
3. **Asynchronous Communication:** Eliminate noisy, synchronous chat (like Slack). Communication happens strictly within the context of Tasks and Projects.
4. **Opinionated Defaults:** Workflows are strict. A task goes from *Todo* → *In Progress* → *In Review* → *Done*. No custom, confusing states.
5. **AI as an Enabler:** AI operates silently in the background (predicting delays, estimating times, summarizing updates), stepping in only to assist Executives with strategic intelligence.

---

## 2. Role-Based Permissions & Access Control (RBAC)

VERDE OS operates on strict, role-based contextual boundaries.

*   **Executive (CEO, Co-Founder):** God-mode access. Can view Company Analytics, Revenue, Profit, Executive Intelligence, all CRM data, all Projects, and cross-company Employee Performance.
*   **Management (Finance, HR, Department Leads):** Department-level access. Can view specific modules (e.g., Payroll, Leave Approvals, Department Budgets). Cannot view global profitability unless authorized.
*   **Execution (Developer, SEO, Marketing, Media):** Strictly execution-focused. **Cannot** see Revenue, Profit, Executive Analytics, AI Strategic Suggestions, or sensitive company data. Only sees their assigned tasks, relevant files, and direct communications.

---

## 3. Navigation Hierarchy & Information Architecture

The sidebar completely transforms based on the authenticated user's role.

### 3.1 Executive Hierarchy (CEO View)
*   **Mission Control** (Global Dashboard)
*   **Intelligence** (AI Analytics & Forecasting)
*   **CRM & Sales** (Pipeline & Clients)
*   **Projects** (Global oversight)
*   **Finance** (Inflow/Outflow)
*   **Team & HR** (Performance & Approvals)
*   **Settings** (Global Config)

### 3.2 Employee Hierarchy (Execution View)
*   **My Work** (Daily Execution Dashboard)
*   **My Tasks** (Kanban/List of all assigned work)
*   **Projects** (Only assigned projects)
*   **Messages** (Task/Project-specific inbox)
*   **Files** (Relevant assets & uploads)
*   **Calendar** (Deadlines & Meetings)
*   **Attendance & Performance** (Clock-in, personal metrics)

---

## 4. Complete Module Breakdown

### Module 1: Mission Control (Executive Dashboard)
*   **Purpose:** The 5-second CEO pulse check.
*   **Screens:** Master Dashboard.
*   **Features:** AI Morning Briefing, Company Health KPIs (Revenue, Churn, Velocity), Projects Radar, Team Activity Feed, Pending Approvals.
*   **Access:** Executive Only.
*   **Future Improvements:** Predictive forecasting for cash flow based on historical execution velocity.

### Module 2: My Work (Employee Workspace)
*   **Purpose:** Remove confusion; focused execution environment.
*   **Screens:** Employee Dashboard.
*   **Features:** Today's Direction (MD Announcements), Active Task Timer, Prioritized Pipeline, Upcoming Deadlines, Time Logging, Check-in/out.
*   **Access:** Execution & Management.
*   **Future Improvements:** Desktop app with global keyboard shortcuts to start/stop task timers anywhere.

### Module 3: Projects & Tasks
*   **Purpose:** The core execution engine.
*   **Screens:** Project List, Project Board (Kanban), Task Details Modal, Timeline/Gantt.
*   **Features:** Epics/Projects, Tasks, Sub-tasks, Dependencies, Issue IDs (e.g., VER-123), Checklists, Attachments.
*   **Access:** All roles (Filtered by assignment).
*   **Future Improvements:** Automated project health scoring (Green/Yellow/Red) based on task velocity vs. deadline.

### Module 4: CRM & Client Management
*   **Purpose:** Manage the lifecycle from Lead to Retained Client.
*   **Screens:** Pipeline (Kanban), Client Profiles, Communications Log, Proposals.
*   **Features:** Lead stages, deal values, contact management, meeting notes history.
*   **Access:** Executive, Sales.
*   **Future Improvements:** Automated LinkedIn data scraping to enrich client profiles upon lead creation.

### Module 5: Finance & Invoicing
*   **Purpose:** Money in, money out.
*   **Screens:** Revenue Dashboard, Invoices, Expenses, Payroll.
*   **Features:** Automated invoice generation, payment tracking, expense approval workflows, profit margins per project.
*   **Access:** Executive, Finance.
*   **Future Improvements:** Stripe/Bank API direct integrations for real-time reconciliation without manual entry.

### Module 6: HR & Attendance
*   **Purpose:** Manage the human capital.
*   **Screens:** Team Directory, Attendance Log, Leave Requests, Performance Reviews.
*   **Features:** Clock-in/out tracking, leave balances, automated timesheets, skill matrix.
*   **Access:** Executive, HR (Employees see personal view only).
*   **Future Improvements:** Automated burnout detection flagging employees logging excessive overtime.

### Module 7: Intelligence (AI Analytics)
*   **Purpose:** Strategic planning and insights.
*   **Screens:** Query Interface, Visualized Reports.
*   **Features:** Natural language querying of company data, custom report generation, bottleneck identification.
*   **Access:** Executive Only.
*   **Future Improvements:** AI auto-generating the optimal hiring roadmap based on project pipeline bottlenecks.

---

## 5. Complete Lifecycles & Workflows

### 5.1 Project Lifecycle
1.  **Initiation:** Deal won in CRM. Budget and timeline established.
2.  **Planning:** MD/Manager generates tasks. (AI suggests task templates for "Website" vs "ERP").
3.  **Execution:** Tasks assigned. Tracked asynchronously via 'My Work'.
4.  **Review:** QA or MD approval stage.
5.  **Delivery:** Client handoff. System triggers an automated invoice draft.

### 5.2 Task Lifecycle
1.  **Backlog:** Created but unassigned/unscheduled.
2.  **Todo:** Assigned and queued for the employee.
3.  **In Progress:** Employee clicks "Start Working" (Timer begins).
4.  **In Review:** Work submitted for approval.
5.  **Done:** Approved and closed.
*(Note: Strict state machine enforcement prevents tasks from being stuck in undefined states).*

### 5.3 Client Management Flow
1.  **Capture:** Lead enters CRM via web webhook.
2.  **Qualification:** Sales engages, updates status.
3.  **Proposal Sent:** Generated directly from VERDE OS templates.
4.  **Won:** Lead converts to Active Client.
5.  **Onboarding:** System automatically provisions a "New Client Onboarding" project with standard tasks.

### 5.4 Attendance Lifecycle
1.  **Check-In:** Employee clicks "Check In" on My Work dashboard.
2.  **Active:** Time is logged strictly against active task timers.
3.  **Check-Out:** Employee checks out, prompting a "Daily Summary" modal to confirm accomplishments.
4.  **Approval:** Auto-approved by HR unless flagged for anomalies.

### 5.5 Employee Lifecycle
1.  **Recruitment:** Applicant tracked in HR module.
2.  **Onboarding:** Automated checklist (Software provisioning, document signing).
3.  **Active:** Continuous performance tracking based on task completion velocity and hours logged.
4.  **Offboarding:** 1-click access revocation workflow across VERDE OS.

### 5.6 Finance Lifecycle
1.  **Quotation:** Linked to CRM deal.
2.  **Invoice:** Triggered by project milestone completion.
3.  **Collection:** Automated follow-up reminders to the client.
4.  **Reconciliation:** Logged against company revenue and project profitability.

### 5.7 Sales Lifecycle
1.  **Prospecting** → 2. **Discovery** → 3. **Proposal** → 4. **Negotiation** → 5. **Closed Won/Lost**.

### 5.8 Marketing Lifecycle
1.  **Campaign Planning:** Created in Projects module.
2.  **Asset Creation:** Tasks assigned to Media/Design team.
3.  **Distribution:** Logged in Marketing calendar.
4.  **Analysis:** ROI and lead source tracked via CRM & Intelligence module.

---

## 6. User Journeys

**The "Start of Day" Journey (Developer)**
1.  Logs into VERDE OS. Lands cleanly on "My Work".
2.  Reads "Today's Direction" (MD's priority broadcast).
3.  Reviews prioritized task pipeline.
4.  Clicks "Start Working" on the top priority task. Timer begins.
5.  Stays in this view until the task is complete.

**The "Pulse Check" Journey (CEO)**
1.  Opens VERDE OS. Lands on Mission Control.
2.  Reads AI Briefing: *"Cashflow is healthy. GreenLeaf project is at risk of delay."*
3.  Reviews high-level KPIs (Revenue, Active Projects).
4.  Approves 3 pending leave requests directly from the dashboard widget.
5.  Types a new "Today's Direction" and broadcasts it to the Execution team.

---

## 7. Systems Architecture & Entity Relationships

The relational data model forms the backbone of the OS.

*   **User (Employee):** Has One Role, Has Many Tasks, Has Many TimeLogs, Has Many Messages.
*   **Client:** Has Many Projects, Has Many Invoices, Has Many Contacts.
*   **Project:** Belongs To Client, Has Many Tasks, Has One Budget.
*   **Task:** Belongs To Project, Assigned To User, Has Many TimeLogs, Has Many Comments.
*   **Invoice:** Belongs To Client, Belongs To Project.
*   **Message/Comment:** Polymorphic (Can belong to a Task, Project, or Client).

---

## 8. Internal Communication & Notification System

**Philosophy: Contextual & Asynchronous.**
*   **No Global Chat:** Avoid Slack-style noise and lost context.
*   **Contextual Threads:** All communication happens inside the specific Task or Project thread (e.g., asking a question about a design happens *on* the design task).
*   **Inbox Model:** A dedicated "Messages" module acts like an Inbox (similar to Linear's Inbox). Notifications stay unread until explicitly actioned or dismissed.
*   **Urgent Routing:** "Urgent" tagged messages trigger email or mobile push notifications. Standard updates remain silent in the app.

---

## 9. Automation Opportunities

1.  **Task Auto-Assignment:** Based on current workload and skill matrix (e.g., assigning a React task to the developer with the fewest active tasks).
2.  **Status Rollups:** When all sub-tasks reach "Done", the parent Epic/Project automatically moves to "Review".
3.  **Client Status Emails:** System auto-emails clients weekly with a sanitized progress report based on completed project tasks.
4.  **Invoice Generation:** Auto-drafts an invoice the moment a project status hits "Delivered".

---

## 10. AI Opportunities (Integrated Intelligence)

1.  **Executive Natural Language Queries:** CEO can ask, *"What is our projected revenue for Q3 based on the current pipeline?"* and get real-time charted responses.
2.  **Task Duration Estimation:** AI analyzes past completion times by a specific employee and flags if an estimated time is unrealistic.
3.  **Automated Morning Briefing:** AI reviews yesterday's completed tasks, flagged delays, and upcoming deadlines, summarizing them into the CEO's Morning Briefing.
4.  **Meeting Transcription to Tasks:** AI ingests audio from a client meeting and automatically drafts a proposed task list in the CRM.

---

## 11. Future Expansion Modules

To support the vision of an "Everything Solutions Company":

1.  **VERDE Client Portal:** An external-facing web portal for clients to log in, view live project progress, approve designs, and pay invoices via Stripe.
2.  **VERDE Desk (Ticketing):** Integrated helpdesk for IT/Support retainers, allowing clients to submit tickets that automatically become VERDE OS Tasks.
3.  **VERDE CMS:** A built-in headless Content Management System, allowing the VERDE team to manage data for all their client's websites natively from within VERDE OS.
