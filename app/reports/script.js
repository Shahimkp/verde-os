/* ==========================================================================
   VERDE OS — REPORTS & ANALYTICS MODULE CONTROLLER
   Pure Data-Driven Executive Intelligence Engine (Read-Only Synchronization)
   ========================================================================== */

(function () {
  'use strict';

  /* ── State ── */
  var currentCategory = 'all';
  var currentDateRange = 'month'; // 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'all'
  var searchQuery = '';
  var libraryPage = 1;
  var PAGE_SIZE = 5;
  var sortField = 'date';
  var sortAsc = false;
  var activeModalReport = null;

  var cachedData = {
    tasks: [],
    projects: [],
    leads: [],
    clients: [],
    employees: [],
    invoices: [],
    expenses: [],
    marketing: []
  };

  /* ── Permissions & Session Helpers ── */
  function getUser() {
    if (window.VERDE_SESSION && window.VERDE_SESSION.getUser) {
      return window.VERDE_SESSION.getUser();
    }
    return null;
  }

  function getUserName() {
    var u = getUser();
    return u && u.name ? u.name : 'Executive';
  }

  function isSuperAdmin() {
    var u = getUser();
    return u && u.role === 'SuperAdmin';
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

  /* ── Strict Date Range Filtering ── */
  function isDateInRange(dateInput, range) {
    if (!dateInput || range === 'all') return true;
    var d = new Date(dateInput);
    if (isNaN(d.getTime())) return true;

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (range === 'today') {
      return d >= todayStart && d <= todayEnd;
    } else if (range === 'week') {
      var weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo && d <= todayEnd;
    } else if (range === 'month') {
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= monthStart && d <= todayEnd;
    } else if (range === 'last_month') {
      var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return d >= lastMonthStart && d <= lastMonthEnd;
    } else if (range === 'quarter') {
      var quarterAgo = new Date(todayStart.getTime() - 90 * 24 * 60 * 60 * 1000);
      return d >= quarterAgo && d <= todayEnd;
    }
    return true;
  }

  /* ── Real Data Loader Across VERDE OS Modules ── */
  function loadAllData() {
    var pTasks = (window.VerdeServices && window.VerdeServices.Tasks)
      ? window.VerdeServices.Tasks.getTasks()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_tasks') || '[]'));

    var pProjects = (window.VerdeServices && window.VerdeServices.Projects)
      ? window.VerdeServices.Projects.getProjects()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_projects') || '[]'));

    var pLeads = (window.VerdeServices && window.VerdeServices.Crm)
      ? window.VerdeServices.Crm.getLeads()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_crm_leads') || '[]'));

    var pClients = (window.VerdeServices && window.VerdeServices.Crm)
      ? window.VerdeServices.Crm.getClients()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_crm_clients') || '[]'));

    var pTeam = (window.VerdeServices && window.VerdeServices.Team && typeof window.VerdeServices.Team.getMembers === 'function')
      ? window.VerdeServices.Team.getMembers()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_team_employees') || '[]'));

    var pMarketing = (window.VerdeServices && window.VerdeServices.Marketing && typeof window.VerdeServices.Marketing.getCampaigns === 'function')
      ? window.VerdeServices.Marketing.getCampaigns()
      : Promise.resolve(JSON.parse(localStorage.getItem('verde_os_marketing') || '[]'));

    return Promise.all([pTasks, pProjects, pLeads, pClients, pTeam, pMarketing]).then(function (results) {
      cachedData.tasks = results[0] || [];
      cachedData.projects = results[1] || [];
      cachedData.leads = results[2] || [];
      cachedData.clients = results[3] || [];
      cachedData.employees = results[4] || [];
      cachedData.marketing = results[5] || [];

      // 1. Finance Invoices & Transactions
      var invList = [];
      try {
        var rawInvs = localStorage.getItem('verde_finance_invoices');
        if (rawInvs) invList = JSON.parse(rawInvs);
      } catch (e) {}

      var txList = [];
      try {
        var rawTx = localStorage.getItem('verde_os_finance_transactions');
        if (rawTx) txList = JSON.parse(rawTx);
      } catch (e) {}

      // Normalize Finance Invoices
      var allInvoices = [];
      invList.forEach(function(inv) {
        allInvoices.push({
          id: inv.id || inv.invoiceNumber,
          invoiceNumber: inv.invoiceNumber || inv.id,
          clientName: inv.clientName || inv.client || 'Client',
          total: parseAmount(inv.total || inv.amount || 0),
          status: inv.status || 'Paid',
          type: inv.type || 'Income',
          issueDate: inv.issueDate || inv.date || new Date().toISOString(),
          dueDate: inv.dueDate || inv.date || ''
        });
      });

      txList.forEach(function(tx) {
        if (tx.type === 'Income' && !allInvoices.some(function(i) { return i.id === tx.id; })) {
          allInvoices.push({
            id: tx.id || ('TX-' + Date.now()),
            invoiceNumber: tx.invoiceNumber || tx.id,
            clientName: tx.client || 'Client',
            total: parseAmount(tx.amount || tx.total || 0),
            status: tx.status === 'Completed' ? 'Paid' : (tx.status || 'Pending'),
            type: 'Income',
            issueDate: tx.date || new Date().toISOString(),
            dueDate: tx.date || ''
          });
        }
      });

      cachedData.invoices = allInvoices;

      // 2. Finance Expenses
      var expList = [];
      try {
        var rawExps = localStorage.getItem('verde_finance_expenses');
        if (rawExps) expList = JSON.parse(rawExps);
      } catch (e) {}

      txList.forEach(function(tx) {
        if (tx.type === 'Expense' && !expList.some(function(e) { return e.id === tx.id; })) {
          expList.push({
            id: tx.id || ('EXP-' + Date.now()),
            category: tx.category || tx.description || 'Operating Expense',
            vendor: tx.client || tx.vendor || 'Supplier',
            total: parseAmount(tx.amount || tx.total || 0),
            date: tx.date || new Date().toISOString(),
            status: tx.status === 'Completed' ? 'Approved' : (tx.status || 'Approved')
          });
        }
      });

      cachedData.expenses = expList;

      return cachedData;
    });
  }

  /* ── Metric Calculation Helpers ── */
  function getPaidRevenue(invoices, range) {
    var sum = 0;
    invoices.forEach(function(inv) {
      var isPaid = inv.status === 'Paid' || inv.status === 'Completed' || (inv.type === 'Income' && inv.status !== 'Pending' && inv.status !== 'Draft');
      if (isPaid && isDateInRange(inv.issueDate, range)) {
        sum += (inv.total || 0);
      }
    });
    return sum;
  }

  function getOutstandingReceivables(invoices, range) {
    var sum = 0;
    invoices.forEach(function(inv) {
      var isUnpaid = inv.status !== 'Paid' && inv.status !== 'Completed' && inv.status !== 'Cancelled';
      if (isUnpaid && isDateInRange(inv.issueDate, range)) {
        sum += (inv.total || 0);
      }
    });
    return sum;
  }

  function getOperationalExpenses(expenses, range) {
    var sum = 0;
    expenses.forEach(function(e) {
      if (e.status !== 'Rejected' && isDateInRange(e.date, range)) {
        sum += parseAmount(e.total || e.amount || 0);
      }
    });
    return sum;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     1. EXECUTIVE KPI SUMMARY CALCULATOR (PER CATEGORY & DATE RANGE)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderKPIs() {
    var k1Val = document.getElementById('rep-kpi-1-val');
    var k1Lbl = document.getElementById('rep-kpi-1-lbl');
    var k2Val = document.getElementById('rep-kpi-2-val');
    var k2Lbl = document.getElementById('rep-kpi-2-lbl');
    var k3Val = document.getElementById('rep-kpi-3-val');
    var k3Lbl = document.getElementById('rep-kpi-3-lbl');
    var k4Val = document.getElementById('rep-kpi-4-val');
    var k4Lbl = document.getElementById('rep-kpi-4-lbl');

    if (!k1Val || !k2Val || !k3Val || !k4Val) return;

    var range = currentDateRange;

    // Filter datasets by range
    var fltTasks = cachedData.tasks.filter(function(t) { return !t.isDeleted && isDateInRange(t.createdAt || t.dueDate, range); });
    var fltProjects = cachedData.projects.filter(function(p) { return !p.isDeleted && isDateInRange(p.createdAt || p.dueDate || p.startDate, range); });
    var fltLeads = cachedData.leads.filter(function(l) { return !l.isDeleted && isDateInRange(l.createdAt || l.date, range); });
    var fltClients = cachedData.clients.filter(function(c) { return !c.isDeleted && isDateInRange(c.createdAt || c.since, range); });
    var employees = cachedData.employees.filter(function(e) { return !e.isDeleted; });

    // ── REVENUE / FINANCE CATEGORY ──
    if (currentCategory === 'revenue' || currentCategory === 'finance') {
      var totalRev = getPaidRevenue(cachedData.invoices, range);
      var totalPending = getOutstandingReceivables(cachedData.invoices, range);
      var totalExp = getOperationalExpenses(cachedData.expenses, range);
      var netProfit = totalRev - totalExp;

      k1Val.textContent = fmtLakhs(totalRev);
      k1Val.style.color = 'var(--success)';
      k1Lbl.textContent = 'Total Revenue';

      k2Val.textContent = fmtLakhs(totalPending);
      k2Val.style.color = 'var(--warning)';
      k2Lbl.textContent = 'Outstanding Receivables';

      k3Val.textContent = fmtLakhs(totalExp);
      k3Val.style.color = 'var(--danger)';
      k3Lbl.textContent = 'Operational Expenses';

      k4Val.textContent = fmtLakhs(netProfit);
      k4Val.style.color = netProfit >= 0 ? 'var(--primary)' : 'var(--danger)';
      k4Lbl.textContent = 'Net Operating Margin';

    // ── PROJECTS CATEGORY ──
    } else if (currentCategory === 'projects') {
      var totalPrj = fltProjects.length;
      var completedPrj = fltProjects.filter(function(p) { return p.status === 'Completed' || p.progress === 100; }).length;
      var activePrj = fltProjects.filter(function(p) {
        return p.status === 'Active' || p.status === 'In Progress' || p.status === 'At Risk' || p.status === 'On Track' || p.status === 'Review' || (!p.status && p.progress < 100);
      }).length;
      var successRate = totalPrj > 0 ? Math.round((completedPrj / totalPrj) * 100) : 0;

      k1Val.textContent = activePrj;
      k1Val.style.color = 'var(--primary)';
      k1Lbl.textContent = 'Active Projects';

      k2Val.textContent = completedPrj;
      k2Val.style.color = 'var(--success)';
      k2Lbl.textContent = 'Completed Projects';

      k3Val.textContent = successRate + '%';
      k3Val.style.color = 'var(--info)';
      k3Lbl.textContent = 'Project Success Rate';

      k4Val.textContent = totalPrj;
      k4Val.style.color = 'var(--text-1)';
      k4Lbl.textContent = 'Total Managed Projects';

    // ── SALES / CRM CATEGORY ──
    } else if (currentCategory === 'sales') {
      var totalLds = fltLeads.length;
      var wonLds = fltLeads.filter(function(l) { return l.stage === 'Won' || l.status === 'Won'; }).length;
      var activePipelineLeads = fltLeads.filter(function(l) { return l.stage !== 'Won' && l.stage !== 'Lost'; });
      var pipelineVal = activePipelineLeads.reduce(function(sum, l) { return sum + parseAmount(l.value || l.dealValue || 0); }, 0);
      var convRate = totalLds > 0 ? Math.round((wonLds / totalLds) * 100) : 0;

      k1Val.textContent = totalLds;
      k1Val.style.color = 'var(--warning)';
      k1Lbl.textContent = 'Total Pipeline Leads';

      k2Val.textContent = wonLds;
      k2Val.style.color = 'var(--success)';
      k2Lbl.textContent = 'Deals Closed (Won)';

      k3Val.textContent = convRate + '%';
      k3Val.style.color = 'var(--info)';
      k3Lbl.textContent = 'Lead Conversion Rate';

      k4Val.textContent = fmtLakhs(pipelineVal);
      k4Val.style.color = 'var(--primary)';
      k4Lbl.textContent = 'Active Pipeline Value';

    // ── PRODUCTIVITY CATEGORY ──
    } else if (currentCategory === 'productivity') {
      var totalTsk = fltTasks.length;
      var doneTsk = fltTasks.filter(function(t) { return t.status === 'Completed'; }).length;
      var activeTsk = fltTasks.filter(function(t) { return t.status !== 'Completed' && t.status !== 'Archived'; }).length;
      var overdueTsk = fltTasks.filter(function(t) {
        if (!t.dueDate || t.status === 'Completed') return false;
        var d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d < new Date();
      }).length;
      var compRate = totalTsk > 0 ? Math.round((doneTsk / totalTsk) * 100) : 0;

      k1Val.textContent = activeTsk;
      k1Val.style.color = 'var(--primary)';
      k1Lbl.textContent = 'Active Deliverables';

      k2Val.textContent = doneTsk;
      k2Val.style.color = 'var(--success)';
      k2Lbl.textContent = 'Completed Tasks';

      k3Val.textContent = overdueTsk;
      k3Val.style.color = overdueTsk > 0 ? 'var(--danger)' : 'var(--success)';
      k3Lbl.textContent = 'Overdue Tasks';

      k4Val.textContent = compRate + '%';
      k4Val.style.color = 'var(--warning)';
      k4Lbl.textContent = 'Throughput Velocity';

    // ── TEAM CATEGORY ──
    } else if (currentCategory === 'team') {
      var activeEmp = employees.filter(function(e) { return e.status !== 'Inactive'; }).length;
      var departments = {};
      employees.forEach(function(e) { if (e.department) departments[e.department] = true; });
      var deptCount = Object.keys(departments).length;

      var totalDone = fltTasks.filter(function(t) { return t.status === 'Completed'; }).length;
      var totalAssigned = fltTasks.length;
      var teamProd = totalAssigned > 0 ? Math.round((totalDone / totalAssigned) * 100) : 0;

      k1Val.textContent = activeEmp;
      k1Val.style.color = 'var(--primary)';
      k1Lbl.textContent = 'Active Team Members';

      k2Val.textContent = deptCount;
      k2Val.style.color = 'var(--info)';
      k2Lbl.textContent = 'Operational Departments';

      k3Val.textContent = totalDone;
      k3Val.style.color = 'var(--success)';
      k3Lbl.textContent = 'Completed Deliverables';

      k4Val.textContent = teamProd + '%';
      k4Val.style.color = 'var(--warning)';
      k4Lbl.textContent = 'Department Productivity';

    // ── DEFAULT GENERAL OVERVIEW (ALL) ──
    } else {
      var revAll = getPaidRevenue(cachedData.invoices, range);
      var totalPrjAll = fltProjects.length;
      var compPrjAll = fltProjects.filter(function(p) { return p.status === 'Completed' || p.progress === 100; }).length;
      var pSuccess = totalPrjAll > 0 ? Math.round((compPrjAll / totalPrjAll) * 100) : 0;

      var totalTskAll = fltTasks.length;
      var doneTskAll = fltTasks.filter(function(t) { return t.status === 'Completed'; }).length;
      var tVelocity = totalTskAll > 0 ? Math.round((doneTskAll / totalTskAll) * 100) : 0;

      var actCliAll = fltClients.filter(function(c) { return c.status === 'Active' || !c.status; }).length;

      k1Val.textContent = fmtLakhs(revAll);
      k1Val.style.color = 'var(--success)';
      k1Lbl.textContent = 'Revenue Volume';

      k2Val.textContent = pSuccess + '%';
      k2Val.style.color = 'var(--primary)';
      k2Lbl.textContent = 'Project Success Rate';

      k3Val.textContent = actCliAll + ' Active';
      k3Val.style.color = 'var(--info)';
      k3Lbl.textContent = 'Client Retention';

      k4Val.textContent = tVelocity + '%';
      k4Val.style.color = 'var(--warning)';
      k4Lbl.textContent = 'Team Productivity';
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     2. ANALYTICS CHARTS RENDERER (EXECUTIVE REAL DATA VISUALIZATIONS)
     ══════════════════════════════════════════════════════════════════════════ */
  function renderCharts() {
    var range = currentDateRange;

    // Filtered data subsets by active range
    var invoices = cachedData.invoices;
    var projects = cachedData.projects.filter(function(p) { return !p.isDeleted && isDateInRange(p.createdAt || p.dueDate || p.startDate, range); });
    var leads = cachedData.leads.filter(function(l) { return !l.isDeleted && isDateInRange(l.createdAt || l.date, range); });
    var tasks = cachedData.tasks.filter(function(t) { return !t.isDeleted && isDateInRange(t.createdAt || t.dueDate, range); });

    // ──────────────────────────────────────────────────────────────────────────
    // 1. REVENUE TREND (INTERACTIVE SVG LINE & AREA CHART)
    // ──────────────────────────────────────────────────────────────────────────
    var c1Body = document.getElementById('rep-chart-1-body');
    var c1Total = document.getElementById('rep-c1-total');
    var c1Avg = document.getElementById('rep-c1-avg');
    var c1Growth = document.getElementById('rep-c1-growth');

    if (c1Body) {
      var now = new Date();
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var months = [];
      var revValues = [];

      for (var i = 5; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        var mIdx = d.getMonth();
        var yIdx = d.getFullYear();
        months.push({ label: monthNames[mIdx], month: mIdx, year: yIdx });

        var mRev = 0;
        invoices.forEach(function(inv) {
          var isPaid = inv.status === 'Paid' || inv.status === 'Completed' || (inv.type === 'Income' && inv.status !== 'Pending');
          if (isPaid && inv.issueDate) {
            var idt = new Date(inv.issueDate);
            if (!isNaN(idt.getTime()) && idt.getFullYear() === yIdx && idt.getMonth() === mIdx) {
              mRev += (inv.total || 0);
            }
          }
        });
        revValues.push(mRev);
      }

      var total6Mo = revValues.reduce(function(sum, v) { return sum + v; }, 0);
      var avg6Mo = Math.round(total6Mo / 6);
      var firstMo = revValues[0];
      var lastMo = revValues[5];
      var growthPct = firstMo > 0 ? Math.round(((lastMo - firstMo) / firstMo) * 100) : (lastMo > 0 ? '+100%' : '0%');
      if (typeof growthPct === 'number') growthPct = (growthPct >= 0 ? '+' : '') + growthPct + '%';

      if (c1Total) c1Total.textContent = fmtLakhs(total6Mo);
      if (c1Avg) c1Avg.textContent = fmtLakhs(avg6Mo);
      if (c1Growth) {
        c1Growth.textContent = growthPct;
        c1Growth.style.color = (parseInt(growthPct, 10) >= 0 || growthPct === '0%') ? 'var(--primary)' : 'var(--danger)';
      }

      var maxRev = Math.max.apply(null, revValues);
      if (maxRev === 0) {
        c1Body.innerHTML = '<div class="rep-chart-empty">' +
          '<svg class="rep-chart-empty-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
          '<div class="rep-chart-empty-text">No revenue recorded for this period</div>' +
          '<div class="rep-chart-empty-sub">Paid invoice settlements will appear here.</div>' +
        '</div>';
      } else {
        // Build SVG Chart Geometry
        var svgW = 460;
        var svgH = 150;
        var padL = 45;
        var padR = 20;
        var padT = 15;
        var padB = 25;
        var chartW = svgW - padL - padR;
        var chartH = svgH - padT - padB;

        var yMax = Math.ceil(maxRev * 1.15);
        var stepX = chartW / 5;

        var points = revValues.map(function(val, idx) {
          var x = padL + (idx * stepX);
          var y = padT + chartH - ((val / yMax) * chartH);
          return { x: x, y: y, val: val, label: months[idx].label };
        });

        // Path generators
        var lineD = 'M ' + points[0].x + ' ' + points[0].y;
        for (var p = 1; p < points.length; p++) {
          var prev = points[p - 1];
          var curr = points[p];
          var cp1x = prev.x + (curr.x - prev.x) / 2;
          var cp1y = prev.y;
          var cp2x = prev.x + (curr.x - prev.x) / 2;
          var cp2y = curr.y;
          lineD += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + curr.x + ' ' + curr.y;
        }

        var areaD = lineD + ' L ' + points[points.length - 1].x + ' ' + (padT + chartH) + ' L ' + points[0].x + ' ' + (padT + chartH) + ' Z';

        // Y-axis grid ticks
        var yTicks = [0, Math.round(yMax / 2), yMax];
        var gridLinesHtml = yTicks.map(function(tVal) {
          var yPos = padT + chartH - ((tVal / yMax) * chartH);
          return '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (svgW - padR) + '" y2="' + yPos + '" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" />' +
            '<text x="' + (padL - 8) + '" y="' + (yPos + 3) + '" fill="var(--text-3)" font-size="9" font-weight="700" text-anchor="end">' + fmtLakhs(tVal) + '</text>';
        }).join('');

        // X-axis text labels & interactive points
        var elementsHtml = points.map(function(pt, idx) {
          return '<text x="' + pt.x + '" y="' + (svgH - 4) + '" fill="var(--text-3)" font-size="10" font-weight="700" text-anchor="middle">' + pt.label + '</text>' +
            '<circle class="rep-chart-point" data-idx="' + idx + '" data-label="' + pt.label + '" data-val="' + fmtMoney(pt.val) + '" cx="' + pt.x + '" cy="' + pt.y + '" r="4.5" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.5" />';
        }).join('');

        var svgHtml = '<div class="rep-svg-wrap">' +
          '<div id="rep-c1-tooltip" class="rep-tooltip-pill" style="display:none; opacity:0;"></div>' +
          '<svg class="rep-svg-chart" viewBox="0 0 ' + svgW + ' ' + svgH + '">' +
            '<defs>' +
              '<linearGradient id="repRevGrad" x1="0" y1="0" x2="0" y2="1">' +
                '<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.32" />' +
                '<stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0" />' +
              '</linearGradient>' +
            '</defs>' +
            gridLinesHtml +
            '<path d="' + areaD + '" fill="url(#repRevGrad)" />' +
            '<path d="' + lineD + '" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
            elementsHtml +
          '</svg>' +
        '</div>';

        c1Body.innerHTML = svgHtml;

        // Tooltip interaction
        var tooltip = document.getElementById('rep-c1-tooltip');
        var wrap = c1Body.querySelector('.rep-svg-wrap');
        if (tooltip && wrap) {
          wrap.querySelectorAll('.rep-chart-point').forEach(function(pt) {
            pt.addEventListener('mouseenter', function() {
              var lbl = this.getAttribute('data-label');
              var val = this.getAttribute('data-val');
              var cx = parseFloat(this.getAttribute('cx'));
              var cy = parseFloat(this.getAttribute('cy'));
              var pctX = (cx / svgW) * 100;
              var pctY = (cy / svgH) * 100;

              tooltip.innerHTML = lbl + ' · ' + val;
              tooltip.style.left = pctX + '%';
              tooltip.style.top = pctY + '%';
              tooltip.style.display = 'block';
              tooltip.style.opacity = '1';
            });
            pt.addEventListener('mouseleave', function() {
              tooltip.style.opacity = '0';
              tooltip.style.display = 'none';
            });
          });
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. PROJECT COMPLETION (STATUS DISTRIBUTION BARS)
    // ──────────────────────────────────────────────────────────────────────────
    var c2Body = document.getElementById('rep-chart-2-body');
    var c2Total = document.getElementById('rep-c2-total');
    var c2Active = document.getElementById('rep-c2-active');
    var c2Comp = document.getElementById('rep-c2-comp');

    if (c2Body) {
      var totalPrj = projects.length;
      var prjPlanning = projects.filter(function(p) { return p.status === 'Planning' || p.status === 'Draft'; }).length;
      var prjActive = projects.filter(function(p) { return p.status === 'Active' || p.status === 'In Progress' || p.status === 'On Track'; }).length;
      var prjReview = projects.filter(function(p) { return p.status === 'At Risk' || p.status === 'Review'; }).length;
      var prjCompleted = projects.filter(function(p) { return p.status === 'Completed' || p.progress === 100; }).length;

      if (c2Total) c2Total.textContent = totalPrj;
      if (c2Active) c2Active.textContent = prjActive + prjReview;
      if (c2Comp) c2Comp.textContent = prjCompleted;

      if (totalPrj === 0) {
        c2Body.innerHTML = '<div class="rep-chart-empty">' +
          '<svg class="rep-chart-empty-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>' +
          '<div class="rep-chart-empty-text">No project activity available for this period</div>' +
          '<div class="rep-chart-empty-sub">Active projects and delivery milestones will appear here.</div>' +
        '</div>';
      } else {
        var stages = [
          { name: 'Completed', count: prjCompleted, color: 'var(--success)', pct: Math.round((prjCompleted / totalPrj) * 100) },
          { name: 'In Progress / Active', count: prjActive, color: 'var(--primary)', pct: Math.round((prjActive / totalPrj) * 100) },
          { name: 'Review / At Risk', count: prjReview, color: 'var(--warning)', pct: Math.round((prjReview / totalPrj) * 100) },
          { name: 'Planning & Draft', count: prjPlanning, color: '#94a3b8', pct: Math.round((prjPlanning / totalPrj) * 100) }
        ];

        c2Body.innerHTML = '<div class="rep-stage-list">' +
          stages.map(function(st) {
            return '<div class="rep-stage-item">' +
              '<div class="rep-stage-header">' +
                '<span class="rep-stage-name"><span class="rep-stage-dot" style="background:' + st.color + ';"></span>' + st.name + '</span>' +
                '<span class="rep-stage-values">' + st.count + ' (' + st.pct + '%)</span>' +
              '</div>' +
              '<div class="rep-stage-bar-track">' +
                '<div class="rep-stage-bar-fill" style="width:' + st.pct + '%; background:' + st.color + ';"></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. SALES PERFORMANCE (PIPELINE STAGE BARS)
    // ──────────────────────────────────────────────────────────────────────────
    var c3Body = document.getElementById('rep-chart-3-body');
    var c3Pipe = document.getElementById('rep-c3-pipe');
    var c3Won = document.getElementById('rep-c3-won');
    var c3Rate = document.getElementById('rep-c3-rate');

    if (c3Body) {
      var totalLds = leads.length;
      var stageNew = leads.filter(function(l) { return l.stage === 'New' || l.stage === 'Lead' || (!l.stage && !l.status); });
      var stageContacted = leads.filter(function(l) { return l.stage === 'Contacted'; });
      var stageProposal = leads.filter(function(l) { return l.stage === 'Proposal' || l.stage === 'Proposal Sent' || l.stage === 'Negotiation'; });
      var stageWon = leads.filter(function(l) { return l.stage === 'Won' || l.status === 'Won'; });

      var activePipeSum = 0;
      stageNew.concat(stageContacted, stageProposal).forEach(function(l) { activePipeSum += parseAmount(l.value || l.dealValue || 0); });

      var wonSum = 0;
      stageWon.forEach(function(l) { wonSum += parseAmount(l.value || l.dealValue || 0); });

      var winRate = totalLds > 0 ? Math.round((stageWon.length / totalLds) * 100) : 0;

      if (c3Pipe) c3Pipe.textContent = fmtLakhs(activePipeSum);
      if (c3Won) c3Won.textContent = fmtLakhs(wonSum);
      if (c3Rate) c3Rate.textContent = winRate + '%';

      if (totalLds === 0) {
        c3Body.innerHTML = '<div class="rep-chart-empty">' +
          '<svg class="rep-chart-empty-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' +
          '<div class="rep-chart-empty-text">No CRM pipeline records available for this period</div>' +
          '<div class="rep-chart-empty-sub">Lead conversions and stage progression will appear here.</div>' +
        '</div>';
      } else {
        var pipeStages = [
          { name: 'Deals Closed (Won)', list: stageWon, color: 'var(--success)' },
          { name: 'Proposal & Negotiation', list: stageProposal, color: 'var(--primary)' },
          { name: 'Contacted', list: stageContacted, color: 'var(--warning)' },
          { name: 'New Leads', list: stageNew, color: 'var(--info)' }
        ];

        c3Body.innerHTML = '<div class="rep-stage-list">' +
          pipeStages.map(function(st) {
            var val = st.list.reduce(function(sum, l) { return sum + parseAmount(l.value || l.dealValue || 0); }, 0);
            var pct = totalLds > 0 ? Math.round((st.list.length / totalLds) * 100) : 0;
            return '<div class="rep-stage-item">' +
              '<div class="rep-stage-header">' +
                '<span class="rep-stage-name"><span class="rep-stage-dot" style="background:' + st.color + ';"></span>' + st.name + '</span>' +
                '<span class="rep-stage-values">' + st.list.length + ' leads · ' + fmtMoney(val) + '</span>' +
              '</div>' +
              '<div class="rep-stage-bar-track">' +
                '<div class="rep-stage-bar-fill" style="width:' + pct + '%; background:' + st.color + ';"></div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TASK COMPLETION (WEEKLY GROUPED ACTIVITY BARS)
    // ──────────────────────────────────────────────────────────────────────────
    var c4Body = document.getElementById('rep-chart-4-body');
    var c4Total = document.getElementById('rep-c4-total');
    var c4Comp = document.getElementById('rep-c4-comp');
    var c4Pending = document.getElementById('rep-c4-pending');

    if (c4Body) {
      var totalTsk = tasks.length;
      var doneTsk = tasks.filter(function(t) { return t.status === 'Completed'; }).length;
      var pendingTsk = totalTsk - doneTsk;

      if (c4Total) c4Total.textContent = totalTsk;
      if (c4Comp) c4Comp.textContent = doneTsk;
      if (c4Pending) c4Pending.textContent = pendingTsk;

      if (totalTsk === 0) {
        c4Body.innerHTML = '<div class="rep-chart-empty">' +
          '<svg class="rep-chart-empty-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' +
          '<div class="rep-chart-empty-text">No task activity recorded for this period</div>' +
          '<div class="rep-chart-empty-sub">Completed and active tasks will display here.</div>' +
        '</div>';
      } else {
        var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Distribute real tasks across the 7 weekly buckets by date or proportional sequence
        var dayStats = days.map(function(day, dIdx) {
          var dDone = 0;
          var dOpen = 0;
          tasks.forEach(function(t, tIdx) {
            var dt = t.dueDate || t.createdAt;
            if (dt) {
              var dObj = new Date(dt);
              if (!isNaN(dObj.getTime())) {
                var dayNum = (dObj.getDay() + 6) % 7; // Convert Sun=0 to Mon=0
                if (dayNum === dIdx) {
                  if (t.status === 'Completed') dDone++;
                  else dOpen++;
                }
              }
            } else if (tIdx % 7 === dIdx) {
              if (t.status === 'Completed') dDone++;
              else dOpen++;
            }
          });
          return { day: day, done: dDone, open: dOpen, total: dDone + dOpen };
        });

        var maxDayTasks = Math.max.apply(null, dayStats.map(function(s) { return Math.max(s.done, s.open); })) * 1.2 || 4;

        c4Body.innerHTML = '<div style="position:relative; width:100%;">' +
          '<div id="rep-c4-tooltip" class="rep-tooltip-pill" style="display:none; opacity:0;"></div>' +
          '<div style="display:flex; justify-content:flex-end; gap:16px; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--text-3);">' +
            '<span style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:2px; background:var(--success);"></span> Completed (' + doneTsk + ')</span>' +
            '<span style="display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:2px; background:var(--primary);"></span> Open (' + pendingTsk + ')</span>' +
          '</div>' +
          '<div class="rep-weekly-grid">' +
            dayStats.map(function(st, dIdx) {
              var hDone = Math.max(6, Math.round((st.done / maxDayTasks) * 100));
              var hOpen = Math.max(6, Math.round((st.open / maxDayTasks) * 100));
              return '<div class="rep-weekly-col">' +
                '<div class="rep-weekly-bars">' +
                  '<div class="rep-wbar rep-wbar-done" data-day="' + st.day + '" data-done="' + st.done + '" data-open="' + st.open + '" style="height:' + (st.done > 0 ? hDone : 4) + '%; background:var(--success); opacity:' + (st.done > 0 ? '1' : '0.2') + ';"></div>' +
                  '<div class="rep-wbar rep-wbar-open" data-day="' + st.day + '" data-done="' + st.done + '" data-open="' + st.open + '" style="height:' + (st.open > 0 ? hOpen : 4) + '%; background:var(--primary); opacity:' + (st.open > 0 ? '1' : '0.2') + ';"></div>' +
                '</div>' +
                '<div class="rep-weekly-label">' + st.day + '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';

        // Tooltip interaction
        var wTooltip = document.getElementById('rep-c4-tooltip');
        if (wTooltip) {
          c4Body.querySelectorAll('.rep-wbar').forEach(function(bar) {
            bar.addEventListener('mouseenter', function() {
              var day = this.getAttribute('data-day');
              var done = this.getAttribute('data-done');
              var open = this.getAttribute('data-open');
              var rect = this.getBoundingClientRect();
              var bodyRect = c4Body.getBoundingClientRect();

              wTooltip.innerHTML = day + ' · ' + done + ' Done, ' + open + ' Open';
              wTooltip.style.left = (rect.left - bodyRect.left + rect.width / 2) + 'px';
              wTooltip.style.top = (rect.top - bodyRect.top) + 'px';
              wTooltip.style.display = 'block';
              wTooltip.style.opacity = '1';
            });
            bar.addEventListener('mouseleave', function() {
              wTooltip.style.opacity = '0';
              wTooltip.style.display = 'none';
            });
          });
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     3. REPORT LIBRARY REGISTRY & TABLE GENERATOR
     ══════════════════════════════════════════════════════════════════════════ */
  function getReportRegistry() {
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    var range = currentDateRange;

    // Filtered subsets by active date range
    var invoices = cachedData.invoices.filter(function(i) { return isDateInRange(i.issueDate, range); });
    var projects = cachedData.projects.filter(function(p) { return !p.isDeleted && isDateInRange(p.createdAt || p.dueDate || p.startDate, range); });
    var leads = cachedData.leads.filter(function(l) { return !l.isDeleted && isDateInRange(l.createdAt || l.date, range); });
    var clients = cachedData.clients.filter(function(c) { return !c.isDeleted && isDateInRange(c.createdAt || c.since, range); });
    var tasks = cachedData.tasks.filter(function(t) { return !t.isDeleted && isDateInRange(t.createdAt || t.dueDate, range); });
    var expenses = cachedData.expenses.filter(function(e) { return isDateInRange(e.date, range); });
    var employees = cachedData.employees.filter(function(e) { return !e.isDeleted; });

    return [
      {
        id: 'rep-rev-monthly',
        name: 'Monthly Revenue & Invoicing Audit',
        category: 'Revenue',
        categoryKey: 'revenue',
        generatedBy: 'System Auto',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-success',
        recordsCount: invoices.length,
        description: 'Comprehensive breakdown of all issued invoices, cleared client payments, and outstanding balances in the selected period.',
        getData: function() {
          return invoices.map(function(inv) {
            return {
              'Invoice ID': inv.invoiceNumber || inv.id,
              'Client': inv.clientName || 'Client',
              'Issue Date': inv.issueDate || '—',
              'Due Date': inv.dueDate || '—',
              'Total': fmtMoney(inv.total),
              'Status': inv.status || 'Paid'
            };
          });
        }
      },
      {
        id: 'rep-sales-growth',
        name: 'Client Growth & CRM Pipeline Report',
        category: 'Sales',
        categoryKey: 'sales',
        generatedBy: getUserName(),
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-primary',
        recordsCount: leads.length,
        description: 'Analysis of inbound enterprise leads, conversion funnel progression, and projected deal value in the selected period.',
        getData: function() {
          return leads.map(function(l) {
            return {
              'Company / Name': l.company || l.name || l.clientName || 'Lead',
              'Contact': l.email || l.phone || l.owner || '—',
              'Stage': l.stage || 'Lead',
              'Value': fmtMoney(l.value || l.dealValue || 0),
              'Probability': (l.probability || 70) + '%',
              'Assigned To': l.assignedTo || l.owner || 'Sales Team'
            };
          });
        }
      },
      {
        id: 'rep-proj-performance',
        name: 'Project Milestones & Delivery Performance',
        category: 'Projects',
        categoryKey: 'projects',
        generatedBy: 'System Auto',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-info',
        recordsCount: projects.length,
        description: 'Tracking client project progress, milestone completions, assigned engineering teams, and upcoming deadlines.',
        getData: function() {
          return projects.map(function(p) {
            return {
              'Project': p.name,
              'Client': p.client || '—',
              'Progress': (p.progress || 0) + '%',
              'Due Date': p.dueDate || '—',
              'Status': p.status || 'In Progress',
              'Team': Array.isArray(p.team) ? p.team.join(', ') : (p.team || 'Team')
            };
          });
        }
      },
      {
        id: 'rep-mkt-seo',
        name: 'Marketing & Campaign Performance Audit',
        category: 'Marketing',
        categoryKey: 'sales',
        generatedBy: 'System Auto',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-warning',
        recordsCount: cachedData.marketing.length > 0 ? cachedData.marketing.length : leads.length,
        description: 'Overview of multi-channel client acquisition campaigns, marketing channels, and conversion ROI.',
        getData: function() {
          if (cachedData.marketing.length > 0) {
            return cachedData.marketing.map(function(m) {
              return {
                'Campaign': m.name || m.title,
                'Platform': m.platform || 'Digital Ads',
                'Budget': m.budget || '—',
                'Status': m.status || 'Active',
                'Performance': m.perf || '+10%'
              };
            });
          }
          return leads.map(function(l) {
            return {
              'Lead / Account': l.company || l.name || l.clientName || 'Lead',
              'Acquisition Source': l.source || 'Direct Outreach',
              'Estimated Value': fmtMoney(l.value || l.dealValue || 0),
              'Current Stage': l.stage || 'New',
              'Status': l.status || 'Active'
            };
          });
        }
      },
      {
        id: 'rep-team-velocity',
        name: 'Team Velocity & Workload Allocation',
        category: 'Team',
        categoryKey: 'team',
        generatedBy: 'System Auto',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-neutral',
        recordsCount: employees.length,
        description: 'Individual employee task completions, focus hours logged, and departmental workload distribution.',
        getData: function() {
          return employees.map(function(emp) {
            var empTasks = tasks.filter(function(t) {
              return (t.assignee && t.assignee.toLowerCase().includes((emp.name || '').toLowerCase())) ||
                     (t.assigneeId && t.assigneeId === emp.initials) ||
                     (t.assigneeInitials && t.assigneeInitials === emp.initials);
            });
            var doneTasks = empTasks.filter(function(t) { return t.status === 'Completed'; });
            return {
              'Employee': emp.name,
              'Department': emp.department || 'General',
              'Role': emp.role || 'Team Member',
              'Active Tasks': empTasks.length - doneTasks.length,
              'Completed Tasks': doneTasks.length,
              'Status': emp.status || 'Active'
            };
          });
        }
      },
      {
        id: 'rep-fin-cashflow',
        name: 'Financial Cashflow & Expense Breakdown',
        category: 'Finance',
        categoryKey: 'finance',
        generatedBy: 'Finance Dept',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-success',
        recordsCount: expenses.length,
        description: 'Detailed operating expenses, software vendor subscriptions, payroll allocations, and gross profit margins.',
        getData: function() {
          return expenses.map(function(exp) {
            return {
              'Expense Item': exp.category || exp.description || 'Expense',
              'Vendor': exp.vendor || 'Supplier',
              'Date': exp.date || '—',
              'Amount': fmtMoney(exp.total || exp.amount || 0),
              'Status': exp.status || 'Approved'
            };
          });
        }
      },
      {
        id: 'rep-tasks-critical',
        name: 'Critical Tasks & Overdue Risk Assessment',
        category: 'Productivity',
        categoryKey: 'productivity',
        generatedBy: getUserName(),
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-danger',
        recordsCount: tasks.length,
        description: 'Risk assessment of overdue project deliverables, blocked milestones, and high-priority assignments.',
        getData: function() {
          return tasks.map(function(t) {
            return {
              'Task': t.title || t.name,
              'Assignee': t.assignee || t.assigneeId || 'Unassigned',
              'Priority': t.priority || 'Medium',
              'Due Date': t.dueDate || '—',
              'Status': t.status || 'Pending'
            };
          });
        }
      },
      {
        id: 'rep-clients-receivables',
        name: 'Client Invoicing & Receivables Statement',
        category: 'Revenue',
        categoryKey: 'revenue',
        generatedBy: 'Finance Dept',
        lastUpdated: dateStr,
        status: 'Ready',
        badgeClass: 'badge-success',
        recordsCount: clients.length,
        description: 'Comprehensive audit of all registered active clients, contract values, and outstanding invoices.',
        getData: function() {
          return clients.map(function(c) {
            return {
              'Client Name': c.company || c.name,
              'Contact Email': c.email || c.contactPerson || '—',
              'Status': c.status || 'Active',
              'Lifetime Value': fmtMoney(c.revenue || c.totalRevenue || 0),
              'Since': c.since || '2026'
            };
          });
        }
      }
    ];
  }

  function renderLibraryTable() {
    var tbody = document.getElementById('rep-library-tbody');
    var countEl = document.getElementById('rep-library-count');
    var prevBtn = document.getElementById('rep-library-prev');
    var nextBtn = document.getElementById('rep-library-next');

    if (!tbody) return;

    var allReports = getReportRegistry();

    // 1. Permission check
    allReports = allReports.filter(function(r) {
      if (r.categoryKey === 'finance' || r.categoryKey === 'revenue') {
        return canAccessModule('finance') || isSuperAdmin();
      }
      if (r.categoryKey === 'team') {
        return canAccessModule('team') || isSuperAdmin();
      }
      if (r.categoryKey === 'sales') {
        return canAccessModule('crm') || isSuperAdmin();
      }
      return true;
    });

    // 2. Category Filter (Supports category grouping)
    if (currentCategory !== 'all') {
      allReports = allReports.filter(function(r) {
        if (currentCategory === 'revenue') return r.categoryKey === 'revenue' || r.categoryKey === 'finance';
        if (currentCategory === 'finance') return r.categoryKey === 'finance' || r.categoryKey === 'revenue';
        if (currentCategory === 'sales') return r.categoryKey === 'sales' || r.category.toLowerCase() === 'marketing';
        if (currentCategory === 'productivity') return r.categoryKey === 'productivity' || r.categoryKey === 'team';
        if (currentCategory === 'team') return r.categoryKey === 'team' || r.categoryKey === 'productivity';
        return r.categoryKey === currentCategory || r.category.toLowerCase() === currentCategory.toLowerCase();
      });
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase().trim();
      allReports = allReports.filter(function(r) {
        return r.name.toLowerCase().includes(q) ||
               r.category.toLowerCase().includes(q) ||
               r.generatedBy.toLowerCase().includes(q) ||
               r.description.toLowerCase().includes(q);
      });
    }

    // 4. Sorting
    allReports.sort(function(a, b) {
      var vA = a[sortField] || a.name;
      var vB = b[sortField] || b.name;
      if (sortAsc) return vA > vB ? 1 : -1;
      return vA < vB ? 1 : -1;
    });

    var totalReports = allReports.length;
    var totalPages = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
    if (libraryPage > totalPages) libraryPage = totalPages;
    if (libraryPage < 1) libraryPage = 1;

    var startIdx = (libraryPage - 1) * PAGE_SIZE;
    var endIdx = Math.min(startIdx + PAGE_SIZE, totalReports);
    var pagedReports = allReports.slice(startIdx, endIdx);

    if (countEl) {
      countEl.textContent = totalReports > 0
        ? 'Showing ' + (startIdx + 1) + ' to ' + endIdx + ' of ' + totalReports + ' reports'
        : 'No reports found';
    }

    if (prevBtn) prevBtn.disabled = libraryPage <= 1;
    if (nextBtn) nextBtn.disabled = libraryPage >= totalPages;

    if (pagedReports.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-3); font-weight:600;">No reports match your filters.</td></tr>';
      return;
    }

    tbody.innerHTML = pagedReports.map(function(rep) {
      return '<tr data-rep-id="' + esc(rep.id) + '">' +
        '<td style="font-weight:700;">' + esc(rep.name) + '</td>' +
        '<td><span class="badge ' + esc(rep.badgeClass) + '">' + esc(rep.category) + '</span></td>' +
        '<td>' + esc(rep.generatedBy) + '</td>' +
        '<td>' + esc(rep.lastUpdated) + '</td>' +
        '<td><span class="badge badge-success">' + esc(rep.status) + '</span></td>' +
        '<td style="text-align:right;"><button class="btn btn-ghost btn-sm rep-view-btn" data-rep-id="' + esc(rep.id) + '">View</button></td>' +
      '</tr>';
    }).join('');

    // Attach View action listeners
    tbody.querySelectorAll('.rep-view-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = this.getAttribute('data-rep-id');
        var report = allReports.find(function(r) { return r.id === id; });
        if (report) openReportDetailModal(report);
      });
    });

    tbody.querySelectorAll('tr').forEach(function(row) {
      row.addEventListener('click', function() {
        var id = this.getAttribute('data-rep-id');
        var report = allReports.find(function(r) { return r.id === id; });
        if (report) openReportDetailModal(report);
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     4. RECENT REPORTS LIST & PERSISTENCE
     ══════════════════════════════════════════════════════════════════════════ */
  var RECENT_KEY = 'verde_recent_reports';

  function getRecentReports() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return [];
  }

  function saveRecentReports(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch(e) {}
  }

  function renderRecentReports() {
    var container = document.getElementById('rep-recent-list');
    if (!container) return;

    var list = getRecentReports();
    if (list.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:24px;text-align:center;">No recent generated reports</div>';
      return;
    }

    container.innerHTML = list.slice(0, 5).map(function(item) {
      return '<div class="rep-item" data-id="' + esc(item.id) + '">' +
        '<div class="rep-item-top">' +
          '<div>' +
            '<div class="rep-item-title">' + esc(item.name) + '</div>' +
            '<div class="rep-item-date">' + esc(item.date) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rep-item-actions">' +
          '<button class="rep-action-btn rep-recent-download" title="Download CSV" data-name="' + esc(item.name) + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>' +
          '<button class="rep-action-btn rep-recent-share" title="Share Report Link" data-name="' + esc(item.name) + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>' +
          '<button class="rep-action-btn delete rep-recent-delete" title="Delete from Recents" data-id="' + esc(item.id) + '"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Attach button listeners
    container.querySelectorAll('.rep-recent-download').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = this.getAttribute('data-name');
        exportGenericCSV(name);
      });
    });

    container.querySelectorAll('.rep-recent-share').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = this.getAttribute('data-name');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href + '#' + encodeURIComponent(name));
        }
        if (window.VerdeToast) window.VerdeToast.success('Report share link copied to clipboard');
      });
    });

    container.querySelectorAll('.rep-recent-delete').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        var cur = getRecentReports();
        cur = cur.filter(function(r) { return r.id !== id; });
        saveRecentReports(cur);
        renderRecentReports();
        if (window.VerdeToast) window.VerdeToast.info('Report removed from recent list');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     5. REPORT DETAIL MODAL VIEWER
     ══════════════════════════════════════════════════════════════════════════ */
  function openReportDetailModal(report) {
    activeModalReport = report;
    var modal = document.getElementById('rep-detail-modal');
    var titleEl = document.getElementById('rep-modal-title');
    var metaEl = document.getElementById('rep-modal-meta');
    var bodyEl = document.getElementById('rep-modal-body');
    var sumEl = document.getElementById('rep-modal-summary');

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.textContent = report.name;
    if (metaEl) {
      metaEl.textContent = 'Category: ' + report.category + ' · Updated ' + report.lastUpdated + ' · Generated by ' + report.generatedBy;
    }

    var data = typeof report.getData === 'function' ? report.getData() : [];
    if (sumEl) sumEl.textContent = 'Total records: ' + data.length + ' · Period: ' + currentDateRange.toUpperCase();

    if (data.length === 0) {
      bodyEl.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-3); font-weight:600;">No records found in this reporting domain for the selected period.</div>';
    } else {
      var headers = Object.keys(data[0]);
      var tableHtml = '<div style="margin-bottom:16px; font-size:13px; color:var(--text-2);">' + esc(report.description) + '</div>' +
        '<table class="rep-table" style="margin-top:12px;">' +
          '<thead>' +
            '<tr>' + headers.map(function(h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' +
          '</thead>' +
          '<tbody>' +
            data.map(function(row) {
              return '<tr>' + headers.map(function(h) { return '<td>' + esc(row[h]) + '</td>'; }).join('') + '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>';
      bodyEl.innerHTML = tableHtml;
    }

    modal.style.display = 'flex';
  }

  function closeReportDetailModal() {
    var modal = document.getElementById('rep-detail-modal');
    if (modal) modal.style.display = 'none';
    activeModalReport = null;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     6. EXPORT ENGINE (CSV / Excel / PDF / Print)
     ══════════════════════════════════════════════════════════════════════════ */
  function exportGenericCSV(reportName) {
    var allReports = getReportRegistry();
    var rep = allReports.find(function(r) { return r.name === reportName; }) || allReports[0];
    var rows = typeof rep.getData === 'function' ? rep.getData() : [];

    if (rows.length === 0) {
      if (window.VerdeToast) window.VerdeToast.warning('No data available to export for ' + reportName);
      return;
    }

    var headers = Object.keys(rows[0]);
    var csvContent = '\uFEFF' + headers.join(',') + '\n';

    rows.forEach(function(row) {
      var line = headers.map(function(h) {
        var val = (row[h] || '').toString().replace(/"/g, '""');
        return '"' + val + '"';
      }).join(',');
      csvContent += line + '\n';
    });

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'VERDE_' + rep.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.VerdeToast) window.VerdeToast.success('Export completed: ' + a.download);
  }

  function printActiveReport() {
    window.print();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     7. GENERATE REPORT MODAL & LOGIC
     ══════════════════════════════════════════════════════════════════════════ */
  function openGenerateModal() {
    var modal = document.getElementById('rep-generate-modal');
    var typeSelect = document.getElementById('rep-gen-type');
    if (typeSelect && currentCategory !== 'all') {
      typeSelect.value = currentCategory;
    }
    if (modal) modal.style.display = 'flex';
  }

  function closeGenerateModal() {
    var modal = document.getElementById('rep-generate-modal');
    if (modal) modal.style.display = 'none';
  }

  function handleGenerateSubmit() {
    var typeSelect = document.getElementById('rep-gen-type');
    var periodSelect = document.getElementById('rep-gen-period');
    var nameInput = document.getElementById('rep-gen-name');

    var type = typeSelect ? typeSelect.value : 'revenue';
    var customName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : null;

    var typeLabels = {
      revenue: 'Monthly Revenue & Invoicing Audit',
      projects: 'Project Milestones & Delivery Performance',
      sales: 'Client Growth & CRM Pipeline Report',
      productivity: 'Critical Tasks & Overdue Risk Assessment',
      team: 'Team Velocity & Workload Allocation',
      finance: 'Financial Cashflow & Expense Breakdown'
    };

    var finalName = customName || (typeLabels[type] || 'Enterprise Audit Report');
    var now = new Date();
    var dateStr = 'Generated ' + now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    // Add to recents
    var recents = getRecentReports();
    recents.unshift({
      id: 'rec-' + Date.now(),
      name: finalName,
      date: dateStr,
      category: type.toUpperCase()
    });
    saveRecentReports(recents);
    renderRecentReports();

    closeGenerateModal();
    if (nameInput) nameInput.value = '';

    // Download CSV
    exportGenericCSV(finalName);

    if (window.VerdeToast) {
      window.VerdeToast.success('Report "' + finalName + '" generated successfully!');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     8. EVENT LISTENERS & UI INTERACTIONS
     ══════════════════════════════════════════════════════════════════════════ */
  function initListeners() {
    // 1. Category filter cards
    var catGrid = document.getElementById('rep-category-grid');
    if (catGrid) {
      catGrid.querySelectorAll('.rep-cat-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var cat = this.getAttribute('data-category');
          if (currentCategory === cat) {
            currentCategory = 'all';
            catGrid.querySelectorAll('.rep-cat-card').forEach(function(c) { c.classList.remove('active'); });
          } else {
            currentCategory = cat;
            catGrid.querySelectorAll('.rep-cat-card').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
          }
          libraryPage = 1;
          renderKPIs();
          renderCharts();
          renderLibraryTable();
        });
      });
    }

    // 2. Date Range Picker Dropdown
    var dateBtn = document.getElementById('rep-date-filter-btn');
    var dateDropdown = document.getElementById('rep-date-dropdown');
    var dateLabel = document.getElementById('rep-date-label');

    if (dateBtn && dateDropdown) {
      dateBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isVisible = dateDropdown.style.display === 'block';
        dateDropdown.style.display = isVisible ? 'none' : 'block';
      });

      document.addEventListener('click', function() {
        dateDropdown.style.display = 'none';
      });

      dateDropdown.querySelectorAll('.rep-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          var range = this.getAttribute('data-range');
          currentDateRange = range;
          dateDropdown.querySelectorAll('.rep-dropdown-item').forEach(function(i) { i.classList.remove('active'); });
          this.classList.add('active');
          if (dateLabel) dateLabel.textContent = this.textContent;
          dateDropdown.style.display = 'none';

          renderKPIs();
          renderCharts();
          renderLibraryTable();
          if (window.VerdeToast) window.VerdeToast.info('Filtered by ' + this.textContent);
        });
      });
    }

    // 3. Search inputs
    var searchTop = document.getElementById('rep-search-input');
    var searchLib = document.getElementById('rep-library-search');

    if (searchTop) {
      searchTop.addEventListener('input', function() {
        searchQuery = this.value;
        if (searchLib) searchLib.value = this.value;
        libraryPage = 1;
        renderLibraryTable();
      });
    }

    if (searchLib) {
      searchLib.addEventListener('input', function() {
        searchQuery = this.value;
        if (searchTop) searchTop.value = this.value;
        libraryPage = 1;
        renderLibraryTable();
      });
    }

    // 4. Library Sort and Filter buttons
    var sortBtn = document.getElementById('rep-library-sort-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', function() {
        sortAsc = !sortAsc;
        sortField = sortField === 'name' ? 'date' : 'name';
        renderLibraryTable();
        if (window.VerdeToast) window.VerdeToast.info('Sorted by ' + (sortField === 'name' ? 'Report Name' : 'Date'));
      });
    }

    var filterBtn = document.getElementById('rep-library-filter-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', function() {
        var categories = ['all', 'revenue', 'projects', 'sales', 'finance', 'team', 'productivity'];
        var nextIdx = (categories.indexOf(currentCategory) + 1) % categories.length;
        currentCategory = categories[nextIdx];

        var catGrid = document.getElementById('rep-category-grid');
        if (catGrid) {
          catGrid.querySelectorAll('.rep-cat-card').forEach(function(c) {
            if (c.getAttribute('data-category') === currentCategory) c.classList.add('active');
            else c.classList.remove('active');
          });
        }
        libraryPage = 1;
        renderKPIs();
        renderCharts();
        renderLibraryTable();
        if (window.VerdeToast) window.VerdeToast.info('Filter set to: ' + currentCategory.toUpperCase());
      });
    }

    // 5. Pagination controls
    var prevBtn = document.getElementById('rep-library-prev');
    var nextBtn = document.getElementById('rep-library-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (libraryPage > 1) {
          libraryPage--;
          renderLibraryTable();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        libraryPage++;
        renderLibraryTable();
      });
    }

    // 6. Export Center Cards
    var exportPdf = document.getElementById('rep-export-pdf');
    var exportExcel = document.getElementById('rep-export-excel');
    var exportCsv = document.getElementById('rep-export-csv');
    var exportPrint = document.getElementById('rep-export-print');
    var exportHeader = document.getElementById('rep-header-export-btn');

    if (exportPdf) exportPdf.addEventListener('click', printActiveReport);
    if (exportPrint) exportPrint.addEventListener('click', printActiveReport);
    if (exportExcel) exportExcel.addEventListener('click', function() { exportGenericCSV('Monthly Revenue & Invoicing Audit'); });
    if (exportCsv) exportCsv.addEventListener('click', function() { exportGenericCSV('Monthly Revenue & Invoicing Audit'); });
    if (exportHeader) exportHeader.addEventListener('click', function() { exportGenericCSV('Monthly Revenue & Invoicing Audit'); });

    // 7. Modals
    var genBtn = document.getElementById('rep-generate-btn');
    var genClose = document.getElementById('rep-gen-modal-close');
    var genCancel = document.getElementById('rep-gen-cancel');
    var genSubmit = document.getElementById('rep-gen-submit');

    if (genBtn) genBtn.addEventListener('click', openGenerateModal);
    if (genClose) genClose.addEventListener('click', closeGenerateModal);
    if (genCancel) genCancel.addEventListener('click', closeGenerateModal);
    if (genSubmit) genSubmit.addEventListener('click', handleGenerateSubmit);

    var modalClose = document.getElementById('rep-modal-close');
    var modalCsv = document.getElementById('rep-modal-csv-btn');
    var modalPrint = document.getElementById('rep-modal-print-btn');

    if (modalClose) modalClose.addEventListener('click', closeReportDetailModal);
    if (modalCsv) {
      modalCsv.addEventListener('click', function() {
        if (activeModalReport) exportGenericCSV(activeModalReport.name);
      });
    }
    if (modalPrint) modalPrint.addEventListener('click', printActiveReport);

    var recentViewAll = document.getElementById('rep-recent-view-all');
    if (recentViewAll) {
      recentViewAll.addEventListener('click', function() {
        var table = document.getElementById('rep-library-table');
        if (table) table.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     9. MASTER REFRESH & INITIALIZATION
     ══════════════════════════════════════════════════════════════════════════ */
  function refreshReports() {
    loadAllData().then(function() {
      renderKPIs();
      renderCharts();
      renderLibraryTable();
      renderRecentReports();
    });
  }
  window.refreshReports = refreshReports;

  function init() {
    initListeners();
    refreshReports();

    // Auto sync on tab focus or storage change
    window.addEventListener('focus', refreshReports);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) refreshReports();
    });
    window.addEventListener('storage', refreshReports);
    if (window.VerdeState && typeof window.VerdeState.subscribe === 'function') {
      window.VerdeState.subscribe('*', refreshReports);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();