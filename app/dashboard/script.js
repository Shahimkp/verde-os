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
      html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
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
    var grid = document.getElementById('mc-cal-grid');

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

    if (grid) {
      grid.addEventListener('click', function (e) {
        var dayEl = e.target.closest('.mc-cal-day:not(.fade)');
        if (dayEl) {
          grid.querySelectorAll('.mc-cal-day').forEach(function(el) { el.classList.remove('active'); });
          dayEl.classList.add('active');
        }
      });
    }
  }

  // Collect event dates from tasks and meetings for calendar dots
  function collectEventDates() {
    var dates = [];
    try {
      // From tasks in storage
      var rawTasks = localStorage.getItem('verde_os_tasks');
      if (rawTasks) {
        var tList = JSON.parse(rawTasks);
        (tList || []).forEach(function(t) {
          if (t.dueDate && t.status !== 'Completed' && t.status !== 'Archived') {
            try {
              var dt = new Date(t.dueDate);
              if (!isNaN(dt.getTime())) {
                dates.push(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'));
              }
            } catch(e) {}
          }
        });
      }

      // From meetings
      var rawM = localStorage.getItem('verde_os_meetings');
      var mList = rawM ? JSON.parse(rawM) : (window.VerdeMockData ? window.VerdeMockData.meetings : []);
      (mList || []).forEach(function (m) {
        if (m.date) {
          try {
            var dm = new Date(m.date);
            if (!isNaN(dm.getTime())) {
              dates.push(dm.getFullYear() + '-' + String(dm.getMonth() + 1).padStart(2, '0') + '-' + String(dm.getDate()).padStart(2, '0'));
            }
          } catch(e) {}
        }
      });
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
      var isDone = t.status === 'Completed';
      var checkCls = isDone ? 'mc-pinned-check checked' : 'mc-pinned-check';
      var titleStyle = isDone ? 'text-decoration:line-through;color:var(--text-3);' : '';
      return '<div class="mc-pinned-task" data-id="' + esc(t.id) + '" style="cursor:pointer;">' +
        '<div class="' + checkCls + '"></div>' +
        '<div class="mc-pinned-title" style="' + titleStyle + '">' + esc(t.title || t.name || 'Untitled') + '</div>' +
      '</div>';
    }).join('');

    container.querySelectorAll('.mc-pinned-task').forEach(function(item) {
      item.addEventListener('click', function() {
        var taskId = this.getAttribute('data-id');
        var check = this.querySelector('.mc-pinned-check');
        var title = this.querySelector('.mc-pinned-title');
        if (check && taskId && window.VerdeServices && window.VerdeServices.Tasks) {
          var isChecked = check.classList.contains('checked');
          var newStatus = isChecked ? 'To Do' : 'Completed';
          if (!isChecked) {
            check.classList.add('checked');
            if (title) { title.style.textDecoration = 'line-through'; title.style.color = 'var(--text-3)'; }
          } else {
            check.classList.remove('checked');
            if (title) { title.style.textDecoration = 'none'; title.style.color = 'var(--text-1)'; }
          }
          window.VerdeServices.Tasks.updateTask(taskId, { status: newStatus }).then(function() {
            syncHeroAndMission();
          }).catch(function() {});
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 6 — MEETINGS (from mock data + CRM leads)
  // ══════════════════════════════════════════════════════════════════════════
  function syncMeetings() {
    var listEl = document.getElementById('mc-meetings-list');
    var heroMeetingsEl = document.getElementById('mc-stat-meetings');
    if (!listEl) return;

    function processAndRender(baseMeetings) {
      var allMeetings = [];
      (baseMeetings || []).forEach(function(m) {
        allMeetings.push({
          time: m.time || '\u2014',
          title: m.purpose || m.title || 'Meeting',
          sub: m.client || '',
          status: m.status || 'Confirmed'
        });
      });

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

    if (window.VerdeServices && window.VerdeServices.Meetings) {
      window.VerdeServices.Meetings.getMeetings().then(function(mtgs) {
        if (mtgs && mtgs.length > 0) {
          processAndRender(mtgs);
        } else if (window.VerdeMockData && window.VerdeMockData.meetings) {
          processAndRender(window.VerdeMockData.meetings);
        } else {
          processAndRender([]);
        }
      }).catch(function() {
        processAndRender(window.VerdeMockData ? window.VerdeMockData.meetings : []);
      });
    } else if (window.VerdeMockData && window.VerdeMockData.meetings) {
      processAndRender(window.VerdeMockData.meetings);
    } else {
      processAndRender([]);
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

        // If finance invoices are not yet populated, use CRM revenue
        var rawFin = localStorage.getItem('verde_finance_invoices');
        if (!rawFin) {
          var revKpiEl = document.getElementById('dashboard-kpi-revenue');
          if (revKpiEl) revKpiEl.textContent = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L';

          var heroRevEl = document.getElementById('mc-stat-revenue');
          if (heroRevEl) {
            heroRevEl.innerHTML = '\u20b9' + (totalRevenue / 100000).toFixed(1) + 'L this month \u00b7 ' + activeClients + ' active client' + (activeClients !== 1 ? 's' : '');
          }
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

            var html = '<div class="mc-project-card" style="cursor:pointer;" onclick="localStorage.setItem(\'verde_pending_project_view\',\'' + esc(p.id) + '\'); window.location.href=\'../projects/index.html\';">' +
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
        syncTeamActivity(projects);
      }).catch(function() {});
    }
  }

  function syncTeamActivity(projectsList) {
    var activityFeedEl = document.getElementById('dashboard-recent-activity');
    if (!activityFeedEl) return;

    var allActivities = [];

    // 1. Projects activities
    (projectsList || []).forEach(function(p) {
      if (p.activities) {
        p.activities.forEach(function(a) {
          allActivities.push({
            target: p.name,
            action: a.action,
            details: a.details,
            user: a.user || 'Team',
            date: new Date(a.date || Date.now())
          });
        });
      }
    });

    // 2. CRM Leads & Clients activities
    try {
      var rawLeads = localStorage.getItem('verde_os_crm_leads');
      if (rawLeads) {
        var leads = JSON.parse(rawLeads);
        (leads || []).forEach(function(l) {
          (l.activities || []).forEach(function(a) {
            allActivities.push({
              target: l.company || l.name,
              action: a.action,
              details: a.details,
              user: a.user || 'Team',
              date: new Date(a.date || Date.now())
            });
          });
        });
      }
    } catch(e) {}

    // 3. Fallback seeds if fresh environment
    if (allActivities.length === 0) {
      allActivities = [
        { user: 'Midhul', action: 'uploaded homepage design', target: 'Cabo Travels', details: 'Phase 1 deliverable', date: new Date(Date.now() - 10 * 60 * 1000) },
        { user: 'Ameen', action: 'added a new lead', target: 'BlueWave Tech', details: '\u20b93.2L value', date: new Date(Date.now() - 25 * 60 * 1000) },
        { user: 'Nihal', action: 'completed SEO audit', target: 'Vertex Systems', details: 'Full report generated', date: new Date(Date.now() - 60 * 60 * 1000) },
        { user: 'Finance', action: 'Payment received', target: 'GreenLeaf', details: '\u20b985,000 cleared', date: new Date(Date.now() - 120 * 60 * 1000) },
        { user: 'Shahim', action: 'Proposal approved', target: 'Vertex Systems', details: 'Contract signed', date: new Date(Date.now() - 180 * 60 * 1000) }
      ];
    }

    allActivities.sort(function(a, b) { return b.date.getTime() - a.date.getTime(); });
    var recentActs = allActivities.slice(0, 5);

    var bgColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
    activityFeedEl.innerHTML = recentActs.map(function(act, idx) {
      var diffMs = Date.now() - act.date.getTime();
      var diffMins = Math.floor(diffMs / 60000);
      var timeStr = diffMins < 1 ? 'Just now' : (diffMins < 60 ? diffMins + ' min ago' : (Math.floor(diffMins / 60) + ' hour' + (Math.floor(diffMins/60) > 1 ? 's' : '') + ' ago'));
      var initials = act.user ? act.user.substring(0,2).toUpperCase() : '??';
      var color = bgColors[idx % bgColors.length];

      return '<div class="mc-activity-item">' +
        '<div class="mc-avatar" style="width:32px;height:32px;font-size:11px;background:' + color + ';color:#fff;">' + initials + '</div>' +
        '<div>' +
          '<div class="mc-activity-text"><strong>' + esc(act.user) + '</strong>: ' + esc(act.action) + ' on <strong>' + esc(act.target) + '</strong></div>' +
          '<div class="mc-activity-time">' + timeStr + (act.details ? ' \u2022 ' + esc(act.details) : '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // Sync finance data for invoices & revenue KPI
  function syncDashboardWithFinance() {
    if (!canAccessModule('finance') && !isSuperAdmin()) return;
    try {
      var totalRevenue = 0;
      var pendingInvoiceCount = 0;

      // 1. Primary: Check verde_finance_invoices from Finance module
      var rawInvoices = localStorage.getItem('verde_finance_invoices');
      if (rawInvoices) {
        var invoices = JSON.parse(rawInvoices);
        invoices.forEach(function(inv) {
          if (inv.status === 'Paid') {
            totalRevenue += (inv.total || 0);
          } else if (inv.status !== 'Cancelled') {
            pendingInvoiceCount++;
          }
        });
      }

      // 2. Secondary: Fallback to transactions store
      if (totalRevenue === 0) {
        var finData = localStorage.getItem('verde_os_finance_transactions');
        if (finData) {
          var transactions = JSON.parse(finData);
          transactions.forEach(function(t) {
            if (t.type === 'Income' && t.status === 'Completed') {
              totalRevenue += (t.amount || 0);
            }
          });
          if (pendingInvoiceCount === 0) {
            pendingInvoiceCount = transactions.filter(function(t) { return t.status === 'Processing' || t.status === 'Pending'; }).length;
          }
        }
      }

      // 3. Fallback to mock data if uninitialized
      if (totalRevenue === 0 && window.VerdeMockData && window.VerdeMockData.invoices) {
        window.VerdeMockData.invoices.forEach(function(inv) {
          if (inv.type === 'Income' && inv.status === 'Completed') totalRevenue += (inv.amount * 85 || 0);
        });
        pendingInvoiceCount = 3;
      }

      var invEl = document.getElementById('dashboard-kpi-invoices');
      if (invEl) invEl.textContent = pendingInvoiceCount;

      var revKpiEl = document.getElementById('dashboard-kpi-revenue');
      var revLakhs = (totalRevenue / 100000).toFixed(1);
      if (revKpiEl && totalRevenue > 0) revKpiEl.textContent = '\u20b9' + revLakhs + 'L';

      var heroRevEl = document.getElementById('mc-stat-revenue');
      if (heroRevEl && totalRevenue > 0) {
        heroRevEl.innerHTML = '\u20b9' + revLakhs + 'L this month \u00b7 <span style="color:var(--success);">\u219112%</span> vs last month';
      }
    } catch(e) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 9 — PENDING APPROVALS
  // ══════════════════════════════════════════════════════════════════════════
  function syncPendingApprovals() {
    var container = document.getElementById('dashboard-pending-approvals');
    var badge = document.getElementById('dashboard-approvals-count');
    if (!container) return;

    var approvals = [];

    // 1. Invoices needing approval
    try {
      var rawInvoices = localStorage.getItem('verde_finance_invoices');
      if (rawInvoices) {
        var invoices = JSON.parse(rawInvoices);
        invoices.filter(function(inv) { return inv.status === 'Overdue' || inv.status === 'Sent' || inv.status === 'Draft'; }).forEach(function(inv) {
          approvals.push({
            id: inv.id || inv.invoiceNumber,
            type: 'invoice',
            title: 'Invoice ' + (inv.invoiceNumber || '#INV-1001'),
            sub: '\u20b9' + (inv.total || 85000).toLocaleString('en-IN') + ' \u00b7 ' + (inv.clientName || 'Client'),
            invoiceNumber: inv.invoiceNumber
          });
        });
      }
    } catch(e) {}

    // 2. Leave requests from notifications
    try {
      var rawNotifs = localStorage.getItem('verde_os_notifications');
      var notifs = rawNotifs ? JSON.parse(rawNotifs) : (window.VerdeMockData ? window.VerdeMockData.notifications : []);
      (notifs || []).filter(function(n) { return !n.read && (n.type === 'alert' || (n.title && n.title.toLowerCase().includes('leave'))); }).forEach(function(n) {
        approvals.push({
          id: n.id,
          type: 'leave',
          title: n.title || 'Leave Request',
          sub: n.subtitle || n.desc || 'Pending approval'
        });
      });
    } catch(e) {}

    // 3. Fallback seeds if no active approvals
    if (approvals.length === 0 && !localStorage.getItem('verde_approvals_cleared')) {
      approvals = [
        { id: 'appr-1', type: 'invoice', title: 'Invoice #VL-0042', sub: '\u20b985,000 \u00b7 Cabo Travels', invoiceNumber: 'INV-1001' },
        { id: 'appr-2', type: 'leave', title: 'Leave Request', sub: 'Midhul \u00b7 July 30 \u2014 31' },
        { id: 'appr-3', type: 'budget', title: 'Budget Increase', sub: 'Marketing Campaign \u00b7 +\u20b915,000' }
      ];
    }

    if (badge) badge.textContent = approvals.length;

    if (approvals.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals \u2714</div>';
      return;
    }

    container.innerHTML = approvals.map(function(item) {
      var iconColor = item.type === 'invoice' ? 'background:var(--success-50);color:var(--success);' : (item.type === 'leave' ? 'background:var(--primary-light);color:var(--primary);' : 'background:var(--warning-50);color:var(--warning);');
      var iconSvg = item.type === 'invoice' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>' : (item.type === 'leave' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>');

      return '<div class="mc-approval-item" data-appr-id="' + esc(item.id) + '" data-appr-type="' + esc(item.type) + '">' +
        '<div class="mc-approval-icon" style="' + iconColor + '">' + iconSvg + '</div>' +
        '<div class="mc-approval-info">' +
          '<div class="mc-approval-title">' + esc(item.title) + '</div>' +
          '<div class="mc-approval-sub">' + esc(item.sub) + '</div>' +
        '</div>' +
        '<div class="mc-approval-actions">' +
          '<button class="mc-btn-sm mc-btn-approve">Approve</button>' +
          '<button class="mc-btn-sm mc-btn-reject">Reject</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Attach click actions
    container.querySelectorAll('.mc-approval-item').forEach(function(el) {
      var id = el.getAttribute('data-appr-id');
      var type = el.getAttribute('data-appr-type');
      var approveBtn = el.querySelector('.mc-btn-approve');
      var rejectBtn = el.querySelector('.mc-btn-reject');

      if (approveBtn) {
        approveBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (type === 'invoice') {
            try {
              var raw = localStorage.getItem('verde_finance_invoices');
              if (raw) {
                var invs = JSON.parse(raw);
                invs.forEach(function(i) { if (i.id === id || i.invoiceNumber === id) i.status = 'Paid'; });
                localStorage.setItem('verde_finance_invoices', JSON.stringify(invs));
              }
            } catch(err) {}
          }
          if (window.VerdeToast) window.VerdeToast.success('Approved successfully');
          el.remove();
          var remaining = container.querySelectorAll('.mc-approval-item').length;
          if (badge) badge.textContent = remaining;
          if (remaining === 0) {
            localStorage.setItem('verde_approvals_cleared', '1');
            container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals \u2714</div>';
          }
          syncDashboardWithFinance();
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (type === 'invoice') {
            try {
              var raw = localStorage.getItem('verde_finance_invoices');
              if (raw) {
                var invs = JSON.parse(raw);
                invs.forEach(function(i) { if (i.id === id || i.invoiceNumber === id) i.status = 'Cancelled'; });
                localStorage.setItem('verde_finance_invoices', JSON.stringify(invs));
              }
            } catch(err) {}
          }
          if (window.VerdeToast) window.VerdeToast.info('Item rejected');
          el.remove();
          var remaining = container.querySelectorAll('.mc-approval-item').length;
          if (badge) badge.textContent = remaining;
          if (remaining === 0) {
            localStorage.setItem('verde_approvals_cleared', '1');
            container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals \u2714</div>';
          }
          syncDashboardWithFinance();
        });
      }
    });
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
      var apprSec = document.getElementById('mc-approvals-section');
      if (apprSec) apprSec.style.display = 'none';
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
  // REFRESH ALL DASHBOARD DATA (CROSS-MODULE SYNC)
  // ══════════════════════════════════════════════════════════════════════════
  function refreshAllDashboardData() {
    updateGreeting();
    updateHeroDate();
    syncHeroAndMission();
    syncMeetings();
    syncDashboardWithProjects();
    syncDashboardWithCRM();
    syncDashboardWithTasks();
    syncDashboardWithFinance();
    syncHoursWorked();
    syncTeamPerformance();
    syncPendingApprovals();
    applyPermissions();
  }
  window.refreshMissionControl = refreshAllDashboardData;

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  function init() {
    // Part 1: Sidebar toggle
    initSidebarToggle();

    // UI interactions
    initTaskTabs();

    // Part 7: Calendar
    renderCalendar();
    initCalendarNav();

    // Part 11: Quick Notes
    initQuickNotes();

    // Refresh all data
    refreshAllDashboardData();

    // Live Clock & Periodic updates
    updateClock();
    updateTopbarDate();
    updateFooterTime();

    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000);
    setInterval(updateFooterTime, 60000);
    setInterval(syncHoursWorked, 1000);

    // Cross-Module Auto Sync Listeners
    window.addEventListener('focus', refreshAllDashboardData);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) refreshAllDashboardData();
    });
    window.addEventListener('storage', function() {
      refreshAllDashboardData();
    });
    if (window.VerdeState && typeof window.VerdeState.subscribe === 'function') {
      window.VerdeState.subscribe('*', refreshAllDashboardData);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();