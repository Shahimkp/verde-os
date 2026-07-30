/* ==========================================================================
   VERDE OS — FRONTEND DATA MODELS & DTO FACTORIES
   REST API Compatible Models (Spring Boot Target)
   ========================================================================== */

(function () {
  'use strict';

  window.VerdeModels = {
    User: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'Employee', // Admin, Manager, Employee, Client
        avatar: data.avatar || '',
        initials: data.initials || '',
        department: data.department || '',
        status: data.status || 'Active'
      };
    },

    Client: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        company: data.company || '',
        contactName: data.contactName || '',
        email: data.email || '',
        status: data.status || 'Active', // Active, Onboarding, Negotiation, Inactive
        assignedTo: data.assignedTo || 'Shahim',
        activeProjects: data.activeProjects || 0,
        totalRevenue: data.totalRevenue || 0
      };
    },

    Lead: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        clientName: data.clientName || '',
        company: data.company || '',
        dealValue: data.dealValue || '$0',
        stage: data.stage || 'Lead', // Lead, Contacted, Proposal, Negotiation, Won
        owner: data.owner || 'Shahim',
        lastContactDate: data.lastContactDate || ''
      };
    },

    Project: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        name: data.name || '',
        client: data.client || '',
        progress: data.progress || 0,
        status: data.status || 'Active', // Active, At Risk, Completed, On Hold
        dueDate: data.dueDate || '',
        team: data.team || []
      };
    },

    Task: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        title: data.title || '',
        project: data.project || '',
        priority: data.priority || 'Medium', // Critical, High, Medium, Low
        assignee: data.assignee || 'Shahim',
        assigneeInitials: data.assigneeInitials || 'SH',
        status: data.status || 'To Do', // To Do, In Progress, Review, Completed
        dueDate: data.dueDate || ''
      };
    },

    Invoice: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        invoiceNumber: data.invoiceNumber || '',
        client: data.client || '',
        description: data.description || '',
        amount: data.amount || 0,
        type: data.type || 'Income', // Income, Expense
        status: data.status || 'Completed', // Completed, Pending, Processing
        date: data.date || ''
      };
    },

    Meeting: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        client: data.client || '',
        time: data.time || '',
        purpose: data.purpose || '',
        status: data.status || 'Scheduled'
      };
    },

    Report: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        name: data.name || '',
        category: data.category || '',
        author: data.author || '',
        generatedDate: data.generatedDate || '',
        status: data.status || 'Ready'
      };
    },

    Notification: function (data) {
      data = data || {};
      return {
        id: data.id || null,
        title: data.title || '',
        subtitle: data.subtitle || '',
        time: data.time || '',
        read: !!data.read,
        type: data.type || 'info' // info, alert, mention, success
      };
    }
  };

})();
