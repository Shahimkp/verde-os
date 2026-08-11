(function () {
  'use strict';

  // Format currency
  function fmtMoney(n) {
    return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  // Format date
  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  // Status Badge
  function statusBadge(status) {
    let clr = 'var(--text-3)';
    if (status === 'Running' || status === 'Published') clr = 'var(--success)';
    else if (status === 'Completed' || status === 'Scheduled') clr = 'var(--primary)';
    else if (status === 'Draft') clr = 'var(--warning)';
    else if (status === 'Paused' || status === 'Failed') clr = 'var(--danger)';

    return `<span style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;background:color-mix(in srgb,${clr} 15%,transparent);color:${clr};">${status}</span>`;
  }

  // ── DASHBOARD SYNCHRONIZATION ── //

  window.refreshDashboardData = function() {
    var total = marketingCampaigns.length;
    var active = 0, paused = 0, completed = 0;
    var totalBudget = 0;
    var totalPerf = 0, perfCount = 0;

    marketingCampaigns.forEach(function(c) {
      if (c.status === 'Running') active++;
      if (c.status === 'Paused') paused++;
      if (c.status === 'Completed') completed++;
      totalBudget += Number(c.budget || 0);

      if (!c.performance) {
        var hash = 0;
        for (var i = 0; i < c.id.length; i++) hash += c.id.charCodeAt(i);
        c.performance = 50 + (hash % 45); // deterministic 50-95
      }
      totalPerf += Number(c.performance);
      perfCount++;
    });

    var avgPerf = perfCount > 0 ? Math.round(totalPerf / perfCount) : 0;

    var elTotal = document.getElementById('dash-kpi-total');
    var elActive = document.getElementById('dash-kpi-active');
    var elPaused = document.getElementById('dash-kpi-paused');
    var elCompleted = document.getElementById('dash-kpi-completed');
    var elBudget = document.getElementById('dash-kpi-budget');
    var elPerf = document.getElementById('dash-kpi-performance');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elPaused) elPaused.textContent = paused;
    if (elCompleted) elCompleted.textContent = completed;
    if (elBudget) elBudget.textContent = fmtMoney(totalBudget);
    if (elPerf) elPerf.textContent = avgPerf + '%';

    window.renderRecentCampaigns();
    window.renderDashboardCharts();
  };

  window.renderRecentCampaigns = function() {
    var tbody = document.getElementById('mkt-campaigns-tbody');
    if (!tbody) return;

    var searchEl = document.getElementById('dash-camp-search');
    var statusEl = document.getElementById('dash-camp-status');
    var platEl = document.getElementById('dash-camp-platform');
    
    var q = searchEl ? searchEl.value.toLowerCase() : '';
    var fStat = statusEl ? statusEl.value : 'All';
    var fPlat = platEl ? platEl.value : 'All';

    var filtered = marketingCampaigns.filter(function(c) {
      var owner = 'Admin';
      var matchQ = !q || c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q) || c.status.toLowerCase().includes(q) || owner.toLowerCase().includes(q);
      var matchStat = fStat === 'All' || c.status === fStat;
      var matchPlat = fPlat === 'All' || c.platform === fPlat;
      return matchQ && matchStat && matchPlat;
    });

    filtered.sort(function(a, b) {
      var da = new Date(a.start).getTime() || 0;
      var db = new Date(b.start).getTime() || 0;
      if (db === da) return b.id.localeCompare(a.id);
      return db - da;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-3);">No campaigns available.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function(c) {
      html += '<tr>' +
        '<td style="font-weight:700; color:var(--text-1);">' + c.name + '</td>' +
        '<td style="color:var(--text-2); font-weight:500;">' + c.platform + '</td>' +
        '<td style="color:var(--text-2);">Admin</td>' +
        '<td style="font-weight:700;">' + fmtMoney(c.budget) + '</td>' +
        '<td>' + statusBadge(c.status) + '</td>' +
        '<td style="color:var(--text-3); font-size:12px;">' + fmtDate(c.start) + '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  };

  // Render Conversion Funnel
  function renderFunnel() {
    const funnelContainer = document.getElementById('mkt-funnel');
    if (!funnelContainer) return;

    const steps = [
      { label: 'Website Visitors', value: 145200, color: '#64748b' },
      { label: 'Engaged Sessions', value: 84000, color: '#3b82f6' },
      { label: 'Leads Captured', value: 1402, color: '#8b5cf6' },
      { label: 'Qualified Leads', value: 420, color: '#ec4899' },
      { label: 'Conversions', value: 85, color: '#22c55e' }
    ];

    const maxVal = steps[0].value;
    let html = '';
    steps.forEach(s => {
      const pct = Math.max((s.value / maxVal) * 100, 10);
      html += `
        <div class="mkt-funnel-step">
          <div class="mkt-funnel-label">${s.label}</div>
          <div class="mkt-funnel-bar-wrap">
            <div class="mkt-funnel-bar" style="width:${pct}%; background:${s.color};"></div>
          </div>
          <div class="mkt-funnel-count">${s.value.toLocaleString('en-IN')}</div>
        </div>
      `;
    });
    funnelContainer.innerHTML = html;
  }

  let _charts = [];
  window.renderDashboardCharts = function() {
    if (!window.Chart) return;
    _charts.forEach(function(c) { c.destroy(); });
    _charts = [];

    var section = document.getElementById('dash-charts-section');
    if (!section) return;

    if (marketingCampaigns.length === 0) {
      section.style.display = 'none';
      return;
    } else {
      section.style.display = 'block';
    }

    var style = getComputedStyle(document.documentElement);
    var tc = style.getPropertyValue('--text-2').trim() || '#888';
    var gc = style.getPropertyValue('--border').trim() || '#eee';
    
    var chartOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tc, font: { size: 11, weight: '600' } } } },
      scales: {
        x: { ticks: { color: tc, font: { size: 11 } }, grid: { color: gc } },
        y: { ticks: { color: tc, font: { size: 11 } }, grid: { color: gc } }
      }
    };

    var pieOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: tc, font: { size: 11, weight: '600' }, padding: 16 } }
      }
    };

    var platCount = {}, statCount = {}, monthBudget = {}, perfs = [];
    marketingCampaigns.forEach(function(c) {
      platCount[c.platform] = (platCount[c.platform] || 0) + 1;
      statCount[c.status] = (statCount[c.status] || 0) + 1;
      
      var m = new Date(c.start).toLocaleDateString('en-IN', { month: 'short' });
      if (m !== 'Invalid Date') {
        monthBudget[m] = (monthBudget[m] || 0) + Number(c.budget || 0);
      }
      perfs.push({ name: c.name, perf: c.performance });
    });

    var ctxPlat = document.getElementById('mkt-chart-platform');
    if (ctxPlat) {
      _charts.push(new Chart(ctxPlat, {
        type: 'doughnut',
        data: {
          labels: Object.keys(platCount),
          datasets: [{
            data: Object.values(platCount),
            backgroundColor: ['#3b82f6', '#0077b5', '#22c55e', '#ec4899', '#1877f2', '#f59e0b', '#8b5cf6'],
            borderWidth: 0
          }]
        },
        options: pieOpts
      }));
    }

    var ctxStat = document.getElementById('mkt-chart-status');
    if (ctxStat) {
      _charts.push(new Chart(ctxStat, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statCount),
          datasets: [{
            data: Object.values(statCount),
            backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: pieOpts
      }));
    }

    var ctxBud = document.getElementById('mkt-chart-budget');
    if (ctxBud) {
      _charts.push(new Chart(ctxBud, {
        type: 'bar',
        data: {
          labels: Object.keys(monthBudget),
          datasets: [{
            label: 'Budget (₹)',
            data: Object.values(monthBudget),
            backgroundColor: '#8b5cf6',
            borderRadius: 4
          }]
        },
        options: chartOpts
      }));
    }

    perfs.sort(function(a, b) { return b.perf - a.perf; });
    var topPerfs = perfs.slice(0, 5);
    var ctxPerf = document.getElementById('mkt-chart-performance');
    if (ctxPerf) {
      _charts.push(new Chart(ctxPerf, {
        type: 'bar',
        data: {
          labels: topPerfs.map(function(x) {
             var n = x.name;
             return n.length > 15 ? n.substring(0, 15) + '...' : n;
          }),
          datasets: [{
            label: 'Performance (%)',
            data: topPerfs.map(function(x) { return x.perf; }),
            backgroundColor: '#10b981',
            borderRadius: 4
          }]
        },
        options: chartOpts
      }));
    }
  };

  // ── CAMPAIGN MANAGEMENT LOGIC ── //

  var marketingCampaigns = [];

  function loadCampaigns() {
    var raw = localStorage.getItem('verde_marketing_campaigns');
    if (raw) {
      try { marketingCampaigns = JSON.parse(raw); } catch (e) { marketingCampaigns = []; }
    } else {
      // Seed initial data based on mock if empty
      marketingCampaigns = [
        { id: 'CMP-1001', name: 'Q4 Enterprise SaaS Targeting', objective: 'Lead Generation', platform: 'Google Ads', budget: 150000, start: '2023-10-01', end: '2023-12-31', targetAudience: 'B2B Enterprise', description: '', status: 'Running' },
        { id: 'CMP-1002', name: 'Product Update Walkthroughs', objective: 'Brand Awareness', platform: 'Instagram', budget: 45000, start: '2023-10-15', end: '2023-11-15', targetAudience: 'Current Users', description: '', status: 'Running' },
        { id: 'CMP-1003', name: 'B2B Networking Lead Gen', objective: 'Lead Generation', platform: 'LinkedIn', budget: 120000, start: '2023-11-01', end: '2023-11-30', targetAudience: 'C-Level Execs', description: '', status: 'Draft' }
      ];
      saveCampaigns();
    }
  }

  function saveCampaigns() {
    localStorage.setItem('verde_marketing_campaigns', JSON.stringify(marketingCampaigns));
    if (window.refreshDashboardData) window.refreshDashboardData();
    if (window.refreshAnalytics) window.refreshAnalytics();
  }

  function genCampId() {
    return 'CMP-' + Math.floor(1000 + Math.random() * 9000);
  }

  window.switchMarketingTab = function (tabId) {
    document.querySelectorAll('.mkt-main-tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.view-content').forEach(function (v) { v.classList.remove('active'); });

    var viewEl = document.getElementById('view-' + tabId);
    if (viewEl) viewEl.classList.add('active');

    document.querySelectorAll('.mkt-main-tab').forEach(function (t) {
      var txt = t.textContent.trim().toLowerCase();
      if (txt === tabId || (tabId === 'analytics' && txt.includes('analytics'))) {
        t.classList.add('active');
      }
    });

    if (tabId === 'campaigns') {
      refreshCampaignsKPIs();
      renderAllCampaigns();
    }
  };

  function refreshCampaignsKPIs() {
    var active = 0, draft = 0, completed = 0, budget = 0;
    marketingCampaigns.forEach(function (c) {
      if (c.status === 'Running') active++;
      if (c.status === 'Draft') draft++;
      if (c.status === 'Completed') completed++;
      budget += Number(c.budget || 0);
    });

    var eAct = document.getElementById('kpi-active-campaigns');
    var eDrf = document.getElementById('kpi-draft-campaigns');
    var eCmp = document.getElementById('kpi-completed-campaigns');
    var eBud = document.getElementById('kpi-total-budget');

    if (eAct) eAct.textContent = active;
    if (eDrf) eDrf.textContent = draft;
    if (eCmp) eCmp.textContent = completed;
    if (eBud) eBud.textContent = fmtMoney(budget);
  }

  /* ── Campaign Actions Menu (Global) ── */
  function getCampPortal() {
    var el = document.getElementById('camp-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'camp-action-portal';
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

  window.toggleCampMenu = function (id, btn) {
    var portal = getCampPortal();

    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var c = marketingCampaigns.find(function (x) { return x.id === id; });
    if (!c) return;

    portal.innerHTML = '';
    portal.appendChild(menuItem('View Campaign',    'var(--text-1)', false, function () { portal.style.display = 'none'; window.openViewCampaign(id); }));
    portal.appendChild(menuItem('Edit Campaign',    'var(--text-1)', false, function () { portal.style.display = 'none'; window.openEditCampaign(id); }));
    portal.appendChild(menuItem('Duplicate',        'var(--text-1)', false, function () { portal.style.display = 'none'; window.openDuplicateCampaign(id); }));
    portal.appendChild(menuDivider());

    if (c.status !== 'Running') {
      portal.appendChild(menuItem('Start Campaign', 'var(--success)', false, function () { portal.style.display = 'none'; window.changeCampaignStatus(id, 'Running'); }));
    }
    if (c.status === 'Running') {
      portal.appendChild(menuItem('Pause Campaign', 'var(--warning)', false, function () { portal.style.display = 'none'; window.changeCampaignStatus(id, 'Paused'); }));
    }
    if (c.status !== 'Completed') {
      portal.appendChild(menuItem('Complete Campaign', 'var(--primary)', false, function () { portal.style.display = 'none'; window.changeCampaignStatus(id, 'Completed'); }));
    }
    
    portal.appendChild(menuDivider());
    portal.appendChild(menuItem('Delete Campaign',  'var(--danger)', false, function () { portal.style.display = 'none'; window.deleteCampaign(id); }));

    var rect = btn.getBoundingClientRect();
    portal.style.display = 'block';
    portal.dataset.activeId = id;

    var portalH = portal.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow >= portalH ? rect.bottom + 4 : rect.top - portalH - 4;
    var right = window.innerWidth - rect.right;
    
    portal.style.top  = Math.max(8, top) + 'px';
    portal.style.right = Math.max(8, right) + 'px';
    portal.style.left = 'auto';

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

  window.renderAllCampaigns = function () {
    var tb = document.getElementById('mkt-all-campaigns-tbody');
    if (!tb) return;

    if (marketingCampaigns.length === 0) {
      tb.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:var(--text-3); font-weight:600;">No campaigns found.</td></tr>';
      return;
    }

    // Sort newest first based on start date
    var sorted = marketingCampaigns.slice().sort(function(a, b) {
      return new Date(b.start).getTime() - new Date(a.start).getTime();
    });

    var html = '';
    sorted.forEach(function (c) {
      var actDropdown = `<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window.toggleCampMenu('${c.id}', this)">⋯</button>`;

      html += `
        <tr>
          <td style="color:var(--text-3); font-size:12px; font-weight:600;">${c.id}</td>
          <td style="font-weight:700; color:var(--text-1);">${c.name}</td>
          <td style="color:var(--text-2); font-weight:500;">${c.platform}</td>
          <td style="color:var(--text-2);">${c.objective}</td>
          <td style="font-weight:700;">${fmtMoney(c.budget)}</td>
          <td style="color:var(--text-3); font-size:12px;">${fmtDate(c.start)}</td>
          <td style="color:var(--text-3); font-size:12px;">${fmtDate(c.end)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${actDropdown}</td>
        </tr>
      `;
    });
    tb.innerHTML = html;
  };


  function getCampaignFormHtml(c) {
    c = c || {};
    const platforms = ['Facebook', 'Instagram', 'Google Ads', 'LinkedIn', 'YouTube', 'X (Twitter)', 'Email'];
    let platOpts = '';
    platforms.forEach(p => platOpts += `<option value="${p}" ${c.platform===p?'selected':''}>${p}</option>`);

    return `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; text-align:left;">
        <div style="grid-column:1/-1;">
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Campaign Name</label>
          <input type="text" id="mkt-f-name" class="input" value="${c.name || ''}" placeholder="e.g. Q4 Enterprise Lead Gen" style="width:100%;">
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Objective</label>
          <input type="text" id="mkt-f-obj" class="input" value="${c.objective || ''}" placeholder="e.g. Lead Generation" style="width:100%;">
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Platform</label>
          <select id="mkt-f-plat" class="input" style="width:100%;">${platOpts}</select>
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Budget (₹)</label>
          <input type="number" id="mkt-f-bud" class="input" value="${c.budget || ''}" placeholder="0" style="width:100%;">
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Target Audience</label>
          <input type="text" id="mkt-f-aud" class="input" value="${c.targetAudience || ''}" placeholder="e.g. B2B Execs" style="width:100%;">
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Start Date</label>
          <input type="date" id="mkt-f-start" class="input" value="${c.start || ''}" style="width:100%;">
        </div>
        <div>
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">End Date</label>
          <input type="date" id="mkt-f-end" class="input" value="${c.end || ''}" style="width:100%;">
        </div>
        <div style="grid-column:1/-1;">
          <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-2);">Description</label>
          <textarea id="mkt-f-desc" class="input" style="width:100%; height:80px; resize:none;">${c.description || ''}</textarea>
        </div>
      </div>
    `;
  }

  function readCampaignForm() {
    return {
      name: document.getElementById('mkt-f-name').value.trim(),
      objective: document.getElementById('mkt-f-obj').value.trim(),
      platform: document.getElementById('mkt-f-plat').value,
      budget: Number(document.getElementById('mkt-f-bud').value) || 0,
      targetAudience: document.getElementById('mkt-f-aud').value.trim(),
      start: document.getElementById('mkt-f-start').value,
      end: document.getElementById('mkt-f-end').value,
      description: document.getElementById('mkt-f-desc').value.trim()
    };
  }

  window.openCreateCampaign = function () {
    window.VerdeModal.confirm({
      title: 'Create Campaign',
      body: getCampaignFormHtml(),
      confirmText: 'Create Campaign',
      onConfirm: function () {
        var d = readCampaignForm();
        if (!d.name) return false;
        d.id = genCampId();
        d.status = 'Draft';
        marketingCampaigns.push(d);
        saveCampaigns();
        refreshCampaignsKPIs();
        renderAllCampaigns();
      }
    });
  };

  window.openEditCampaign = function (id) {
    var c = marketingCampaigns.find(function(x) { return x.id === id; });
    if (!c) return;
    window.VerdeModal.confirm({
      title: 'Edit Campaign',
      body: getCampaignFormHtml(c),
      confirmText: 'Save Changes',
      onConfirm: function () {
        var d = readCampaignForm();
        if (!d.name) return false;
        c.name = d.name; c.objective = d.objective; c.platform = d.platform;
        c.budget = d.budget; c.targetAudience = d.targetAudience;
        c.start = d.start; c.end = d.end; c.description = d.description;
        saveCampaigns();
        refreshCampaignsKPIs();
        renderAllCampaigns();
      }
    });
  };

  window.openDuplicateCampaign = function (id) {
    var c = marketingCampaigns.find(function(x) { return x.id === id; });
    if (!c) return;
    var copy = JSON.parse(JSON.stringify(c));
    copy.name = copy.name + ' (Copy)';
    
    window.VerdeModal.confirm({
      title: 'Duplicate Campaign',
      body: getCampaignFormHtml(copy),
      confirmText: 'Create Duplicate',
      onConfirm: function () {
        var d = readCampaignForm();
        if (!d.name) return false;
        d.id = genCampId();
        d.status = 'Draft';
        marketingCampaigns.push(d);
        saveCampaigns();
        refreshCampaignsKPIs();
        renderAllCampaigns();
      }
    });
  };

  window.openViewCampaign = function (id) {
    var c = marketingCampaigns.find(function(x) { return x.id === id; });
    if (!c) return;
    var html = `
      <div style="text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
          <div>
            <div style="font-size:12px; color:var(--text-3); font-weight:600;">${c.id}</div>
            <div style="font-size:20px; font-weight:800; color:var(--text-1);">${c.name}</div>
          </div>
          <div>${statusBadge(c.status)}</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div><div style="font-size:12px; color:var(--text-3);">Platform</div><div style="font-weight:600;">${c.platform}</div></div>
          <div><div style="font-size:12px; color:var(--text-3);">Objective</div><div style="font-weight:600;">${c.objective}</div></div>
          <div><div style="font-size:12px; color:var(--text-3);">Budget</div><div style="font-weight:600;">${fmtMoney(c.budget)}</div></div>
          <div><div style="font-size:12px; color:var(--text-3);">Target Audience</div><div style="font-weight:600;">${c.targetAudience}</div></div>
          <div><div style="font-size:12px; color:var(--text-3);">Start Date</div><div style="font-weight:600;">${fmtDate(c.start)}</div></div>
          <div><div style="font-size:12px; color:var(--text-3);">End Date</div><div style="font-weight:600;">${fmtDate(c.end)}</div></div>
        </div>
        ${c.description ? `<div><div style="font-size:12px; color:var(--text-3);">Description</div><div style="font-weight:500; font-size:14px; background:var(--bg-2); padding:12px; border-radius:8px;">${c.description}</div></div>` : ''}
      </div>
    `;
    window.VerdeModal.confirm({
      title: 'Campaign Details',
      body: html,
      confirmText: 'Close',
      cancelText: '', // hide cancel
      onConfirm: function () {}
    });
  };

  window.changeCampaignStatus = function(id, newStatus) {
    var c = marketingCampaigns.find(function(x) { return x.id === id; });
    if (!c) return;
    window.VerdeModal.confirm({
      title: 'Change Status',
      body: '<p style="color:var(--text-2);">Are you sure you want to change the status of <strong>' + c.name + '</strong> to <strong>' + newStatus + '</strong>?</p>',
      confirmText: 'Confirm',
      onConfirm: function() {
        c.status = newStatus;
        saveCampaigns();
        refreshCampaignsKPIs();
        renderAllCampaigns();
      }
    });
  };

  window.deleteCampaign = function(id) {
    var c = marketingCampaigns.find(function(x) { return x.id === id; });
    if (!c) return;
    window.VerdeModal.confirm({
      title: 'Delete Campaign',
      body: '<p style="color:var(--text-2);">Are you sure you want to delete <strong>' + c.name + '</strong>? This action cannot be undone.</p>',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: function() {
        marketingCampaigns = marketingCampaigns.filter(function(x) { return x.id !== id; });
        saveCampaigns();
        refreshCampaignsKPIs();
        renderAllCampaigns();
      }
    });
  };

  // ── SOCIAL MEDIA SCHEDULER LOGIC ── //

  var marketingPosts = [];

  function loadPosts() {
    var raw = localStorage.getItem('verde_marketing_posts');
    if (raw) {
      try { marketingPosts = JSON.parse(raw); } catch (e) { marketingPosts = []; }
    } else {
      marketingPosts = [
        { id: 'POST-8001', campaignId: 'CMP-1001', platform: 'LinkedIn', title: 'Q4 Updates Post', caption: 'Here are the latest updates for Q4...', media: 'Q4_update.jpg', scheduledDate: '2023-10-05', scheduledTime: '09:00', status: 'Published' },
        { id: 'POST-8002', campaignId: 'CMP-1002', platform: 'Instagram', title: 'Feature Walkthrough', caption: 'Swipe left to see our new feature in action.', media: 'walkthrough.mp4', scheduledDate: '2023-11-15', scheduledTime: '15:30', status: 'Scheduled' },
        { id: 'POST-8003', campaignId: 'CMP-1003', platform: 'Facebook', title: 'Webinar Invite', caption: 'Join us for a webinar on B2B networking.', media: 'webinar_banner.png', scheduledDate: '2023-12-01', scheduledTime: '11:00', status: 'Draft' }
      ];
      savePosts();
    }
  }

  function savePosts() {
    localStorage.setItem('verde_marketing_posts', JSON.stringify(marketingPosts));
    if (window.refreshDashboardData) window.refreshDashboardData(); // Dashboard sync
    if (window.refreshAnalytics) window.refreshAnalytics();
  }

  function genPostId() {
    return 'POST-' + Math.floor(1000 + Math.random() * 9000);
  }

  // Hook tab switching for social
  var originalSwitchMarketingTab = window.switchMarketingTab;
  window.switchMarketingTab = function(tabId) {
    originalSwitchMarketingTab(tabId);
    if (tabId === 'social') {
      refreshPostsKPIs();
      renderAllPosts();
    }
    if (tabId === 'analytics') {
      if (window.refreshAnalytics) window.refreshAnalytics();
    }
  };

  function refreshPostsKPIs() {
    var scheduled = 0, published = 0, draft = 0, thisWeek = 0;
    var now = new Date();
    // Start of current day to ensure we don't exclude today's posts
    now.setHours(0, 0, 0, 0); 
    var nowTime = now.getTime();
    var weekForward = nowTime + (7 * 24 * 60 * 60 * 1000);
    
    marketingPosts.forEach(function(p) {
      if (p.status === 'Scheduled') scheduled++;
      if (p.status === 'Published') published++;
      if (p.status === 'Draft') draft++;

      var pDate = new Date(p.scheduledDate).getTime();
      if (pDate >= nowTime && pDate <= weekForward) {
        thisWeek++;
      }
    });

    var eSch = document.getElementById('kpi-sched-posts');
    var ePub = document.getElementById('kpi-pub-posts');
    var eDrf = document.getElementById('kpi-draft-posts');
    var eWek = document.getElementById('kpi-week-posts');

    if (eSch) eSch.textContent = scheduled;
    if (ePub) ePub.textContent = published;
    if (eDrf) eDrf.textContent = draft;
    if (eWek) eWek.textContent = thisWeek;
  }

  // Social Post Action Portal
  function getPostPortal() {
    var el = document.getElementById('post-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'post-action-portal';
      el.style.cssText = 'position:fixed; z-index:9999; display:none; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-md); min-width:180px; padding:4px 0;';
      document.body.appendChild(el);
    }
    return el;
  }

  window.togglePostMenu = function(id, btn) {
    var portal = getPostPortal();
    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var p = marketingPosts.find(function(x) { return x.id === id; });
    
    portal.innerHTML = '';
    portal.appendChild(menuItem('View Post', 'var(--text-1)', false, function() { portal.style.display = 'none'; window.viewPost(id); }));
    portal.appendChild(menuItem('Edit Post', 'var(--text-1)', false, function() { portal.style.display = 'none'; window.openEditPost(id); }));
    portal.appendChild(menuItem('Duplicate Post', 'var(--text-1)', false, function() { portal.style.display = 'none'; window.duplicatePost(id); }));
    
    if (p && (p.status === 'Draft' || p.status === 'Scheduled' || p.status === 'Failed')) {
       portal.appendChild(menuItem('Publish Now', 'var(--success)', false, function() { portal.style.display = 'none'; window.changePostStatus(id, 'Published'); }));
    }
    if (p && p.status === 'Scheduled') {
       portal.appendChild(menuItem('Cancel Schedule', 'var(--warning)', false, function() { portal.style.display = 'none'; window.changePostStatus(id, 'Draft'); }));
    }
    
    portal.appendChild(menuDivider());
    portal.appendChild(menuItem('Delete Post', 'var(--danger)', false, function() { portal.style.display = 'none'; window.deletePost(id); }));

    portal.style.display = 'block';
    portal.dataset.activeId = id;

    var rect = btn.getBoundingClientRect();
    var portalH = portal.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow >= portalH ? rect.bottom + 4 : rect.top - portalH - 4;
    var right = window.innerWidth - rect.right;
    
    portal.style.top = Math.max(8, top) + 'px';
    portal.style.right = Math.max(8, right) + 'px';
    portal.style.left = 'auto';

    setTimeout(function() {
      var hideFn = function(e) {
        if (!portal.contains(e.target) && e.target !== btn) {
          portal.style.display = 'none';
          portal.dataset.activeId = '';
          document.removeEventListener('click', hideFn);
        }
      };
      document.addEventListener('click', hideFn);
    }, 0);
  };

  window.handlePostMediaUpload = function(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('mkt-p-media').value = e.target.result;
      document.getElementById('mkt-p-filename').textContent = file.name;
      var preview = document.getElementById('mkt-p-preview');
      preview.style.display = 'block';
      var img = preview.querySelector('img');
      if (img) {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  function getCampaignOptions(selectedId) {
    var opts = '<option value="">-- Select Campaign --</option>';
    marketingCampaigns.forEach(function(c) {
      var sel = (c.id === selectedId) ? 'selected' : '';
      opts += '<option value="' + c.id + '" ' + sel + '>' + c.name + '</option>';
    });
    return opts;
  }

  function getPostFormHtml(post) {
    var p = post || {};
    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Campaign</label>
          <select id="mkt-p-camp" class="input">${getCampaignOptions(p.campaignId)}</select>
        </div>
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Platform</label>
          <select id="mkt-p-plat" class="input">
            <option value="Facebook" ${p.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
            <option value="Instagram" ${p.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
            <option value="LinkedIn" ${p.platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
            <option value="X (Twitter)" ${p.platform === 'X (Twitter)' ? 'selected' : ''}>X (Twitter)</option>
            <option value="YouTube" ${p.platform === 'YouTube' ? 'selected' : ''}>YouTube</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Post Title</label>
          <input type="text" id="mkt-p-title" class="input" placeholder="e.g. Weekly Update" value="${p.title || ''}" />
        </div>
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Caption</label>
          <textarea id="mkt-p-caption" class="input" style="height:80px;" placeholder="Post content...">${p.caption || ''}</textarea>
        </div>
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Media Upload</label>
          <input type="hidden" id="mkt-p-media" value="${p.media || ''}" />
          <div style="display:flex; align-items:center; gap:12px;">
            <button type="button" class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="document.getElementById('mkt-p-file').click()">Upload Image</button>
            <input type="file" id="mkt-p-file" accept=".jpg,.jpeg,.png,.webp" style="display:none;" onchange="window.handlePostMediaUpload(this)" />
            <span id="mkt-p-filename" style="font-size:12px; color:var(--text-3);">${p.media ? 'Image attached' : 'No file chosen'}</span>
          </div>
          <div id="mkt-p-preview" style="margin-top:12px; display:${p.media && p.media.startsWith('data:image') ? 'block' : 'none'};">
            <img src="${p.media && p.media.startsWith('data:image') ? p.media : ''}" style="max-width:100%; max-height:160px; border-radius:6px; border:1px solid var(--border); object-fit:contain;" />
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Scheduled Date</label>
            <input type="date" id="mkt-p-date" class="input" value="${p.scheduledDate || ''}" />
          </div>
          <div>
            <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Scheduled Time</label>
            <input type="time" id="mkt-p-time" class="input" value="${p.scheduledTime || ''}" />
          </div>
        </div>
        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Status</label>
          <select id="mkt-p-status" class="input">
            <option value="Draft" ${p.status === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Scheduled" ${p.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="Published" ${p.status === 'Published' ? 'selected' : ''}>Published</option>
            <option value="Failed" ${p.status === 'Failed' ? 'selected' : ''}>Failed</option>
          </select>
        </div>
      </div>
    `;
  }

  function readPostForm() {
    return {
      campaignId: document.getElementById('mkt-p-camp').value,
      platform: document.getElementById('mkt-p-plat').value,
      title: document.getElementById('mkt-p-title').value.trim(),
      caption: document.getElementById('mkt-p-caption').value.trim(),
      media: document.getElementById('mkt-p-media').value.trim(),
      scheduledDate: document.getElementById('mkt-p-date').value,
      scheduledTime: document.getElementById('mkt-p-time').value,
      status: document.getElementById('mkt-p-status').value
    };
  }

  window.openCreatePost = function() {
    window.VerdeModal.confirm({
      title: 'Create Post',
      body: getPostFormHtml(),
      confirmText: 'Schedule Post',
      onConfirm: function() {
        var d = readPostForm();
        if (!d.title) return false;
        d.id = genPostId();
        d.createdDate = new Date().toISOString().split('T')[0];
        d.lastUpdatedDate = d.createdDate;
        marketingPosts.push(d);
        savePosts();
        refreshPostsKPIs();
        renderAllPosts();
      }
    });
  };

  window.openEditPost = function(id) {
    var p = marketingPosts.find(function(x) { return x.id === id; });
    if (!p) return;
    window.VerdeModal.confirm({
      title: 'Edit Post',
      body: getPostFormHtml(p),
      confirmText: 'Save Changes',
      onConfirm: function() {
        var d = readPostForm();
        if (!d.title) return false;
        p.campaignId = d.campaignId; p.platform = d.platform; p.title = d.title;
        p.caption = d.caption; p.media = d.media; p.scheduledDate = d.scheduledDate;
        p.scheduledTime = d.scheduledTime; p.status = d.status;
        p.lastUpdatedDate = new Date().toISOString().split('T')[0];
        savePosts();
        refreshPostsKPIs();
        renderAllPosts();
      }
    });
  };

  window.viewPost = function(id) {
    var p = marketingPosts.find(function(x) { return x.id === id; });
    if (!p) return;
    var campName = 'None';
    var c = marketingCampaigns.find(function(x) { return x.id === p.campaignId; });
    if (c) campName = c.name;

    var html = `
      <div style="font-size:13px; color:var(--text-2); line-height:1.6; display:flex; flex-direction:column; gap:12px;">
        <div><strong>Post ID:</strong> ${p.id}</div>
        <div><strong>Campaign:</strong> ${campName}</div>
        <div><strong>Platform:</strong> ${p.platform}</div>
        <div><strong>Title:</strong> ${p.title}</div>
        <div><strong>Caption:</strong><br/>${p.caption || '<em>No caption</em>'}</div>
        <div><strong>Media:</strong><br/>${p.media && p.media.startsWith('data:image') ? `<img src="${p.media}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:8px; border:1px solid var(--border);" />` : (p.media || '<em>None</em>')}</div>
        <div><strong>Scheduled:</strong> ${fmtDate(p.scheduledDate)} at ${p.scheduledTime}</div>
        <div><strong>Status:</strong> ${statusBadge(p.status)}</div>
        <div><strong>Created:</strong> ${p.createdDate ? fmtDate(p.createdDate) : 'N/A'}</div>
        <div><strong>Last Updated:</strong> ${p.lastUpdatedDate ? fmtDate(p.lastUpdatedDate) : 'N/A'}</div>
      </div>
    `;
    window.VerdeModal.confirm({
      title: 'View Post',
      body: html,
      confirmText: 'Close',
      cancelText: '',
      onConfirm: function() {}
    });
  };

  window.duplicatePost = function(id) {
    var p = marketingPosts.find(function(x) { return x.id === id; });
    if (!p) return;
    var d = JSON.parse(JSON.stringify(p));
    d.id = genPostId();
    d.title = d.title + ' (Copy)';
    d.status = 'Draft';
    marketingPosts.push(d);
    savePosts();
    refreshPostsKPIs();
    renderAllPosts();
  };

  window.changePostStatus = function(id, newStatus) {
    var p = marketingPosts.find(function(x) { return x.id === id; });
    if (!p) return;
    window.VerdeModal.confirm({
      title: 'Change Status',
      body: '<p style="color:var(--text-2);">Are you sure you want to change the status of <strong>' + p.title + '</strong> to <strong>' + newStatus + '</strong>?</p>',
      confirmText: 'Confirm',
      onConfirm: function() {
        p.status = newStatus;
        savePosts();
        refreshPostsKPIs();
        renderAllPosts();
      }
    });
  };

  window.deletePost = function(id) {
    var p = marketingPosts.find(function(x) { return x.id === id; });
    if (!p) return;
    window.VerdeModal.confirm({
      title: 'Delete Post',
      body: '<p style="color:var(--text-2);">Are you sure you want to delete <strong>' + p.title + '</strong>? This action cannot be undone.</p>',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: function() {
        marketingPosts = marketingPosts.filter(function(x) { return x.id !== id; });
        savePosts();
        refreshPostsKPIs();
        renderAllPosts();
      }
    });
  };

  window.renderAllPosts = function() {
    var tbody = document.getElementById('mkt-all-posts-tbody');
    if (!tbody) return;
    if (marketingPosts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-3);">No scheduled posts available.</td></tr>';
      return;
    }
    
    // Sort newest scheduled first
    var sorted = marketingPosts.slice().sort(function(a, b) {
      var da = new Date(a.scheduledDate).getTime() || 0;
      var db = new Date(b.scheduledDate).getTime() || 0;
      return db - da;
    });

    var html = '';
    sorted.forEach(function(p) {
      var campName = 'None';
      var c = marketingCampaigns.find(function(x) { return x.id === p.campaignId; });
      if (c) campName = c.name;

      html += '<tr>' +
        '<td style="color:var(--text-3); font-size:12px;">' + p.id + '</td>' +
        '<td style="color:var(--text-2); font-weight:500;">' + campName + '</td>' +
        '<td style="color:var(--text-2); font-weight:500;">' + p.platform + '</td>' +
        '<td style="font-weight:700; color:var(--text-1);">' + p.title + '</td>' +
        '<td style="color:var(--text-3); font-size:12px;">' + fmtDate(p.scheduledDate) + '</td>' +
        '<td style="color:var(--text-3); font-size:12px;">' + p.scheduledTime + '</td>' +
        '<td>' + statusBadge(p.status) + '</td>' +
        '<td>' +
          '<button class="btn btn-ghost btn-icon" onclick="window.togglePostMenu(\'' + p.id + '\', this)">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>' +
          '</button>' +
        '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  };

  // ── ANALYTICS & REPORTS LOGIC ── //

  var chartCampStatus = null;
  var chartPostPlat = null;
  var chartCampMonthly = null;
  var chartPostTimeline = null;

  window.refreshAnalytics = function() {
    updateAnalyticsKPIs();
    renderAnalyticsCharts();
    window.renderReportsTable();
  };

  function updateAnalyticsKPIs() {
    var cTotal=0, cActive=0, cComp=0, cDraft=0;
    marketingCampaigns.forEach(function(c) {
      cTotal++;
      if(c.status==='Active') cActive++;
      if(c.status==='Completed') cComp++;
      if(c.status==='Draft') cDraft++;
    });

    var pDraft=0, pSched=0, pPub=0;
    var platCounts = {};
    marketingPosts.forEach(function(p) {
      if(p.status==='Draft') pDraft++;
      if(p.status==='Scheduled') pSched++;
      if(p.status==='Published') pPub++;

      if(!platCounts[p.platform]) platCounts[p.platform] = 0;
      platCounts[p.platform]++;
    });

    var eCT = document.getElementById('kpi-an-camp-total');
    var eCA = document.getElementById('kpi-an-camp-active');
    var eCC = document.getElementById('kpi-an-camp-comp');
    var eCD = document.getElementById('kpi-an-camp-draft');
    
    var ePD = document.getElementById('kpi-an-post-draft');
    var ePS = document.getElementById('kpi-an-post-sched');
    var ePP = document.getElementById('kpi-an-post-pub');

    if(eCT) eCT.textContent = cTotal;
    if(eCA) eCA.textContent = cActive;
    if(eCC) eCC.textContent = cComp;
    if(eCD) eCD.textContent = cDraft;

    if(ePD) ePD.textContent = pDraft;
    if(ePS) ePS.textContent = pSched;
    if(ePP) ePP.textContent = pPub;

    var pBreakdown = document.getElementById('kpi-an-plat-breakdown');
    if(pBreakdown) {
      var html = '';
      Object.keys(platCounts).sort((a,b)=>platCounts[b]-platCounts[a]).forEach(function(k) {
        html += '<div style="display:flex; justify-content:space-between;"><span>' + k + '</span><strong>' + platCounts[k] + '</strong></div>';
      });
      if(html === '') html = '<em>No posts available</em>';
      pBreakdown.innerHTML = html;
    }
  }

  function renderAnalyticsCharts() {
    if (!window.Chart) return;

    var styleStyle = getComputedStyle(document.documentElement);
    var primary = styleStyle.getPropertyValue('--primary').trim() || '#3b82f6';
    var success = styleStyle.getPropertyValue('--success').trim() || '#10b981';
    var warning = styleStyle.getPropertyValue('--warning').trim() || '#f59e0b';
    var danger = styleStyle.getPropertyValue('--danger').trim() || '#ef4444';
    var text2 = styleStyle.getPropertyValue('--text-2').trim() || '#64748b';
    var border = styleStyle.getPropertyValue('--border').trim() || '#e2e8f0';

    // 1. Campaign Status Distribution (Pie)
    var cStData = { Draft:0, Active:0, Paused:0, Completed:0 };
    marketingCampaigns.forEach(function(c) {
      if(cStData[c.status]!==undefined) cStData[c.status]++;
    });
    var ctx1 = document.getElementById('mkt-chart-camp-status');
    if(ctx1) {
      if(chartCampStatus) chartCampStatus.destroy();
      chartCampStatus = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Draft', 'Active', 'Paused', 'Completed'],
          datasets: [{
            data: [cStData.Draft, cStData.Active, cStData.Paused, cStData.Completed],
            backgroundColor: [warning, success, danger, primary],
            borderWidth: 0
          }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{color:text2, font:{size:11}} } } }
      });
    }

    // 2. Posts by Platform (Bar)
    var pPlat = {};
    marketingPosts.forEach(function(p) {
      if(!pPlat[p.platform]) pPlat[p.platform] = 0;
      pPlat[p.platform]++;
    });
    var labels2 = Object.keys(pPlat);
    var data2 = Object.values(pPlat);
    var ctx2 = document.getElementById('mkt-chart-post-plat');
    if(ctx2) {
      if(chartPostPlat) chartPostPlat.destroy();
      chartPostPlat = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels2,
          datasets: [{
            label: 'Total Posts',
            data: data2,
            backgroundColor: primary,
            borderRadius: 4
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: { legend: { display:false } },
          scales: {
            x: { grid: { display:false }, ticks: { color:text2, font:{size:11} } },
            y: { grid: { color:border }, ticks: { color:text2, font:{size:11}, stepSize:1 } }
          }
        }
      });
    }

    // 3. Monthly Campaign Creation (Line)
    var months = {};
    marketingCampaigns.forEach(function(c) {
      if(c.startDate) {
        var ym = c.startDate.substring(0,7);
        if(!months[ym]) months[ym]=0;
        months[ym]++;
      }
    });
    var labels3 = Object.keys(months).sort();
    var data3 = labels3.map(function(k) { return months[k]; });
    var ctx3 = document.getElementById('mkt-chart-camp-monthly');
    if(ctx3) {
      if(chartCampMonthly) chartCampMonthly.destroy();
      chartCampMonthly = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: labels3,
          datasets: [{
            label: 'Campaigns Created',
            data: data3,
            borderColor: success,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: { legend: { display:false } },
          scales: {
            x: { grid: { display:false }, ticks: { color:text2, font:{size:11} } },
            y: { grid: { color:border }, ticks: { color:text2, font:{size:11}, stepSize:1 } }
          }
        }
      });
    }

    // 4. Publishing Timeline (Bar)
    var pDates = {};
    marketingPosts.forEach(function(p) {
      if(p.scheduledDate) {
        if(!pDates[p.scheduledDate]) pDates[p.scheduledDate]=0;
        pDates[p.scheduledDate]++;
      }
    });
    var labels4 = Object.keys(pDates).sort();
    var data4 = labels4.map(function(k) { return pDates[k]; });
    var ctx4 = document.getElementById('mkt-chart-post-timeline');
    if(ctx4) {
      if(chartPostTimeline) chartPostTimeline.destroy();
      chartPostTimeline = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: labels4,
          datasets: [{
            label: 'Posts Scheduled',
            data: data4,
            backgroundColor: warning,
            borderRadius: 4
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: { legend: { display:false } },
          scales: {
            x: { grid: { display:false }, ticks: { color:text2, font:{size:11} } },
            y: { grid: { color:border }, ticks: { color:text2, font:{size:11}, stepSize:1 } }
          }
        }
      });
    }
  }

  window.renderReportsTable = function() {
    var type = document.getElementById('mkt-an-report-type').value;
    var search = document.getElementById('mkt-an-search').value.toLowerCase();
    var platFilter = document.getElementById('mkt-an-plat-filter').value;
    var statFilter = document.getElementById('mkt-an-stat-filter').value;
    var dateFilter = document.getElementById('mkt-an-date-filter').value;

    var thead = document.getElementById('mkt-an-report-thead');
    var tbody = document.getElementById('mkt-an-report-tbody');
    if(!thead || !tbody) return;

    var htmlTh = '';
    var htmlTb = '';

    if (type === 'campaign') {
      htmlTh = '<tr><th>ID</th><th>Campaign Name</th><th>Platform</th><th>Budget</th><th>Start Date</th><th>Status</th></tr>';
      marketingCampaigns.forEach(function(c) {
        if(search && !(c.name.toLowerCase().includes(search) || c.id.toLowerCase().includes(search))) return;
        if(platFilter !== 'All' && c.platform !== platFilter) return;
        if(statFilter !== 'All' && c.status !== statFilter) return;
        if(dateFilter && c.startDate < dateFilter) return;

        htmlTb += '<tr>' +
          '<td style="color:var(--text-3); font-size:12px;">' + c.id + '</td>' +
          '<td style="font-weight:600; color:var(--text-1);">' + c.name + '</td>' +
          '<td>' + c.platform + '</td>' +
          '<td>₹' + c.budget + '</td>' +
          '<td style="color:var(--text-3); font-size:12px;">' + fmtDate(c.startDate) + '</td>' +
          '<td>' + statusBadge(c.status) + '</td>' +
          '</tr>';
      });
    } else if (type === 'post') {
      htmlTh = '<tr><th>ID</th><th>Post Title</th><th>Campaign</th><th>Platform</th><th>Scheduled</th><th>Status</th></tr>';
      marketingPosts.forEach(function(p) {
        var c = marketingCampaigns.find(function(x) { return x.id === p.campaignId; });
        var cName = c ? c.name : 'None';
        if(search && !(p.title.toLowerCase().includes(search) || p.id.toLowerCase().includes(search))) return;
        if(platFilter !== 'All' && p.platform !== platFilter) return;
        if(statFilter !== 'All' && p.status !== statFilter) return;
        if(dateFilter && p.scheduledDate < dateFilter) return;

        htmlTb += '<tr>' +
          '<td style="color:var(--text-3); font-size:12px;">' + p.id + '</td>' +
          '<td style="font-weight:600; color:var(--text-1);">' + p.title + '</td>' +
          '<td style="color:var(--text-2);">' + cName + '</td>' +
          '<td>' + p.platform + '</td>' +
          '<td style="color:var(--text-3); font-size:12px;">' + fmtDate(p.scheduledDate) + '</td>' +
          '<td>' + statusBadge(p.status) + '</td>' +
          '</tr>';
      });
    } else if (type === 'platform') {
      htmlTh = '<tr><th>Platform</th><th>Total Campaigns</th><th>Total Posts</th><th>Active Campaigns</th><th>Published Posts</th></tr>';
      var platStats = {};
      var platforms = ['Facebook', 'Instagram', 'LinkedIn', 'X (Twitter)', 'YouTube'];
      platforms.forEach(function(pl) { platStats[pl] = { cTot:0, pTot:0, cAct:0, pPub:0 }; });
      
      marketingCampaigns.forEach(function(c) {
        if(platStats[c.platform]) {
          platStats[c.platform].cTot++;
          if(c.status==='Active') platStats[c.platform].cAct++;
        }
      });
      marketingPosts.forEach(function(p) {
        if(platStats[p.platform]) {
          platStats[p.platform].pTot++;
          if(p.status==='Published') platStats[p.platform].pPub++;
        }
      });

      platforms.forEach(function(pl) {
        if(search && !pl.toLowerCase().includes(search)) return;
        if(platFilter !== 'All' && pl !== platFilter) return;
        var s = platStats[pl];
        htmlTb += '<tr>' +
          '<td style="font-weight:600; color:var(--text-1);">' + pl + '</td>' +
          '<td>' + s.cTot + '</td>' +
          '<td>' + s.pTot + '</td>' +
          '<td>' + s.cAct + '</td>' +
          '<td>' + s.pPub + '</td>' +
          '</tr>';
      });
    } else if (type === 'status') {
      htmlTh = '<tr><th>Status</th><th>Campaign Count</th><th>Post Count</th></tr>';
      var statStats = { 'Draft':{c:0,p:0}, 'Active':{c:0,p:0}, 'Paused':{c:0,p:0}, 'Completed':{c:0,p:0}, 'Scheduled':{c:0,p:0}, 'Published':{c:0,p:0}, 'Failed':{c:0,p:0} };
      marketingCampaigns.forEach(function(c) { if(statStats[c.status]) statStats[c.status].c++; });
      marketingPosts.forEach(function(p) { if(statStats[p.status]) statStats[p.status].p++; });
      
      Object.keys(statStats).forEach(function(st) {
        if(search && !st.toLowerCase().includes(search)) return;
        if(statFilter !== 'All' && st !== statFilter) return;
        var s = statStats[st];
        if(s.c === 0 && s.p === 0) return; // Hide zeros
        htmlTb += '<tr>' +
          '<td style="font-weight:600; color:var(--text-1);">' + statusBadge(st) + '</td>' +
          '<td>' + s.c + '</td>' +
          '<td>' + s.p + '</td>' +
          '</tr>';
      });
    }

    if(htmlTb === '') {
      htmlTb = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-3);">No records found.</td></tr>';
    }
    
    thead.innerHTML = htmlTh;
    tbody.innerHTML = htmlTb;
  };

  // ── EXPORT UTILITIES ── //
  window.exportAnalyticsCSV = function() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var thead = document.getElementById('mkt-an-report-thead');
    var tbody = document.getElementById('mkt-an-report-tbody');
    var csv = [];
    
    var headers = [];
    var ths = thead.querySelectorAll('th');
    ths.forEach(function(th) { headers.push('"' + th.innerText.replace(/"/g, '""') + '"'); });
    if(headers.length > 0) csv.push(headers.join(','));

    var trs = tbody.querySelectorAll('tr');
    trs.forEach(function(tr) {
      var row = [];
      var tds = tr.querySelectorAll('td');
      if(tds.length === 1 && tds[0].colSpan > 1) return; // empty state
      tds.forEach(function(td) {
        row.push('"' + td.innerText.replace(/"/g, '""') + '"');
      });
      csv.push(row.join(','));
    });

    var csvFile = new Blob([csv.join('\\n')], {type: 'text/csv'});
    var link = document.createElement('a');
    link.href = URL.createObjectURL(csvFile);
    link.download = 'Marketing_Analytics_Report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.exportAnalyticsJSON = function() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    var type = document.getElementById('mkt-an-report-type').value;
    var data = [];
    if(type === 'campaign') {
      data = marketingCampaigns;
    } else if (type === 'post') {
      data = marketingPosts;
    } else {
      data = { campaigns: marketingCampaigns, posts: marketingPosts };
    }
    
    var jsonFile = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    var link = document.createElement('a');
    link.href = URL.createObjectURL(jsonFile);
    link.download = 'Marketing_Analytics_Report.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.exportSummaryReport = function() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('reports_export')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    window.print(); // Easy summary report export for UI bounds
  };

  // Initialize

  function initMarketing() {
    loadCampaigns();
    loadPosts();
    renderFunnel(); // Dashboard widget
    
    // Auto-sync if on campaigns tab
    refreshCampaignsKPIs();
    renderAllCampaigns();

    // Use timeout to ensure Chart.js script is fully evaluated and canvas layout is settled
    setTimeout(function() {
      if (window.refreshDashboardData) window.refreshDashboardData();
    }, 100);
  }

  // Attach quick actions to generic alerts for now
  document.addEventListener('DOMContentLoaded', () => {
    ['qa-new-campaign', 'qa-create-ad', 'qa-schedule-post', 'qa-export'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'qa-new-campaign') {
          el.addEventListener('click', () => {
            window.switchMarketingTab('campaigns');
            window.openCreateCampaign();
          });
        } else {
          el.addEventListener('click', () => alert(el.textContent.trim() + ' coming soon.'));
        }
      }
    });
  });

  // Call immediately, assuming script is loaded at bottom of page
  initMarketing();

  console.log('Marketing module initialized.');

})();
