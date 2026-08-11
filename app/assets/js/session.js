/* ==========================================================================
   VERDE OS — SESSION MANAGER
   Log In Session State & User Profile Initialization
   ========================================================================== */

(function () {
  'use strict';

  const DEFAULT_USER = {
    id: 'usr_01',
    name: 'Shahim',
    initials: 'SH',
    email: 'shahim@verdelabs.com',
    role: 'SuperAdmin',
    workspace: 'VERDE LABS',
    avatarUrl: '',
    loggedIn: true,
    lastActive: new Date().toISOString()
  };

  window.VERDE_SESSION = {
    initCore: function () {
      const path = window.location.pathname;
      const isAuthPage = path.includes('/auth/');
      
      const stored = localStorage.getItem('verde_session');
      let currentUser = null;

      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {}
      }

      if (!currentUser && !isAuthPage) {
        window.location.href = '../auth/index.html';
        return null;
      }

      if (currentUser) {
        this.loadPermissions(currentUser);
        this.enforceGlobalPermissions();
      }
      return currentUser;
    },

    initUI: function (currentUser) {
      if (currentUser) {
        this.applyToUI(currentUser);
      }
    },

    loadPermissions: function (user) {
      const isSuperAdmin = user.role === 'SuperAdmin';
      const ALL_MODULES = ['dashboard', 'my-work', 'crm', 'projects', 'tasks', 'team', 'finance', 'marketing', 'ai-hub', 'workspace', 'reports', 'settings'];
      let perms = { modules: {}, actions: {} };

      if (isSuperAdmin) {
        ALL_MODULES.forEach(m => perms.modules[m] = true);
        window.VERDE_PERMISSIONS = {
          modules: perms.modules,
          can: () => true
        };
      } else {
        try {
          const raw = localStorage.getItem('verde_permissions');
          const allPerms = raw ? JSON.parse(raw) : {};
          const uId = user.userId || user.id;
          
          if (allPerms[uId]) {
            perms = allPerms[uId];
            if (!perms.modules) perms.modules = {};
            if (!perms.actions) perms.actions = {};
          } else {
            ['dashboard', 'my-work', 'tasks', 'projects'].forEach(m => perms.modules[m] = true);
            ['tasks_view', 'tasks_edit', 'projects_view'].forEach(a => perms.actions[a] = true);
          }
        } catch(e) {
          ['dashboard', 'my-work', 'tasks', 'projects'].forEach(m => perms.modules[m] = true);
        }

        window.VERDE_PERMISSIONS = {
          modules: perms.modules,
          can: (action) => perms.actions[action] === true
        };
      }
    },

    enforceGlobalPermissions: function () {
      const path = window.location.pathname;
      if (path.includes('/auth/')) return;

      const p = window.VERDE_PERMISSIONS;
      if (!p) return;

      const match = path.match(/\/app\/([^/]+)\//);
      if (match) {
        let mod = match[1];
        if (mod === 'global') mod = 'settings';
        
        if (p.modules[mod] === false) {
          window.location.href = '../dashboard/index.html';
        }
      }
    },

    getUser: function () {
      try {
        return JSON.parse(localStorage.getItem('verde_session')) || DEFAULT_USER;
      } catch (e) {
        return DEFAULT_USER;
      }
    },

    applyToUI: function (user) {
      if (!user) return;

      const sidebarName = document.getElementById('sidebar-user-name');
      const sidebarRole = document.getElementById('sidebar-user-role');
      const sidebarAvatar = document.getElementById('sidebar-user-avatar');
      const profileToggle = document.getElementById('topbar-profile-toggle');
      const profileDropdownName = document.getElementById('profile-dropdown-name');

      if (sidebarName) sidebarName.textContent = user.name || 'Shahim';
      if (sidebarRole) sidebarRole.textContent = `${user.workspace || 'VERDE LABS'} ${user.role || 'Admin'}`;
      if (sidebarAvatar) sidebarAvatar.textContent = user.initials || 'SH';
      if (profileToggle) profileToggle.textContent = user.initials || 'SH';
      if (profileDropdownName) profileDropdownName.textContent = `${user.name} (${user.role || 'Admin'})`;
    },

    clearSession: function () {
      localStorage.removeItem('verde_session');
      window.location.href = '../auth/index.html';
    }
  };

  const currentUser = window.VERDE_SESSION.initCore();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.VERDE_SESSION.initUI(currentUser);
    });
  } else {
    window.VERDE_SESSION.initUI(currentUser);
  }
})();

