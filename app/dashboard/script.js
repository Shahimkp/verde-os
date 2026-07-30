/* ==========================================================================
   VERDE OS — MISSION CONTROL: EXECUTIVE COMMAND CENTER SCRIPT
   Live clock, dynamic greeting, task tab switching
   ========================================================================== */

(function () {
  'use strict';

  // ── Dynamic Greeting ──
  function updateGreeting() {
    const h = new Date().getHours();
    let greeting = 'Good Evening';
    if (h < 12) greeting = 'Good Morning';
    else if (h < 17) greeting = 'Good Afternoon';

    const el = document.getElementById('mc-greeting');
    if (el) el.textContent = greeting + ', Shahim';
  }

  // ── Live Clock (updates every second) ──
  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('mc-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
  }

  // ── Live Date ──
  function updateDate() {
    const now = new Date();
    const dateEl = document.getElementById('mc-date');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // ── Topbar Date (existing app expects this) ──
  function updateTopbarDate() {
    const dateEl = document.querySelector('.topbar-date');
    if (dateEl) {
      const d = new Date();
      const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = d.toLocaleDateString('en-US', opts);
    }
  }

  // ── Task Tab Switching ──
  function initTaskTabs() {
    const tabs = document.querySelectorAll('.mc-task-tab');
    const panels = document.querySelectorAll('.mc-tasks-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const target = this.getAttribute('data-tab');

        // Update active tab
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');

        // Show corresponding panel
        panels.forEach(function (p) { p.classList.remove('active'); });
        const targetPanel = document.querySelector('.mc-tasks-panel[data-panel="' + target + '"]');
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // ── Footer Time ──
  function updateFooterTime() {
    const el = document.getElementById('mc-footer-time');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  // ── Initialize Everything ──
  function init() {
    updateGreeting();
    updateClock();
    updateDate();
    updateTopbarDate();
    updateFooterTime();
    initTaskTabs();

    // Update clock every second
    setInterval(updateClock, 1000);

    // Update greeting every minute (in case user crosses time boundary)
    setInterval(updateGreeting, 60000);

    // Update footer time every minute
    setInterval(updateFooterTime, 60000);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();