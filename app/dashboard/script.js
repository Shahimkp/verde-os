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
    
    // Sync with Projects
    syncDashboardWithProjects();
    
    // Sync with CRM
    syncDashboardWithCRM();
  }

  // ── Sync Dashboard with CRM ──
  function syncDashboardWithCRM() {
    if (window.VerdeServices && window.VerdeServices.Crm) {
      Promise.all([
        window.VerdeServices.Crm.getClients(),
        window.VerdeServices.Crm.getLeads()
      ]).then(function(results) {
        var clients = results[0] || [];
        var leads = results[1] || [];
        
        var activeClients = clients.filter(function(c) { return c.status === 'Active'; }).length;
        var totalRevenue = clients.reduce(function(sum, c) { return sum + (c.revenue || 0); }, 0);
        
        var clientKpiEl = document.getElementById('dashboard-kpi-clients');
        if (clientKpiEl) clientKpiEl.textContent = activeClients;
        
        var revKpiEl = document.getElementById('dashboard-kpi-revenue');
        if (revKpiEl) {
          revKpiEl.textContent = '₹' + (totalRevenue / 100000).toFixed(1) + 'L';
        }
      });
    }
  }
  window.syncDashboardWithCRM = syncDashboardWithCRM;

  // ── Sync Dashboard with Projects ──
  function syncDashboardWithProjects() {
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjects().then(function(projects) {
        if (!projects) return;
        
        var activeProjects = projects.filter(function(p) { return !p.isDeleted && !p.isArchived; });
        var numActive = activeProjects.length;

        var kpiEl = document.getElementById('dashboard-kpi-projects');
        if (kpiEl) kpiEl.textContent = numActive;

        // Render Active Projects (Top 4)
        var projListEl = document.getElementById('dashboard-active-projects');
        if (projListEl) {
          projListEl.innerHTML = '';
          var topProjects = activeProjects.slice(0, 4);
          topProjects.forEach(function(p) {
            var pct = p.progress || 0;
            var color = pct > 80 ? 'var(--success)' : (pct > 40 ? 'var(--primary)' : 'var(--warning)');
            var badgeText = p.status === 'Completed' ? 'Done' : (pct > 80 ? 'On Track' : (pct > 40 ? 'In Progress' : 'Review'));
            var badgeClass = p.status === 'Completed' ? 'badge-success' : (pct > 80 ? 'badge-success' : (pct > 40 ? 'badge-primary' : 'badge-warning'));

            var avatarsHtml = (p.team || ['SH']).map(function(m) {
              return '<div class="mc-avatar">' + m + '</div>';
            }).join('');

            var html = '<div class="mc-project-card">' +
              '<div>' +
                '<div class="mc-project-title">' + p.name + '</div>' +
                '<div class="mc-project-client">' + p.client + '</div>' +
              '</div>' +
              '<div class="mc-project-meta">' +
                '<span style="color:' + color + ';font-weight:700;">' + pct + '%</span>' +
                '<span style="color:var(--text-3);">' + (p.dueDate || 'N/A') + '</span>' +
              '</div>' +
              '<div class="mc-project-bar">' +
                '<div class="mc-project-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div class="mc-avatars">' + avatarsHtml + '</div>' +
                '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
              '</div>' +
            '</div>';
            projListEl.innerHTML += html;
          });
        }

        // Render Recent Activity Feed
        var activityFeedEl = document.getElementById('dashboard-recent-activity');
        if (activityFeedEl) {
          activityFeedEl.innerHTML = '';
          var allActivities = [];
          projects.forEach(function(p) {
            if (p.activities) {
              p.activities.forEach(function(a) {
                allActivities.push({
                  projName: p.name,
                  action: a.action,
                  details: a.details,
                  user: a.user,
                  date: new Date(a.date)
                });
              });
            }
          });
          
          allActivities.sort(function(a, b) { return b.date.getTime() - a.date.getTime(); });
          var recentActs = allActivities.slice(0, 5);
          
          recentActs.forEach(function(act) {
            var timeStr = act.date.toLocaleDateString() + ' ' + act.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            var initials = act.user.substring(0,2).toUpperCase();
            var bgColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
            var color = bgColors[Math.floor(Math.random() * bgColors.length)];
            
            var html = '<div class="mc-activity-item">' +
              '<div class="mc-avatar" style="width:32px;height:32px;font-size:11px;background:' + color + ';color:#fff;">' + initials + '</div>' +
              '<div>' +
                '<div class="mc-activity-text"><strong>' + act.user + '</strong>: ' + act.action + ' on <strong>' + act.projName + '</strong></div>' +
                '<div class="mc-activity-time">' + timeStr + ' &bull; ' + act.details + '</div>' +
              '</div>' +
            '</div>';
            activityFeedEl.innerHTML += html;
          });
        }
      });
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();