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
    init: function () {
      const stored = localStorage.getItem('verde_session');
      let currentUser = DEFAULT_USER;

      if (!stored) {
        localStorage.setItem('verde_session', JSON.stringify(DEFAULT_USER));
      } else {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {
          currentUser = DEFAULT_USER;
        }
      }

      this.applyToUI(currentUser);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.VERDE_SESSION.init();
    });
  } else {
    window.VERDE_SESSION.init();
  }
})();

