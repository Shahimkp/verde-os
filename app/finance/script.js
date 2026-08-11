(function () {
  'use strict';
  /* ==========================================================================
     VERDE OS — FINANCE WORKSPACE CONTROLLER
     Invoice Management + Tab Navigation
     ========================================================================== */

  var GST_RATE = 0.18;
  var STORAGE_KEY = 'verde_finance_invoices';

  /* ── Helpers ── */
  function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function todayStr() { return new Date().toISOString().split('T')[0]; }
  function genId() { return 'INV-' + Date.now().toString(36).toUpperCase(); }
  function nextInvoiceNumber() {
    var max = 1000;
    financeInvoices.forEach(function (inv) {
      var num = parseInt((inv.invoiceNumber || '').replace('INV-', ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return 'INV-' + (max + 1);
  }

  /* ── State ── */
  var financeInvoices = [];

  function loadInvoices() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { financeInvoices = JSON.parse(raw); return; }
    } catch (e) { /* ignore */ }

    // Seed mock data
    financeInvoices = [
      {
        id: genId(), invoiceNumber: 'INV-1001', clientId: 'CLI-001', clientName: 'Cabo Travels',
        projectId: 'PRJ-001', projectName: 'Cabo Travels Website',
        issueDate: '2026-07-15', dueDate: '2026-08-15',
        items: [
          { description: 'Website Design Sprint Phase 1', qty: 1, unitPrice: 25000 },
          { description: 'SEO Optimization Package', qty: 1, unitPrice: 8000 }
        ],
        subtotal: 33000, gst: 5940, total: 38940, status: 'Paid'
      },
      {
        id: genId() + '2', invoiceNumber: 'INV-1002', clientId: 'CLI-003', clientName: 'BlueWave Tech',
        projectId: 'PRJ-003', projectName: 'BlueWave CRM Portal',
        issueDate: '2026-07-25', dueDate: '2026-08-25',
        items: [
          { description: 'CRM Portal Development', qty: 1, unitPrice: 45000 },
          { description: 'Database Architecture', qty: 1, unitPrice: 12000 }
        ],
        subtotal: 57000, gst: 10260, total: 67260, status: 'Sent'
      },
      {
        id: genId() + '3', invoiceNumber: 'INV-1003', clientId: 'CLI-002', clientName: 'GreenLeaf',
        projectId: 'PRJ-002', projectName: 'GreenLeaf Branding',
        issueDate: '2026-08-01', dueDate: '2026-08-10',
        items: [
          { description: 'Brand Identity Package', qty: 1, unitPrice: 18000 }
        ],
        subtotal: 18000, gst: 3240, total: 21240, status: 'Overdue'
      },
      {
        id: genId() + '4', invoiceNumber: 'INV-1004', clientId: 'CLI-004', clientName: 'Vertex Systems',
        projectId: 'PRJ-004', projectName: 'Vertex Systems API',
        issueDate: '2026-08-03', dueDate: '2026-09-03',
        items: [
          { description: 'API Integration Consulting', qty: 10, unitPrice: 2500 },
          { description: 'Technical Documentation', qty: 1, unitPrice: 5000 }
        ],
        subtotal: 30000, gst: 5400, total: 35400, status: 'Draft'
      },
      {
        id: genId() + '5', invoiceNumber: 'INV-1005', clientId: 'CLI-001', clientName: 'Cabo Travels',
        projectId: 'PRJ-001', projectName: 'Cabo Travels Website',
        issueDate: '2026-08-02', dueDate: '2026-09-02',
        items: [
          { description: 'Website Design Sprint Phase 2', qty: 1, unitPrice: 20000 }
        ],
        subtotal: 20000, gst: 3600, total: 23600, status: 'Partially Paid'
      }
    ];
    saveInvoices();
  }

  function saveInvoices() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeInvoices));
  }

  /* ── Dashboard KPI Sync ── */
  window.refreshDashboardKPIs = function () {
    // Read invoices from localStorage
    var invoices = [];
    try { invoices = JSON.parse(localStorage.getItem('verde_finance_invoices') || '[]'); } catch (e) { invoices = []; }
    // Read expenses from localStorage
    var expenses = [];
    try { expenses = JSON.parse(localStorage.getItem('verde_finance_expenses') || '[]'); } catch (e) { expenses = []; }

    // Calculations
    var totalRevenue = 0;
    var pendingInvoices = 0;
    invoices.forEach(function (inv) {
      if (inv.status === 'Paid') totalRevenue += (inv.total || 0);
      if (inv.status !== 'Paid' && inv.status !== 'Cancelled') pendingInvoices++;
    });

    var totalExpenses = 0;
    expenses.forEach(function (exp) {
      if (exp.status !== 'Rejected') totalExpenses += (exp.total || 0);
    });

    var netProfit = totalRevenue - totalExpenses;

    // Inject into DOM (only if elements exist — dashboard may not be active)
    var elRev = document.getElementById('kpi-total-revenue');
    var elExp = document.getElementById('kpi-total-expenses');
    var elNet = document.getElementById('kpi-net-profit');
    var elPend = document.getElementById('kpi-pending-invoices');

    function fmt(n) { return '\u20b9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    if (elRev)  elRev.textContent  = fmt(totalRevenue);
    if (elExp)  elExp.textContent  = fmt(totalExpenses);
    if (elNet) {
      elNet.textContent = fmt(netProfit);
      elNet.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    if (elPend) elPend.textContent = pendingInvoices;

    /* ── Render Recent Transactions ── */
    var tb = document.getElementById('dashboard-transactions-body');
    if (tb) {
      // 1. Read payments (we didn't read them above)
      var payments = [];
      try { payments = JSON.parse(localStorage.getItem('verde_finance_payments') || '[]'); } catch (e) { payments = []; }

      var allTransactions = [];

      // Paid Invoices
      invoices.forEach(function (inv) {
        if (inv.status === 'Paid') {
          allTransactions.push({
            date: inv.issueDate || inv.dueDate || '',
            description: inv.invoiceNumber + ' Paid',
            category: inv.clientName || 'Client Services',
            type: 'Income',
            amount: inv.total || 0,
            status: 'Completed'
          });
        }
      });

      // Approved/Paid Expenses
      expenses.forEach(function (exp) {
        if (exp.status === 'Paid' || exp.status === 'Approved') {
          allTransactions.push({
            date: exp.date || '',
            description: exp.title || 'Expense',
            category: exp.category || 'Operations',
            type: 'Expense',
            amount: exp.total || 0,
            status: exp.status === 'Paid' ? 'Completed' : 'Pending'
          });
        }
      });

      // Recorded Payments
      payments.forEach(function (pay) {
        allTransactions.push({
          date: pay.date || '',
          description: pay.type + ' Payment',
          category: pay.clientVendor || 'Various',
          type: pay.type === 'Expense' ? 'Expense' : 'Income',
          amount: pay.amount || 0,
          status: (pay.status === 'Completed' || pay.status === 'Paid') ? 'Completed' : 'Pending'
        });
      });

      // Sort newest first
      allTransactions.sort(function (a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      if (allTransactions.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-3); font-weight:600; background:var(--surface);">No financial transactions available.</td></tr>';
        var cntEl = document.getElementById('dashboard-transactions-count');
        if (cntEl) cntEl.textContent = 'Showing 0 transactions';
      } else {
        var html = '';
        var displayRows = allTransactions.slice(0, 10);
        displayRows.forEach(function (t) {
          var dateFmt = new Date(t.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
          if (dateFmt === 'Invalid Date') dateFmt = t.date;

          var typeBadge = t.type === 'Income'
            ? '<span class="badge badge-success">Income</span>'
            : '<span class="badge badge-danger">Expense</span>';

          var statusBadge = t.status === 'Completed'
            ? '<span class="badge badge-success">Completed</span>'
            : '<span class="badge badge-warning">Pending</span>';

          var amountStr = '\u20b9' + Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          html += '<tr>' +
            '<td style="white-space:nowrap; color:var(--text-2);">' + dateFmt + '</td>' +
            '<td style="font-weight:700; color:var(--text-1);">' + t.description + '</td>' +
            '<td style="color:var(--text-2);">' + t.category + '</td>' +
            '<td>' + typeBadge + '</td>' +
            '<td style="font-weight:800; color:var(--text-1);">' + amountStr + '</td>' +
            '<td>' + statusBadge + '</td>' +
          '</tr>';
        });
        tb.innerHTML = html;
        var cntEl = document.getElementById('dashboard-transactions-count');
        if (cntEl) cntEl.textContent = 'Showing 1 to ' + displayRows.length + ' of ' + allTransactions.length + ' transactions';
      }
    }
  };

  /* ── Tab Switching ── */
  window.switchFinanceTab = function (tabId) {
    document.querySelectorAll('.fin-main-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.view-content').forEach(function (v) { v.classList.remove('active'); });

    var viewEl = document.getElementById('view-' + tabId);
    if (viewEl) viewEl.classList.add('active');

    var tabs = document.querySelectorAll('.fin-main-tab');
    tabs.forEach(function (t) {
      if (t.textContent.trim().toLowerCase() === tabId) t.classList.add('active');
    });

    if (tabId === 'dashboard') {
      window.refreshDashboardKPIs();
    }
    if (tabId === 'invoices') {
      renderInvoicesKPI();
      renderInvoicesTable();
    }
  };

  /* ── Status Badge Helper ── */
  function statusBadge(status) {
    var cls = 'badge-neutral';
    if (status === 'Paid') cls = 'badge-success';
    else if (status === 'Sent') cls = 'badge-info';
    else if (status === 'Partially Paid') cls = 'badge-warning';
    else if (status === 'Overdue') cls = 'badge-danger';
    else if (status === 'Cancelled') cls = 'badge-danger';
    else if (status === 'Draft') cls = 'badge-neutral';
    return '<span class="badge ' + cls + '">' + status + '</span>';
  }

  /* ── KPI Rendering ── */
  function renderInvoicesKPI() {
    var outstanding = 0, paid = 0, overdue = 0, draft = 0;
    financeInvoices.forEach(function (inv) {
      if (inv.status === 'Paid') paid += inv.total;
      else if (inv.status !== 'Cancelled') outstanding += inv.total;
      if (inv.status === 'Overdue') overdue++;
      if (inv.status === 'Draft') draft++;
    });
    var elOut = document.getElementById('inv-kpi-outstanding');
    var elPaid = document.getElementById('inv-kpi-paid');
    var elOver = document.getElementById('inv-kpi-overdue');
    var elDraft = document.getElementById('inv-kpi-draft');
    if (elOut) elOut.textContent = fmtMoney(outstanding);
    if (elPaid) elPaid.textContent = fmtMoney(paid);
    if (elOver) elOver.textContent = overdue;
    if (elDraft) elDraft.textContent = draft;
  }

  /* ── Table Rendering ── */
  window.renderInvoicesTable = function () {
    var tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    var searchEl = document.getElementById('invoice-search-input');
    var query = searchEl ? searchEl.value.toLowerCase().trim() : '';

    var filtered = financeInvoices.filter(function (inv) {
      if (!query) return true;
      return (inv.invoiceNumber || '').toLowerCase().indexOf(query) !== -1 ||
             (inv.clientName || '').toLowerCase().indexOf(query) !== -1 ||
             (inv.projectName || '').toLowerCase().indexOf(query) !== -1 ||
             (inv.status || '').toLowerCase().indexOf(query) !== -1;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:48px 24px; color:var(--text-3); font-weight:600;">No invoices found. Click "+ Create Invoice" to get started.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (inv) {
      html += '<tr>' +
        '<td style="font-weight:700; white-space:nowrap;">' + inv.invoiceNumber + '</td>' +
        '<td style="font-weight:600;">' + (inv.clientName || '—') + '</td>' +
        '<td style="color:var(--text-2);">' + (inv.projectName || '—') + '</td>' +
        '<td style="white-space:nowrap;">' + fmtDate(inv.issueDate) + '</td>' +
        '<td style="white-space:nowrap;">' + fmtDate(inv.dueDate) + '</td>' +
        '<td style="font-weight:700;">' + fmtMoney(inv.subtotal) + '</td>' +
        '<td>' + fmtMoney(inv.gst) + '</td>' +
        '<td style="font-weight:800;">' + fmtMoney(inv.total) + '</td>' +
        '<td>' + statusBadge(inv.status) + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window.toggleInvMenu(\'' + inv.id + '\', this)">⋯</button>' +
        '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  };

  /* ── Invoice Action Menu Portal ── */
  function getInvPortal() {
    var el = document.getElementById('inv-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inv-action-portal';
      el.style.cssText = 'position:fixed; z-index:9999; display:none; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-md); min-width:170px; padding:4px 0;';
      document.body.appendChild(el);
    }
    return el;
  }
  function invMenuItem(label, color, disabled, onclick) {
    var el = document.createElement('div');
    el.style.cssText = 'padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; color:' + color + ';' + (disabled ? ' opacity:0.4; pointer-events:none;' : '');
    el.textContent = label;
    if (!disabled) {
      el.addEventListener('mouseover', function () { el.style.background = 'var(--bg-2)'; });
      el.addEventListener('mouseout',  function () { el.style.background = 'transparent'; });
      el.addEventListener('click', onclick);
    }
    return el;
  }
  function invMenuDivider() {
    var el = document.createElement('div');
    el.style.cssText = 'height:1px; background:var(--border); margin:4px 0;';
    return el;
  }

  window.toggleInvMenu = function (id, btn) {
    var portal = getInvPortal();

    // Toggle off if same button clicked again
    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var inv = financeInvoices.find(function (i) { return i.id === id; });
    if (!inv) return;

    var canSent      = inv.status === 'Draft';
    var canPaid      = inv.status !== 'Paid' && inv.status !== 'Cancelled';

    // Build menu
    portal.innerHTML = '';
    portal.appendChild(invMenuItem('View Invoice',   'var(--text-1)',    false,    function () { portal.style.display = 'none'; window.viewInvoice(id); }));
    portal.appendChild(invMenuItem('Edit Invoice',   'var(--text-1)',    false,    function () { portal.style.display = 'none'; window.editInvoice(id); }));
    portal.appendChild(invMenuItem('Duplicate',      'var(--text-1)',    false,    function () { portal.style.display = 'none'; window.duplicateInvoice(id); }));
    portal.appendChild(invMenuDivider());
    portal.appendChild(invMenuItem('Mark as Sent',   'var(--text-1)',    !canSent, function () { portal.style.display = 'none'; window.updateInvoiceStatus(id, 'Sent'); }));
    portal.appendChild(invMenuItem('Mark as Paid',   'var(--success)',   !canPaid, function () { portal.style.display = 'none'; window.updateInvoiceStatus(id, 'Paid'); }));
    portal.appendChild(invMenuItem('Download PDF',   'var(--primary)',   false,    function () { portal.style.display = 'none'; window.downloadInvoicePDF(id); }));
    portal.appendChild(invMenuDivider());
    portal.appendChild(invMenuItem('Delete',         'var(--danger)',    false,    function () { portal.style.display = 'none'; window.deleteInvoice(id); }));

    // Position using fixed coords from button
    var rect = btn.getBoundingClientRect();
    portal.style.display = 'block';
    portal.dataset.activeId = id;

    // Flip above if not enough room below
    var portalH = portal.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow >= portalH ? rect.bottom + 4 : rect.top - portalH - 4;

    // Align right edge with button, clamp to viewport
    var right = window.innerWidth - rect.right;
    portal.style.top   = Math.max(8, top) + 'px';
    portal.style.right = Math.max(8, right) + 'px';
    portal.style.left  = 'auto';

    // Close on outside click
    setTimeout(function () {
      function handler(ev) {
        if (!portal.contains(ev.target) && ev.target !== btn) {
          portal.style.display = 'none';
          portal.dataset.activeId = '';
          document.removeEventListener('click', handler);
        }
      }
      document.addEventListener('click', handler);
    }, 10);
  };



  /* ── Build Client & Project Options ── */
  function getClientOptions(selectedId) {
    var clients = (window.VerdeMockData && window.VerdeMockData.clients) || [];
    var html = '<option value="">— Select Client —</option>';
    clients.forEach(function (c) {
      html += '<option value="' + c.id + '" data-name="' + c.company + '"' + (c.id === selectedId ? ' selected' : '') + '>' + c.company + '</option>';
    });
    return html;
  }
  function getProjectOptions(selectedId) {
    var projects = (window.VerdeMockData && window.VerdeMockData.projects) || [];
    var html = '<option value="">— Select Project —</option>';
    projects.forEach(function (p) {
      html += '<option value="' + p.id + '" data-name="' + p.name + '"' + (p.id === selectedId ? ' selected' : '') + '>' + p.name + '</option>';
    });
    return html;
  }

  /* ── Build Line Items HTML ── */
  function buildItemRowHTML(item, idx) {
    item = item || { description: '', qty: 1, unitPrice: 0 };
    var lineTotal = (item.qty || 0) * (item.unitPrice || 0);
    return '<tr data-item-idx="' + idx + '">' +
      '<td><input class="modal-table-input inv-item-desc" type="text" value="' + (item.description || '') + '" placeholder="Description" /></td>' +
      '<td style="width:80px;"><input class="modal-table-input inv-item-qty" type="number" min="1" value="' + (item.qty || 1) + '" oninput="window.recalcInvoiceForm()" /></td>' +
      '<td style="width:120px;"><input class="modal-table-input inv-item-price" type="number" min="0" step="0.01" value="' + (item.unitPrice || 0) + '" oninput="window.recalcInvoiceForm()" /></td>' +
      '<td style="width:120px; font-weight:700; text-align:right;">' + fmtMoney(lineTotal) + '</td>' +
      '<td style="width:40px; text-align:center;"><button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="this.closest(\'tr\').remove(); window.recalcInvoiceForm();">✕</button></td>' +
    '</tr>';
  }

  /* ── Recalculate Totals in Form ── */
  window.recalcInvoiceForm = function () {
    var rows = document.querySelectorAll('#inv-items-body tr');
    var subtotal = 0;
    rows.forEach(function (row) {
      var qty = parseFloat(row.querySelector('.inv-item-qty').value) || 0;
      var price = parseFloat(row.querySelector('.inv-item-price').value) || 0;
      var lineTotal = qty * price;
      subtotal += lineTotal;
      row.querySelectorAll('td')[3].textContent = fmtMoney(lineTotal);
    });
    var gst = subtotal * GST_RATE;
    var grand = subtotal + gst;
    var elSub = document.getElementById('inv-form-subtotal');
    var elGst = document.getElementById('inv-form-gst');
    var elGrand = document.getElementById('inv-form-grand');
    if (elSub) elSub.textContent = fmtMoney(subtotal);
    if (elGst) elGst.textContent = fmtMoney(gst);
    if (elGrand) elGrand.textContent = fmtMoney(grand);
  };

  /* ── Add Line Item ── */
  window.addInvoiceLineItem = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_create')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var tbody = document.getElementById('inv-items-body');
    if (!tbody) return;
    var idx = tbody.querySelectorAll('tr').length;
    var temp = document.createElement('tbody');
    temp.innerHTML = buildItemRowHTML(null, idx);
    tbody.appendChild(temp.firstChild);
  };

  /* ── Build Modal Body for Create/Edit ── */
  function buildInvoiceFormBody(inv) {
    inv = inv || {};
    var items = inv.items || [{ description: '', qty: 1, unitPrice: 0 }];
    var subtotal = inv.subtotal || 0;
    var gst = inv.gst || 0;
    var total = inv.total || 0;

    var itemsHTML = '';
    items.forEach(function (item, i) { itemsHTML += buildItemRowHTML(item, i); });

    return '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Client</label>' +
        '<select id="inv-form-client" class="modal-table-input" style="padding:8px 12px;">' + getClientOptions(inv.clientId) + '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Project</label>' +
        '<select id="inv-form-project" class="modal-table-input" style="padding:8px 12px;">' + getProjectOptions(inv.projectId) + '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Issue Date</label>' +
        '<input id="inv-form-issue" type="date" class="modal-table-input" style="padding:8px 12px;" value="' + (inv.issueDate || todayStr()) + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Due Date</label>' +
        '<input id="inv-form-due" type="date" class="modal-table-input" style="padding:8px 12px;" value="' + (inv.dueDate || '') + '" />' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:12px;">' +
      '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:8px;">Invoice Items</label>' +
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%; border-collapse:collapse;">' +
        '<thead><tr style="border-bottom:1px solid var(--border);">' +
          '<th style="text-align:left; padding:8px 4px; font-size:12px; font-weight:700; color:var(--text-3);">Description</th>' +
          '<th style="text-align:left; padding:8px 4px; font-size:12px; font-weight:700; color:var(--text-3); width:80px;">Qty</th>' +
          '<th style="text-align:left; padding:8px 4px; font-size:12px; font-weight:700; color:var(--text-3); width:120px;">Unit Price</th>' +
          '<th style="text-align:right; padding:8px 4px; font-size:12px; font-weight:700; color:var(--text-3); width:120px;">Total</th>' +
          '<th style="width:40px;"></th>' +
        '</tr></thead>' +
        '<tbody id="inv-items-body">' + itemsHTML + '</tbody>' +
      '</table>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" style="margin-top:8px; border:1px dashed var(--border); width:100%;" onclick="window.addInvoiceLineItem()">+ Add Item</button>' +
    '</div>' +
    '<div style="border-top:1px solid var(--border); padding-top:16px; display:flex; flex-direction:column; gap:8px; align-items:flex-end;">' +
      '<div style="display:flex; justify-content:space-between; width:250px;"><span style="font-size:13px; color:var(--text-3); font-weight:600;">Subtotal:</span><span id="inv-form-subtotal" style="font-size:13px; font-weight:700;">' + fmtMoney(subtotal) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; width:250px;"><span style="font-size:13px; color:var(--text-3); font-weight:600;">GST (18%):</span><span id="inv-form-gst" style="font-size:13px; font-weight:700;">' + fmtMoney(gst) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; width:250px; border-top:1px solid var(--border); padding-top:8px;"><span style="font-size:14px; font-weight:800; color:var(--text-1);">Grand Total:</span><span id="inv-form-grand" style="font-size:14px; font-weight:800; color:var(--primary);">' + fmtMoney(total) + '</span></div>' +
    '</div>';
  }

  /* ── Gather Form Data ── */
  function gatherFormData() {
    var clientEl = document.getElementById('inv-form-client');
    var projEl = document.getElementById('inv-form-project');
    var issueEl = document.getElementById('inv-form-issue');
    var dueEl = document.getElementById('inv-form-due');

    var clientOpt = clientEl.options[clientEl.selectedIndex];
    var projOpt = projEl.options[projEl.selectedIndex];

    var items = [];
    var subtotal = 0;
    document.querySelectorAll('#inv-items-body tr').forEach(function (row) {
      var desc = row.querySelector('.inv-item-desc').value.trim();
      var qty = parseFloat(row.querySelector('.inv-item-qty').value) || 0;
      var price = parseFloat(row.querySelector('.inv-item-price').value) || 0;
      if (desc && qty > 0) {
        items.push({ description: desc, qty: qty, unitPrice: price });
        subtotal += qty * price;
      }
    });

    var gst = subtotal * GST_RATE;
    var total = subtotal + gst;

    return {
      clientId: clientEl.value,
      clientName: clientOpt ? clientOpt.getAttribute('data-name') || clientOpt.textContent : '',
      projectId: projEl.value,
      projectName: projOpt ? projOpt.getAttribute('data-name') || projOpt.textContent : '',
      issueDate: issueEl.value,
      dueDate: dueEl.value,
      items: items,
      subtotal: subtotal,
      gst: gst,
      total: total
    };
  }

  /* ── CREATE INVOICE ── */
  window.openCreateInvoice = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_create')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var body = buildInvoiceFormBody();
    window.VerdeModal.confirm({
      title: 'Create Invoice',
      body: body,
      confirmText: 'Create Invoice',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var data = gatherFormData();
        if (!data.clientId) { window.VerdeToast.error('Please select a client.'); return; }
        if (data.items.length === 0) { window.VerdeToast.error('Add at least one invoice item.'); return; }
        if (!data.dueDate) { window.VerdeToast.error('Please set a due date.'); return; }

        var inv = {
          id: genId(),
          invoiceNumber: nextInvoiceNumber(),
          clientId: data.clientId,
          clientName: data.clientName,
          projectId: data.projectId,
          projectName: data.projectName,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          items: data.items,
          subtotal: data.subtotal,
          gst: data.gst,
          total: data.total,
          status: 'Draft'
        };
        financeInvoices.push(inv);
        saveInvoices();
        renderInvoicesKPI();
        renderInvoicesTable();
        window.refreshDashboardKPIs();
        window.VerdeToast.success('Invoice ' + inv.invoiceNumber + ' created successfully.');
      }
    });

    // Recalculate after DOM renders
    setTimeout(function () { window.recalcInvoiceForm(); }, 50);
  };

  /* ── EDIT INVOICE ── */
  window.editInvoice = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    // Close menu
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    var inv = financeInvoices.find(function (i) { return i.id === id; });
    if (!inv) return;

    var body = buildInvoiceFormBody(inv);
    window.VerdeModal.confirm({
      title: 'Edit Invoice — ' + inv.invoiceNumber,
      body: body,
      confirmText: 'Save Changes',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var data = gatherFormData();
        if (!data.clientId) { window.VerdeToast.error('Please select a client.'); return; }
        if (data.items.length === 0) { window.VerdeToast.error('Add at least one invoice item.'); return; }

        inv.clientId = data.clientId;
        inv.clientName = data.clientName;
        inv.projectId = data.projectId;
        inv.projectName = data.projectName;
        inv.issueDate = data.issueDate;
        inv.dueDate = data.dueDate;
        inv.items = data.items;
        inv.subtotal = data.subtotal;
        inv.gst = data.gst;
        inv.total = data.total;

        saveInvoices();
        renderInvoicesKPI();
        renderInvoicesTable();
        window.refreshDashboardKPIs();
        window.VerdeToast.success('Invoice ' + inv.invoiceNumber + ' updated.');
      }
    });
    setTimeout(function () { window.recalcInvoiceForm(); }, 50);
  };

  /* ── VIEW INVOICE ── */
  window.viewInvoice = function (id) {
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    var inv = financeInvoices.find(function (i) { return i.id === id; });
    if (!inv) return;

    var itemRows = '';
    (inv.items || []).forEach(function (item) {
      var lt = (item.qty || 0) * (item.unitPrice || 0);
      itemRows += '<tr style="border-bottom:1px solid var(--border-subtle);">' +
        '<td style="padding:10px 8px; font-size:13px;">' + item.description + '</td>' +
        '<td style="padding:10px 8px; font-size:13px; text-align:center;">' + item.qty + '</td>' +
        '<td style="padding:10px 8px; font-size:13px; text-align:right;">' + fmtMoney(item.unitPrice) + '</td>' +
        '<td style="padding:10px 8px; font-size:13px; text-align:right; font-weight:700;">' + fmtMoney(lt) + '</td>' +
      '</tr>';
    });

    var body =
      '<div id="invoice-print-area">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px;">' +
        '<div>' +
          '<div style="font-size:22px; font-weight:900; color:var(--text-1); margin-bottom:4px;">VERDE LABS</div>' +
          '<div style="font-size:12px; color:var(--text-3);">Kochi, Kerala, India</div>' +
          '<div style="font-size:12px; color:var(--text-3);">hello@verdelabs.co</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:20px; font-weight:900; color:var(--primary); margin-bottom:4px;">' + inv.invoiceNumber + '</div>' +
          '<div style="font-size:12px; color:var(--text-3);">Issue: ' + fmtDate(inv.issueDate) + '</div>' +
          '<div style="font-size:12px; color:var(--text-3);">Due: ' + fmtDate(inv.dueDate) + '</div>' +
          '<div style="margin-top:8px;">' + statusBadge(inv.status) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:24px; padding:16px; background:var(--bg-2); border-radius:8px;">' +
        '<div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:6px;">Bill To</div>' +
        '<div style="font-size:14px; font-weight:700; color:var(--text-1);">' + (inv.clientName || '—') + '</div>' +
        '<div style="font-size:12px; color:var(--text-3);">' + (inv.projectName || 'No project linked') + '</div>' +
      '</div>' +
      '<table style="width:100%; border-collapse:collapse; margin-bottom:24px;">' +
        '<thead><tr style="border-bottom:2px solid var(--border);">' +
          '<th style="text-align:left; padding:10px 8px; font-size:12px; font-weight:700; color:var(--text-3);">Description</th>' +
          '<th style="text-align:center; padding:10px 8px; font-size:12px; font-weight:700; color:var(--text-3);">Qty</th>' +
          '<th style="text-align:right; padding:10px 8px; font-size:12px; font-weight:700; color:var(--text-3);">Unit Price</th>' +
          '<th style="text-align:right; padding:10px 8px; font-size:12px; font-weight:700; color:var(--text-3);">Total</th>' +
        '</tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table>' +
      '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">' +
        '<div style="display:flex; justify-content:space-between; width:250px;"><span style="font-size:13px; color:var(--text-3);">Subtotal:</span><span style="font-size:13px; font-weight:700;">' + fmtMoney(inv.subtotal) + '</span></div>' +
        '<div style="display:flex; justify-content:space-between; width:250px;"><span style="font-size:13px; color:var(--text-3);">GST (18%):</span><span style="font-size:13px; font-weight:700;">' + fmtMoney(inv.gst) + '</span></div>' +
        '<div style="display:flex; justify-content:space-between; width:250px; border-top:2px solid var(--border); padding-top:8px;"><span style="font-size:15px; font-weight:800;">Grand Total:</span><span style="font-size:15px; font-weight:800; color:var(--primary);">' + fmtMoney(inv.total) + '</span></div>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex; gap:12px; margin-top:24px; justify-content:flex-end;">' +
        '<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window.downloadInvoicePDF(\'' + inv.id + '\')">🖨 Print / PDF</button>' +
      '</div>';

    window.VerdeModal.confirm({
      title: 'Invoice Preview',
      body: body,
      confirmText: 'Close',
      confirmClass: 'btn-ghost',
      cancelText: 'Close',
      onConfirm: function () {}
    });
  };

  /* ── DUPLICATE INVOICE ── */
  window.duplicateInvoice = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_create')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    var src = financeInvoices.find(function (i) { return i.id === id; });
    if (!src) return;

    var dup = JSON.parse(JSON.stringify(src));
    dup.id = genId();
    dup.invoiceNumber = nextInvoiceNumber();
    dup.status = 'Draft';
    dup.issueDate = todayStr();
    dup.dueDate = '';

    financeInvoices.push(dup);
    saveInvoices();
    renderInvoicesKPI();
    renderInvoicesTable();
    window.VerdeToast.success('Invoice duplicated as ' + dup.invoiceNumber + '.');
  };

  /* ── UPDATE STATUS ── */
  window.updateInvoiceStatus = function (id, status) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    var inv = financeInvoices.find(function (i) { return i.id === id; });
    if (!inv) return;

    inv.status = status;
    saveInvoices();
    renderInvoicesKPI();
    renderInvoicesTable();
    window.refreshDashboardKPIs();
    window.VerdeToast.success('Invoice ' + inv.invoiceNumber + ' marked as ' + status + '.');
  };

  /* ── DELETE INVOICE ── */
  window.deleteInvoice = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_delete')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    var inv = financeInvoices.find(function (i) { return i.id === id; });
    if (!inv) return;

    window.VerdeModal.delete('Delete Invoice', 'Are you sure you want to permanently delete invoice <strong>' + inv.invoiceNumber + '</strong>? This action cannot be undone.', function () {
      financeInvoices = financeInvoices.filter(function (i) { return i.id !== id; });
      saveInvoices();
      renderInvoicesKPI();
      renderInvoicesTable();
      window.refreshDashboardKPIs();
      window.VerdeToast.success('Invoice ' + inv.invoiceNumber + ' deleted.');
    });
  };

  /* ── DOWNLOAD PDF (Print) ── */
  window.downloadInvoicePDF = function (id) {
    var menu = document.getElementById('inv-menu-' + id);
    if (menu) menu.style.display = 'none';

    // Open the view modal first, then trigger print
    window.viewInvoice(id);
    setTimeout(function () { window.print(); }, 300);
  };

  /* ── INIT ── */
  loadInvoices();
  renderInvoicesKPI();
  window.refreshDashboardKPIs();

  // Extend tab switcher to handle expenses + payments + reports
  var _origSwitch = window.switchFinanceTab;
  window.switchFinanceTab = function (tabId) {
    _origSwitch(tabId);
    if (tabId === 'dashboard') {
        window.refreshDashboardKPIs();
    }
    if (tabId === 'expenses') {
      window.renderExpensesKPI && window.renderExpensesKPI();
      window.renderExpensesTable && window.renderExpensesTable();
    }
    if (tabId === 'payments') {
      window.renderPaymentsKPI && window.renderPaymentsKPI();
      window.renderPaymentsTable && window.renderPaymentsTable();
    }
    if (tabId === 'reports') {
      window.applyReportFilters && window.applyReportFilters();
    }
  };

  console.log('Finance module initialized.');

})();

/* ==========================================================================
   VERDE OS — PAYMENT MANAGEMENT MODULE
   ========================================================================== */
(function () {
  'use strict';

  var PAY_STORAGE_KEY = 'verde_finance_payments';

  /* ── Helpers ── */
  function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function todayStr() { return new Date().toISOString().split('T')[0]; }
  function genPayId() { return 'PAY-' + Date.now().toString(36).toUpperCase(); }
  function nextPayNumber() {
    var max = 1000;
    financePayments.forEach(function (p) {
      var num = parseInt((p.paymentId || '').replace('PAY-', ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return 'PAY-' + (max + 1);
  }

  /* ── State ── */
  var financePayments = [];

  function loadPayments() {
    try {
      var raw = localStorage.getItem(PAY_STORAGE_KEY);
      if (raw) { financePayments = JSON.parse(raw); return; }
    } catch (e) { /* ignore */ }

    // Seed mock data
    financePayments = [
      {
        id: genPayId(), paymentId: 'PAY-1001',
        type: 'Invoice', refNumber: 'INV-1001', clientVendor: 'Cabo Travels',
        date: '2026-07-20', method: 'Bank Transfer', amount: 38940,
        transactionId: 'TXN-CB-20260720', notes: 'Full payment received for website sprint.', status: 'Completed'
      },
      {
        id: genPayId() + '2', paymentId: 'PAY-1002',
        type: 'Expense', refNumber: 'EXP-1001', clientVendor: 'Prestige Properties',
        date: '2026-08-01', method: 'Bank Transfer', amount: 53100,
        transactionId: 'TXN-PP-20260801', notes: 'August office rent paid.', status: 'Completed'
      },
      {
        id: genPayId() + '3', paymentId: 'PAY-1003',
        type: 'Invoice', refNumber: 'INV-1002', clientVendor: 'BlueWave Tech',
        date: '2026-08-03', method: 'UPI', amount: 67260,
        transactionId: 'TXN-BW-20260803', notes: 'Awaiting confirmation from client.', status: 'Pending'
      },
      {
        id: genPayId() + '4', paymentId: 'PAY-1004',
        type: 'Expense', refNumber: 'EXP-1002', clientVendor: 'Google LLC',
        date: '2026-08-03', method: 'Credit Card', amount: 10030,
        transactionId: 'TXN-GG-20260803', notes: 'Auto-charged annually.', status: 'Completed'
      },
      {
        id: genPayId() + '5', paymentId: 'PAY-1005',
        type: 'Invoice', refNumber: 'INV-1003', clientVendor: 'GreenLeaf',
        date: '2026-08-02', method: 'Cheque', amount: 21240,
        transactionId: 'TXN-GL-20260802', notes: 'Cheque bounced — follow up required.', status: 'Failed'
      }
    ];
    savePayments();
  }

  function savePayments() {
    localStorage.setItem(PAY_STORAGE_KEY, JSON.stringify(financePayments));
  }

  /* ── Status Badge ── */
  function payStatusBadge(status) {
    var cls = 'badge-neutral';
    if (status === 'Completed') cls = 'badge-success';
    else if (status === 'Pending')   cls = 'badge-warning';
    else if (status === 'Failed')    cls = 'badge-danger';
    else if (status === 'Refunded')  cls = 'badge-info';
    return '<span class="badge ' + cls + '">' + status + '</span>';
  }

  /* ── Type Badge ── */
  function payTypeBadge(type) {
    var cls = type === 'Invoice' ? 'badge-info' : 'badge-neutral';
    return '<span class="badge ' + cls + '">' + type + '</span>';
  }

  /* ── KPI Rendering ── */
  window.renderPaymentsKPI = function () {
    var received = 0, made = 0, pending = 0, failed = 0;
    financePayments.forEach(function (p) {
      if (p.status === 'Completed') {
        if (p.type === 'Invoice') received += (p.amount || 0);
        else made += (p.amount || 0);
      }
      if (p.status === 'Pending') pending++;
      if (p.status === 'Failed') failed++;
    });
    var el1 = document.getElementById('pay-kpi-received');
    var el2 = document.getElementById('pay-kpi-made');
    var el3 = document.getElementById('pay-kpi-pending');
    var el4 = document.getElementById('pay-kpi-failed');
    if (el1) el1.textContent = fmtMoney(received);
    if (el2) el2.textContent = fmtMoney(made);
    if (el3) el3.textContent = pending;
    if (el4) el4.textContent = failed;
  };

  /* ── Table Rendering ── */
  window.renderPaymentsTable = function () {
    var tbody = document.getElementById('payments-table-body');
    if (!tbody) return;

    var query = ((document.getElementById('pay-search-input') || {}).value || '').toLowerCase().trim();
    var typeFilter   = (document.getElementById('pay-filter-type')   || {}).value || '';
    var statusFilter = (document.getElementById('pay-filter-status') || {}).value || '';

    var filtered = financePayments.filter(function (p) {
      var mQ = !query ||
        (p.paymentId || '').toLowerCase().indexOf(query) !== -1 ||
        (p.refNumber || '').toLowerCase().indexOf(query) !== -1 ||
        (p.clientVendor || '').toLowerCase().indexOf(query) !== -1 ||
        (p.transactionId || '').toLowerCase().indexOf(query) !== -1;
      var mT = !typeFilter || p.type === typeFilter;
      var mS = !statusFilter || p.status === statusFilter;
      return mQ && mT && mS;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:48px 24px; color:var(--text-3); font-weight:600;">No payments found. Click \"+ Record Payment\" to get started.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (p) {
      html += '<tr>' +
        '<td style="font-weight:700; white-space:nowrap;">' + p.paymentId + '</td>' +
        '<td>' + payTypeBadge(p.type) + '</td>' +
        '<td style="font-weight:600;">' + (p.refNumber || '—') + '</td>' +
        '<td style="color:var(--text-2);">' + (p.clientVendor || '—') + '</td>' +
        '<td style="white-space:nowrap;">' + fmtDate(p.date) + '</td>' +
        '<td>' + (p.method || '—') + '</td>' +
        '<td style="font-weight:800;">' + fmtMoney(p.amount) + '</td>' +
        '<td style="font-size:12px; color:var(--text-3);">' + (p.transactionId || '—') + '</td>' +
        '<td>' + payStatusBadge(p.status) + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window.togglePayMenu(\'' + p.id + '\', this)">⋯</button>' +
        '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  };

  /* ── Payment Action Menu Portal ── */
  function getPayPortal() {
    var el = document.getElementById('pay-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pay-action-portal';
      el.style.cssText = 'position:fixed; z-index:9999; display:none; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-md); min-width:180px; padding:4px 0;';
      document.body.appendChild(el);
    }
    return el;
  }
  function payMenuItem(label, color, disabled, onclick) {
    var el = document.createElement('div');
    el.style.cssText = 'padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; color:' + color + ';' + (disabled ? ' opacity:0.35; pointer-events:none;' : '');
    el.textContent = label;
    if (!disabled) {
      el.addEventListener('mouseover', function () { el.style.background = 'var(--bg-2)'; });
      el.addEventListener('mouseout',  function () { el.style.background = 'transparent'; });
      el.addEventListener('click', onclick);
    }
    return el;
  }
  function payMenuDivider() {
    var el = document.createElement('div');
    el.style.cssText = 'height:1px; background:var(--border); margin:4px 0;';
    return el;
  }

  window.togglePayMenu = function (id, btn) {
    var portal = getPayPortal();

    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var p = financePayments.find(function (x) { return x.id === id; });
    if (!p) return;

    var canComplete = p.status === 'Pending' || p.status === 'Failed';
    var canRefund   = p.status === 'Completed';

    portal.innerHTML = '';
    portal.appendChild(payMenuItem('View Payment',      'var(--text-1)',  false,       function () { portal.style.display = 'none'; window.viewPayment(id); }));
    portal.appendChild(payMenuItem('Edit Payment',      'var(--text-1)',  false,       function () { portal.style.display = 'none'; window.editPayment(id); }));
    portal.appendChild(payMenuDivider());
    portal.appendChild(payMenuItem('Mark as Completed', 'var(--success)', !canComplete, function () { portal.style.display = 'none'; window.updatePaymentStatus(id, 'Completed'); }));
    portal.appendChild(payMenuItem('Mark as Refunded',  'var(--info)',    !canRefund,   function () { portal.style.display = 'none'; window.updatePaymentStatus(id, 'Refunded'); }));
    portal.appendChild(payMenuDivider());
    portal.appendChild(payMenuItem('Delete',            'var(--danger)',  false,       function () { portal.style.display = 'none'; window.deletePayment(id); }));

    // Position
    var rect = btn.getBoundingClientRect();
    portal.style.display = 'block';
    portal.dataset.activeId = id;
    var portalH = portal.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow >= portalH ? rect.bottom + 4 : rect.top - portalH - 4;
    var right = window.innerWidth - rect.right;
    portal.style.top   = Math.max(8, top) + 'px';
    portal.style.right = Math.max(8, right) + 'px';
    portal.style.left  = 'auto';

    setTimeout(function () {
      function handler(ev) {
        if (!portal.contains(ev.target) && ev.target !== btn) {
          portal.style.display = 'none';
          portal.dataset.activeId = '';
          document.removeEventListener('click', handler);
        }
      }
      document.addEventListener('click', handler);
    }, 10);
  };

  /* ── Build Form Body ── */
  function buildPayFormBody(pay) {
    pay = pay || {};
    var methods = ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Cheque'];
    var mHTML = methods.map(function (m) {
      return '<option' + (m === pay.method ? ' selected' : '') + '>' + m + '</option>';
    }).join('');

    // Load invoice + expense options from localStorage for linking
    var invoices = [];
    var expenses = [];
    try { invoices = JSON.parse(localStorage.getItem('verde_finance_invoices') || '[]'); } catch (e) {}
    try { expenses = JSON.parse(localStorage.getItem('verde_finance_expenses') || '[]'); } catch (e) {}

    var invOpts = invoices.map(function (inv) {
      var sel = pay.type === 'Invoice' && pay.refNumber === inv.invoiceNumber ? ' selected' : '';
      return '<option value="' + inv.invoiceNumber + '" data-party="' + (inv.clientName || '') + '" data-amount="' + (inv.total || 0) + '"' + sel + '>' + inv.invoiceNumber + ' — ' + (inv.clientName || '') + '</option>';
    }).join('');
    var expOpts = expenses.map(function (exp) {
      var sel = pay.type === 'Expense' && pay.refNumber === exp.expenseId ? ' selected' : '';
      return '<option value="' + exp.expenseId + '" data-party="' + (exp.vendor || '') + '" data-amount="' + (exp.total || 0) + '"' + sel + '>' + exp.expenseId + ' — ' + (exp.title || '') + '</option>';
    }).join('');

    return '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:8px;">' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Payment Type *</label>' +
        '<select id="pay-form-type" class="modal-table-input" style="padding:8px 12px;" onchange="window._payFormTypeChange()">' +
          '<option value="">— Select —</option>' +
          '<option' + (pay.type === 'Invoice' ? ' selected' : '') + '>Invoice</option>' +
          '<option' + (pay.type === 'Expense' ? ' selected' : '') + '>Expense</option>' +
        '</select>' +
      '</div>' +
      '<div id="pay-form-ref-wrap">' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Reference</label>' +
        '<select id="pay-form-ref" class="modal-table-input" style="padding:8px 12px;" onchange="window._payFormRefChange()">' +
          '<option value="">— Select Type First —</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Client / Vendor</label>' +
        '<input id="pay-form-party" type="text" class="modal-table-input" style="padding:8px 12px; background:var(--bg-2);" readonly value="' + (pay.clientVendor || '') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Amount (₹) *</label>' +
        '<input id="pay-form-amount" type="number" min="0" step="0.01" class="modal-table-input" style="padding:8px 12px;" value="' + (pay.amount || '') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Payment Method *</label>' +
        '<select id="pay-form-method" class="modal-table-input" style="padding:8px 12px;"><option value="">— Select —</option>' + mHTML + '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Payment Date *</label>' +
        '<input id="pay-form-date" type="date" class="modal-table-input" style="padding:8px 12px;" value="' + (pay.date || todayStr()) + '" />' +
      '</div>' +
      '<div style="grid-column:1/-1;">' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Transaction ID</label>' +
        '<input id="pay-form-txnid" type="text" class="modal-table-input" style="padding:8px 12px;" placeholder="e.g. TXN-12345678" value="' + (pay.transactionId || '') + '" />' +
      '</div>' +
      '<div style="grid-column:1/-1;">' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Notes</label>' +
        '<textarea id="pay-form-notes" class="modal-table-input" style="padding:8px 12px; resize:vertical; min-height:64px;" placeholder="Optional notes...">' + (pay.notes || '') + '</textarea>' +
      '</div>' +
      // Hidden data stores for invoice/expense options
      '<input type="hidden" id="pay-inv-opts" value=\'' + invOpts.replace(/'/g, '&#39;') + '\' />' +
      '<input type="hidden" id="pay-exp-opts" value=\'' + expOpts.replace(/'/g, '&#39;') + '\' />' +
    '</div>';
  }

  /* ── Type Change Handler ── */
  window._payFormTypeChange = function () {
    var typeEl = document.getElementById('pay-form-type');
    var refEl  = document.getElementById('pay-form-ref');
    var invOpts = document.getElementById('pay-inv-opts');
    var expOpts = document.getElementById('pay-exp-opts');
    if (!typeEl || !refEl) return;
    var t = typeEl.value;
    if (t === 'Invoice') {
      refEl.innerHTML = '<option value="">— Select Invoice —</option>' + (invOpts ? invOpts.value : '');
    } else if (t === 'Expense') {
      refEl.innerHTML = '<option value="">— Select Expense —</option>' + (expOpts ? expOpts.value : '');
    } else {
      refEl.innerHTML = '<option value="">— Select Type First —</option>';
    }
    var partyEl = document.getElementById('pay-form-party');
    var amtEl   = document.getElementById('pay-form-amount');
    if (partyEl) partyEl.value = '';
    if (amtEl && !amtEl.value) amtEl.value = '';
  };

  /* ── Ref Change Handler ── */
  window._payFormRefChange = function () {
    var refEl   = document.getElementById('pay-form-ref');
    var partyEl = document.getElementById('pay-form-party');
    var amtEl   = document.getElementById('pay-form-amount');
    if (!refEl) return;
    var opt = refEl.options[refEl.selectedIndex];
    if (opt && opt.getAttribute('data-party')) {
      if (partyEl) partyEl.value = opt.getAttribute('data-party');
      if (amtEl && !amtEl.value) amtEl.value = opt.getAttribute('data-amount') || '';
    }
  };

  /* ── Gather Form Data ── */
  function gatherPayFormData() {
    var typeEl   = document.getElementById('pay-form-type');
    var refEl    = document.getElementById('pay-form-ref');
    var partyEl  = document.getElementById('pay-form-party');
    var amtEl    = document.getElementById('pay-form-amount');
    var methodEl = document.getElementById('pay-form-method');
    var dateEl   = document.getElementById('pay-form-date');
    var txnEl    = document.getElementById('pay-form-txnid');
    var notesEl  = document.getElementById('pay-form-notes');
    return {
      type:         typeEl   ? typeEl.value   : '',
      refNumber:    refEl    ? refEl.value    : '',
      clientVendor: partyEl  ? partyEl.value  : '',
      amount:       parseFloat((amtEl || {}).value) || 0,
      method:       methodEl ? methodEl.value : '',
      date:         dateEl   ? dateEl.value   : '',
      transactionId: txnEl  ? txnEl.value.trim() : '',
      notes:        notesEl  ? notesEl.value.trim() : ''
    };
  }

  /* ── RECORD PAYMENT ── */
  window.openRecordPayment = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_create')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var body = buildPayFormBody();
    window.VerdeModal.confirm({
      title: 'Record Payment',
      body: body,
      confirmText: 'Save Payment',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var d = gatherPayFormData();
        if (!d.type)   { window.VerdeToast.error('Please select a payment type.'); return; }
        if (!d.method) { window.VerdeToast.error('Please select a payment method.'); return; }
        if (!d.date)   { window.VerdeToast.error('Please set a payment date.'); return; }
        if (d.amount <= 0) { window.VerdeToast.error('Amount must be greater than zero.'); return; }

        var pay = {
          id: genPayId(), paymentId: nextPayNumber(),
          type: d.type, refNumber: d.refNumber, clientVendor: d.clientVendor,
          date: d.date, method: d.method, amount: d.amount,
          transactionId: d.transactionId, notes: d.notes, status: 'Pending'
        };
        financePayments.push(pay);
        savePayments();
        window.renderPaymentsKPI();
        window.renderPaymentsTable();
        window.refreshDashboardKPIs && window.refreshDashboardKPIs();
        window.VerdeToast.success('Payment ' + pay.paymentId + ' recorded successfully.');
      }
    });
    // Trigger type select to init ref dropdown if pre-filled
    setTimeout(function () { window._payFormTypeChange && window._payFormTypeChange(); }, 50);
  };

  /* ── EDIT PAYMENT ── */
  window.editPayment = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var pay = financePayments.find(function (p) { return p.id === id; });
    if (!pay) return;

    var body = buildPayFormBody(pay);
    window.VerdeModal.confirm({
      title: 'Edit Payment — ' + pay.paymentId,
      body: body,
      confirmText: 'Save Changes',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var d = gatherPayFormData();
        if (!d.type)   { window.VerdeToast.error('Please select a payment type.'); return; }
        if (!d.method) { window.VerdeToast.error('Please select a payment method.'); return; }
        if (d.amount <= 0) { window.VerdeToast.error('Amount must be greater than zero.'); return; }

        pay.type = d.type; pay.refNumber = d.refNumber; pay.clientVendor = d.clientVendor;
        pay.date = d.date; pay.method = d.method; pay.amount = d.amount;
        pay.transactionId = d.transactionId; pay.notes = d.notes;

        savePayments();
        window.renderPaymentsKPI();
        window.renderPaymentsTable();
        window.VerdeToast.success('Payment ' + pay.paymentId + ' updated.');
      }
    });
    setTimeout(function () {
      // Re-populate type dropdown selection then trigger ref list
      var typeEl = document.getElementById('pay-form-type');
      if (typeEl) { typeEl.value = pay.type; window._payFormTypeChange(); }
      // Then set the ref selection
      setTimeout(function () {
        var refEl = document.getElementById('pay-form-ref');
        if (refEl) refEl.value = pay.refNumber;
        var partyEl = document.getElementById('pay-form-party');
        if (partyEl) partyEl.value = pay.clientVendor;
      }, 30);
    }, 60);
  };

  /* ── VIEW PAYMENT ── */
  window.viewPayment = function (id) {
    var pay = financePayments.find(function (p) { return p.id === id; });
    if (!pay) return;

    var body =
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Payment ID</div><div style="font-size:14px; font-weight:800;">' + pay.paymentId + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Status</div>' + payStatusBadge(pay.status) + '</div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Type</div>' + payTypeBadge(pay.type) + '</div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Reference</div><div style="font-size:13px; font-weight:700;">' + (pay.refNumber || '—') + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Client / Vendor</div><div style="font-size:13px; font-weight:600;">' + (pay.clientVendor || '—') + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Date</div><div style="font-size:13px; font-weight:600;">' + fmtDate(pay.date) + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Method</div><div style="font-size:13px; font-weight:600;">' + (pay.method || '—') + '</div></div>' +
        '<div style="grid-column:1/-1; border-top:1px solid var(--border); padding-top:16px; margin-top:4px;">' +
          '<div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Amount</div>' +
          '<div style="font-size:22px; font-weight:900; color:var(--primary);">' + fmtMoney(pay.amount) + '</div>' +
        '</div>' +
        '<div style="grid-column:1/-1;"><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Transaction ID</div><div style="font-size:13px; font-weight:600; color:var(--text-2);">' + (pay.transactionId || '—') + '</div></div>' +
        (pay.notes ? '<div style="grid-column:1/-1;"><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Notes</div><div style="font-size:13px; color:var(--text-2);">' + pay.notes + '</div></div>' : '') +
      '</div>';

    window.VerdeModal.confirm({
      title: 'Payment Details',
      body: body,
      confirmText: 'Close',
      confirmClass: 'btn-ghost',
      cancelText: 'Close',
      onConfirm: function () {}
    });
  };

  /* ── UPDATE STATUS ── */
  window.updatePaymentStatus = function (id, newStatus) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var pay = financePayments.find(function (p) { return p.id === id; });
    if (!pay) return;
    pay.status = newStatus;
    savePayments();
    window.renderPaymentsKPI();
    window.renderPaymentsTable();
    window.VerdeToast.success(pay.paymentId + ' marked as ' + newStatus + '.');
  };

  /* ── DELETE PAYMENT ── */
  window.deletePayment = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_delete')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var pay = financePayments.find(function (p) { return p.id === id; });
    if (!pay) return;
    window.VerdeModal.delete('Delete Payment', 'Are you sure you want to permanently delete <strong>' + pay.paymentId + '</strong>? This action cannot be undone.', function () {
      financePayments = financePayments.filter(function (p) { return p.id !== id; });
      savePayments();
      window.renderPaymentsKPI();
      window.renderPaymentsTable();
      window.VerdeToast.success('Payment ' + pay.paymentId + ' deleted.');
    });
  };

  /* ── INIT ── */
  loadPayments();
  console.log('Payment module initialized.');

})();


/* ==========================================================================
   VERDE OS — EXPENSE MANAGEMENT MODULE
   ========================================================================== */
(function () {
  'use strict';

  var EXP_STORAGE_KEY = 'verde_finance_expenses';
  var EXP_GST_RATE = 0.18;

  /* ── Helpers ── */
  function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function todayStr() { return new Date().toISOString().split('T')[0]; }
  function genExpId() { return 'EXP-' + Date.now().toString(36).toUpperCase(); }
  function nextExpNumber() {
    var max = 1000;
    financeExpenses.forEach(function (e) {
      var num = parseInt((e.expenseId || '').replace('EXP-', ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return 'EXP-' + (max + 1);
  }
  function currentMonthStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  /* ── State ── */
  var financeExpenses = [];

  function loadExpenses() {
    try {
      var raw = localStorage.getItem(EXP_STORAGE_KEY);
      if (raw) { financeExpenses = JSON.parse(raw); return; }
    } catch (e) { /* ignore */ }

    // Seed mock data
    financeExpenses = [
      {
        id: genExpId(), expenseId: 'EXP-1001',
        title: 'Monthly Office Rent', category: 'Office Rent', vendor: 'Prestige Properties',
        date: '2026-08-01', paymentMethod: 'Bank Transfer',
        amount: 45000, gst: 8100, total: 53100,
        receiptAttached: true, receiptName: 'rent_aug_2026.pdf',
        notes: 'August 2026 office rent - Kakkanad branch', status: 'Paid'
      },
      {
        id: genExpId() + '2', expenseId: 'EXP-1002',
        title: 'Google Workspace Subscription', category: 'Software', vendor: 'Google LLC',
        date: '2026-08-03', paymentMethod: 'Credit Card',
        amount: 8500, gst: 1530, total: 10030,
        receiptAttached: true, receiptName: 'google_invoice_aug.pdf',
        notes: '20 seats — annual plan monthly billing', status: 'Paid'
      },
      {
        id: genExpId() + '3', expenseId: 'EXP-1003',
        title: 'Team Outstation Travel — Bangalore', category: 'Travel', vendor: 'MakeMyTrip',
        date: '2026-07-28', paymentMethod: 'Corporate Card',
        amount: 22000, gst: 3960, total: 25960,
        receiptAttached: false, receiptName: '',
        notes: 'Client meeting — BlueWave Tech HQ', status: 'Approved'
      },
      {
        id: genExpId() + '4', expenseId: 'EXP-1004',
        title: 'MacBook Pro 14" — Dev Team', category: 'Equipment', vendor: 'Apple India',
        date: '2026-08-02', paymentMethod: 'Bank Transfer',
        amount: 185000, gst: 33300, total: 218300,
        receiptAttached: true, receiptName: 'apple_invoice_macbook.pdf',
        notes: 'Replacement for damaged unit', status: 'Pending'
      },
      {
        id: genExpId() + '5', expenseId: 'EXP-1005',
        title: 'Facebook & Instagram Ad Spend', category: 'Marketing', vendor: 'Meta Platforms',
        date: '2026-08-03', paymentMethod: 'Credit Card',
        amount: 15000, gst: 2700, total: 17700,
        receiptAttached: false, receiptName: '',
        notes: 'Q3 digital marketing campaign', status: 'Pending'
      }
    ];
    saveExpenses();
  }

  function saveExpenses() {
    localStorage.setItem(EXP_STORAGE_KEY, JSON.stringify(financeExpenses));
  }

  /* ── Status Badge ── */
  function expStatusBadge(status) {
    var cls = 'badge-neutral';
    if (status === 'Paid') cls = 'badge-success';
    else if (status === 'Approved') cls = 'badge-info';
    else if (status === 'Pending') cls = 'badge-warning';
    else if (status === 'Rejected') cls = 'badge-danger';
    return '<span class="badge ' + cls + '">' + status + '</span>';
  }

  /* ── KPI Rendering ── */
  window.renderExpensesKPI = function () {
    var total = 0, pending = 0, paid = 0, monthly = 0;
    var monthStr = currentMonthStr();
    financeExpenses.forEach(function (e) {
      total += e.total || 0;
      if (e.status === 'Pending') pending++;
      if (e.status === 'Paid') paid += e.total || 0;
      if ((e.date || '').startsWith(monthStr)) monthly += e.total || 0;
    });
    var elTotal = document.getElementById('exp-kpi-total');
    var elPend = document.getElementById('exp-kpi-pending');
    var elPaid = document.getElementById('exp-kpi-paid');
    var elMon = document.getElementById('exp-kpi-monthly');
    if (elTotal) elTotal.textContent = fmtMoney(total);
    if (elPend) elPend.textContent = pending;
    if (elPaid) elPaid.textContent = fmtMoney(paid);
    if (elMon) elMon.textContent = fmtMoney(monthly);
  };

  /* ── Table Rendering ── */
  window.renderExpensesTable = function () {
    var tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    var query = (document.getElementById('exp-search-input') || {}).value || '';
    query = query.toLowerCase().trim();
    var catFilter = (document.getElementById('exp-filter-category') || {}).value || '';
    var statusFilter = (document.getElementById('exp-filter-status') || {}).value || '';

    var filtered = financeExpenses.filter(function (e) {
      var matchQ = !query ||
        (e.expenseId || '').toLowerCase().indexOf(query) !== -1 ||
        (e.title || '').toLowerCase().indexOf(query) !== -1 ||
        (e.vendor || '').toLowerCase().indexOf(query) !== -1 ||
        (e.category || '').toLowerCase().indexOf(query) !== -1;
      var matchCat = !catFilter || e.category === catFilter;
      var matchStat = !statusFilter || e.status === statusFilter;
      return matchQ && matchCat && matchStat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:48px 24px; color:var(--text-3); font-weight:600;">No expenses found. Click \"+ Add Expense\" to get started.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (e) {
      html += '<tr>' +
        '<td style="font-weight:700; white-space:nowrap;">' + e.expenseId + '</td>' +
        '<td style="font-weight:600;">' + (e.title || '—') + '</td>' +
        '<td>' + (e.category || '—') + '</td>' +
        '<td style="color:var(--text-2);">' + (e.vendor || '—') + '</td>' +
        '<td style="white-space:nowrap;">' + fmtDate(e.date) + '</td>' +
        '<td>' + (e.paymentMethod || '—') + '</td>' +
        '<td style="font-weight:700;">' + fmtMoney(e.amount) + '</td>' +
        '<td>' + fmtMoney(e.gst) + '</td>' +
        '<td style="font-weight:800;">' + fmtMoney(e.total) + '</td>' +
        '<td>' + (e.receiptAttached ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-neutral">No</span>') + '</td>' +
        '<td>' + expStatusBadge(e.status) + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window.toggleExpMenu(\'' + e.id + '\', this)">⋯</button>' +
        '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  };

  /* ── Action Menu Portal (body-level, escapes overflow clipping) ── */
  function getExpPortal() {
    var el = document.getElementById('exp-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'exp-action-portal';
      el.style.cssText = 'position:fixed; z-index:9999; display:none; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-md); min-width:180px; padding:4px 0;';
      document.body.appendChild(el);
    }
    return el;
  }

  function menuItem(label, color, disabled, onclick) {
    var el = document.createElement('div');
    el.style.cssText = 'padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; color:' + color + ';' + (disabled ? ' opacity:0.35; pointer-events:none;' : '');
    el.textContent = label;
    if (!disabled) {
      el.addEventListener('mouseover', function () { el.style.background = 'var(--bg-2)'; });
      el.addEventListener('mouseout', function () { el.style.background = 'transparent'; });
      el.addEventListener('click', onclick);
    }
    return el;
  }
  function menuDivider() {
    var el = document.createElement('div');
    el.style.cssText = 'height:1px; background:var(--border); margin:4px 0;';
    return el;
  }

  window.toggleExpMenu = function (id, btn) {
    var portal = getExpPortal();

    // Toggle off if same button clicked again
    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    var canApprove = exp.status === 'Pending';
    var canReject  = exp.status === 'Pending';
    var canPay     = exp.status === 'Approved';

    // Build menu content
    portal.innerHTML = '';
    portal.appendChild(menuItem('View Expense',    'var(--text-1)', false, function () { portal.style.display = 'none'; window.viewExpense(id); }));
    portal.appendChild(menuItem('Edit Expense',    'var(--text-1)', false, function () { portal.style.display = 'none'; window.editExpense(id); }));
    portal.appendChild(menuItem('Upload Receipt',  'var(--text-1)', false, function () { portal.style.display = 'none'; window.uploadExpenseReceipt(id); }));
    portal.appendChild(menuDivider());
    portal.appendChild(menuItem('Approve',         'var(--success)', !canApprove,  function () { portal.style.display = 'none'; window.updateExpenseStatus(id, 'Approved'); }));
    portal.appendChild(menuItem('Reject',          'var(--danger)',  !canReject,   function () { portal.style.display = 'none'; window.updateExpenseStatus(id, 'Rejected'); }));
    portal.appendChild(menuItem('Mark as Paid',    'var(--primary)', !canPay,      function () { portal.style.display = 'none'; window.updateExpenseStatus(id, 'Paid'); }));
    portal.appendChild(menuDivider());
    portal.appendChild(menuItem('Delete',          'var(--danger)',  false, function () { portal.style.display = 'none'; window.deleteExpense(id); }));

    // Position using fixed coords from button
    var rect = btn.getBoundingClientRect();
    portal.style.display = 'block';
    portal.dataset.activeId = id;

    // Measure then adjust if it overflows viewport bottom
    var portalH = portal.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow >= portalH ? rect.bottom + 4 : rect.top - portalH - 4;

    // Align right edge with button right edge, clamp to viewport left
    var right = window.innerWidth - rect.right;
    portal.style.top  = Math.max(8, top) + 'px';
    portal.style.right = Math.max(8, right) + 'px';
    portal.style.left = 'auto';

    // Close on outside click
    setTimeout(function () {
      function handler(ev) {
        if (!portal.contains(ev.target) && ev.target !== btn) {
          portal.style.display = 'none';
          portal.dataset.activeId = '';
          document.removeEventListener('click', handler);
        }
      }
      document.addEventListener('click', handler);
    }, 10);
  };


  /* ── Build Form Body ── */
  function buildExpenseFormBody(exp) {
    exp = exp || {};
    var catOptions = ['Salary','Office Rent','Utilities','Marketing','Travel','Software','Equipment','Maintenance','Miscellaneous'];
    var catHTML = catOptions.map(function (c) {
      return '<option' + (c === exp.category ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    var pmOptions = ['Cash','Bank Transfer','Credit Card','Corporate Card','UPI','Cheque'];
    var pmHTML = pmOptions.map(function (p) {
      return '<option' + (p === exp.paymentMethod ? ' selected' : '') + '>' + p + '</option>';
    }).join('');

    return '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
      '<div style="grid-column:1/-1;">' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Expense Title *</label>' +
        '<input id="exp-form-title" type="text" class="modal-table-input" style="padding:8px 12px;" placeholder="e.g. Office Supplies Q3" value="' + (exp.title || '') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Category *</label>' +
        '<select id="exp-form-category" class="modal-table-input" style="padding:8px 12px;"><option value="">— Select —</option>' + catHTML + '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Vendor</label>' +
        '<input id="exp-form-vendor" type="text" class="modal-table-input" style="padding:8px 12px;" placeholder="Vendor name" value="' + (exp.vendor || '') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Date *</label>' +
        '<input id="exp-form-date" type="date" class="modal-table-input" style="padding:8px 12px;" value="' + (exp.date || todayStr()) + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Payment Method</label>' +
        '<select id="exp-form-pm" class="modal-table-input" style="padding:8px 12px;"><option value="">— Select —</option>' + pmHTML + '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Amount (₹) *</label>' +
        '<input id="exp-form-amount" type="number" min="0" step="0.01" class="modal-table-input" style="padding:8px 12px;" placeholder="0.00" value="' + (exp.amount || '') + '" oninput="window.recalcExpForm()" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">GST @ 18% (₹)</label>' +
        '<input id="exp-form-gst" type="text" class="modal-table-input" style="padding:8px 12px; background:var(--bg-2);" readonly value="' + (exp.gst ? exp.gst.toFixed(2) : '0.00') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Total (₹)</label>' +
        '<input id="exp-form-total" type="text" class="modal-table-input" style="padding:8px 12px; background:var(--bg-2); font-weight:800; color:var(--primary);" readonly value="' + (exp.total ? exp.total.toFixed(2) : '0.00') + '" />' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Receipt Attached</label>' +
        '<select id="exp-form-receipt" class="modal-table-input" style="padding:8px 12px;">' +
          '<option value="false"' + (!exp.receiptAttached ? ' selected' : '') + '>No</option>' +
          '<option value="true"' + (exp.receiptAttached ? ' selected' : '') + '>Yes</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Receipt File</label>' +
        '<input id="exp-form-receipt-file" type="file" accept=".pdf,.jpg,.jpeg,.png" class="modal-table-input" style="padding:6px 12px;" />' +
        (exp.receiptName ? '<div style="font-size:11px; color:var(--text-3); margin-top:4px;">Current: ' + exp.receiptName + '</div>' : '') +
      '</div>' +
      '<div style="grid-column:1/-1;">' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Notes</label>' +
        '<textarea id="exp-form-notes" class="modal-table-input" style="padding:8px 12px; resize:vertical; min-height:72px;" placeholder="Optional notes...">' + (exp.notes || '') + '</textarea>' +
      '</div>' +
    '</div>';
  }

  /* ── Recalculate GST & Total ── */
  window.recalcExpForm = function () {
    var amtEl = document.getElementById('exp-form-amount');
    var gstEl = document.getElementById('exp-form-gst');
    var totEl = document.getElementById('exp-form-total');
    if (!amtEl) return;
    var amt = parseFloat(amtEl.value) || 0;
    var gst = amt * EXP_GST_RATE;
    var total = amt + gst;
    if (gstEl) gstEl.value = gst.toFixed(2);
    if (totEl) totEl.value = total.toFixed(2);
  };

  /* ── Gather Form Data ── */
  function gatherExpFormData() {
    var titleEl = document.getElementById('exp-form-title');
    var catEl = document.getElementById('exp-form-category');
    var vendorEl = document.getElementById('exp-form-vendor');
    var dateEl = document.getElementById('exp-form-date');
    var pmEl = document.getElementById('exp-form-pm');
    var amtEl = document.getElementById('exp-form-amount');
    var receiptEl = document.getElementById('exp-form-receipt');
    var receiptFileEl = document.getElementById('exp-form-receipt-file');
    var notesEl = document.getElementById('exp-form-notes');

    var amt = parseFloat((amtEl || {}).value) || 0;
    var gst = amt * EXP_GST_RATE;
    var total = amt + gst;
    var receiptAttached = receiptEl && receiptEl.value === 'true';
    var receiptName = '';
    if (receiptFileEl && receiptFileEl.files && receiptFileEl.files[0]) {
      receiptName = receiptFileEl.files[0].name;
      receiptAttached = true;
    }

    return {
      title: titleEl ? titleEl.value.trim() : '',
      category: catEl ? catEl.value : '',
      vendor: vendorEl ? vendorEl.value.trim() : '',
      date: dateEl ? dateEl.value : '',
      paymentMethod: pmEl ? pmEl.value : '',
      amount: amt,
      gst: gst,
      total: total,
      receiptAttached: receiptAttached,
      receiptName: receiptName,
      notes: notesEl ? notesEl.value.trim() : ''
    };
  }

  /* ── CREATE EXPENSE ── */
  window.openCreateExpense = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_create')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var body = buildExpenseFormBody();
    window.VerdeModal.confirm({
      title: 'Add Expense',
      body: body,
      confirmText: 'Save Expense',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var data = gatherExpFormData();
        if (!data.title) { window.VerdeToast.error('Expense title is required.'); return; }
        if (!data.category) { window.VerdeToast.error('Please select a category.'); return; }
        if (!data.date) { window.VerdeToast.error('Please select a date.'); return; }
        if (data.amount <= 0) { window.VerdeToast.error('Amount must be greater than zero.'); return; }

        var exp = {
          id: genExpId(),
          expenseId: nextExpNumber(),
          title: data.title,
          category: data.category,
          vendor: data.vendor,
          date: data.date,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          gst: data.gst,
          total: data.total,
          receiptAttached: data.receiptAttached,
          receiptName: data.receiptName,
          notes: data.notes,
          status: 'Pending'
        };
        financeExpenses.push(exp);
        saveExpenses();
        window.renderExpensesKPI();
        window.renderExpensesTable();
        window.refreshDashboardKPIs && window.refreshDashboardKPIs();
        window.VerdeToast.success('Expense ' + exp.expenseId + ' created successfully.');
      }
    });
    setTimeout(function () { window.recalcExpForm(); }, 50);
  };

  /* ── EDIT EXPENSE ── */
  window.editExpense = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('exp-menu-' + id);
    if (menu) menu.style.display = 'none';

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    var body = buildExpenseFormBody(exp);
    window.VerdeModal.confirm({
      title: 'Edit Expense — ' + exp.expenseId,
      body: body,
      confirmText: 'Save Changes',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var data = gatherExpFormData();
        if (!data.title) { window.VerdeToast.error('Expense title is required.'); return; }
        if (!data.category) { window.VerdeToast.error('Please select a category.'); return; }
        if (data.amount <= 0) { window.VerdeToast.error('Amount must be greater than zero.'); return; }

        exp.title = data.title;
        exp.category = data.category;
        exp.vendor = data.vendor;
        exp.date = data.date;
        exp.paymentMethod = data.paymentMethod;
        exp.amount = data.amount;
        exp.gst = data.gst;
        exp.total = data.total;
        exp.receiptAttached = data.receiptAttached;
        if (data.receiptName) exp.receiptName = data.receiptName;
        exp.notes = data.notes;

        saveExpenses();
        window.renderExpensesKPI();
        window.renderExpensesTable();
        window.refreshDashboardKPIs && window.refreshDashboardKPIs();
        window.VerdeToast.success('Expense ' + exp.expenseId + ' updated.');
      }
    });
    setTimeout(function () { window.recalcExpForm(); }, 50);
  };

  /* ── VIEW EXPENSE ── */
  window.viewExpense = function (id) {
    var menu = document.getElementById('exp-menu-' + id);
    if (menu) menu.style.display = 'none';

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    var body =
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Expense ID</div><div style="font-size:14px; font-weight:800;">' + exp.expenseId + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Status</div>' + expStatusBadge(exp.status) + '</div>' +
        '<div style="grid-column:1/-1;"><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Expense Title</div><div style="font-size:15px; font-weight:800; color:var(--text-1);">' + (exp.title || '—') + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Category</div><div style="font-size:13px; font-weight:600;">' + (exp.category || '—') + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Vendor</div><div style="font-size:13px; font-weight:600;">' + (exp.vendor || '—') + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Date</div><div style="font-size:13px; font-weight:600;">' + fmtDate(exp.date) + '</div></div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Payment Method</div><div style="font-size:13px; font-weight:600;">' + (exp.paymentMethod || '—') + '</div></div>' +
        '<div style="grid-column:1/-1; border-top:1px solid var(--border); padding-top:16px; margin-top:4px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">' +
          '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Amount</div><div style="font-size:14px; font-weight:700;">' + fmtMoney(exp.amount) + '</div></div>' +
          '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">GST (18%)</div><div style="font-size:14px; font-weight:700;">' + fmtMoney(exp.gst) + '</div></div>' +
          '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Total</div><div style="font-size:16px; font-weight:900; color:var(--primary);">' + fmtMoney(exp.total) + '</div></div>' +
        '</div>' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Receipt</div>' +
          (exp.receiptAttached ? '<span class="badge badge-success">Attached' + (exp.receiptName ? ' — ' + exp.receiptName : '') + '</span>' : '<span class="badge badge-neutral">Not Attached</span>') +
        '</div>' +
        (exp.notes ? '<div style="grid-column:1/-1;"><div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Notes</div><div style="font-size:13px; color:var(--text-2);">' + exp.notes + '</div></div>' : '') +
      '</div>';

    window.VerdeModal.confirm({
      title: 'Expense Details',
      body: body,
      confirmText: 'Close',
      confirmClass: 'btn-ghost',
      cancelText: 'Close',
      onConfirm: function () {}
    });
  };

  /* ── UPLOAD RECEIPT ── */
  window.uploadExpenseReceipt = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('exp-menu-' + id);
    if (menu) menu.style.display = 'none';

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    var body =
      '<div>' +
        '<p style="font-size:13px; color:var(--text-2); margin-bottom:16px;">Upload a receipt for <strong>' + exp.expenseId + ' — ' + exp.title + '</strong></p>' +
        '<label style="font-size:12px; font-weight:700; color:var(--text-3); display:block; margin-bottom:6px;">Select File (PDF, JPG, PNG)</label>' +
        '<input id="exp-upload-file" type="file" accept=".pdf,.jpg,.jpeg,.png" class="modal-table-input" style="padding:6px 12px;" />' +
        (exp.receiptAttached && exp.receiptName ? '<div style="font-size:11px; color:var(--text-3); margin-top:8px;">Currently: ' + exp.receiptName + '</div>' : '') +
      '</div>';

    window.VerdeModal.confirm({
      title: 'Upload Receipt',
      body: body,
      confirmText: 'Save Receipt',
      confirmClass: 'btn-primary',
      onConfirm: function () {
        var fileEl = document.getElementById('exp-upload-file');
        if (!fileEl || !fileEl.files || !fileEl.files[0]) {
          window.VerdeToast.error('Please select a file to upload.');
          return;
        }
        exp.receiptAttached = true;
        exp.receiptName = fileEl.files[0].name;
        saveExpenses();
        window.renderExpensesTable();
        window.VerdeToast.success('Receipt "' + exp.receiptName + '" attached to ' + exp.expenseId + '.');
      }
    });
  };

  /* ── UPDATE STATUS ── */
  window.updateExpenseStatus = function (id, status) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('exp-menu-' + id);
    if (menu) menu.style.display = 'none';

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    exp.status = status;
    saveExpenses();
    window.renderExpensesKPI();
    window.renderExpensesTable();
    window.refreshDashboardKPIs && window.refreshDashboardKPIs();
    window.VerdeToast.success(exp.expenseId + ' marked as ' + newStatus + '.');
  };

  /* ── DELETE EXPENSE ── */
  window.deleteExpense = function (id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('finance_delete')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var menu = document.getElementById('exp-menu-' + id);
    if (menu) menu.style.display = 'none';

    var exp = financeExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;

    window.VerdeModal.delete('Delete Expense', 'Are you sure you want to permanently delete <strong>' + exp.expenseId + ' — ' + exp.title + '</strong>? This action cannot be undone.', function () {
      financeExpenses = financeExpenses.filter(function (e) { return e.id !== id; });
      saveExpenses();
      window.renderExpensesKPI();
      window.renderExpensesTable();
      window.refreshDashboardKPIs && window.refreshDashboardKPIs();
      window.VerdeToast.success('Expense ' + exp.expenseId + ' deleted.');
    });
  };

  /* ── INIT ── */
  loadExpenses();
  console.log('Expense module initialized.');

})();

/* ==========================================================================
   VERDE OS — FINANCIAL REPORTS & ANALYTICS MODULE
   ========================================================================== */
(function () {
  'use strict';

  /* ── Helpers ── */
  function fmtMoney(n) { return '\u20b9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtDate(d) {
    if (!d) return '\u2014';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  /* ── Read all data from localStorage ── */
  function loadAll() {
    var invoices = [], expenses = [], payments = [];
    try { invoices = JSON.parse(localStorage.getItem('verde_finance_invoices') || '[]'); } catch (e) {}
    try { expenses = JSON.parse(localStorage.getItem('verde_finance_expenses') || '[]'); } catch (e) {}
    try { payments = JSON.parse(localStorage.getItem('verde_finance_payments') || '[]'); } catch (e) {}
    return { invoices: invoices, expenses: expenses, payments: payments };
  }

  /* ── Build unified transaction rows ── */
  function buildRows(data, filters) {
    var rows = [];
    var fromTs = filters.from ? new Date(filters.from).getTime() : null;
    var toTs   = filters.to   ? new Date(filters.to + 'T23:59:59').getTime() : null;
    function inRange(ds) {
      if (!ds) return true;
      var t = new Date(ds).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs   && t > toTs)   return false;
      return true;
    }
    var tf = filters.type || '', isf = filters.invStatus || '', psf = filters.payStatus || '';

    if (!tf || tf === 'Invoice') {
      data.invoices.forEach(function (inv) {
        if (!inRange(inv.issueDate)) return;
        if (isf && inv.status !== isf) return;
        rows.push({ date: inv.issueDate, type: 'Invoice', ref: inv.invoiceNumber, party: inv.clientName || '\u2014', amount: inv.total || 0, status: inv.status });
      });
    }
    if (!tf || tf === 'Expense') {
      data.expenses.forEach(function (exp) {
        if (!inRange(exp.date)) return;
        rows.push({ date: exp.date, type: 'Expense', ref: exp.expenseId, party: exp.vendor || '\u2014', amount: exp.total || 0, status: exp.status });
      });
    }
    if (!tf || tf === 'Payment') {
      data.payments.forEach(function (pay) {
        if (!inRange(pay.date)) return;
        if (psf && pay.status !== psf) return;
        rows.push({ date: pay.date, type: 'Payment (' + pay.type + ')', ref: pay.paymentId, party: pay.clientVendor || '\u2014', amount: pay.amount || 0, status: pay.status });
      });
    }
    rows.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return rows;
  }

  /* ── Badges ── */
  function statusColor(s) {
    var m = { 'Paid':'var(--success)','Completed':'var(--success)','Approved':'var(--info)','Sent':'var(--info)','Refunded':'var(--info)','Pending':'var(--warning)','Failed':'var(--danger)','Rejected':'var(--danger)','Overdue':'var(--danger)','Draft':'var(--text-3)','Partially Paid':'var(--warning)' };
    return m[s] || 'var(--text-3)';
  }
  function sBadge(s) { var c = statusColor(s); return '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;background:color-mix(in srgb,' + c + ' 15%,transparent);color:' + c + ';">' + s + '</span>'; }
  function tBadge(t) { var b = t.replace(/ \(.+\)/,''); var c = b==='Invoice'?'var(--primary)':b==='Expense'?'var(--danger)':'var(--text-2)'; return '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;background:color-mix(in srgb,' + c + ' 15%,transparent);color:' + c + ';">' + t + '</span>'; }

  /* ── Chart registry ── */
  var _charts = {};
  function destroyChart(k) { if (_charts[k]) { _charts[k].destroy(); _charts[k] = null; } }

  /* ── Monthly buckets (last 6 months) ── */
  function last6() {
    var labels = [], keys = [], now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'));
      labels.push(d.toLocaleDateString('en-IN', { month:'short', year:'2-digit' }));
    }
    return { labels: labels, keys: keys };
  }
  function sumByMonth(items, df, af, keys) {
    var s = {}; keys.forEach(function(k){ s[k]=0; });
    items.forEach(function(it){ var k=(it[df]||'').substring(0,7); if(s.hasOwnProperty(k)) s[k]+=(it[af]||0); });
    return keys.map(function(k){ return s[k]; });
  }

  /* ── Render all charts ── */
  function renderCharts(data) {
    var Ch = window.Chart; if (!Ch) return;
    var st = getComputedStyle(document.documentElement);
    var tc = (st.getPropertyValue('--text-2')||'').trim() || '#888';
    var gc = (st.getPropertyValue('--border')||'').trim() || '#ddd';
    var scaleOpts = { x:{ ticks:{color:tc,font:{size:11}}, grid:{color:gc} }, y:{ ticks:{color:tc,font:{size:11},callback:function(v){return '\u20b9'+Number(v).toLocaleString('en-IN');}}, grid:{color:gc} } };
    var legOpts = { labels:{ color:tc, font:{size:11,weight:'600'} } };
    var b = last6();

    // Bar: Revenue vs Expenses
    destroyChart('re');
    var paidInv = data.invoices.filter(function(i){return i.status==='Paid';});
    var nonRejExp = data.expenses.filter(function(e){return e.status!=='Rejected';});
    var rv = sumByMonth(paidInv,'issueDate','total',b.keys);
    var ev = sumByMonth(nonRejExp,'date','total',b.keys);
    var c1 = document.getElementById('rpt-chart-rev-exp');
    if (c1) _charts['re'] = new Ch(c1,{ type:'bar', data:{ labels:b.labels, datasets:[
      { label:'Revenue', data:rv, backgroundColor:'rgba(34,197,94,0.75)', borderColor:'#22c55e', borderWidth:1, borderRadius:4 },
      { label:'Expenses', data:ev, backgroundColor:'rgba(239,68,68,0.75)', borderColor:'#ef4444', borderWidth:1, borderRadius:4 }
    ]}, options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:legOpts }, scales:scaleOpts } });

    // Line: Monthly Profit
    destroyChart('pr');
    var pv = rv.map(function(r,i){return r-ev[i];});
    var c2 = document.getElementById('rpt-chart-profit');
    if (c2) _charts['pr'] = new Ch(c2,{ type:'line', data:{ labels:b.labels, datasets:[{
      label:'Net Profit', data:pv, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.15)',
      borderWidth:2, fill:true, tension:0.4, pointBackgroundColor:'#6366f1', pointRadius:4
    }]}, options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:legOpts }, scales:scaleOpts } });

    // Doughnut: Invoice Status
    destroyChart('is');
    var isl = ['Draft','Sent','Paid','Overdue','Partially Paid'];
    var isd = isl.map(function(s){return data.invoices.filter(function(i){return i.status===s;}).length;});
    var c3 = document.getElementById('rpt-chart-inv-status');
    if (c3) _charts['is'] = new Ch(c3,{ type:'doughnut', data:{ labels:isl, datasets:[{data:isd, backgroundColor:['#94a3b8','#6366f1','#22c55e','#ef4444','#f59e0b'], borderWidth:0}]},
      options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ position:'right', labels:{ color:tc, font:{size:11,weight:'600'}, padding:12 } } } } });

    // Doughnut: Payment Status
    destroyChart('ps');
    var psl = ['Pending','Completed','Failed','Refunded'];
    var psd = psl.map(function(s){return data.payments.filter(function(p){return p.status===s;}).length;});
    var c4 = document.getElementById('rpt-chart-pay-status');
    if (c4) _charts['ps'] = new Ch(c4,{ type:'doughnut', data:{ labels:psl, datasets:[{data:psd, backgroundColor:['#f59e0b','#22c55e','#ef4444','#6366f1'], borderWidth:0}]},
      options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ position:'right', labels:{ color:tc, font:{size:11,weight:'600'}, padding:12 } } } } });
  }

  /* ── Render KPIs ── */
  function renderKPIs(data) {
    var rev=0, exp=0, cin=0, cout=0;
    data.invoices.forEach(function(i){ if(i.status==='Paid') rev+=(i.total||0); });
    data.expenses.forEach(function(e){ if(e.status!=='Rejected') exp+=(e.total||0); });
    data.payments.forEach(function(p){ if(p.status==='Completed'){ if(p.type==='Invoice') cin+=(p.amount||0); else cout+=(p.amount||0); } });
    var profit = rev-exp, cash = cin-cout;
    var e1=document.getElementById('rpt-kpi-revenue'), e2=document.getElementById('rpt-kpi-expenses'), e3=document.getElementById('rpt-kpi-profit'), e4=document.getElementById('rpt-kpi-cash');
    if(e1) e1.textContent=fmtMoney(rev);
    if(e2) e2.textContent=fmtMoney(exp);
    if(e3){ e3.textContent=fmtMoney(profit); e3.style.color=profit>=0?'var(--success)':'var(--danger)'; }
    if(e4) e4.textContent=fmtMoney(cash);
  }

  /* ── Render Table ── */
  function renderTable(rows) {
    var tbody=document.getElementById('rpt-table-body');
    var cnt=document.getElementById('rpt-record-count');
    if(cnt) cnt.textContent=rows.length+' record'+(rows.length!==1?'s':'');
    if(!tbody) return;
    if(rows.length===0){ tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:48px 24px;color:var(--text-3);font-weight:600;">No records match the selected filters.</td></tr>'; return; }
    var html='';
    rows.forEach(function(r){
      html+='<tr>'+
        '<td style="white-space:nowrap;">'+fmtDate(r.date)+'</td>'+
        '<td>'+tBadge(r.type)+'</td>'+
        '<td style="font-weight:700;">'+r.ref+'</td>'+
        '<td style="color:var(--text-2);">'+r.party+'</td>'+
        '<td style="font-weight:800;">'+fmtMoney(r.amount)+'</td>'+
        '<td>'+sBadge(r.status)+'</td>'+
      '</tr>';
    });
    tbody.innerHTML=html;
  }

  /* ── Read Filters ── */
  function getFilters() {
    return { from:(document.getElementById('rpt-from')||{}).value||'', to:(document.getElementById('rpt-to')||{}).value||'',
      invStatus:(document.getElementById('rpt-inv-status')||{}).value||'', payStatus:(document.getElementById('rpt-pay-status')||{}).value||'',
      type:(document.getElementById('rpt-type')||{}).value||'' };
  }

  /* ── APPLY FILTERS ── */
  window.applyReportFilters = function () {
    var data = loadAll();
    var rows = buildRows(data, getFilters());
    renderKPIs(data);
    renderTable(rows);
    renderCharts(data);
  };

  /* ── CLEAR FILTERS ── */
  window.clearReportFilters = function () {
    ['rpt-from','rpt-to','rpt-inv-status','rpt-pay-status','rpt-type'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    window.applyReportFilters();
  };

  /* ── EXPORT MODAL ── */
  window.openDashboardExportModal = function () {
    var body = '<div style="display:flex; flex-direction:column; gap:16px;">' +
      '<div style="color:var(--text-2); font-size:14px;">Select a format to export your financial report:</div>' +
      '<div style="display:flex; gap:12px; justify-content:center;">' +
        '<button class="btn btn-primary" onclick="window.exportReportPDF(); document.querySelector(\'.modal-close-btn\').click();" style="flex:1;">&#x2193; PDF</button>' +
        '<button class="btn btn-ghost" onclick="window.exportReportExcel(); document.querySelector(\'.modal-close-btn\').click();" style="flex:1; border:1px solid var(--border);">&#x2193; Excel</button>' +
        '<button class="btn btn-ghost" onclick="window.exportReportCSV(); document.querySelector(\'.modal-close-btn\').click();" style="flex:1; border:1px solid var(--border);">&#x2193; CSV</button>' +
      '</div>' +
    '</div>';
    
    window.VerdeModal.confirm({
      title: 'Export Financial Report',
      body: body,
      confirmText: 'Done',
      cancelText: 'Cancel',
      onConfirm: function () {}
    });
  };

  /* ── EXPORT CSV ── */
  window.exportReportCSV = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var rows = buildRows(loadAll(), getFilters());
    var lines = ['Date,Type,Reference,Client/Vendor,Amount,Status'];
    rows.forEach(function(r){ lines.push([r.date,'"'+r.type+'"',r.ref,'"'+(r.party||'').replace(/"/g,'""')+'"',r.amount,r.status].join(',')); });
    var blob = new Blob([lines.join('\n')],{type:'text/csv'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='verde_report_'+new Date().toISOString().split('T')[0]+'.csv'; a.click(); URL.revokeObjectURL(a.href);
    window.VerdeToast && window.VerdeToast.success('CSV exported successfully.');
  };

  /* ── EXPORT EXCEL (TSV) ── */
  window.exportReportExcel = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var rows = buildRows(loadAll(), getFilters());
    var lines = ['Date\tType\tReference\tClient/Vendor\tAmount (INR)\tStatus'];
    rows.forEach(function(r){ lines.push([r.date,r.type,r.ref,r.party,r.amount,r.status].join('\t')); });
    var blob = new Blob(['\uFEFF'+lines.join('\n')],{type:'application/vnd.ms-excel;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='verde_report_'+new Date().toISOString().split('T')[0]+'.xls'; a.click(); URL.revokeObjectURL(a.href);
    window.VerdeToast && window.VerdeToast.success('Excel exported successfully.');
  };

  /* ── EXPORT PDF (print popup) ── */
  window.exportReportPDF = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var rows = buildRows(loadAll(), getFilters());
    var trs = rows.map(function(r){
      return '<tr style="border-bottom:1px solid #eee;"><td style="padding:6px 8px;">'+fmtDate(r.date)+'</td><td style="padding:6px 8px;">'+r.type+'</td><td style="padding:6px 8px;font-weight:700;">'+r.ref+'</td><td style="padding:6px 8px;">'+r.party+'</td><td style="padding:6px 8px;font-weight:800;text-align:right;">'+fmtMoney(r.amount)+'</td><td style="padding:6px 8px;">'+r.status+'</td></tr>';
    }).join('');
    var win=window.open('','_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VERDE OS \u2014 Financial Report</title><style>body{font-family:sans-serif;font-size:12px;color:#1e293b;padding:32px;}h1{font-size:20px;margin-bottom:4px;}p{color:#64748b;font-size:12px;margin-bottom:24px;}table{width:100%;border-collapse:collapse;}thead th{background:#f1f5f9;padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;}tr:nth-child(even){background:#f8fafc;}@media print{button{display:none!important;}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><h1>VERDE OS \u2014 Financial Report</h1><p>Generated: '+new Date().toLocaleString('en-IN')+'&nbsp;|&nbsp;'+rows.length+' records</p></div><button onclick="window.print()" style="padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Print / Save PDF</button></div><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Client / Vendor</th><th style="text-align:right;">Amount</th><th>Status</th></tr></thead><tbody>'+trs+'</tbody></table></body></html>');
    win.document.close();
  };

  console.log('Reports module initialized.');

})();