(function () {
'use strict';
/* ==========================================================================
   VERDE OS — FINANCE WORKSPACE CONTROLLER
   ========================================================================== */

window.openModal = function (modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
};

window.closeModal = function (modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
};

window.navigate = navigate;

function formatMoney(num) { return '₹' + num.toLocaleString('en-IN'); }

let state = {
  invoices: [
    { id: 'INV-26-081', client: 'Nova Corp', desc: 'ERP Phase 1 Advance', amt: 15000, paid: 15000, date: '2026-10-15', status: 'Paid' },
    { id: 'INV-26-082', client: 'Pinnacle Health', desc: 'AI Model Integration', amt: 25000, paid: 10000, date: '2026-10-20', status: 'Partially Paid' },
    { id: 'INV-26-083', client: 'Echo Systems', desc: 'Website Final Handover', amt: 6000, paid: 0, date: '2026-10-25', status: 'Pending' },
  ],
  quotations: [
    { id: 'QT-26-101', client: 'GreenLeaf Organics', desc: 'E-Commerce Platform', amt: 18000, status: 'Accepted' },
    { id: 'QT-26-102', client: 'BlueWave Logistics', desc: 'Logistics Dashboard', amt: 22000, status: 'Sent' },
    { id: 'QT-26-103', client: 'Vertex AI', desc: 'Data Analytics Tool', amt: 35000, status: 'Draft' },
  ],
  expenses: [
    { id: 'EXP-1', date: '2026-10-01', vendor: 'Amazon Web Services', cat: 'Software', method: 'Corp Card', amt: 850.00 },
    { id: 'EXP-2', date: '2026-10-05', vendor: 'Google Ads', cat: 'Marketing', method: 'Corp Card', amt: 1200.00 },
    { id: 'EXP-3', date: '2026-10-15', vendor: 'WeWork', cat: 'Office', method: 'Bank Transfer', amt: 4500.00 },
  ],
  historicalData: [
    { month: 'May', rev: 42000, exp: 12000 },
    { month: 'Jun', rev: 55000, exp: 14000 },
    { month: 'Jul', rev: 48000, exp: 13500 },
    { month: 'Aug', rev: 68000, exp: 15000 },
    { month: 'Sep', rev: 72000, exp: 16000 },
    { month: 'Oct', rev: 85000, exp: 18000 }
  ]
};

/* ── ROUTER ── */
function navigate(view) {
  document.querySelectorAll('.route').forEach(r => r.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const routeEl = document.getElementById(`route-${view}`);
  if(routeEl) routeEl.classList.add('active');

  const navMap = { 'dashboard':0, 'quotations':1, 'invoices':2, 'expenses':4, 'analytics':5 };
  if(navMap[view] !== undefined) document.querySelectorAll('.nav-item')[navMap[view]].classList.add('active');

  const titleMap = {
    'dashboard': 'Finance Dashboard', 'quotations': 'Quotations Manager',
    'invoices': 'Invoices Ledger', 'expenses': 'Company Expenses',
    'analytics': 'Revenue Analytics'
  };
  
  if(titleMap[view]) document.getElementById('topNavTitle').textContent = titleMap[view];

  // Specific Actions
  if(view === 'invoices') document.getElementById('topNavActions').innerHTML = `<button class="btn btn-p" onclick="openModal('modal-new-invoice')">+ Generate Invoice</button>`;
  else if(view === 'expenses') document.getElementById('topNavActions').innerHTML = `<button class="btn btn-p" onclick="openModal('modal-new-exp')">+ Record Expense</button>`;
  else if(view === 'dashboard') document.getElementById('topNavActions').innerHTML = `<button class="btn btn-s">Download Report</button><button class="btn btn-p" onclick="openModal('modal-new-invoice')">+ Generate Invoice</button>`;
  else document.getElementById('topNavActions').innerHTML = '';

  if (view === 'dashboard') renderDashboard();
  else if (view === 'invoices') renderInvoices();
  else if (view === 'quotations') renderQuotations();
  else if (view === 'expenses') renderExpenses();
  else if (view === 'analytics') renderAnalytics();
}

/* ── RENDER FUNCTIONS ── */

function getStatusBadge(status) {
  let c = 'sb-warning';
  if(status === 'Paid' || status === 'Accepted') c = 'sb-success';
  if(status === 'Sent' || status === 'Partially Paid') c = 'sb-primary';
  if(status === 'Overdue') c = 'sb-danger';
  if(status === 'Draft') c = ''; // default bg
  return `<span class="status-badge ${c}">${status}</span>`;
}

function renderDashboard() {
  const rev = state.invoices.reduce((acc, i) => acc + i.paid, 0);
  const out = state.invoices.reduce((acc, i) => acc + (i.amt - i.paid), 0);
  const exp = state.expenses.reduce((acc, e) => acc + e.amt, 0);
  const profit = rev - exp;

  document.getElementById('dash-rev').textContent = formatMoney(rev);
  document.getElementById('dash-exp').textContent = formatMoney(exp);
  document.getElementById('dash-profit').textContent = formatMoney(profit);
  document.getElementById('dash-out').textContent = formatMoney(out);

  // Recent Transactions (Mix of Invoices Paid and Expenses)
  let txs = [];
  state.invoices.filter(i=>i.paid>0).forEach(i => txs.push({ date: i.date, desc: `Payment from ${i.client}`, type: 'Income', amt: i.paid }));
  state.expenses.forEach(e => txs.push({ date: e.date, desc: e.vendor, type: 'Expense', amt: e.amt }));
  
  txs.sort((a,b) => new Date(b.date) - new Date(a.date));

  document.getElementById('dash-tx-table').innerHTML = txs.slice(0,5).map(tx => `
    <tr>
      <td style="color:var(--text-2)">${tx.date}</td>
      <td style="font-weight:600">${tx.desc}</td>
      <td>${tx.type === 'Income' ? '<span class="status-badge sb-success">Income</span>' : '<span class="status-badge" style="background:var(--border)">Expense</span>'}</td>
      <td class="${tx.type==='Income' ? 'amt-green' : 'amt-red'}">${tx.type==='Income' ? '+' : '-'}${formatMoney(tx.amt)}</td>
      <td><span class="status-badge sb-success">Completed</span></td>
    </tr>
  `).join('');

  // Right sidebar
  document.getElementById('rs-tx-list').innerHTML = txs.slice(0,4).map(tx => `
    <div class="rs-item">
      <div class="rs-i-head">${tx.desc} <span class="rs-i-time">${tx.date}</span></div>
      <div class="rs-i-desc ${tx.type==='Income' ? 'amt-green' : 'amt-red'}">${tx.type==='Income' ? '+' : '-'}${formatMoney(tx.amt)}</div>
    </div>
  `).join('');
}

function renderInvoices() {
  document.getElementById('invoices-table').innerHTML = state.invoices.map(i => `
    <tr>
      <td style="font-weight:700;">${i.id}</td>
      <td><div style="font-weight:600">${i.client}</div><div style="font-size:11px;color:var(--text-3)">${i.desc}</div></td>
      <td style="color:var(--text-2)">${i.date}</td>
      <td style="font-weight:700;">${formatMoney(i.amt)}</td>
      <td style="color:var(--danger); font-weight:600">${i.amt - i.paid > 0 ? formatMoney(i.amt - i.paid) : '-'}</td>
      <td>${getStatusBadge(i.status)}</td>
      <td><button class="btn btn-ghost" style="font-size:11px;">View PDF</button></td>
    </tr>
  `).join('');
}

function renderQuotations() {
  document.getElementById('quotations-table').innerHTML = state.quotations.map(q => `
    <tr>
      <td style="font-weight:700;">${q.id}</td>
      <td><div style="font-weight:600">${q.client}</div></td>
      <td style="color:var(--text-2)">${q.desc}</td>
      <td style="font-weight:700;">${formatMoney(q.amt)}</td>
      <td>${getStatusBadge(q.status)}</td>
      <td>
        ${q.status === 'Accepted' 
          ? `<button class="btn btn-ghost" style="font-size:11px; color:var(--primary)">Convert to Inv</button>` 
          : `<button class="btn btn-ghost" style="font-size:11px;">Edit</button>`}
      </td>
    </tr>
  `).join('');
}

function renderExpenses() {
  document.getElementById('exp-table').innerHTML = state.expenses.map(e => `
    <tr>
      <td style="color:var(--text-2)">${e.date}</td>
      <td><div style="font-weight:600">${e.vendor}</div></td>
      <td><span style="font-size:11px; background:var(--bg-2); border:1px solid var(--border); padding:2px 8px; border-radius:var(--r-sm);">${e.cat}</span></td>
      <td style="color:var(--text-2)">${e.method}</td>
      <td class="amt-red">-${formatMoney(e.amt)}</td>
    </tr>
  `).join('');
}

function renderAnalytics() {
  const maxRev = Math.max(...state.historicalData.map(d => d.rev));
  
  // Custom CSS Bar Chart for Revenue
  document.getElementById('chart-rev').innerHTML = state.historicalData.map(d => {
    const heightPct = (d.rev / maxRev) * 100;
    return `
      <div class="bar-col">
        <div class="bar" style="height:${heightPct}%">
          <div class="bar-val">${formatMoney(d.rev)}</div>
        </div>
        <div class="bar-label">${d.month}</div>
      </div>
    `;
  }).join('');

  // Profit Margin Trend
  document.getElementById('chart-profit').innerHTML = state.historicalData.map(d => {
    const profit = d.rev - d.exp;
    const heightPct = (profit / maxRev) * 100;
    return `
      <div class="bar-col">
        <div class="bar" style="height:${heightPct}%; background:var(--success)">
          <div class="bar-val">${formatMoney(profit)}</div>
        </div>
        <div class="bar-label">${d.month}</div>
      </div>
    `;
  }).join('');

  // Expense Trend
  document.getElementById('chart-exp').innerHTML = state.historicalData.map(d => {
    const heightPct = (d.exp / (maxRev/2)) * 100; // scaled for visibility
    return `
      <div class="bar-col">
        <div class="bar" style="height:${heightPct}%; background:var(--danger)">
          <div class="bar-val">${formatMoney(d.exp)}</div>
        </div>
        <div class="bar-label">${d.month}</div>
      </div>
    `;
  }).join('');
}

/* ── MODALS & ACTIONS ── */
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function createInvoice() {
  const client = document.getElementById('ni-client').value;
  const desc = document.getElementById('ni-desc').value;
  const amt = parseFloat(document.getElementById('ni-amt').value);
  const date = document.getElementById('ni-date').value || new Date().toISOString().split('T')[0];

  if(!desc || !amt) return alert('Description and Amount required.');

  state.invoices.push({
    id: 'INV-26-0' + (84 + state.invoices.length),
    client, desc, amt, paid: 0, date, status: 'Pending'
  });

  closeModal('modal-new-invoice');
  if(document.getElementById('route-invoices').classList.contains('active')) renderInvoices();
  if(document.getElementById('route-dashboard').classList.contains('active')) renderDashboard();
  
  // Clear
  document.getElementById('ni-desc').value = '';
  document.getElementById('ni-amt').value = '';
}

function recordExpense() {
  const vendor = document.getElementById('ne-vendor').value;
  const amt = parseFloat(document.getElementById('ne-amt').value);
  
  if(!vendor || !amt) return alert('Vendor and Amount required.');

  state.expenses.push({
    id: 'EXP-' + (4 + state.expenses.length),
    date: document.getElementById('ne-date').value || new Date().toISOString().split('T')[0],
    vendor,
    cat: document.getElementById('ne-cat').value,
    method: document.getElementById('ne-method').value,
    amt
  });

  closeModal('modal-new-exp');
  if(document.getElementById('route-expenses').classList.contains('active')) renderExpenses();
  if(document.getElementById('route-dashboard').classList.contains('active')) renderDashboard();

  // Clear
  document.getElementById('ne-vendor').value = '';
  document.getElementById('ne-amt').value = '';
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { navigate('dashboard'); });
} else {
  navigate('dashboard');
}
})();