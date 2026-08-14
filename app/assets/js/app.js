/* ==========================================================================
   VERDE OS — APPLICATION ENTRY POINT & ORCHESTRATOR
   Initializes State, Components, Services, Navigation & Permissions
   ========================================================================== */

(function () {
  'use strict';

  // --- FIREBASE FOUNDATION INJECTION ---
  (function() {
    const scripts = [
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js",
      "../assets/js/firebase/config.js",
      "../assets/js/firebase/service.js"
    ];
    
    function loadScript(src) {
      return new Promise(function(resolve, reject) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    async function loadFirebase() {
      try {
        for (let i = 0; i < scripts.length; i++) {
          await loadScript(scripts[i]);
        }
      } catch (e) {
        console.error("[VERDE OS] Failed to load Firebase foundation scripts", e);
      }
    }
    
    loadFirebase();
  })();
  // -------------------------------------

    window.updateNotificationUI = function() {
    if (!window.VerdeServices || !window.VerdeServices.Notifications) return;
    window.VerdeServices.Notifications.getNotifications().then(notifs => {
      const dropdown = document.getElementById('notifications-dropdown');
      const toggleDot = document.querySelector('#topbar-notifications-toggle .dot');
      if (!dropdown) return;
      
      const unreadCount = notifs.filter(n => !n.read).length;
      if (toggleDot) {
        if (unreadCount > 0) {
          toggleDot.style.display = 'block';
          toggleDot.style.background = 'var(--danger)';
          toggleDot.style.position = 'absolute';
          toggleDot.style.top = '4px';
          toggleDot.style.right = '6px';
          toggleDot.style.width = '8px';
          toggleDot.style.height = '8px';
          toggleDot.style.borderRadius = '50%';
        } else {
          toggleDot.style.display = 'none';
        }
      }
      
      let html = `<div style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid var(--border-subtle); font-size: 12px; display:flex; justify-content:space-between; align-items:center;">
        <span>Notifications</span>
        <span style="font-size:11px;color:var(--primary);cursor:pointer;" id="mark-all-read">Mark all as read</span>
      </div>`;
      
      if (notifs.length === 0) {
        html += `<div style="padding: 24px; text-align: center; color: var(--text-3); font-size: 12px;">No notifications.</div>`;
      } else {
        notifs.slice(0, 10).forEach(n => {
           const bg = n.read ? 'transparent' : 'var(--primary-10)';
           html += `<div class="dropdown-item" style="background:${bg}; border-bottom: 1px solid var(--border-subtle);">
             <div>
               <div style="font-weight: 600; font-size: 12px; color: var(--text-1);">${n.title}</div>
               <div style="font-size: 11px; color: var(--text-2);">${n.desc}</div>
               <div style="font-size: 10px; color: var(--text-3); margin-top: 4px;">${new Date(n.createdAt).toLocaleString()}</div>
             </div>
           </div>`;
        });
      }
      
      dropdown.innerHTML = html;
      
      const markBtn = document.getElementById('mark-all-read');
      if (markBtn) {
        markBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          window.VerdeServices.Notifications.markAsRead().then(() => {
            window.updateNotificationUI();
          });
        });
      }
    });
  };

  window.VERDE_APP = {
    version: '2.0.0-REST-READY',
    name: 'VERDE OS Shared Framework Orchestrator',
    intervals: [],

    clearIntervals: function() {
      this.intervals.forEach(clearInterval);
      this.intervals = [];
    },

    init: function () {
      // Wrapper for setInterval to track and clear them on SPA navigation
      if (!window.__verdeIntervalWrapped) {
        const originalSetInterval = window.setInterval;
        window.setInterval = function (fn, delay) {
          const id = originalSetInterval(fn, delay);
          window.VERDE_APP.intervals.push(id);
          return id;
        };
        window.__verdeIntervalWrapped = true;
      }

      // 0. Initialize Global App State Store
      if (window.VerdeState && typeof window.VerdeState.init === 'function') {
        window.VerdeState.init();
      }

      // 1. Render Layout Components into placeholder IDs
      if (window.VERDE_COMPONENTS && typeof window.VERDE_COMPONENTS.render === 'function') {
        window.VERDE_COMPONENTS.render();
      }

      // 2. Initialize Navigation & Active Link Controllers
      if (window.VERDE_NAVIGATION && typeof window.VERDE_NAVIGATION.init === 'function') {
        window.VERDE_NAVIGATION.init();
      }

      // 3. Initialize Session & User UI Binding
      if (window.VERDE_SESSION && typeof window.VERDE_SESSION.init === 'function') {
        window.VERDE_SESSION.init();
      }

      // 4. Update Notifications
      if (window.updateNotificationUI) window.updateNotificationUI();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.VERDE_APP.init();
    });
  } else {
    window.VERDE_APP.init();
  }
})();
