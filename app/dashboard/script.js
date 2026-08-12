/* ==========================================================================
   VERDE OS — MISSION CONTROL: EXECUTIVE COMMAND CENTER SCRIPT
   Pure Data-Driven Dashboard Synchronization & Cross-Module Intelligence
   ========================================================================== */

(function () {
  'use strict';

  // ── Session & Permission Helpers ──
  function getUser() {
    if (window.VERDE_SESSION && window.VERDE_SESSION.getUser) {
      return window.VERDE_SESSION.getUser();
    }
    return null;
  }

  function getUserFirstName() {
    var user = getUser();
    if (user && user.name) return user.name.split(' ')[0];
    return 'Executive';
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
    if (s === undefined || s === null) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function parseAmount(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    var clean = String(val).replace(/[^0-9.-]+/g, '');
    var num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  function fmtMoney(n) {
    var num = parseAmount(n);
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  function fmtLakhs(n) {
    var num = parseAmount(n);
    if (Math.abs(num) >= 100000) {
      return '₹' + (num / 100000).toFixed(1) + 'L';
    }
    return fmtMoney(num);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 1 — RIGHT SIDEBAR PULL BAR & COLLAPSE
  // ══════════════════════════════════════════════════════════════════════════
  function initSidebarToggle() {
    var pullBar = document.getElementById('mc-sidebar-pull');
    var layout = document.querySelector('.mc-dashboard-layout');
    if (!pullBar || !layout) return;

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
  // PART 2 — AUTHENTICATED USER GREETING & DATES
  // ══════════════════════════════════════════════════════════════════════════
  function updateGreeting() {
    var h = new Date().getHours();
    var greeting = 'Good Evening';
    if (h < 12) greeting = 'Good Morning';
    else if (h < 17) greeting = 'Good Afternoon';

    var el = document.getElementById('mc-hero-greeting');
    if (el) el.textContent = greeting + ', ' + getUserFirstName() + ' 👋';
  }

  function updateHeroDate() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    var el = document.getElementById('mc-hero-date');
    if (el) el.textContent = dateStr + ' · Your daily intelligence briefing';
  }

  function updateClock() {
    var clockEl = document.getElementById('mc-clock');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
  }

  function updateTopbarDate() {
    var dateEl = document.querySelector('.topbar-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  function updateFooterTime() {
    var el = document.getElementById('mc-footer-time');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 3 — CALENDAR & EVENT DOTS
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

  function collectEventDates() {
    var dates = [];
    try {
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

  // ══════════════════════════════════════════════════════════════════════════
  // PART 4 — REAL TASKS: HERO STATS, TODAY'S MISSION, AI RECOMMENDATION
  // ══════════════════════════════════════════════════════════════════════════
  function syncHeroAndMission() {
    var userName = getUserFirstName();
    var userId = getUserId();
    var userInitials = getUserInitials();

    var pTasks = (window.VerdeServices && window.VerdeServices.Tasks)
      ? window.VerdeServices.Tasks.getTasks()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_tasks') || '[]'));

    var pProjects = (window.VerdeServices && window.VerdeServices.Projects)
      ? window.VerdeServices.Projects.getProjects()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_projects') || '[]'));

    Promise.all([pTasks, pProjects]).then(function (results) {
      var tasks = (results[0] || []).filter(function(t) { return !t.isDeleted && !t.isArchived && t.status !== 'Archived'; });
      var projects = (results[1] || []).filter(function(p) { return !p.isDeleted && !p.isArchived; });

      var now = new Date();
      var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      function isDueToday(t) {
        if (!t.dueDate) return false;
        var dd = String(t.dueDate).trim().toLowerCase();
        if (dd === 'today') return true;
        try {
          var dt = new Date(t.dueDate);
          if (!isNaN(dt.getTime())) {
            return dt >= todayStart && dt <= todayEnd;
          }
        } catch(e) {}
        return false;
      }

      function isOverdue(t) {
        if (!t.dueDate || t.status === 'Completed') return false;
        var dd = String(t.dueDate).trim().toLowerCase();
        if (dd === 'today' || dd === 'tomorrow') return false;
        try {
          var dt = new Date(t.dueDate);
          if (!isNaN(dt.getTime())) {
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

      var relevantTasks = tasks.filter(isMyTask);
      var completedTasks = relevantTasks.filter(function(t) { return t.status === 'Completed'; });
      var activeTasks = relevantTasks.filter(function(t) { return t.status !== 'Completed'; });
      var dueTodayTasks = activeTasks.filter(isDueToday);
      var overdueTasks = activeTasks.filter(isOverdue);
      var criticalTasks = activeTasks.filter(function(t) {
        return t.priority === 'Critical' || t.priority === 'High';
      });

      // ── 1. Today's Focus (Hero Card 1) ──
      var focusEl = document.getElementById('mc-stat-focus');
      if (focusEl) {
        if (overdueTasks.length > 0) {
          focusEl.textContent = overdueTasks.length + ' overdue deliverable' + (overdueTasks.length > 1 ? 's' : '') + ' require attention';
        } else if (dueTodayTasks.length > 0) {
          focusEl.textContent = dueTodayTasks.length + ' client deliverable' + (dueTodayTasks.length > 1 ? 's' : '') + ' due today';
        } else if (activeTasks.length > 0) {
          focusEl.textContent = activeTasks.length + ' active task' + (activeTasks.length > 1 ? 's' : '') + ' in progress';
        } else {
          focusEl.textContent = 'All deliverables on schedule ✔';
        }
      }

      // ── 2. Critical Items (Hero Card 2) ──
      var critEl = document.getElementById('mc-stat-critical');
      if (critEl) {
        var topCriticalTask = overdueTasks.length > 0 ? overdueTasks[0] : (criticalTasks.length > 0 ? criticalTasks[0] : null);
        var overdueProjects = projects.filter(function(p) {
          if (!p.dueDate || p.status === 'Completed' || p.progress === 100) return false;
          var pd = new Date(p.dueDate);
          return !isNaN(pd.getTime()) && pd < todayStart;
        });

        if (overdueProjects.length > 0) {
          critEl.textContent = esc(overdueProjects[0].name) + ' project overdue';
        } else if (topCriticalTask) {
          var tTitle = esc(topCriticalTask.title || topCriticalTask.name || 'Task');
          critEl.textContent = tTitle + (isOverdue(topCriticalTask) ? ' (overdue)' : ' requires review');
        } else {
          critEl.textContent = 'No critical risks detected ✔';
        }
      }

      // ── 3. Today's Mission ──
      var total = relevantTasks.length;
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

      // ── 4. AI Recommendation (Pure Data Intelligence) ──
      var aiEl = document.getElementById('mc-ai-text');
      if (aiEl) {
        var rec = '';
        if (overdueTasks.length > 0) {
          rec = 'Focus on <strong>' + esc(overdueTasks[0].title || overdueTasks[0].name) + '</strong> first — it is overdue and needs immediate resolution.';
          if (overdueTasks.length > 1) {
            rec += ' There are ' + (overdueTasks.length - 1) + ' additional overdue items in the queue.';
          }
        } else if (dueTodayTasks.length > 0) {
          rec = 'Prioritize <strong>' + esc(dueTodayTasks[0].title || dueTodayTasks[0].name) + '</strong> — scheduled for completion today.';
          if (dueTodayTasks.length > 1) {
            rec += ' Complete the remaining ' + (dueTodayTasks.length - 1) + ' deliverables before end of day.';
          }
        } else if (criticalTasks.length > 0) {
          rec = 'High priority focus: <strong>' + esc(criticalTasks[0].title || criticalTasks[0].name) + '</strong> (' + esc(criticalTasks[0].priority) + ' priority deliverable).';
        } else if (activeTasks.length > 0) {
          rec = 'Deliverables on track! Continue execution on <strong>' + esc(activeTasks[0].title || activeTasks[0].name) + '</strong>.';
        } else {
          rec = 'All tasks completed! Review active project milestones or plan upcoming client sprints.';
        }
        aiEl.innerHTML = '<strong>AI RECOMMENDATION</strong><br>' + rec;
      }

      // ── 5. Pinned Tasks ──
      renderPinnedTasks(activeTasks);

      // ── 6. Event Dots for Calendar ──
      var allEventDates = collectEventDates();
      renderCalendar(calViewYear, calViewMonth, allEventDates);

    }).catch(function() {
      var focusEl = document.getElementById('mc-stat-focus');
      if (focusEl) focusEl.textContent = 'All deliverables on schedule ✔';
      var critEl = document.getElementById('mc-stat-critical');
      if (critEl) critEl.textContent = 'No critical risks detected ✔';
    });
  }

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
      container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No active deliverables pinned</div>';
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
  // PART 5 — MEETINGS SYNCHRONIZATION
  // ══════════════════════════════════════════════════════════════════════════
  function syncMeetings() {
    var listEl = document.getElementById('mc-meetings-list');
    var heroMeetingsEl = document.getElementById('mc-stat-meetings');
    if (!listEl) return;

    var pMeetings = (window.VerdeServices && window.VerdeServices.Meetings)
      ? window.VerdeServices.Meetings.getMeetings()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_meetings') || '[]'));

    var pLeads = (window.VerdeServices && window.VerdeServices.Crm)
      ? window.VerdeServices.Crm.getLeads()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_crm_leads') || '[]'));

    Promise.all([pMeetings, pLeads]).then(function(results) {
      var baseMeetings = results[0] || [];
      var leads = results[1] || [];

      var allMeetings = [];
      baseMeetings.forEach(function(m) {
        if (m.status !== 'Completed' && m.status !== 'Cancelled') {
          allMeetings.push({
            time: m.time || '10:00',
            title: m.purpose || m.title || 'Meeting',
            sub: m.client || m.attendees || 'Team',
            status: m.status || 'Confirmed',
            date: m.date || ''
          });
        }
      });

      leads.forEach(function(lead) {
        if (lead.meetings && lead.meetings.length > 0) {
          lead.meetings.forEach(function(m) {
            if (m.status !== 'Completed' && m.status !== 'Cancelled') {
              allMeetings.push({
                time: m.time || '14:00',
                title: m.notes || m.purpose || 'Client Discussion',
                sub: lead.company || lead.name || 'Client',
                status: m.status || 'Scheduled',
                date: m.date || ''
              });
            }
          });
        }
      });

      var topMeetings = allMeetings.slice(0, 4);

      if (heroMeetingsEl) {
        if (topMeetings.length === 0) {
          heroMeetingsEl.textContent = 'No meetings scheduled for today';
        } else if (topMeetings.length === 1) {
          heroMeetingsEl.textContent = '1 scheduled — ' + topMeetings[0].time + ' ' + topMeetings[0].title;
        } else {
          heroMeetingsEl.textContent = topMeetings.length + ' scheduled — ' + topMeetings[0].time + ' ' + topMeetings[0].title + ', ' + topMeetings[1].time + ' ' + topMeetings[1].title;
        }
      }

      if (topMeetings.length === 0) {
        listEl.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No upcoming meetings scheduled</div>';
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
    }).catch(function() {
      if (heroMeetingsEl) heroMeetingsEl.textContent = 'No meetings scheduled for today';
      listEl.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:12px 0;">No upcoming meetings scheduled</div>';
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 6 — FINANCE & REVENUE (STRICT SOURCE OF TRUTH)
  // ══════════════════════════════════════════════════════════════════════════
  function syncDashboardWithFinance() {
    if (!canAccessModule('finance') && !isSuperAdmin()) return;

    var totalRevenue = 0;
    var pendingInvoiceCount = 0;

    // 1. Primary: Invoices store
    try {
      var rawInvoices = localStorage.getItem('verde_finance_invoices');
      if (rawInvoices) {
        var invoices = JSON.parse(rawInvoices);
        invoices.forEach(function(inv) {
          var isPaid = inv.status === 'Paid' || inv.status === 'Completed';
          if (isPaid) {
            totalRevenue += parseAmount(inv.total || inv.amount || 0);
          } else if (inv.status !== 'Cancelled') {
            pendingInvoiceCount++;
          }
        });
      }
    } catch(e) {}

    // 2. Transactions store (always included)
    try {
      var rawTx = localStorage.getItem('verde_os_finance_transactions');
      if (rawTx) {
        var transactions = JSON.parse(rawTx);
        transactions.forEach(function(t) {
          if (t.isDeleted) return;
          if (t.type === 'Income' && t.status === 'Completed') {
            totalRevenue += parseAmount(t.amount || 0);
          }
          if (t.type === 'Income' && (t.status === 'Processing' || t.status === 'Pending')) {
            pendingInvoiceCount++;
          }
        });
      }
    } catch(e) {}

    var invEl = document.getElementById('dashboard-kpi-invoices');
    if (invEl) invEl.textContent = pendingInvoiceCount;

    var revKpiEl = document.getElementById('dashboard-kpi-revenue');
    if (revKpiEl) revKpiEl.textContent = fmtLakhs(totalRevenue);

    var heroRevEl = document.getElementById('mc-stat-revenue');
    if (heroRevEl) {
      heroRevEl.innerHTML = fmtLakhs(totalRevenue) + ' this month · <span style="color:var(--success);">Settled Revenue</span>';
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 7 — PROJECTS & CRM SYNC (COMPANY HEALTH & ACTIVE PROJECTS)
  // ══════════════════════════════════════════════════════════════════════════
  function syncDashboardWithProjects() {
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjects().then(function(projects) {
        projects = projects || [];
        var activeProjects = projects.filter(function(p) { return !p.isDeleted && !p.isArchived; });

        var kpiEl = document.getElementById('dashboard-kpi-projects');
        if (kpiEl) kpiEl.textContent = activeProjects.length;

        var projListEl = document.getElementById('dashboard-active-projects');
        if (projListEl) {
          if (activeProjects.length === 0) {
            projListEl.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-3); font-size:13px;">No active projects available</div>';
          } else {
            var topProjects = activeProjects.slice(0, 4);
            projListEl.innerHTML = topProjects.map(function(p) {
              var pct = p.progress || 0;
              var color = pct > 80 ? 'var(--success)' : (pct > 40 ? 'var(--primary)' : 'var(--warning)');
              var badgeText = p.status === 'Completed' ? 'Done' : (pct > 80 ? 'On Track' : (pct > 40 ? 'In Progress' : 'Review'));
              var badgeClass = p.status === 'Completed' ? 'badge-success' : (pct > 80 ? 'badge-success' : (pct > 40 ? 'badge-primary' : 'badge-warning'));

              var avatarsHtml = (Array.isArray(p.team) ? p.team : ['SH']).map(function(m) {
                return '<div class="mc-avatar">' + esc(m) + '</div>';
              }).join('');

              return '<div class="mc-project-card" style="cursor:pointer;" onclick="localStorage.setItem(\'verde_pending_project_view\',\'' + esc(p.id) + '\'); window.location.href=\'../projects/index.html\';">' +
                '<div>' +
                  '<div class="mc-project-title">' + esc(p.name) + '</div>' +
                  '<div class="mc-project-client">' + esc(p.client || 'Client') + '</div>' +
                '</div>' +
                '<div class="mc-project-meta">' +
                  '<span style="color:' + color + ';font-weight:700;">' + pct + '%</span>' +
                  '<span style="color:var(--text-3);">' + esc(p.dueDate || 'Ongoing') + '</span>' +
                '</div>' +
                '<div class="mc-project-bar">' +
                  '<div class="mc-project-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                  '<div class="mc-avatars">' + avatarsHtml + '</div>' +
                  '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
                '</div>' +
              '</div>';
            }).join('');
          }
        }

        syncTeamActivity(projects);
      }).catch(function() {});
    }
  }

  function syncDashboardWithCRM() {
    if (!canAccessModule('crm') && !isSuperAdmin()) return;
    if (window.VerdeServices && window.VerdeServices.Crm) {
      window.VerdeServices.Crm.getClients().then(function(clients) {
        clients = clients || [];
        var activeClients = clients.filter(function(c) { return !c.isDeleted && (c.status === 'Active' || !c.status); }).length;
        var clientKpiEl = document.getElementById('dashboard-kpi-clients');
        if (clientKpiEl) clientKpiEl.textContent = activeClients;
      }).catch(function() {});
    }
  }
  window.syncDashboardWithCRM = syncDashboardWithCRM;

  // ══════════════════════════════════════════════════════════════════════════
  // PART 8 — TEAM ACTIVITY FEED
  // ══════════════════════════════════════════════════════════════════════════
  function syncTeamActivity(projectsList) {
    var activityFeedEl = document.getElementById('dashboard-recent-activity');
    if (!activityFeedEl) return;

    var allActivities = [];

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

    if (allActivities.length === 0) {
      activityFeedEl.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:24px;text-align:center;">No recent audit activity recorded</div>';
      return;
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
          '<div class="mc-activity-time">' + timeStr + (act.details ? ' • ' + esc(act.details) : '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 9 — PENDING APPROVALS
  // ══════════════════════════════════════════════════════════════════════════
  function syncPendingApprovals() {
    var container = document.getElementById('dashboard-pending-approvals');
    var badge = document.getElementById('dashboard-approvals-count');
    if (!container) return;

    var approvals = [];

    try {
      var rawInvoices = localStorage.getItem('verde_finance_invoices');
      if (rawInvoices) {
        var invoices = JSON.parse(rawInvoices);
        invoices.filter(function(inv) { return inv.status === 'Sent' || inv.status === 'Draft' || inv.status === 'Overdue'; }).forEach(function(inv) {
          approvals.push({
            id: inv.id || inv.invoiceNumber,
            type: 'invoice',
            title: 'Invoice ' + (inv.invoiceNumber || inv.id),
            sub: fmtMoney(inv.total || inv.amount || 0) + ' · ' + (inv.clientName || 'Client'),
            invoiceNumber: inv.invoiceNumber
          });
        });
      }
    } catch(e) {}

    try {
      var rawNotifs = localStorage.getItem('verde_os_notifications');
      if (rawNotifs) {
        var notifs = JSON.parse(rawNotifs);
        notifs.filter(function(n) { return !n.read && (n.type === 'alert' || (n.title && n.title.toLowerCase().includes('leave'))); }).forEach(function(n) {
          approvals.push({
            id: n.id,
            type: 'leave',
            title: n.title || 'Leave Request',
            sub: n.subtitle || n.desc || 'Pending administrative review'
          });
        });
      }
    } catch(e) {}

    if (badge) badge.textContent = approvals.length;

    if (approvals.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals ✔</div>';
      return;
    }

    container.innerHTML = approvals.map(function(item) {
      var iconColor = item.type === 'invoice' ? 'background:var(--success-50);color:var(--success);' : 'background:var(--primary-light);color:var(--primary);';
      var iconSvg = item.type === 'invoice'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>';

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
            container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals ✔</div>';
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
            container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:20px 0;text-align:center;">No pending approvals ✔</div>';
          }
          syncDashboardWithFinance();
        });
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 10 — TEAM PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  function syncTeamPerformance() {
    var grid = document.getElementById('mc-performance-grid');
    if (!grid) return;
    if (!canAccessModule('team') && !isSuperAdmin()) return;

    var pTeam = (window.VerdeServices && window.VerdeServices.Team && typeof window.VerdeServices.Team.getMembers === 'function')
      ? window.VerdeServices.Team.getMembers()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_team_employees') || '[]'));

    var pTasks = (window.VerdeServices && window.VerdeServices.Tasks)
      ? window.VerdeServices.Tasks.getTasks()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_tasks') || '[]'));

    Promise.all([pTeam, pTasks]).then(function(results) {
      var teamEmps = (results[0] || []).filter(function(e) { return !e.isDeleted && e.status !== 'Inactive'; });
      var tasks = results[1] || [];

      if (teamEmps.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; padding:16px; text-align:center; color:var(--text-3); font-size:12px;">No active team members registered</div>';
        return;
      }

      var bgColors = ['var(--primary)', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];
      grid.innerHTML = teamEmps.slice(0, 4).map(function(emp, i) {
        var empTasks = tasks.filter(function(t) {
          return (t.assignee && t.assignee.toLowerCase().includes((emp.name || '').toLowerCase())) ||
                 (t.assigneeId && t.assigneeId === emp.initials) ||
                 (t.assigneeInitials && t.assigneeInitials === emp.initials);
        });
        var doneTasks = empTasks.filter(function(t) { return t.status === 'Completed'; }).length;
        var prodPct = empTasks.length > 0 ? Math.round((doneTasks / empTasks.length) * 100) : 100;
        var initials = emp.initials || (emp.name || '??').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
        var bgColor = bgColors[i % bgColors.length];

        return '<div class="mc-perf-card">' +
          '<div class="mc-perf-avatar" style="background:' + bgColor + ';">' + initials + '</div>' +
          '<div style="flex: 1;">' +
            '<div class="mc-perf-name" style="margin-bottom: 4px;">' + esc(emp.name) + '</div>' +
            '<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-3);">' +
              '<span>' + esc(emp.department || 'General') + '</span>' +
              '<span>' + doneTasks + '/' + empTasks.length + ' tasks</span>' +
              '<span style="color: var(--success); font-weight: 700;">' + prodPct + '%</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }).catch(function() {});
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 11 — QUICK NOTES (PER-USER PERSISTENCE)
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
  // PART 12 — HOURS WORKED
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

  // ══════════════════════════════════════════════════════════════════════════
  // PART 13 — ROLE PERMISSION APPLICATION
  // ══════════════════════════════════════════════════════════════════════════
  function applyPermissions() {
    var healthSection = document.querySelector('.mc-health-grid');
    if (healthSection && !canAccessModule('finance') && !isSuperAdmin()) {
      var sec = healthSection.closest('section');
      if (sec) sec.style.display = 'none';
    }

    var perfGrid = document.getElementById('mc-performance-grid');
    if (perfGrid && !canAccessModule('team') && !isSuperAdmin()) {
      var sec2 = perfGrid.closest('section');
      if (sec2) sec2.style.display = 'none';
    }

    if (!isSuperAdmin()) {
      var apprSec = document.getElementById('mc-approvals-section');
      if (apprSec) apprSec.style.display = 'none';
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER REFRESH & CROSS-MODULE SYNC
  // ══════════════════════════════════════════════════════════════════════════
  function refreshAllDashboardData() {
    updateGreeting();
    updateHeroDate();
    syncHeroAndMission();
    syncMeetings();
    syncDashboardWithProjects();
    syncDashboardWithCRM();
    syncDashboardWithFinance();
    syncHoursWorked();
    syncTeamPerformance();
    syncPendingApprovals();
    applyPermissions();
  }
  window.refreshMissionControl = refreshAllDashboardData;

  function init() {
    initSidebarToggle();
    renderCalendar();
    initCalendarNav();
    initQuickNotes();

    refreshAllDashboardData();

    updateClock();
    updateTopbarDate();
    updateFooterTime();

    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000);
    setInterval(updateFooterTime, 60000);
    setInterval(syncHoursWorked, 1000);

    window.addEventListener('focus', refreshAllDashboardData);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) refreshAllDashboardData();
    });
    window.addEventListener('storage', refreshAllDashboardData);
    if (window.VerdeState && typeof window.VerdeState.subscribe === 'function') {
      window.VerdeState.subscribe('*', refreshAllDashboardData);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();