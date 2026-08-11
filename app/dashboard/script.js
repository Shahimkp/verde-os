/* ==========================================================================
   VERDE OS — MISSION CONTROL: EXECUTIVE COMMAND CENTER SCRIPT
   Personalized, data-driven dashboard using existing VERDE OS services.
   ========================================================================== */

(function () {
  'use strict';

  // ── Helpers ──
  function getUser() {
    if (window.VERDE_SESSION && window.VERDE_SESSION.getUser) {
      return window.VERDE_SESSION.getUser();
    }
    return null;
  }

  function getUserFirstName() {
    var user = getUser();
    if (user && user.name) return user.name.split(' ')[0];
    return 'User';
  }

  function getUserId() {
    var user = getUser();
    if (!user) return '';
    return user.userId || user.id || '';
  }

  function isSuperAdmin() {
    var user = getUser();
    return user && user.role === 'SuperAdmin';
  }

  function canAccessModule(mod) {
    if (isSuperAdmin()) return true;
    if (window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.modules) {
      return window.VERDE_PERMISSIONS.modules[mod] !== false;
    }
    return true; // default allow if permissions not loaded
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── 1. Dynamic Greeting ──
  function updateGreeting() {
    var h = new Date().getHours();
    var greeting = 'Good Evening';
    if (h < 12) greeting = 'Good Morning';
    else if (h < 17) greeting = 'Good Afternoon';

    var el = document.getElementById('mc-hero-greeting');
    if (el) el.textContent = greeting + ', ' + getUserFirstName() + ' \ud83d\udc4b';
  }

  // ── 2. Dynamic Date ──
  function updateHeroDate() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    var el = document.getElementById('mc-hero-date');
    if (el) el.textContent = dateStr + ' \u00b7 Your daily intelligence briefing';
  }

  // ── Live Clock (updates every second) ──
  function updateClock() {
    var now = new Date();
    var clockEl = document.getElementById('mc-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
  }

  // ── Topbar Date (existing app expects this) ──
  function updateTopbarDate() {
    var dateEl = document.querySelector('.topbar-date');
    if (dateEl) {
      var d = new Date();
      dateEl.textContent = d.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  // ── Footer Time ──
  function updateFooterTime() {
    var el = document.getElementById('mc-footer-time');
    if (el) {
      var now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
  }

  // ── 3. Dynamic Calendar ──
  function renderCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var today = now.getDate();

    var monthLabel = document.getElementById('mc-cal-month');
    if (monthLabel) {
      monthLabel.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    var grid = document.getElementById('mc-cal-grid');
    if (!grid) return;

    var firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    // Convert to Monday-start: Mon=0, Tue=1, ..., Sun=6
    var startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrevMonth = new Date(year, month, 0).getDate();

    var html = '';

    // Previous month trailing days
    for (var p = startOffset - 1; p >= 0; p--) {
      html += '<div class="mc-cal-day fade">' + (daysInPrevMonth - p) + '</div>';
    }

    // Current month days
    for (var d = 1; d <= daysInMonth; d++) {
      var cls = 'mc-cal-day';
      if (d === today) cls += ' active';
      html += '<div class="' + cls + '">' + d + '</div>';
    }

    // Fill remaining cells to complete 6-row grid (42 cells)
    var totalCells = startOffset + daysInMonth;
    var remaining = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
    for (var n = 1; n <= remaining; n++) {
      html += '<div class="mc-cal-day fade">' + n + '</div>';
    }

    grid.innerHTML = html;
  }

  // ── Task Tab Switching ──
  function initTaskTabs() {
    var tabs = document.querySelectorAll('.mc-task-tab');
    var panels = document.querySelectorAll('.mc-tasks-panel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        panels.forEach(function (p) { p.classList.remove('active'); });
        var targetPanel = document.querySelector('.mc-tasks-panel[data-panel="' + target + '"]');
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // ── 4. Hero Stats + 5. AI Recommendation + 6. Today's Mission ──
  function syncHeroAndMission() {
    var userName = getUserFirstName();

    if (window.VerdeServices && window.VerdeServices.Tasks) {
      window.VerdeServices.Tasks.getTasks().then(function (tasks) {
        tasks = tasks || [];
        var now = new Date();
        var todayIso = now.toISOString().split('T')[0];

        function isDueToday(t) {
          if (!t.dueDate) return false;
          var dd = String(t.dueDate).trim().toLowerCase();
          if (dd === 'today') return true;
          if (dd.includes(todayIso)) return true;
          try {
            var dt = new Date(t.dueDate);
            if (!isNaN(dt.getTime())) {
              return dt.getFullYear() === now.getFullYear() &&
                     dt.getMonth() === now.getMonth() &&
                     dt.getDate() === now.getDate();
            }
          } catch(e) {}
          return false;
        }

        function isOverdue(t) {
          if (!t.dueDate || t.status === 'Completed' || t.status === 'Archived') return false;
          try {
            var dt = new Date(t.dueDate);
            return !isNaN(dt.getTime()) && dt < now;
          } catch(e) { return false; }
        }

        function isMyTask(t) {
          if (isSuperAdmin()) return true; // SuperAdmin sees all
          var n = userName.toLowerCase();
          return (t.assignee && t.assignee.toLowerCase().includes(n)) ||
                 (t.assigneeId && (t.assigneeId === getUserId()));
        }

        var myTasks = tasks.filter(function(t) {
          return !t.isArchived && t.status !== 'Archived' && isMyTask(t);
        });
        var completedTasks = myTasks.filter(function(t) { return t.status === 'Completed'; });
        var activeTasks = myTasks.filter(function(t) { return t.status !== 'Completed'; });
        var dueTodayTasks = activeTasks.filter(isDueToday);
        var overdueTasks = activeTasks.filter(isOverdue);
        var criticalTasks = activeTasks.filter(function(t) {
          return t.priority === 'Critical' || t.priority === 'High';
        });

        // Hero: Today's Focus
        var focusEl = document.getElementById('mc-stat-focus');
        if (focusEl) {
          var dtCount = dueTodayTasks.length;
          focusEl.textContent = dtCount > 0
            ? dtCount + ' task' + (dtCount > 1 ? 's' : '') + ' due today'
            : 'No tasks due today \u2714';
        }

        // Hero: Critical
        var critEl = document.getElementById('mc-stat-critical');
        if (critEl) {
          var topCritical = overdueTasks.length > 0
            ? overdueTasks[0]
            : (criticalTasks.length > 0 ? criticalTasks[0] : null);
          if (topCritical) {
            critEl.textContent = (topCritical.title || topCritical.name || 'Task') + (isOverdue(topCritical) ? ' (overdue!)' : ' needs attention');
          } else {
            critEl.textContent = 'No critical items \u2714';
          }
        }

        // Today's Mission stats
        var total = myTasks.length;
        var done = completedTasks.length;
        var remaining = total - done;
        var pct = total > 0 ? Math.round((done / total) * 100) : 0;

        var pctEl = document.getElementById('mc-progress-pct');
        if (pctEl) pctEl.textContent = pct + '%';
        var ringEl = document.getElementById('mc-progress-ring');
        if (ringEl) ringEl.style.setProperty('--percentage', pct);

        var doneEl = document.getElementById('mc-tasks-done');
        if (doneEl) doneEl.innerHTML = done + '<span style="font-size:14px;color:var(--text-3);font-weight:600;">/' + total + '</span>';

        var remEl = document.getElementById('mc-tasks-remaining');
        if (remEl) remEl.textContent = remaining;

        var prodEl = document.getElementById('mc-productivity');
        if (prodEl) prodEl.textContent = pct;

        // AI Recommendation
        var aiEl = document.getElementById('mc-ai-text');
        if (aiEl) {
          var rec = '';
          if (overdueTasks.length > 0) {
            rec = 'Focus on <strong>' + esc(overdueTasks[0].title || overdueTasks[0].name) + '</strong> first \u2014 it\'s overdue and needs immediate attention.';
            if (overdueTasks.length > 1) {
              rec += ' You have ' + (overdueTasks.length - 1) + ' more overdue task' + (overdueTasks.length > 2 ? 's' : '') + ' to address after that.';
            }
          } else if (dueTodayTasks.length > 0) {
            rec = 'Prioritize <strong>' + esc(dueTodayTasks[0].title || dueTodayTasks[0].name) + '</strong> \u2014 it\'s due today.';
            if (dueTodayTasks.length > 1) {
              rec += ' Then tackle the ' + (dueTodayTasks.length - 1) + ' other task' + (dueTodayTasks.length > 2 ? 's' : '') + ' due today.';
            }
          } else if (criticalTasks.length > 0) {
            rec = 'Your next priority should be <strong>' + esc(criticalTasks[0].title || criticalTasks[0].name) + '</strong> \u2014 it\'s marked as ' + (criticalTasks[0].priority || 'High') + ' priority.';
          } else if (activeTasks.length > 0) {
            rec = 'You\'re on track! Continue working on <strong>' + esc(activeTasks[0].title || activeTasks[0].name) + '</strong>. No urgent deadlines right now.';
          } else {
            rec = 'All clear! No pending tasks. Great time to plan ahead or review upcoming projects.';
          }
          aiEl.innerHTML = '<strong>AI RECOMMENDATION</strong><br>' + rec;
        }

        // Pinned Tasks — top 4 high-priority active tasks
        renderPinnedTasks(activeTasks);
      });
    }
  }

  // ── Pinned Tasks ──
  function renderPinnedTasks(activeTasks) {
    var container = document.getElementById('mc-pinned-tasks');
    var countEl = document.getElementById('mc-pinned-count');
    if (!container) return;

    // Sort: Critical > High > Medium > Low, then by due date
    var priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    var sorted = activeTasks.slice().sort(function(a, b) {
      var pa = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 4;
      var pb = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 4;
      if (pa !== pb) return pa - pb;
      var da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      var db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });

    var topTasks = sorted.slice(0, 4);
    if (countEl) countEl.textContent = topTasks.length + ' task' + (topTasks.length !== 1 ? 's' : '');

    if (topTasks.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No pending tasks</div>';
      return;
    }

    container.innerHTML = topTasks.map(function(t) {
      return '<div class="mc-pinned-task">' +
        '<div class="mc-pinned-check"></div>' +
        '<div class="mc-pinned-title">' + esc(t.title || t.name || 'Untitled') + '</div>' +
      '</div>';
    }).join('');
  }

  // ── 7. Meetings — from CRM client meetings ──
  function syncMeetings() {
    var listEl = document.getElementById('mc-meetings-list');
    var heroMeetingsEl = document.getElementById('mc-stat-meetings');
    if (!listEl) return;

    if (window.VerdeServices && window.VerdeServices.Crm) {
      window.VerdeServices.Crm.getClients().then(function(clients) {
        var now = new Date();
        var todayIso = now.toISOString().split('T')[0];
        var upcomingMeetings = [];

        (clients || []).forEach(function(c) {
          if (!c.meetings) return;
          c.meetings.forEach(function(m) {
            if (m.status === 'Completed' || m.status === 'Cancelled') return;
            // Include scheduled meetings
            upcomingMeetings.push({
              time: m.time || '—',
              title: m.notes || 'Meeting',
              sub: c.company || c.contactPerson || '',
              date: m.date || ''
            });
          });
        });

        // Sort by date, then time
        upcomingMeetings.sort(function(a, b) {
          var da = a.date ? new Date(a.date).getTime() : Infinity;
          var db = b.date ? new Date(b.date).getTime() : Infinity;
          if (da !== db) return da - db;
          return (a.time || '').localeCompare(b.time || '');
        });

        var topMeetings = upcomingMeetings.slice(0, 3);

        // Hero stat
        if (heroMeetingsEl) {
          if (topMeetings.length > 0) {
            heroMeetingsEl.textContent = topMeetings.length + ' upcoming meeting' + (topMeetings.length > 1 ? 's' : '');
          } else {
            heroMeetingsEl.textContent = 'No meetings scheduled';
          }
        }

        if (topMeetings.length === 0) {
          listEl.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No upcoming meetings</div>';
          return;
        }

        listEl.innerHTML = topMeetings.map(function(m) {
          return '<div class="mc-meeting-item">' +
            '<div class="mc-meeting-time">' + esc(m.time) + '</div>' +
            '<div>' +
              '<div class="mc-meeting-title">' + esc(m.title) + '</div>' +
              '<div class="mc-meeting-sub">' + esc(m.sub) + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      });
    } else {
      // No CRM service — show empty state
      if (heroMeetingsEl) heroMeetingsEl.textContent = 'No meetings scheduled';
      listEl.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No upcoming meetings</div>';
    }
  }

  // ── 8. Quick Notes (per-user persistence) ──
  function initQuickNotes() {
    var textarea = document.getElementById('mc-quick-note');
    if (!textarea) return;
    var key = 'verde_mc_notes_' + getUserId();
    var saved = localStorage.getItem(key);
    if (saved) textarea.value = saved;

    textarea.addEventListener('input', function() {
      localStorage.setItem(key, this.value);
    });
  }

  // ── 9. Hours Worked (sync with My Work focus session) ──
  function syncHoursWorked() {
    try {
      var sessionStr = localStorage.getItem('verde_mywork_focus_session');
      var historyStr = localStorage.getItem('verde_mywork_focus_history');
      var currentSessionSeconds = 0;
      if (sessionStr) {
        var session = JSON.parse(sessionStr);
        if (session && session.status === 'active') {
          currentSessionSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
        }
      }

      var historyElapsed = 0;
      if (historyStr) {
        var history = JSON.parse(historyStr);
        historyElapsed = history.reduce(function(total, s) { return total + (s.elapsedSeconds || 0); }, 0);
      }

      var totalHours = (historyElapsed + currentSessionSeconds) / 3600;

      var hoursEl = document.getElementById('mc-hours-worked');
      if (hoursEl) {
        hoursEl.innerHTML = totalHours.toFixed(1) + '<span style="font-size:14px;color:var(--text-3);font-weight:600;">h</span>';
      }
    } catch(e) {}
  }
  window.syncDashboardWithMyWork = syncHoursWorked;

  // ── 10. Permission Awareness ──
  function applyPermissions() {
    // Company Health (finance-related)
    var healthSection = document.querySelector('.mc-health-grid');
    if (healthSection && !canAccessModule('finance')) {
      healthSection.closest('section').style.display = 'none';
    }

    // Team Performance
    var perfGrid = document.getElementById('mc-performance-grid');
    if (perfGrid && !canAccessModule('team')) {
      perfGrid.closest('section').style.display = 'none';
    }

    // Pending Approvals (admin-only)
    if (!isSuperAdmin()) {
      var approvalSections = document.querySelectorAll('.mc-section-title');
      approvalSections.forEach(function(t) {
        if (t.textContent.trim() === 'Pending Approvals') {
          var sec = t.closest('section');
          if (sec) sec.style.display = 'none';
        }
      });
    }
  }

  // ── 11. Team Performance ──
  function syncTeamPerformance() {
    var grid = document.getElementById('mc-performance-grid');
    if (!grid) return;

    // Only show to users with team access
    if (!canAccessModule('team')) return;

    try {
      var teamStored = localStorage.getItem('verde_os_team_employees');
      if (teamStored) {
        var teamEmps = JSON.parse(teamStored);
        var activeEmps = teamEmps.filter(function(e) { return e.status === 'Active'; });

        if (activeEmps.length > 0) {
          var bgColors = ['var(--primary)', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
          grid.innerHTML = activeEmps.slice(0, 4).map(function(emp, i) {
            var initials = (emp.name || '??').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
            var bgColor = bgColors[i % bgColors.length];
            return '<div class="mc-perf-card">' +
              '<div class="mc-perf-avatar" style="background:' + bgColor + ';">' + initials + '</div>' +
              '<div style="flex: 1;">' +
                '<div class="mc-perf-name" style="margin-bottom: 4px;">' + esc(emp.name) + '</div>' +
                '<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-3);">' +
                  '<span>' + esc(emp.department || '\u2014') + '</span>' +
                  '<span>' + esc(emp.role || '\u2014') + '</span>' +
                  '<span style="color: var(--success); font-weight: 700;">' + esc(emp.status || 'Active') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('');
        }
      }
      // If no team data found, keep the existing hardcoded HTML as fallback
    } catch(e) {
      // Keep existing HTML on error
    }
  }

  // ── Sync with CRM (revenue, clients) ──
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
          revKpiEl.textContent = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L';
        }

        // Hero revenue stat
        var heroRevEl = document.getElementById('mc-stat-revenue');
        if (heroRevEl) {
          heroRevEl.innerHTML = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L this month \u00b7 ' + activeClients + ' active client' + (activeClients !== 1 ? 's' : '');
        }
      });
    }
  }
  window.syncDashboardWithCRM = syncDashboardWithCRM;

  // ── Sync with Tasks (dashboard KPIs) ──
  function syncDashboardWithTasks() {
    if (window.VerdeServices && window.VerdeServices.Tasks) {
      window.VerdeServices.Tasks.getTasks().then(function(tasks) {
        if (!tasks) return;

        var kpiTasks = document.getElementById('dashboard-kpi-tasks');
        if (kpiTasks) kpiTasks.textContent = tasks.length;
      });
    }
  }
  window.syncDashboardWithTasks = syncDashboardWithTasks;

  // ── Sync with Projects (active projects, activity feed) ──
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
                '<div class="mc-project-title">' + esc(p.name) + '</div>' +
                '<div class="mc-project-client">' + esc(p.client || '') + '</div>' +
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

          if (recentActs.length === 0) {
            activityFeedEl.innerHTML = '<div class="mc-activity-item"><div style="font-size:12px;color:var(--text-3);">No recent activity</div></div>';
          } else {
            var bgColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
            recentActs.forEach(function(act, idx) {
              var timeStr = act.date.toLocaleDateString() + ' ' + act.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
              var initials = act.user.substring(0,2).toUpperCase();
              var color = bgColors[idx % bgColors.length];

              var html = '<div class="mc-activity-item">' +
                '<div class="mc-avatar" style="width:32px;height:32px;font-size:11px;background:' + color + ';color:#fff;">' + initials + '</div>' +
                '<div>' +
                  '<div class="mc-activity-text"><strong>' + esc(act.user) + '</strong>: ' + esc(act.action) + ' on <strong>' + esc(act.projName) + '</strong></div>' +
                  '<div class="mc-activity-time">' + timeStr + ' \u2022 ' + esc(act.details || '') + '</div>' +
                '</div>' +
              '</div>';
              activityFeedEl.innerHTML += html;
            });
          }
        }
      });
    }
  }

  // ── Initialize Everything ──
  function init() {
    updateGreeting();
    updateHeroDate();
    updateClock();
    updateTopbarDate();
    updateFooterTime();
    initTaskTabs();
    renderCalendar();
    initQuickNotes();

    // Personalized data sync
    syncHeroAndMission();
    syncMeetings();
    syncDashboardWithProjects();
    syncDashboardWithCRM();
    syncDashboardWithTasks();
    syncHoursWorked();
    syncTeamPerformance();

    // Permission enforcement
    applyPermissions();

    // Update clock every second
    setInterval(updateClock, 1000);

    // Update greeting every minute (in case user crosses time boundary)
    setInterval(updateGreeting, 60000);

    // Update footer time every minute
    setInterval(updateFooterTime, 60000);

    // Sync hours worked every second (tracks active focus session)
    setInterval(syncHoursWorked, 1000);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();