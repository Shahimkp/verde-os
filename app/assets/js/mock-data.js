/* ==========================================================================
   VERDE OS — CENTRALIZED MOCK DATASET
   Single Source of Truth for VERDE LABS
   ========================================================================== */

(function () {
  'use strict';

  window.VerdeMockData = {
    user: {
      id: 'USR-001',
      name: 'Shahim',
      email: 'shahim@verdelabs.co',
      role: 'Admin',
      avatar: 'SH',
      department: 'Executive',
      status: 'Active'
    },

    employees: [
      { id: 'EMP-001', name: 'Shahim', role: 'CEO', department: 'Executive', initials: 'SH', avatarBg: 'var(--primary)', status: 'Online', workload: '100%' },
      { id: 'EMP-002', name: 'Midhul', role: 'Full Stack Developer', department: 'Engineering', initials: 'MI', avatarBg: 'var(--success)', status: 'Online', workload: '85%' },
      { id: 'EMP-003', name: 'Ameen', role: 'UI/UX Designer', department: 'Design', initials: 'AM', avatarBg: 'var(--warning)', status: 'Busy', workload: '60%' },
      { id: 'EMP-004', name: 'Nihal', role: 'Marketing Executive', department: 'Marketing', initials: 'NH', avatarBg: 'var(--text-3)', status: 'Offline', workload: '45%' }
    ],

    clients: [
      { id: 'CLI-001', company: 'Cabo Travels', contactName: 'Elena Rodriguez', email: 'elena@cabotravels.com', status: 'Active', assignedTo: 'Shahim', activeProjects: 2, totalRevenue: '$45,000' },
      { id: 'CLI-002', company: 'GreenLeaf', contactName: 'Marcus Thorne', email: 'm.thorne@greenleaf.io', status: 'Onboarding', assignedTo: 'Shahim', activeProjects: 1, totalRevenue: '$28,000' },
      { id: 'CLI-003', company: 'BlueWave Tech', contactName: 'Michael Chang', email: 'michael@bluewave.com', status: 'Negotiation', assignedTo: 'Midhul', activeProjects: 1, totalRevenue: '$62,000' },
      { id: 'CLI-004', company: 'Vertex Systems', contactName: 'David Chen', email: 'd.chen@vertex.net', status: 'Active', assignedTo: 'Nihal', activeProjects: 1, totalRevenue: '$34,000' }
    ],

    leads: [
      { id: 'LED-001', clientName: 'Sarah Jenkins', company: 'Vertex Systems', dealValue: '$15,000', stage: 'Proposal', owner: 'Shahim', lastContact: 'Today, 10:30 AM' },
      { id: 'LED-002', clientName: 'David Chen', company: 'Cabo Travels', dealValue: '$8,500', stage: 'Contacted', owner: 'Ameen', lastContact: 'Yesterday' },
      { id: 'LED-003', clientName: 'Marcus Thorne', company: 'GreenLeaf', dealValue: '$22,000', stage: 'Negotiation', owner: 'Shahim', lastContact: 'Aug 14, 2026' },
      { id: 'LED-004', clientName: 'Michael Chang', company: 'BlueWave Tech', dealValue: '$45,000', stage: 'Won', owner: 'Midhul', lastContact: 'Aug 12, 2026' }
    ],

    projects: [
      { id: 'PRJ-001', name: 'Cabo Travels Website', client: 'Cabo Travels', progress: 65, status: 'Active', dueDate: 'Aug 30, 2026', team: ['SH', 'MI'] },
      { id: 'PRJ-002', name: 'GreenLeaf Branding', client: 'GreenLeaf', progress: 30, status: 'Active', dueDate: 'Sep 15, 2026', team: ['NH'] },
      { id: 'PRJ-003', name: 'BlueWave CRM Portal', client: 'BlueWave Tech', progress: 85, status: 'At Risk', dueDate: 'Aug 05, 2026', team: ['SH', 'NH'] },
      { id: 'PRJ-004', name: 'Vertex Systems API', client: 'Vertex Systems', progress: 100, status: 'Completed', dueDate: 'Jul 25, 2026', team: ['MI'] }
    ],

    tasks: [
      { id: 'TSK-001', title: 'Review Cabo Homepage', project: 'Cabo Travels', priority: 'Critical', assignee: 'Shahim', assigneeInitials: 'SH', status: 'To Do', dueDate: 'Today' },
      { id: 'TSK-002', title: 'Approve Invoice #INV-204', project: 'Finance', priority: 'High', assignee: 'Ameen', assigneeInitials: 'AM', status: 'Review', dueDate: 'Yesterday' },
      { id: 'TSK-003', title: 'Finalize Proposal', project: 'BlueWave Tech', priority: 'High', assignee: 'Shahim', assigneeInitials: 'SH', status: 'In Progress', dueDate: 'Today' },
      { id: 'TSK-004', title: 'Client Meeting Preparation', project: 'GreenLeaf Branding', priority: 'Medium', assignee: 'Nihal', assigneeInitials: 'NH', status: 'To Do', dueDate: 'Tomorrow' },
      { id: 'TSK-005', title: 'Deploy Landing Page', project: 'Vertex Systems API', priority: 'Medium', assignee: 'Midhul', assigneeInitials: 'MI', status: 'In Progress', dueDate: 'Today' },
      { id: 'TSK-006', title: 'Database Schema Review', project: 'BlueWave Tech', priority: 'Low', assignee: 'Shahim', assigneeInitials: 'SH', status: 'Completed', dueDate: 'Today' }
    ],

    invoices: [
      { id: 'INV-1044', invoiceNumber: 'INV-1044', client: 'Cabo Travels', description: 'Design Sprint Phase 2', amount: 4500.00, type: 'Income', status: 'Completed', date: 'Aug 14, 2026' },
      { id: 'INV-1043', invoiceNumber: 'INV-1043', client: 'AWS Hosting', description: 'Monthly Server Infrastructure', amount: 340.00, type: 'Expense', status: 'Completed', date: 'Aug 13, 2026' },
      { id: 'INV-1042', invoiceNumber: 'INV-1042', client: 'GreenLeaf', description: 'Design Retainer (Aug)', amount: 2000.00, type: 'Income', status: 'Completed', date: 'Aug 12, 2026' },
      { id: 'INV-1041', invoiceNumber: 'INV-1041', client: 'Workspace Co', description: 'Office Rent', amount: 1800.00, type: 'Expense', status: 'Completed', date: 'Aug 10, 2026' },
      { id: 'INV-1040', invoiceNumber: 'INV-1040', client: 'BlueWave Tech', description: 'API Integration Phase 1', amount: 6200.00, type: 'Income', status: 'Processing', date: 'Aug 08, 2026' }
    ],

    meetings: [
      { id: 'MTG-001', client: 'Cabo Travels', time: '10:30 AM', purpose: 'Sprint Review', status: 'Confirmed' },
      { id: 'MTG-002', client: 'GreenLeaf', time: '02:00 PM', purpose: 'Brand Concept Feedback', status: 'Pending' },
      { id: 'MTG-003', client: 'BlueWave Tech', time: '04:15 PM', purpose: 'Integration Sign-off', status: 'Confirmed' }
    ],

    reports: [
      { id: 'REP-001', name: 'Monthly Revenue Report', category: 'Revenue', author: 'Nihal', generatedDate: 'Aug 01, 2026', status: 'Ready' },
      { id: 'REP-002', name: 'Client Growth Report', category: 'Sales', author: 'Shahim', generatedDate: 'Jul 28, 2026', status: 'Ready' },
      { id: 'REP-003', name: 'Project Performance Report', category: 'Projects', author: 'Ameen', generatedDate: 'Jul 15, 2026', status: 'Ready' },
      { id: 'REP-004', name: 'SEO Performance Report', category: 'Marketing', author: 'Midhul', generatedDate: 'Jul 10, 2026', status: 'Ready' },
      { id: 'REP-005', name: 'Team Productivity Report', category: 'Team', author: 'Nihal', generatedDate: 'Jul 01, 2026', status: 'Ready' }
    ],

    notifications: [
      { id: 'NTF-001', title: 'Midhul mentioned you in Vertex Systems API', subtitle: '"@Shahim Can you review the payload structure?"', time: '10 mins ago', read: false, type: 'mention' },
      { id: 'NTF-002', title: 'Ameen requested approval for Annual Leave', subtitle: 'Aug 18 - Aug 20 (3 days)', time: '1 hour ago', read: false, type: 'alert' },
      { id: 'NTF-003', title: 'GreenLeaf signed Project Contract', subtitle: 'Contract #GL-2026-B signed', time: '3 hours ago', read: true, type: 'success' }
    ]
  };

})();
