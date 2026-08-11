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

  function getUserInitials() {
    var user = getUser();
    if (user && user.initials) return user.initials;
    var name = getUserFirstName();
    return name.substring(0, 2).toUpperCase();
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
    return true;
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 1 — RIGHT SIDEBAR PULL BAR
  // ══════════════════════════════════════════════════════════════════════════
  function initSidebarToggle() {
    var pullBar = document.getElementById('mc-sidebar-pull');
    var layout = document.querySelector('.mc-dashboard-layout');
    if (!pullBar || !layout) return;

    // Restore collapsed state from session
    var wasCollapsed = sessionStorage.getItem('verde_mc_sidebar_collapsed') === '1';
    if (wasCollapsed) {
      layout.classList.add('mc-sidebar-collapsed');
    }

    pullBar.addEventListener('click', function () {
      layout.classList.toggle('mc-sidebar-collapsed');
      var collapsed = layout.classList.contains('mc-sidebar-collapsed');
      sessionStorage.setItem('verde_mc_sidebar_collapsed', collapsed ? '1' : '0');
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 2 — AUTHENTICATED USER GREETING
  // ══════════════════════════════════════════════════════════════════════════
  function updateGreeting() {
    var h = new Date().getHours();
    var greeting = 'Good Evening';
    if (h < 12) greeting = 'Good Morning';
    else if (h < 17) greeting = 'Good Afternoon';

    var el = document.getElementById('mc-hero-greeting');
    if (el) el.textContent = greeting + ', ' + getUserFirstName() + ' \ud83d\udc4b';
  }

  function updateHeroDate() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    var el = document.getElementById('mc-hero-date');
    if (el) el.textContent = dateStr + ' \u00b7 Your daily intelligence briefing';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 7 — CALENDAR (with prev/next navigation)
  // ══════════════════════════════════════════════════════════════════════════
  var calViewYear, calViewMonth;

  function renderCalendar(year, month, eventDates) {
    var now = new Date();
    if (year === undefined) year = now.getFullYear();
    if (month === undefined) month = now.getMonth();
    calViewYear = year;
    calViewMonth = month;

    eventDates = eventDates || [];

    var monthLabel = document.getElementById('mc-cal-month');
    if (monthLabel) {
      var display = new Date(year, month, 1);
      monthLabel.textContent = display.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    var grid = document.getElementById('mc-cal-grid');
    if (!grid) return;

    var firstDay = new Date(year, month, 1).getDay();
    var startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrevMonth = new Date(year, month, 0).getDate();

    var todayYear = now.getFullYear();
    var todayMonth = now.getMonth();
    var todayDate = now.getDate();

    var html = '';

    // Previous month trailing days
    for (var p = startOffset - 1; p >= 0; p--) {
      html += '<div class="mc-cal-day fade">' + (daysInPrevMonth - p) + '</div>';
    }

    // Current month days
    for (var d = 1; d <= daysInMonth; d++) {
      var cls = 'mc-cal-day';
      if (year === todayYear && month === todayMonth && d === todayDate) cls += ' active';
      // Check if this date has events
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (eventDates.indexOf(dateStr) !== -1) cls += ' has-event';
      html += '<div class="' + cls + '">' + d + '</div>';
    }

    // Fill remaining cells
    var totalCells = startOffset + daysInMonth;
    var remaining = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
    for (var n = 1; n <= remaining; n++) {
      html += '<div class="mc-cal-day fade">' + n + '</div>';
    }

    grid.innerHTML = html;
  }

  function initCalendarNav() {
    var prevBtn = document.getElementById('mc-cal-prev');
    var nextBtn = document.getElementById('mc-cal-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var m = calViewMonth - 1;
        var y = calViewYear;
        if (m < 0) { m = 11; y--; }
        renderCalendar(y, m, collectEventDates());
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var m = calViewMonth + 1;
        var y = calViewYear;
        if (m > 11) { m = 0; y++; }
        renderCalendar(y, m, collectEventDates());
      });
    }
  }

  // Collect event dates from tasks and meetings for calendar dots
  function collectEventDates() {
    var dates = [];
    try {
      // From tasks
      if (window.VerdeServices && window.VerdeServices.Tasks) {
        // We'll collect asynchronously later; for now return what we cached
      }
      // From mock meetings
      if (window.VerdeMockData && window.VerdeMockData.meetings) {
        window.VerdeMockData.meetings.forEach(function (m) {
          if (m.date) {
            try {
              var dt = new Date(m.date);
              if (!isNaN(dt.getTime())) {
                dates.push(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'));
              }
            } catch(e) {}
          }
        });
      }
    } catch(e) {}
    return dates;
  }

  // ── Live Clock ──
  function updateClock() {
    var clockEl = document.getElementById('mc-clock');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
  }

  // ── Topbar Date ──
  function updateTopbarDate() {
    var dateEl = document.querySelector('.topbar-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  // ── Footer Time ──
  function updateFooterTime() {
    var el = document.getElementById('mc-footer-time');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
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

  // ══════════════════════════════════════════════════════════════════════════
  // PARTS 3-5, 9, 10 — TASK DATA SYNC: Hero Stats, Mission, AI, Critical, Focus
  // ══════════════════════════════════════════════════════════════════════════
  function syncHeroAndMission() {
    var userName = getUserFirstName();
    var userId = getUserId();
    var userInitials = getUserInitials();

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
          var dd = String(t.dueDate).trim().toLowerCase();
          if (dd === 'today' || dd === 'tomorrow') return false;
          try {
            var dt = new Date(t.dueDate);
            if (!isNaN(dt.getTime())) {
              var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return dt < todayStart;
            }
          } catch(e) {}
          return false;
        }

        function isMyTask(t) {
          if (isSuperAdmin()) return true;
          var n = userName.toLowerCase();
          return (t.assignee && t.assignee.toLowerCase().includes(n)) ||
                 (t.assigneeId && (t.assigneeId === userInitials || t.assigneeId === userId)) ||
                 (t.assigneeInitials && t.assigneeInitials === userInitials);
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

        // PART 4 — Today's Focus
        var focusEl = document.getElementById('mc-stat-focus');
        if (focusEl) {
          if (overdueTasks.length > 0) {
            focusEl.textContent = overdueTasks.length + ' overdue task' + (overdueTasks.length > 1 ? 's' : '') + ' need attention';
          } else if (dueTodayTasks.length > 0) {
            focusEl.textContent = dueTodayTasks.length + ' task' + (dueTodayTasks.length > 1 ? 's' : '') + ' due today';
          } else if (activeTasks.length > 0) {
            focusEl.textContent = activeTasks.length + ' active task' + (activeTasks.length > 1 ? 's' : '') + ' in progress';
          } else {
            focusEl.textContent = 'No tasks due today \u2714';
          }
        }

        // PART 5 — Critical Section
        var critEl = document.getElementById('mc-stat-critical');
        if (critEl) {
          var topCritical = overdueTasks.length > 0 ? overdueTasks[0]
            : (criticalTasks.length > 0 ? criticalTasks[0] : null);
          if (topCritical) {
            var label = esc(topCritical.title || topCritical.name || 'Task');
            critEl.textContent = label + (isOverdue(topCritical) ? ' (overdue)' : ' needs attention');
          } else {
            critEl.textContent = 'No critical items \u2714';
          }
        }

        // PART 9 — Today's Mission
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

        // PART 10 — AI Recommendation
        var aiEl = document.getElementById('mc-ai-text');
        if (aiEl) {
          var rec = '';
          if (overdueTasks.length > 0) {
            rec = 'Focus on <strong>' + esc(overdueTasks[0].title || overdueTasks[0].name) + '</strong> first \u2014 it\'s overdue and needs immediate attention.';
            if (overdueTasks.length > 1) {
              rec += ' You have ' + (overdueTasks.length - 1) + ' more overdue task' + (overdueTasks.length > 2 ? 's' : '') + ' to address.';
            }
          } else if (dueTodayTasks.length > 0) {
            rec = 'Prioritize <strong>' + esc(dueTodayTasks[0].title || dueTodayTasks[0].name) + '</strong> \u2014 it\'s due today.';
            if (dueTodayTasks.length > 1) {
              rec += ' Then tackle the ' + (dueTodayTasks.length - 1) + ' other task' + (dueTodayTasks.length > 2 ? 's' : '') + ' due today.';
            }
          } else if (criticalTasks.length > 0) {
            rec = 'Your next priority is <strong>' + esc(criticalTasks[0].title || criticalTasks[0].name) + '</strong> \u2014 marked as ' + esc(criticalTasks[0].priority) + ' priority.';
          } else if (activeTasks.length > 0) {
            rec = 'You\'re on track! Continue with <strong>' + esc(activeTasks[0].title || activeTasks[0].name) + '</strong>. No urgent deadlines right now.';
          } else {
            rec = 'All clear! No pending tasks. Great time to plan ahead or review upcoming projects.';
          }
          aiEl.innerHTML = '<strong>AI RECOMMENDATION</strong><br>' + rec;
        }

        // Pinned Tasks — top 4 high-priority active tasks
        renderPinnedTasks(activeTasks);

        // Collect task due dates for calendar event dots
        var taskDates = [];
        tasks.forEach(function(t) {
          if (t.dueDate && t.status !== 'Completed' && t.status !== 'Archived') {
            try {
              var dt = new Date(t.dueDate);
              if (!isNaN(dt.getTime())) {
                taskDates.push(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'));
              }
            } catch(e) {}
          }
        });
        // Re-render calendar with event dots
        var allEventDates = taskDates.concat(collectEventDates());
        renderCalendar(calViewYear, calViewMonth, allEventDates);

      }).catch(function() {
        // Safe fallback — show zeros
        safeSetText('mc-stat-focus', 'No task data available');
        safeSetText('mc-stat-critical', 'No critical items');
        safeSetText('mc-progress-pct', '0%');
        safeSetText('mc-tasks-remaining', '0');
        safeSetText('mc-productivity', '0');
      });
    } else {
      // No services available — use mock data if present
      if (window.VerdeMockData && window.VerdeMockData.tasks) {
        safeSetText('mc-stat-focus', window.VerdeMockData.tasks.length + ' tasks loaded');
      }
    }
  }

  function safeSetText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ── Pinned Tasks ──
  function renderPinnedTasks(activeTasks) {
    var container = document.getElementById('mc-pinned-tasks');
    var countEl = document.getElementById('mc-pinned-count');
    if (!container) return;

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

  // ══════════════════════════════════════════════════════════════════════════
  // PART 6 — MEETINGS (from mock data + CRM leads)
  // ══════════════════════════════════════════════════════════════════════════
  function syncMeetings() {
    var listEl = document.getElementById('mc-meetings-list');
    var heroMeetingsEl = document.getElementById('mc-stat-meetings');
    if (!listEl) return;

    var allMeetings = [];

    // Source 1: VerdeMockData.meetings (global meeting records)
    if (window.VerdeMockData && window.VerdeMockData.meetings) {
      window.VerdeMockData.meetings.forEach(function(m) {
        allMeetings.push({
          time: m.time || '\u2014',
          title: m.purpose || 'Meeting',
          sub: m.client || '',
          status: m.status || 'Confirmed'
        });
      });
    }

    // Source 2: CRM Lead meetings (if any exist)
    if (window.VerdeServices && window.VerdeServices.Crm) {
      window.VerdeServices.Crm.getLeads().then(function(leads) {
        (leads || []).forEach(function(lead) {
          if (lead.meetings && lead.meetings.length > 0) {
            lead.meetings.forEach(function(m) {
              if (m.status !== 'Completed' && m.status !== 'Cancelled') {
                allMeetings.push({
                  time: m.time || '\u2014',
                  title: m.notes || m.purpose || 'Meeting',
                  sub: lead.company || lead.name || '',
                  status: m.status || 'Scheduled'
                });
              }
            });
          }
        });
        renderMeetingsList(allMeetings, listEl, heroMeetingsEl);
      }).catch(function() {
        renderMeetingsList(allMeetings, listEl, heroMeetingsEl);
      });
    } else {
      renderMeetingsList(allMeetings, listEl, heroMeetingsEl);
    }
  }

  function renderMeetingsList(meetings, listEl, heroEl) {
    var topMeetings = meetings.slice(0, 4);

    // Hero stat
    if (heroEl) {
      if (topMeetings.length > 0) {
        heroEl.textContent = topMeetings.length + ' scheduled meeting' + (topMeetings.length > 1 ? 's' : '');
      } else {
        heroEl.textContent = 'No meetings scheduled';
      }
    }

    if (!listEl) return;

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
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 8 — COMPANY HEALTH (CRM + Projects + Tasks + Finance sync)
  // ══════════════════════════════════════════════════════════════════════════
  function syncDashboardWithCRM() {
    if (!canAccessModule('crm') && !isSuperAdmin()) return;
    if (window.VerdeServices && window.VerdeServices.Crm) {
      Promise.all([
        window.VerdeServices.Crm.getClients(),
        window.VerdeServices.Crm.getLeads()
      ]).then(function(results) {
        var clients = results[0] || [];
        var activeClients = clients.filter(function(c) { return c.status === 'Active'; }).length;
        var totalRevenue = clients.reduce(function(sum, c) { return sum + (c.revenue || 0); }, 0);

        var clientKpiEl = document.getElementById('dashboard-kpi-clients');
        if (clientKpiEl) clientKpiEl.textContent = activeClients;

        var revKpiEl = document.getElementById('dashboard-kpi-revenue');
        if (revKpiEl) revKpiEl.textContent = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L';

        var heroRevEl = document.getElementById('mc-stat-revenue');
        if (heroRevEl) {
          heroRevEl.innerHTML = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L this month \u00b7 ' + activeClients + ' active client' + (activeClients !== 1 ? 's' : '');
        }
      }).catch(function() {});
    }
  }
  window.syncDashboardWithCRM = syncDashboardWithCRM;

  function syncDashboardWithTasks() {
    if (window.VerdeServices && window.VerdeServices.Tasks) {
      window.VerdeServices.Tasks.getTasks().then(function(tasks) {
        if (!tasks) return;
        var kpiTasks = document.getElementById('dashboard-kpi-tasks');
        if (kpiTasks) kpiTasks.textContent = tasks.length;
      }).catch(function() {});
    }
  }
  window.syncDashboardWithTasks = syncDashboardWithTasks;

  function syncDashboardWithProjects() {
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjects().then(function(projects) {
        if (!projects) return;

        var activeProjects = projects.filter(function(p) { return !p.isDeleted && !p.isArchived; });
        var numActive = activeProjects.length;

        var kpiEl = document.getElementById('dashboard-kpi-projects');
        if (kpiEl) kpiEl.textContent = numActive;

        // Active Projects cards (top 4)
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
              return '<div class="mc-avatar">' + esc(m) + '</div>';
            }).join('');

            var html = '<div class="mc-project-card">' +
              '<div>' +
                '<div class="mc-project-title">' + esc(p.name) + '</div>' +
                '<div class="mc-project-client">' + esc(p.client || '') + '</div>' +
              '</div>' +
              '<div class="mc-project-meta">' +
                '<span style="color:' + color + ';font-weight:700;">' + pct + '%</span>' +
                '<span style="color:var(--text-3);">' + esc(p.dueDate || 'N/A') + '</span>' +
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

        // Team Activity Feed
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
              var initials = act.user ? act.user.substring(0,2).toUpperCase() : '??';
              var color = bgColors[idx % bgColors.length];

              var html = '<div class="mc-activity-item">' +
                '<div class="mc-avatar" style="width:32px;height:32px;font-size:11px;background:' + color + ';color:#fff;">' + initials + '</div>' +
                '<div>' +
                  '<div class="mc-activity-text"><strong>' + esc(act.user) + '</strong>: ' + esc(act.action) + ' on <strong>' + esc(act.projName) + '</strong></div>' +
                  '<div class="mc-activity-time">' + timeStr + (act.details ? ' \u2022 ' + esc(act.details) : '') + '</div>' +
                '</div>' +
              '</div>';
              activityFeedEl.innerHTML += html;
            });
          }
        }
      }).catch(function() {});
    }
  }

  // Sync finance data for invoices KPI
  function syncDashboardWithFinance() {
    if (!canAccessModule('finance') && !isSuperAdmin()) return;
    try {
      var finData = localStorage.getItem('verde_os_finance_transactions');
      if (finData) {
        var transactions = JSON.parse(finData);
        var invoiceCount = transactions.filter(function(t) { return t.type === 'Income' || t.invoiceNumber; }).length;
        var invEl = document.getElementById('dashboard-kpi-invoices');
        if (invEl && invoiceCount > 0) invEl.textContent = invoiceCount;
      }
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 11 — QUICK NOTES (per-user persistence)
  // ══════════════════════════════════════════════════════════════════════════
  function initQuickNotes() {
    var textarea = document.getElementById('mc-quick-note');
    if (!textarea) return;
    var key = 'verde_mc_notes_' + getUserId();
    try {
      var saved = localStorage.getItem(key);
      if (saved) textarea.value = saved;
    } catch(e) {}

    textarea.addEventListener('input', function() {
      try { localStorage.setItem(key, this.value); } catch(e) {}
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOCUS/WORK ACTIVITY — Hours Worked sync with My Work module
  // ══════════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════════
  // PART 12 — PERMISSION AWARENESS
  // ══════════════════════════════════════════════════════════════════════════
  function applyPermissions() {
    // Company Health (finance-related)
    var healthSection = document.querySelector('.mc-health-grid');
    if (healthSection && !canAccessModule('finance') && !isSuperAdmin()) {
      var sec = healthSection.closest('section');
      if (sec) sec.style.display = 'none';
    }

    // Team Performance
    var perfGrid = document.getElementById('mc-performance-grid');
    if (perfGrid && !canAccessModule('team') && !isSuperAdmin()) {
      var sec2 = perfGrid.closest('section');
      if (sec2) sec2.style.display = 'none';
    }

    // Pending Approvals (admin-only)
    if (!isSuperAdmin()) {
      var approvalSections = document.querySelectorAll('.mc-section-title');
      approvalSections.forEach(function(t) {
        if (t.textContent.trim() === 'Pending Approvals') {
          var sec3 = t.closest('section');
          if (sec3) sec3.style.display = 'none';
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TEAM PERFORMANCE — from existing team data
  // ══════════════════════════════════════════════════════════════════════════
  function syncTeamPerformance() {
    var grid = document.getElementById('mc-performance-grid');
    if (!grid) return;
    if (!canAccessModule('team') && !isSuperAdmin()) return;

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
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  function init() {
    // Part 1: Sidebar toggle
    initSidebarToggle();

    // Part 2: User greeting + date
    updateGreeting();
    updateHeroDate();
    updateClock();
    updateTopbarDate();
    updateFooterTime();

    // UI interactions
    initTaskTabs();

    // Part 7: Calendar
    renderCalendar();
    initCalendarNav();

    // Part 11: Quick Notes
    initQuickNotes();

    // Part 3-5, 9, 10: Data sync
    syncHeroAndMission();
    syncMeetings();
    syncDashboardWithProjects();
    syncDashboardWithCRM();
    syncDashboardWithTasks();
    syncDashboardWithFinance();
    syncHoursWorked();
    syncTeamPerformance();

    // Part 12: Permissions
    applyPermissions();

    // Timers
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000);
    setInterval(updateFooterTime, 60000);
    setInterval(syncHoursWorked, 1000);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();