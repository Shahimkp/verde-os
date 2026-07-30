/* ==========================================================================
   VERDE OS — ROLE HANDLING & PERMISSIONS SYSTEM
   Prepares frontend authorization matrix for Spring Boot Security
   ========================================================================== */

(function () {
  'use strict';

  var rolePermissions = {
    Admin: [
      'workspace.read', 'workspace.write', 'workspace.admin',
      'projects.read', 'projects.write', 'projects.delete',
      'tasks.read', 'tasks.write', 'tasks.delete',
      'crm.read', 'crm.write', 'crm.delete',
      'finance.read', 'finance.write',
      'reports.read', 'reports.create',
      'team.manage', 'settings.manage', 'ai.access'
    ],

    Manager: [
      'workspace.read',
      'projects.read', 'projects.write',
      'tasks.read', 'tasks.write',
      'crm.read', 'crm.write',
      'reports.read', 'reports.create',
      'team.read', 'ai.access'
    ],

    Employee: [
      'workspace.read',
      'projects.read',
      'tasks.read', 'tasks.write',
      'crm.read',
      'reports.read',
      'ai.access'
    ],

    Client: [
      'projects.read',
      'tasks.read'
    ]
  };

  window.VerdePermissions = {
    getRole: function () {
      var user = window.VerdeState ? window.VerdeState.get('user') : null;
      return (user && user.role) ? user.role : 'Employee';
    },

    hasPermission: function (permission) {
      var role = this.getRole();
      var allowed = rolePermissions[role] || [];
      return allowed.indexOf(permission) !== -1;
    },

    canManageTeam: function () {
      return this.hasPermission('team.manage');
    },

    canManageFinance: function () {
      return this.hasPermission('finance.write');
    },

    canDeleteProject: function () {
      return this.hasPermission('projects.delete');
    }
  };

})();
