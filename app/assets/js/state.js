/* ==========================================================================
   VERDE OS — GLOBAL REACTION APPLICATION STATE STORE
   Subscribable State Management for REST Integration
   ========================================================================== */

(function () {
  'use strict';

  var state = {
    user: null,
    token: null,
    isAuthenticated: false,
    workspace: {
      id: 'WS-VERDE',
      name: 'VERDE LABS',
      plan: 'Enterprise',
      timezone: 'UTC-08:00 (Pacific Time)',
      currency: 'USD ($)'
    },
    theme: 'light',
    sidebarCollapsed: false,
    notifications: [],
    unreadNotificationCount: 0,
    permissions: []
  };

  var listeners = {};

  window.VerdeState = {
    init: function () {
      if (window.VerdeMockData) {
        state.user = window.VerdeMockData.user;
        state.token = 'mock-jwt-token-verde-labs';
        state.isAuthenticated = true;
        state.notifications = window.VerdeMockData.notifications || [];
        state.unreadNotificationCount = state.notifications.filter(function (n) { return !n.read; }).length;
      }
      this.notify('*', state);
    },

    get: function (key) {
      if (!key) return state;
      return state[key];
    },

    set: function (key, value) {
      state[key] = value;
      this.notify(key, value);
      this.notify('*', state);
    },

    subscribe: function (key, callback) {
      if (typeof callback !== 'function') return;
      if (!listeners[key]) listeners[key] = [];
      listeners[key].push(callback);
    },

    notify: function (key, value) {
      if (listeners[key]) {
        listeners[key].forEach(function (cb) {
          try { cb(value); } catch (e) { console.error('State subscriber error:', e); }
        });
      }
    },

    toggleSidebar: function () {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      this.notify('sidebarCollapsed', state.sidebarCollapsed);
      this.notify('*', state);
    }
  };

})();
