-- Verde OS Initial Schema Migration
-- Designed strictly from docs/database-architecture.md

-- =====================================================================================
-- 1. EXTENSIONS & FUNCTIONS
-- =====================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================================================
-- 2. WORKSPACE & IDENTITY (organizations, users, roles, permissions, organization_members)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    email VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    avatar_bg VARCHAR,
    initials VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department VARCHAR,
    workload VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id),
    UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL,
    PRIMARY KEY (organization_id, user_id, permission_id),
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE CASCADE
);

-- =====================================================================================
-- 3. CRM BASE (leads, clients)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    company VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    source VARCHAR,
    priority VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'New Lead',
    value NUMERIC NOT NULL DEFAULT 0,
    assigned_to UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, assigned_to) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company VARCHAR NOT NULL,
    contact_person VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    industry VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Active',
    revenue NUMERIC NOT NULL DEFAULT 0,
    lead_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, lead_id) REFERENCES leads(organization_id, id) ON DELETE SET NULL
);

-- =====================================================================================
-- 4. CRM CHILDREN
-- =====================================================================================
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    client_id UUID NOT NULL,
    lead_id UUID,
    value NUMERIC NOT NULL DEFAULT 0,
    valid_until DATE,
    status VARCHAR NOT NULL DEFAULT 'Sent',
    assigned_to UUID,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, client_id) REFERENCES clients(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, lead_id) REFERENCES leads(organization_id, id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id, assigned_to) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    purpose VARCHAR,
    client_id UUID,
    lead_id UUID,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTERVAL NOT NULL,
    owner_id UUID NOT NULL,
    notes TEXT,
    status VARCHAR NOT NULL DEFAULT 'Scheduled',
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, client_id) REFERENCES clients(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, lead_id) REFERENCES leads(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, owner_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    author_id UUID NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, client_id) REFERENCES clients(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, author_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, lead_id) REFERENCES leads(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

-- =====================================================================================
-- 5. PROJECTS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    client_id UUID,
    category VARCHAR,
    priority VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Active',
    start_date DATE NOT NULL,
    due_date DATE,
    budget NUMERIC NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deliverables TEXT,
    notes TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, client_id) REFERENCES clients(organization_id, id) ON DELETE RESTRICT
);

-- =====================================================================================
-- 6. PROJECT CHILDREN
-- =====================================================================================
CREATE TABLE IF NOT EXISTS project_members (
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'Member',
    workload VARCHAR,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, project_id, user_id),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    assignee_id UUID,
    due_date DATE,
    status VARCHAR NOT NULL DEFAULT 'Pending',
    completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, assignee_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    size_bytes INTEGER NOT NULL,
    url VARCHAR NOT NULL,
    uploader_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, uploader_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    author_id UUID NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, author_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

-- =====================================================================================
-- 7. TASKS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    project_id UUID,
    assignee_id UUID,
    status VARCHAR NOT NULL DEFAULT 'To Do',
    priority VARCHAR,
    due_date DATE,
    estimated_hours NUMERIC NOT NULL DEFAULT 0 CHECK (estimated_hours >= 0),
    tags JSONB,
    recurrence VARCHAR NOT NULL DEFAULT 'None',
    reminder VARCHAR NOT NULL DEFAULT 'None',
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, project_id) REFERENCES projects(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, assignee_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

-- =====================================================================================
-- 8. TASK CHILDREN
-- =====================================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
    organization_id UUID NOT NULL,
    task_id UUID NOT NULL,
    depends_on_task_id UUID NOT NULL,
    PRIMARY KEY (organization_id, task_id, depends_on_task_id),
    FOREIGN KEY (organization_id, task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, depends_on_task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    title VARCHAR NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    author_id UUID NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, author_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    size_bytes INTEGER NOT NULL,
    url VARCHAR NOT NULL,
    uploader_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, uploader_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, task_id) REFERENCES tasks(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

-- =====================================================================================
-- 9. FINANCE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR NOT NULL,
    client_id UUID,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Completed',
    date DATE NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, invoice_number),
    FOREIGN KEY (organization_id, client_id) REFERENCES clients(organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    emp_id UUID NOT NULL,
    month VARCHAR NOT NULL,
    basic NUMERIC(12,2) NOT NULL DEFAULT 0,
    allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
    bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, emp_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

-- =====================================================================================
-- 10. MARKETING
-- =====================================================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    budget NUMERIC(12,2),
    status VARCHAR NOT NULL DEFAULT 'Draft',
    perf VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 11. TEAM (ATTENDANCE & LEAVE)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    total_hours INTERVAL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id, date),
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    leave_type VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR NOT NULL DEFAULT 'Pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date),
    CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id, reviewed_by) REFERENCES organization_members(organization_id, user_id) ON DELETE SET NULL
);

-- =====================================================================================
-- 12. CHAT
-- =====================================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('direct', 'team')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    organization_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, conversation_id, user_id),
    FOREIGN KEY (organization_id, conversation_id) REFERENCES conversations(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, conversation_id) REFERENCES conversations(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, sender_id) REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS chat_read_receipts (
    organization_id UUID NOT NULL,
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, message_id, user_id),
    FOREIGN KEY (organization_id, message_id) REFERENCES chat_messages(organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE CASCADE
);

-- =====================================================================================
-- 13. NOTIFICATIONS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    title VARCHAR NOT NULL,
    description TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, user_id) REFERENCES organization_members(organization_id, user_id) ON DELETE CASCADE
);

-- =====================================================================================
-- 14. TRIGGERS
-- =====================================================================================
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================================================
-- 15. ENABLE ROW LEVEL SECURITY
-- =====================================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 16. INDEXES
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
