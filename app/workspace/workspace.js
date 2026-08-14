/* ==========================================================================
   VERDE OS — WORKSPACE MODULE CONTROLLER
   Full Functional Implementation — Zero UI Changes
   ========================================================================== */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     1. DEFAULT MOCK DATA
     ══════════════════════════════════════════════════════════════════════════ */

  var DEFAULTS = {
    profile: {
      name: 'VERDE LABS',
      industry: 'Software & AI Solutions',
      website: 'www.verdelabs.co',
      email: 'hello@verdelabs.co',
      phone: '+1 (555) 019-2026',
      address: 'San Francisco, CA',
      registration: 'INC-1984729',
      logo: ''
    },
    departments: [
      { id: 'dept-1', name: 'Development', members: 8, status: 'Active', head: 'Shahim', desc: 'Core engineering and product development' },
      { id: 'dept-2', name: 'Design', members: 4, status: 'Active', head: 'Midhul', desc: 'UI/UX and brand design' },
      { id: 'dept-3', name: 'Marketing', members: 5, status: 'Active', head: 'Ameen', desc: 'Growth, content, and campaigns' },
      { id: 'dept-4', name: 'Finance', members: 3, status: 'Active', head: 'Ameen', desc: 'Accounting and financial planning' },
      { id: 'dept-5', name: 'HR & Operations', members: 4, status: 'Active', head: 'Nihal', desc: 'People ops and administration' }
    ],
    integrations: [
      { id: 'int-1', name: 'Google Workspace', status: 'Connected', apiKey: 'gw-****-****-7a3f', lastSync: '2026-08-04 09:15', syncInterval: 'Every 1 Hour' },
      { id: 'int-2', name: 'GitHub', status: 'Connected', apiKey: 'gh-****-****-b2e1', lastSync: '2026-08-04 10:00', syncInterval: 'Every 1 Hour' },
      { id: 'int-3', name: 'Slack', status: 'Connected', apiKey: 'sl-****-****-c9d4', lastSync: '2026-08-04 08:30', syncInterval: 'Every 12 Hours' },
      { id: 'int-4', name: 'OpenAI', status: 'Connected', apiKey: 'oa-****-****-e5f2', lastSync: '2026-08-04 07:45', syncInterval: 'Daily' },
      { id: 'int-5', name: 'Gemini', status: 'Connected', apiKey: 'gm-****-****-a1b3', lastSync: '2026-08-04 06:00', syncInterval: 'Daily' },
      { id: 'int-6', name: 'Microsoft 365', status: 'Not Connected', apiKey: '', lastSync: '', syncInterval: 'Every 1 Hour' }
    ],
    preferences: {
      name: 'VERDE LABS',
      timezone: 'UTC-08:00 (Pacific Time)',
      currency: 'INR (₹)',
      language: 'English (US)',
      dateFormat: 'MMM DD, YYYY'
    },
    security: {
      tfaEnabled: true,
      sessions: [
        { id: 'ses-1', device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', lastActive: 'Current Session', current: true },
        { id: 'ses-2', device: 'iPhone 15 — Safari', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
        { id: 'ses-3', device: 'Windows Desktop — Edge', location: 'New York, NY', lastActive: '1 day ago', current: false }
      ],
      loginHistory: [
        { date: '2026-08-04 10:30', device: 'MacBook Pro — Chrome', ip: '192.168.1.42', status: 'Success' },
        { date: '2026-08-03 14:15', device: 'iPhone 15 — Safari', ip: '10.0.0.15', status: 'Success' },
        { date: '2026-08-02 09:00', device: 'Windows Desktop — Edge', ip: '172.16.0.8', status: 'Success' },
        { date: '2026-08-01 22:45', device: 'Unknown — Firefox', ip: '203.0.113.50', status: 'Failed' }
      ],
      apiKeys: [
        { id: 'key-1', name: 'Production API Key', key: 'vrd_prod_a1b2c3d4e5f6g7h8', created: 'Aug 1, 2026', status: 'Active' },
        { id: 'key-2', name: 'Staging API Key', key: 'vrd_stg_z9y8x7w6v5u4t3s2', created: 'Jul 15, 2026', status: 'Active' }
      ]
    },
    members: [
      { id: 'mem-1', name: 'Shahim', email: 'shahim@verdelabs.co', role: 'Owner', status: 'Active', permissions: ['Read','Write','Edit','Delete','Manage'] },
      { id: 'mem-2', name: 'Midhul', email: 'midhul@verdelabs.co', role: 'Admin', status: 'Active', permissions: ['Read','Write','Edit','Delete','Manage'] },
      { id: 'mem-3', name: 'Ameen', email: 'ameen@verdelabs.co', role: 'Manager', status: 'Active', permissions: ['Read','Write','Edit'] },
      { id: 'mem-4', name: 'Nihal', email: 'nihal@verdelabs.co', role: 'Team Lead', status: 'Active', permissions: ['Read','Write','Edit'] }
    ]
  };

  /* ══════════════════════════════════════════════════════════════════════════
     2. STATE MANAGEMENT
     ══════════════════════════════════════════════════════════════════════════ */

  function load(key) {
    try { var d = localStorage.getItem('verde_ws_' + key); return d ? JSON.parse(d) : null; } catch (e) { return null; }
  }
  function save(key, data) {
    localStorage.setItem('verde_ws_' + key, JSON.stringify(data));
  }

  var state = {
    profile: load('profile') || JSON.parse(JSON.stringify(DEFAULTS.profile)),
    departments: load('departments') || JSON.parse(JSON.stringify(DEFAULTS.departments)),
    integrations: load('integrations') || JSON.parse(JSON.stringify(DEFAULTS.integrations)),
    preferences: load('preferences') || JSON.parse(JSON.stringify(DEFAULTS.preferences)),
    security: load('security') || JSON.parse(JSON.stringify(DEFAULTS.security)),
    members: load('members') || JSON.parse(JSON.stringify(DEFAULTS.members))
  };

  function persist(key) { save(key, state[key]); }
  function persistAll() { Object.keys(state).forEach(persist); }

  // Initialize on first load
  if (!localStorage.getItem('verde_ws_profile')) persistAll();

  /* ══════════════════════════════════════════════════════════════════════════
     3. TOAST HELPER
     ══════════════════════════════════════════════════════════════════════════ */

  function toast(msg, type) {
    if (window.VerdeToast) {
      if (type === 'error') window.VerdeToast.error(msg);
      else if (type === 'warning') window.VerdeToast.warning(msg);
      else window.VerdeToast.success(msg);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     4. GLOBAL MODAL SYSTEM
     ══════════════════════════════════════════════════════════════════════════ */

  var chevronSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var closeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  function openModal(id, title, bodyHTML, footerHTML, width) {
    closeModal(id);
    var w = width || '550px';
    var el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s ease;';
    el.innerHTML =
      '<div style="position:relative;width:calc(100% - 48px);max-width:' + w + ';background:#ffffff;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,0.18);display:flex;flex-direction:column;max-height:90vh;overflow:hidden;transform:translateY(12px);transition:transform 0.25s ease;">' +
        '<div style="background:#ffffff;padding:20px 24px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">' +
          '<h3 style="font-size:18px;font-weight:800;color:var(--text-1);margin:0;">' + title + '</h3>' +
          '<button class="ws-modal-close" style="background:none;border:none;color:var(--text-3);cursor:pointer;padding:4px;">' + closeSvg + '</button>' +
        '</div>' +
        '<div style="background:#ffffff;padding:24px;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:20px;">' + bodyHTML + '</div>' +
        (footerHTML ? '<div style="background:#ffffff;padding:20px 24px;border-top:1px solid var(--border);flex-shrink:0;display:flex;justify-content:flex-end;gap:12px;">' + footerHTML + '</div>' : '') +
      '</div>';

    document.body.appendChild(el);

    // Animate in
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      var inner = el.querySelector('div');
      if (inner) inner.style.transform = 'translateY(0)';
    });

    // Close handlers
    el.querySelector('.ws-modal-close').addEventListener('click', function () { closeModal(id); });
    el.addEventListener('click', function (e) { if (e.target === el) closeModal(id); });

    // ESC key
    function onEsc(e) { if (e.key === 'Escape') { closeModal(id); document.removeEventListener('keydown', onEsc); } }
    document.addEventListener('keydown', onEsc);
    el._escHandler = onEsc;

    return el;
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el._escHandler) document.removeEventListener('keydown', el._escHandler);
    el.style.opacity = '0';
    var inner = el.querySelector('div');
    if (inner) inner.style.transform = 'translateY(12px)';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     5. FORM FIELD HELPERS
     ══════════════════════════════════════════════════════════════════════════ */

  function fieldHTML(label, inputHTML, required) {
    return '<div>' +
      '<label style="font-size:13px;font-weight:700;color:var(--text-1);display:block;margin-bottom:8px;">' + label + (required ? ' *' : '') + '</label>' +
      inputHTML +
    '</div>';
  }
  function inputHTML(id, value, type, placeholder) {
    return '<input type="' + (type || 'text') + '" id="' + id + '" class="input" style="width:100%;" value="' + esc(value || '') + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '>';
  }
  function textareaHTML(id, value, ph) {
    return '<textarea id="' + id + '" class="input" style="width:100%;min-height:70px;" placeholder="' + esc(ph || '') + '">' + esc(value || '') + '</textarea>';
  }
  function selectHTML(id, options, selected) {
    var h = '<select id="' + id + '" class="input" style="width:100%;">';
    options.forEach(function (o) {
      var val = typeof o === 'string' ? o : o.value;
      var lbl = typeof o === 'string' ? o : o.label;
      h += '<option value="' + esc(val) + '"' + (val === selected ? ' selected' : '') + '>' + esc(lbl) + '</option>';
    });
    return h + '</select>';
  }
  function row2(left, right) {
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' + left + right + '</div>';
  }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ══════════════════════════════════════════════════════════════════════════
     6. SVG ICON BANK (matching existing HTML exactly)
     ══════════════════════════════════════════════════════════════════════════ */

  var ICONS = {
    globe: '<svg class="ws-profile-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    mail: '<svg class="ws-profile-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    phone: '<svg class="ws-profile-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
    pin: '<svg class="ws-profile-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
  };

  /* ══════════════════════════════════════════════════════════════════════════
     7. RENDER: ORGANIZATION PROFILE
     ══════════════════════════════════════════════════════════════════════════ */

  function renderProfile() {
    var p = state.profile;
    var nameEl = document.querySelector('.ws-profile-name');
    var indEl = document.querySelector('.ws-profile-industry');
    var logoEl = document.querySelector('.ws-profile-logo');
    var items = document.querySelectorAll('.ws-profile-item');

    if (nameEl) nameEl.textContent = p.name;
    if (indEl) indEl.textContent = p.industry;
    if (logoEl) logoEl.textContent = p.name.charAt(0).toUpperCase();
    if (items.length >= 4) {
      items[0].innerHTML = ICONS.globe + ' ' + esc(p.website);
      items[1].innerHTML = ICONS.mail + ' ' + esc(p.email);
      items[2].innerHTML = ICONS.phone + ' ' + esc(p.phone);
      items[3].innerHTML = ICONS.pin + ' ' + esc(p.address);
    }
  }

  function openEditProfile() {
    var p = state.profile;
    var body =
      fieldHTML('Company Name', inputHTML('ep-name', p.name), true) +
      fieldHTML('Industry', inputHTML('ep-industry', p.industry)) +
      row2(
        fieldHTML('Website', inputHTML('ep-website', p.website)),
        fieldHTML('Email Address', inputHTML('ep-email', p.email, 'email'))
      ) +
      row2(
        fieldHTML('Phone Number', inputHTML('ep-phone', p.phone)),
        fieldHTML('Business Registration', inputHTML('ep-reg', p.registration))
      ) +
      fieldHTML('Company Address', textareaHTML('ep-addr', p.address));

    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-profile\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveProfile()">Save Changes</button>';
    openModal('ws-m-profile', 'Edit Organization Profile', body, footer, '600px');
  }

  function saveProfile() {
    var name = val('ep-name');
    if (!name) { toast('Company name is required', 'error'); return; }
    state.profile.name = name;
    state.profile.industry = val('ep-industry');
    state.profile.website = val('ep-website');
    state.profile.email = val('ep-email');
    state.profile.phone = val('ep-phone');
    state.profile.registration = val('ep-reg');
    state.profile.address = val('ep-addr');
    persist('profile');
    closeModal('ws-m-profile');
    renderProfile();
    renderPreferences(); // name may have changed
    toast('Organization profile updated');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     8. RENDER: KPI CARDS (dynamic values)
     ══════════════════════════════════════════════════════════════════════════ */

  function renderKPIs() {
    var kpiGrid = document.querySelector('.ws-kpi-grid');
    if (!kpiGrid) return;
    var vals = kpiGrid.querySelectorAll('.ws-kpi-value');
    if (vals.length >= 2) {
      vals[1].textContent = String(state.members.length);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     9. RENDER: DEPARTMENTS
     ══════════════════════════════════════════════════════════════════════════ */

  function getDepts() {
    var stored = localStorage.getItem('verde_departments');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    // Migrate if empty
    if (state.departments && state.departments.length > 0) {
      saveDepts(state.departments);
      return state.departments;
    }
    return [];
  }

  function saveDepts(list) {
    localStorage.setItem('verde_departments', JSON.stringify(list));
  }

  function getEmployees() {
    var base = null;
    var stored = localStorage.getItem('verde_api_members');
    if (stored) { try { base = JSON.parse(stored); } catch(e) {} }
    if (!base) {
      base = [
        { id: 'mem-1', name: 'Shahim' },
        { id: 'mem-2', name: 'Midhul' },
        { id: 'mem-3', name: 'Ameen' },
        { id: 'mem-4', name: 'Nihal' }
      ];
    }
    // Merge team employees from the Team module's authoritative source
    var teamStored = localStorage.getItem('verde_os_team_employees');
    if (teamStored) {
      try {
        var teamEmps = JSON.parse(teamStored);
        var existingNames = {};
        base.forEach(function(e) { existingNames[e.name.toLowerCase()] = true; });
        teamEmps.forEach(function(te) {
          if (te.name && !existingNames[te.name.toLowerCase()]) {
            base.push({ id: te.id, name: te.name });
            existingNames[te.name.toLowerCase()] = true;
          }
        });
      } catch(e) {}
    }
    return base;
  }

  function renderDepartments() {
    var grid = document.querySelector('.ws-dept-grid');
    if (!grid) return;
    
    var list = getDepts();
    
    // Apply filters
    var searchInput = document.getElementById('dept-search');
    var statusFilter = document.getElementById('dept-status-filter');
    var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var sf = statusFilter ? statusFilter.value : '';

    var filtered = list.filter(function(d) {
      var matchName = d.name.toLowerCase().includes(q);
      var matchMgr = (d.headName || d.head || '').toLowerCase().includes(q);
      var matchSearch = !q || matchName || matchMgr;
      var matchStatus = !sf || d.status === sf;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3);">No departments match your search.</div>';
    } else {
      grid.innerHTML = filtered.map(function (d) {
        return '<div class="ws-dept-card" data-dept-id="' + d.id + '">' +
          '<div class="ws-dept-top">' +
            '<div>' +
              '<div class="ws-dept-name">' + esc(d.name) + '</div>' +
              '<div class="ws-dept-members">' + (d.members || 0) + ' Members</div>' +
            '</div>' +
            '<span class="badge ' + (d.status === 'Active' ? 'badge-success' : 'badge-neutral') + '">' + esc(d.status) + '</span>' +
          '</div>' +
          '<div class="ws-dept-bottom">' +
            '<div>' +
              '<div class="ws-dept-head-label">Department Head</div>' +
              '<div class="ws-dept-head-name">' + esc(d.headName || d.head || 'Unassigned') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    grid.querySelectorAll('.ws-dept-card').forEach(function (card) {
      card.addEventListener('click', function () { openViewDept(card.getAttribute('data-dept-id')); });
    });

    updateDeptDashboard(list);
  }

  function updateDeptDashboard(list) {
    if(!list) list = getDepts();
    var total = list.length;
    var active = list.filter(function(d) { return d.status === 'Active'; }).length;
    var empTotal = list.reduce(function(sum, d) { return sum + parseInt(d.members || 0, 10); }, 0);
    var avg = total === 0 ? 0 : (empTotal / total).toFixed(1);

    var elTotal = document.getElementById('dept-total');
    var elActive = document.getElementById('dept-active');
    var elAvg = document.getElementById('dept-avg');
    
    if(elTotal) elTotal.textContent = total;
    if(elActive) elActive.textContent = active;
    if(elAvg) elAvg.textContent = avg;
  }

  function openCreateDept() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_dept')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var emps = getEmployees();
    var empOpts = [{label:'-- Select Manager --', value:''}].concat(emps.map(function(e) { 
  return {label: e.name, value: e.id}; }));
    var autoCode = 'DEP-' + Math.floor(1000 + Math.random() * 9000);
    
    var body =
      fieldHTML('Department Name *', inputHTML('dp-name', ''), true) +
      fieldHTML('Department Code', '<input type="text" id="dp-code" class="form-control" value="' + autoCode + '" readonly style="background:var(--bg);">') +
      fieldHTML('Description', textareaHTML('dp-desc', '')) +
      row2(
        fieldHTML('Department Head', selectHTML('dp-head', empOpts, '')),
        fieldHTML('Status', selectHTML('dp-status', ['Active', 'Inactive'], 'Active'))
      );
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-dept\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveDept()">Create Department</button>';
    openModal('ws-m-dept', 'Create Department', body, footer, '500px');
  }

  function openViewDept(id) {
    var d = getDepts().find(function (x) { return x.id === id; });
    if (!d) return;
    var badgeStyle = d.status === 'Active' ? 'background:rgba(46,204,113,0.1);color:#2ecc71;' : 'background:rgba(231,76,60,0.1);color:#e74c3c;';
    var body =
      '<div style="display:flex; gap:20px; margin-bottom:15px;">' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Department Name</label><div style="font-size:14px;color:var(--text-1);font-weight:600;">' + esc(d.name) + '</div></div>' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Department Code</label><div style="font-size:14px;color:var(--text-1);">' + esc(d.code || d.id.toUpperCase()) + '</div></div>' +
      '</div>' +
      '<div style="margin-bottom:15px;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Description</label><div style="font-size:14px;color:var(--text-1);">' + (esc(d.desc) || '<i>No description</i>') + '</div></div>' +
      '<div style="display:flex; gap:20px; margin-bottom:15px;">' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Manager</label><div style="font-size:14px;color:var(--text-1);">' + esc(d.headName || d.head || 'Unassigned') + '</div></div>' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Status</label><div><span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;' + badgeStyle + '">' + esc(d.status) + '</span></div></div>' +
      '</div>';
      
    var actionBtn = d.status === 'Active' ? 
      '<button class="btn btn-ghost" style="color:#f39c12;" onclick="window._ws.toggleDeptStatus(\'' + id + '\', \'Inactive\')">Deactivate</button>' : 
      '<button class="btn btn-ghost" style="color:#2ecc71;" onclick="window._ws.toggleDeptStatus(\'' + id + '\', \'Active\')">Reactivate</button>';

    var footer = '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.deleteDept(\'' + id + '\')">Delete</button>' +
                 actionBtn +
                 '<button class="btn btn-primary" onclick="window._ws.openEditDept(\'' + id + '\')">Edit</button>';
    openModal('ws-m-view-dept', 'View Department', body, footer, '500px');
  }

  function toggleDeptStatus(id, newStatus) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_dept')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var list = getDepts();
    var d = list.find(function(x) { return x.id === id; });
    if(d) {
      d.status = newStatus;
      saveDepts(list);
      toast('Department ' + (newStatus === 'Active' ? 'reactivated' : 'deactivated'), 'success');
      closeModal('ws-m-view-dept');
      renderDepartments();
    }
  }

  function openEditDept(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_dept')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var d = getDepts().find(function (x) { return x.id === id; });
    if (!d) return;
    var emps = getEmployees();
    var empOpts = [{label:'-- Select Manager --', value:''}].concat(emps.map(function(e) { 

  /* ══════════════════════════════════════════════════════════════════════════
     15. ACTIVITY LOGS
     ══════════════════════════════════════════════════════════════════════════ */  
  // Call it on init
  

  return {
label: e.name, value: e.id}; }));
    var currentMgrId = d.headId || (emps.find(function(e){ return e.name === d.head; }) || {}).id || '';
    
    var body =
      '<input type="hidden" id="dp-edit-id" value="' + id + '">' +
      fieldHTML('Department Name *', inputHTML('dp-name', d.name), true) +
      fieldHTML('Department Code', '<input type="text" id="dp-code" class="form-control" value="' + esc(d.code || d.id.toUpperCase()) + '" readonly style="background:var(--bg);">') +
      fieldHTML('Description', textareaHTML('dp-desc', d.desc || '')) +
      row2(
        fieldHTML('Department Head', selectHTML('dp-head', empOpts, currentMgrId)),
        fieldHTML('Status', selectHTML('dp-status', ['Active', 'Inactive'], d.status))
      );
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-dept\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveDept()">Save Changes</button>';
    closeModal('ws-m-view-dept');
    openModal('ws-m-dept', 'Edit Department', body, footer, '500px');
  }

  function saveDept() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_dept')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var name = val('dp-name');
    if (!name || name.trim() === '') { toast('Department name is required', 'error'); return; }
    
    var list = getDepts();
    var editId = val('dp-edit-id');
    var code = val('dp-code');
    var headId = val('dp-head');
    var status = val('dp-status');
    var desc = val('dp-desc');
    
    var emps = getEmployees();
    var headName = '';
    if(headId) {
       var emp = emps.find(function(e) { return e.id === headId; });
       if(emp) headName = emp.name;
    }
    
    var dup = list.find(function(d) { return d.name.toLowerCase() === name.toLowerCase() && d.id !== editId; });
    if (dup) { toast('Department name must be unique', 'error'); return; }

    if (editId) {
      var d = list.find(function (x) { return x.id === editId; });
      if (d) { 
        d.name = name; d.desc = desc; d.headId = headId; d.headName = headName; 
        d.head = headName; d.status = status; d.code = code;
      }
      toast('Department updated', 'success');
    } else {
      list.push({ id: 'dept-' + Date.now(), code: code, name: name, desc: desc, headId: headId, headName: headName, head: headName, status: status, members: 0 });
      toast('Department created', 'success');
    }
    saveDepts(list);
    closeModal('ws-m-dept');
    renderDepartments();
  }

  function deleteDept(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_dept')) { if(window.toast) toast('Access Denied', 'error'); return; }
    openModal('ws-m-confirm', 'Delete Department',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to delete this department? This action cannot be undone.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-confirm\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmDeleteDept(\'' + id + '\')">Delete</button>'
    );
  }

  function confirmDeleteDept(id) {
    var targetDept = getDepts().find(function (d) { return d.id === id; });
    
    var list = getDepts().filter(function (d) { return d.id !== id; });
    saveDepts(list);
    closeModal('ws-m-confirm');
    closeModal('ws-m-view-dept');
    closeModal('ws-m-dept');
    renderDepartments();
    toast('Department deleted', 'success');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     10. RENDER: INTEGRATIONS
     ══════════════════════════════════════════════════════════════════════════ */

  // We keep the original HTML for integrations and just wire events
  function wireIntegrations() {
    var grid = document.querySelector('.ws-int-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('.ws-int-card');
    cards.forEach(function (card, idx) {
      var intData = state.integrations[idx];
      if (!intData) return;
      // Update status text from state
      var statusEl = card.querySelector('.ws-int-status');
      if (statusEl) {
        var isConn = intData.status === 'Connected';
        statusEl.className = 'ws-int-status' + (isConn ? '' : ' disconnected');
        statusEl.innerHTML = '<span style="width:6px;height:6px;background:currentColor;border-radius:50%;"></span> ' + intData.status;
      }
      // Update opacity
      card.style.opacity = intData.status === 'Connected' ? '1' : '0.7';
      // Wire button
      var btn = card.querySelector('.btn');
      if (btn) {
        btn.textContent = intData.status === 'Connected' ? 'Manage' : 'Connect';
        btn.className = intData.status === 'Connected' ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm';
        if (intData.status === 'Connected') btn.style.border = '1px solid var(--border)';
        else btn.style.border = '';
        btn.onclick = function (e) { e.stopPropagation(); openIntegrationModal(intData.id); };
      }
    });
  }

  function openIntegrationModal(id) {
    var intg = state.integrations.find(function (x) { return x.id === id; });
    if (!intg) return;
    var isConn = intg.status === 'Connected';

    var body;
    if (isConn) {
      body =
        '<div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg);border:1px solid var(--border);border-radius:12px;">' +
          '<div style="width:8px;height:8px;border-radius:50%;background:var(--success);"></div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--text-1);">' + esc(intg.name) + ' is connected</div>' +
        '</div>' +
        fieldHTML('API Key', '<div style="display:flex;gap:8px;">' +
          '<input type="text" id="int-apikey" class="input" style="flex:1;font-family:monospace;" value="' + esc(intg.apiKey) + '" readonly>' +
          '<button class="btn btn-secondary btn-sm" onclick="window._ws.copyApiKey(\'int-apikey\')">Copy</button>' +
        '</div>') +
        row2(
          fieldHTML('Sync Interval', selectHTML('int-sync', ['Every 1 Hour', 'Every 12 Hours', 'Daily'], intg.syncInterval)),
          fieldHTML('Last Sync', '<div style="padding:10px 14px;font-size:13px;color:var(--text-2);background:var(--bg);border:1px solid var(--border);border-radius:8px;">' + esc(intg.lastSync || 'Never') + '</div>')
        );
    } else {
      body =
        '<div style="font-size:14px;color:var(--text-2);line-height:1.6;">Connect ' + esc(intg.name) + ' to sync your data and streamline workflows across VERDE OS.</div>' +
        fieldHTML('API Key', inputHTML('int-connect-key', '', 'text', 'Enter your API key...'), true);
    }

    var footer;
    if (isConn) {
      footer = '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.disconnectIntegration(\'' + id + '\')">Disconnect</button>' +
               '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-int\')">Cancel</button>' +
               '<button class="btn btn-primary" onclick="window._ws.saveIntegration(\'' + id + '\')">Save Settings</button>';
    } else {
      footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-int\')">Cancel</button>' +
               '<button class="btn btn-primary" onclick="window._ws.connectIntegration(\'' + id + '\')">Connect</button>';
    }

    openModal('ws-m-int', (isConn ? 'Manage ' : 'Connect ') + intg.name, body, footer);
  }

  function connectIntegration(id) {
    var key = val('int-connect-key');
    if (!key) { toast('API key is required', 'error'); return; }
    var intg = state.integrations.find(function (x) { return x.id === id; });
    if (!intg) return;
    intg.status = 'Connected';
    intg.apiKey = key.substring(0, 4) + '-****-****-' + key.substring(key.length - 4);
    intg.lastSync = new Date().toISOString().replace('T', ' ').substring(0, 16);
    persist('integrations');
    closeModal('ws-m-int');
    wireIntegrations();
    toast(intg.name + ' connected successfully');
  }

  function disconnectIntegration(id) {
    openModal('ws-m-confirm', 'Disconnect Integration',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to disconnect this integration? You can reconnect later.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-confirm\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmDisconnect(\'' + id + '\')">Disconnect</button>'
    );
  }

  function confirmDisconnect(id) {
    var intg = state.integrations.find(function (x) { return x.id === id; });
    if (intg) { intg.status = 'Not Connected'; intg.apiKey = ''; intg.lastSync = ''; }
    persist('integrations');
    closeModal('ws-m-confirm');
    closeModal('ws-m-int');
    wireIntegrations();
    toast(intg.name + ' disconnected');
  }

  function saveIntegration(id) {
    var intg = state.integrations.find(function (x) { return x.id === id; });
    if (intg) {
      intg.syncInterval = val('int-sync');
      intg.lastSync = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    persist('integrations');
    closeModal('ws-m-int');
    wireIntegrations();
    toast('Integration settings saved');
  }

  function copyApiKey(inputId) {
    var el = document.getElementById(inputId);
    if (el) {
      el.select();
      try { document.execCommand('copy'); toast('API key copied to clipboard'); }
      catch (e) { toast('Failed to copy', 'error'); }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     11. RENDER: WORKSPACE PREFERENCES
     ══════════════════════════════════════════════════════════════════════════ */

  var prefItems = [
    { key: 'name', title: 'Workspace Name', sub: "Your company's primary workspace handle" },
    { key: 'timezone', title: 'Time Zone', sub: 'Used for all reports, tasks, and communications' },
    { key: 'currency', title: 'Currency', sub: 'Base currency for Finance and CRM modules' },
    { key: 'language', title: 'Language', sub: 'Default language for the entire workspace' },
    { key: 'dateFormat', title: 'Date Format', sub: 'Display format for dates' }
  ];

  function renderPreferences() {
    var box = document.querySelector('.ws-half-grid .ws-box:nth-child(1) .ws-list');
    if (!box) return;
    box.innerHTML = prefItems.map(function (item) {
      return '<div class="ws-list-item" data-pref="' + item.key + '">' +
        '<div><div class="ws-list-title">' + item.title + '</div><div class="ws-list-sub">' + item.sub + '</div></div>' +
        '<div class="ws-list-value">' + esc(state.preferences[item.key]) + ' ' + chevronSvg + '</div>' +
      '</div>';
    }).join('');

    // Wire click on each preference row
    box.querySelectorAll('.ws-list-item').forEach(function (el) {
      el.addEventListener('click', function () { openEditPref(el.getAttribute('data-pref')); });
    });
  }

  var prefOptions = {
    timezone: ['UTC-12:00 (Baker Island)', 'UTC-08:00 (Pacific Time)', 'UTC-05:00 (Eastern Time)', 'UTC+00:00 (GMT)', 'UTC+01:00 (CET)', 'UTC+05:30 (IST)', 'UTC+08:00 (CST)', 'UTC+09:00 (JST)'],
    currency: ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'JPY (¥)', 'AUD (A$)', 'CAD (C$)'],
    language: ['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Chinese (Simplified)'],
    dateFormat: ['MMM DD, YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY']
  };

  function openEditPref(key) {
    var item = prefItems.find(function (p) { return p.key === key; });
    if (!item) return;
    var currentValue = state.preferences[key];
    var inputField;
    if (prefOptions[key]) {
      inputField = selectHTML('pref-val', prefOptions[key], currentValue);
    } else {
      inputField = inputHTML('pref-val', currentValue);
    }

    var body = fieldHTML(item.title, inputField, true);
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-pref\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.savePref(\'' + key + '\')">Save</button>';
    openModal('ws-m-pref', 'Edit ' + item.title, body, footer, '420px');
  }

  function savePref(key) {
    var v = val('pref-val');
    if (!v) { toast(key.charAt(0).toUpperCase() + key.slice(1) + ' is required', 'error'); return; }
    state.preferences[key] = v;
    persist('preferences');
    closeModal('ws-m-pref');
    renderPreferences();
    toast(key.charAt(0).toUpperCase() + key.slice(1) + ' updated');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     12. RENDER: SECURITY OVERVIEW
     ══════════════════════════════════════════════════════════════════════════ */

  function renderSecurity() {
    var secBox = document.querySelector('.ws-half-grid .ws-box:nth-child(2)');
    if (!secBox) return;
    var list = secBox.querySelector('.ws-list');
    if (!list) return;

    var s = state.security;
    list.innerHTML =
      '<div class="ws-list-item" data-sec="tfa">' +
        '<div><div class="ws-list-title">Two-Factor Authentication</div><div class="ws-list-sub">Required for all administrator accounts</div></div>' +
        '<div class="ws-list-value" style="color:' + (s.tfaEnabled ? 'var(--success)' : 'var(--text-3)') + ';">' + (s.tfaEnabled ? 'Enabled' : 'Disabled') + ' ' + chevronSvg + '</div>' +
      '</div>' +
      '<div class="ws-list-item" data-sec="sessions">' +
        '<div><div class="ws-list-title">Active Sessions</div><div class="ws-list-sub">Devices currently logged into VERDE OS</div></div>' +
        '<div class="ws-list-value">' + s.sessions.length + ' Devices ' + chevronSvg + '</div>' +
      '</div>' +
      '<div class="ws-list-item" data-sec="history">' +
        '<div><div class="ws-list-title">Login History</div><div class="ws-list-sub">Review recent access attempts</div></div>' +
        '<div class="ws-list-value">View Logs ' + chevronSvg + '</div>' +
      '</div>' +
      '<div class="ws-list-item" data-sec="apikeys">' +
        '<div><div class="ws-list-title">API Keys</div><div class="ws-list-sub">Manage active developer tokens</div></div>' +
        '<div class="ws-list-value">' + s.apiKeys.length + ' Active ' + chevronSvg + '</div>' +
      '</div>';

    // Wire clicks
    list.querySelectorAll('.ws-list-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var secType = el.getAttribute('data-sec');
        if (secType === 'tfa') openTFAModal();
        else if (secType === 'sessions') openSessionsModal();
        else if (secType === 'history') openLoginHistoryModal();
        else if (secType === 'apikeys') openAPIKeysModal();
      });
    });

    // Wire "Manage Security" button
    var manageBtn = secBox.querySelector('.ws-box-header .btn');
    if (manageBtn) manageBtn.onclick = function () { openSecurityPanelModal(); };
  }

  // 2FA
  function openTFAModal() {
    var s = state.security;
    var body =
      '<div style="text-align:center;padding:16px;">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:' + (s.tfaEnabled ? 'var(--success-10)' : 'var(--bg-2)') + ';display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' + (s.tfaEnabled ? 'var(--success)' : 'var(--text-3)') + '" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:800;color:var(--text-1);margin-bottom:8px;">Two-Factor Authentication</div>' +
        '<div style="font-size:14px;color:var(--text-2);">2FA is currently <strong>' + (s.tfaEnabled ? 'enabled' : 'disabled') + '</strong> for all administrator accounts.</div>' +
      '</div>';
    var action = s.tfaEnabled ? 'Disable 2FA' : 'Enable 2FA';
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-tfa\')">Cancel</button>' +
                 '<button class="btn btn-primary" ' + (s.tfaEnabled ? 'style="background:var(--danger);"' : '') + ' onclick="window._ws.toggleTFA()">' + action + '</button>';
    openModal('ws-m-tfa', 'Two-Factor Authentication', body, footer, '420px');
  }

  function toggleTFA() {
    state.security.tfaEnabled = !state.security.tfaEnabled;
    persist('security');
    closeModal('ws-m-tfa');
    renderSecurity();
    toast('Two-Factor Authentication ' + (state.security.tfaEnabled ? 'enabled' : 'disabled'));
  }

  // Sessions
  function openSessionsModal() {
    var sessions = state.security.sessions;
    var body = sessions.map(function (s) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border);">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-1);">' + esc(s.device) + '</div>' +
          '<div style="font-size:12px;color:var(--text-3);margin-top:4px;">' + esc(s.location) + ' · ' + esc(s.lastActive) + '</div>' +
        '</div>' +
        (s.current
          ? '<span class="badge badge-success">Current</span>'
          : '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window._ws.terminateSession(\'' + s.id + '\')">Terminate</button>'
        ) +
      '</div>';
    }).join('');
    openModal('ws-m-sessions', 'Active Sessions', '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">' + body + '</div>', null, '550px');
  }

  function terminateSession(id) {
    state.security.sessions = state.security.sessions.filter(function (s) { return s.id !== id; });
    persist('security');
    closeModal('ws-m-sessions');
    renderSecurity();
    toast('Session terminated');
  }

  // Login History
  function openLoginHistoryModal() {
    var history = state.security.loginHistory;
    var rows = history.map(function (h) {
      return '<tr>' +
        '<td style="padding:10px 16px;font-size:13px;color:var(--text-1);border-bottom:1px solid var(--border);">' + esc(h.date) + '</td>' +
        '<td style="padding:10px 16px;font-size:13px;color:var(--text-2);border-bottom:1px solid var(--border);">' + esc(h.device) + '</td>' +
        '<td style="padding:10px 16px;font-size:13px;color:var(--text-3);border-bottom:1px solid var(--border);">' + esc(h.ip) + '</td>' +
        '<td style="padding:10px 16px;border-bottom:1px solid var(--border);"><span class="badge ' + (h.status === 'Success' ? 'badge-success' : 'badge-danger') + '">' + esc(h.status) + '</span></td>' +
      '</tr>';
    }).join('');
    var body = '<div style="border:1px solid var(--border);border-radius:12px;overflow:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:var(--bg);">' +
          '<th style="padding:10px 16px;font-size:12px;font-weight:700;color:var(--text-3);text-align:left;text-transform:uppercase;">Date</th>' +
          '<th style="padding:10px 16px;font-size:12px;font-weight:700;color:var(--text-3);text-align:left;text-transform:uppercase;">Device</th>' +
          '<th style="padding:10px 16px;font-size:12px;font-weight:700;color:var(--text-3);text-align:left;text-transform:uppercase;">IP Address</th>' +
          '<th style="padding:10px 16px;font-size:12px;font-weight:700;color:var(--text-3);text-align:left;text-transform:uppercase;">Status</th>' +
        '</tr></thead><tbody>' + rows + '</tbody>' +
      '</table></div>';
    openModal('ws-m-history', 'Login History', body, null, '700px');
  }

  // API Keys
  function openAPIKeysModal() {
    var keys = state.security.apiKeys;
    var rows = keys.map(function (k) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border);">' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-1);">' + esc(k.name) + '</div>' +
          '<div style="font-size:12px;color:var(--text-3);margin-top:4px;font-family:monospace;">' + esc(k.key.substring(0, 12)) + '••••••••</div>' +
          '<div style="font-size:11px;color:var(--text-3);margin-top:4px;">Created ' + esc(k.created) + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-ghost btn-sm" onclick="window._ws.copyGeneratedKey(\'' + esc(k.key) + '\')">Copy</button>' +
          '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window._ws.revokeAPIKey(\'' + k.id + '\')">Revoke</button>' +
        '</div>' +
      '</div>';
    }).join('');
    var body = '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">' +
      (rows || '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">No API keys yet</div>') +
    '</div>' +
    '<button class="btn btn-secondary" style="width:100%;margin-top:4px;" onclick="window._ws.generateAPIKey()">+ Generate New API Key</button>';
    openModal('ws-m-apikeys', 'API Keys', body, null, '600px');
  }

  function generateAPIKey() {
    var body =
      fieldHTML('Key Name', inputHTML('ak-name', '', 'text', 'e.g., Production API Key'), true);
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-genkey\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.confirmGenerateKey()">Generate</button>';
    openModal('ws-m-genkey', 'Generate API Key', body, footer, '420px');
  }

  function confirmGenerateKey() {
    var name = val('ak-name');
    if (!name) { toast('Key name is required', 'error'); return; }
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var key = 'vrd_';
    for (var i = 0; i < 24; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    var now = new Date();
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    state.security.apiKeys.push({
      id: 'key-' + Date.now(),
      name: name,
      key: key,
      created: months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear(),
      status: 'Active'
    });
    persist('security');
    closeModal('ws-m-genkey');
    closeModal('ws-m-apikeys');
    renderSecurity();
    toast('API key generated: ' + key.substring(0, 12) + '...');
    setTimeout(openAPIKeysModal, 250);
  }

  function revokeAPIKey(id) {
    openModal('ws-m-confirm', 'Revoke API Key',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to revoke this API key? Applications using this key will lose access immediately.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-confirm\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmRevokeKey(\'' + id + '\')">Revoke Key</button>'
    );
  }

  function confirmRevokeKey(id) {
    state.security.apiKeys = state.security.apiKeys.filter(function (k) { return k.id !== id; });
    persist('security');
    closeModal('ws-m-confirm');
    closeModal('ws-m-apikeys');
    renderSecurity();
    toast('API key revoked');
    setTimeout(openAPIKeysModal, 250);
  }

  function copyGeneratedKey(key) {
    var temp = document.createElement('textarea');
    temp.value = key;
    document.body.appendChild(temp);
    temp.select();
    try { document.execCommand('copy'); toast('API key copied to clipboard'); }
    catch (e) { toast('Failed to copy', 'error'); }
    document.body.removeChild(temp);
  }

  // Full Security Panel
  function openSecurityPanelModal() {
    var s = state.security;
    var body =
      // 2FA Section
      '<div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:800;color:var(--text-1);">Two-Factor Authentication</div>' +
          '<div style="font-size:13px;color:var(--text-3);margin-top:4px;">' + (s.tfaEnabled ? 'Enabled for all admins' : 'Currently disabled') + '</div>' +
        '</div>' +
        '<button class="btn btn-secondary btn-sm" onclick="window._ws.closeModal(\'ws-m-secpanel\'); window._ws.openTFAModal();">' + (s.tfaEnabled ? 'Manage' : 'Enable') + '</button>' +
      '</div>' +
      // Sessions
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-size:14px;font-weight:800;color:var(--text-1);">Active Sessions (' + s.sessions.length + ')</div>' +
        '<button class="btn btn-ghost btn-sm" style="color:var(--primary);" onclick="window._ws.closeModal(\'ws-m-secpanel\'); window._ws.openSessionsModal();">View All</button>' +
      '</div>' +
      // Login History
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-size:14px;font-weight:800;color:var(--text-1);">Login History</div>' +
        '<button class="btn btn-ghost btn-sm" style="color:var(--primary);" onclick="window._ws.closeModal(\'ws-m-secpanel\'); window._ws.openLoginHistoryModal();">View Logs</button>' +
      '</div>' +
      // API Keys
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-size:14px;font-weight:800;color:var(--text-1);">API Keys (' + s.apiKeys.length + ' active)</div>' +
        '<button class="btn btn-ghost btn-sm" style="color:var(--primary);" onclick="window._ws.closeModal(\'ws-m-secpanel\'); window._ws.openAPIKeysModal();">Manage</button>' +
      '</div>';

    openModal('ws-m-secpanel', 'Manage Security', body, null, '550px');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     13. MEMBER MANAGEMENT (Quick Actions modal)
     ══════════════════════════════════════════════════════════════════════════ */

  function openInviteMemberModal() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_perms')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var body =
      row2(
        fieldHTML('Full Name', inputHTML('mem-name', ''), true),
        fieldHTML('Email Address', inputHTML('mem-email', '', 'email', 'name@company.com'), true)
      ) +
      row2(
        fieldHTML('Role', selectHTML('mem-role', ['Owner', 'Admin', 'Manager', 'Team Lead', 'Employee', 'Guest'], 'Employee')),
        fieldHTML('Status', selectHTML('mem-status', ['Active', 'Suspended'], 'Active'))
      ) +
      fieldHTML('Permissions', '<div id="mem-perms" style="display:flex;flex-wrap:wrap;gap:8px;">' +
        ['Read','Write','Edit','Delete','Manage'].map(function (p) {
          return '<label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--text-2);cursor:pointer;"><input type="checkbox" value="' + p + '"' + (p === 'Read' ? ' checked' : '') + '> ' + p + '</label>';
        }).join('') +
      '</div>');
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-member\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveInviteMember()">Invite Member</button>';
    openModal('ws-m-member', 'Invite Member', body, footer);
  }

  function saveInviteMember() {
    var name = val('mem-name');
    var email = val('mem-email');
    if (!name) { toast('Name is required', 'error'); return; }
    if (!email) { toast('Email is required', 'error'); return; }
    if (state.members.find(function (m) { return m.email === email; })) { toast('Member already exists', 'error'); return; }
    var perms = [];
    document.querySelectorAll('#mem-perms input:checked').forEach(function (cb) { perms.push(cb.value); });
    state.members.push({
      id: 'mem-' + Date.now(),
      name: name,
      email: email,
      role: val('mem-role'),
      status: val('mem-status'),
      permissions: perms
    });
    persist('members');
    closeModal('ws-m-member');
    renderKPIs();
    toast(name + ' invited successfully');
  }

  // Manage Permissions modal
  function openManagePermissions() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_perms')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var body = state.members.map(function (m) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:32px;height:32px;border-radius:50%;background:var(--primary-10);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">' + m.name.charAt(0) + '</div>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:700;color:var(--text-1);">' + esc(m.name) + '</div>' +
            '<div style="font-size:12px;color:var(--text-3);">' + esc(m.email) + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="badge badge-neutral">' + esc(m.role) + '</span>' +
      '</div>';
    }).join('');
    openModal('ws-m-perms', 'Manage Permissions', '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">' + body + '</div>', null, '600px');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     14. QUICK ACTIONS
     ══════════════════════════════════════════════════════════════════════════ */

  function wireQuickActions() {
    var btn = document.querySelector('.ws-toolbar .btn-primary');
    if (!btn || btn._wired) return;
    btn._wired = true;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var existing = document.getElementById('ws-qa-dropdown');
      if (existing) { existing.remove(); return; }

      var rect = btn.getBoundingClientRect();
      var dd = document.createElement('div');
      dd.id = 'ws-qa-dropdown';
      dd.style.cssText = 'position:fixed;top:' + (rect.bottom + 8) + 'px;right:' + (window.innerWidth - rect.right) + 'px;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.12);border:1px solid var(--border);padding:8px;z-index:10000;width:220px;display:flex;flex-direction:column;gap:2px;opacity:0;transform:translateY(-4px);transition:all 0.15s ease;';

      var items = [
        { label: 'Organization Profile', fn: window._ws ? window._ws.openOrganizationProfile : openOrganizationProfile },
        { label: 'Create Workspace', fn: function () { window._ws.openWorkspaceProvisioning(); } },
        { label: 'Invite Member', fn: function () { if(typeof openInviteMemberModal !== 'undefined') openInviteMemberModal(); else if(typeof openInviteMember !== 'undefined') openInviteMember(); else toast('Invite Member', 'info'); } },
        { label: 'Upload File', fn: function () { toast('Upload File opened', 'info'); } },
        { label: 'Workspace Settings', fn: function () { toast('Workspace Settings opened', 'info'); } },
        { label: 'Organization Profile', fn: function () { if(typeof openOrganizationProfile !== 'undefined') openOrganizationProfile(); else toast('Organization Profile', 'info'); } }
      ];

      dd.innerHTML = items.map(function (it, i) {
        return '<div class="qa-item" data-qa="' + i + '" style="padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text-1);cursor:pointer;transition:background 0.1s;">' + it.label + '</div>';
      }).join('');

      document.body.appendChild(dd);

      // Animate in
      requestAnimationFrame(function () { dd.style.opacity = '1'; dd.style.transform = 'translateY(0)'; });

      dd.querySelectorAll('.qa-item').forEach(function (el) {
        el.addEventListener('mouseover', function () { el.style.background = 'var(--bg)'; });
        el.addEventListener('mouseout', function () { el.style.background = 'transparent'; });
        el.addEventListener('click', function () {
          dd.remove();
          items[parseInt(el.getAttribute('data-qa'))].fn();
        });
      });

      function closeDropdown(ev) {
        if (!dd.contains(ev.target) && ev.target !== btn) {
          dd.remove();
          document.removeEventListener('click', closeDropdown);
        }
      }
      setTimeout(function () { document.addEventListener('click', closeDropdown); }, 10);
    });
  }

  function openUploadLogoModal() {
    var body =
      '<div style="border:2px dashed var(--border);border-radius:12px;padding:40px;text-align:center;cursor:pointer;" onclick="document.getElementById(\'logo-input\').click();">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" style="margin-bottom:12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
        '<div style="font-size:14px;font-weight:600;color:var(--text-1);">Click to upload logo</div>' +
        '<div style="font-size:12px;color:var(--text-3);margin-top:4px;">Recommended: 256×256 PNG</div>' +
      '</div>' +
      '<input type="file" id="logo-input" accept="image/*" style="display:none;" onchange="window._ws.handleLogoUpload(this)">';
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-logo\')">Cancel</button>';
    openModal('ws-m-logo', 'Upload Company Logo', body, footer, '420px');
  }

  function handleLogoUpload(input) {
    if (input.files && input.files[0]) {
      toast('Logo uploaded successfully');
      closeModal('ws-m-logo');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CREATE WORKSPACE HANDLERS (RESTORED)
     ══════════════════════════════════════════════════════════════════════════ */
  function getWorkspaces() {
    var stored = localStorage.getItem('verdeWorkspaces');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    return [];
  }

  function saveWorkspaces(list) {
    localStorage.setItem('verdeWorkspaces', JSON.stringify(list));
  }

  function openCreateWorkspace(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_create')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var list = getWorkspaces();
    var ws = { name: '', description: '', type: 'Team', visibility: 'Internal', storage: '50', status: 'Active' };
    var isEdit = false;
    if (id && typeof id === 'string') {
      var existing = list.filter(function(w) { return w.id === id; })[0];
      if (existing) { ws = existing; isEdit = true; }
    }
    var types = [{label:'Personal',value:'Personal'},{label:'Team',value:'Team'},{label:'Enterprise',value:'Enterprise'}];
    var vis = [{label:'Private',value:'Private'},{label:'Internal',value:'Internal'},{label:'Public',value:'Public'}];
    var stats = [{label:'Active',value:'Active'},{label:'Archived',value:'Archived'}];
    var body =
      '<input type="hidden" id="cws-id" value="' + (isEdit ? esc(id) : '') + '">' +
      fieldHTML('Workspace Name *', inputHTML('cws-name', ws.name), true) +
      fieldHTML('Description', textareaHTML('cws-desc', ws.description)) +
      row2(fieldHTML('Workspace Type', selectHTML('cws-type', types, ws.type)), fieldHTML('Visibility', selectHTML('cws-vis', vis, ws.visibility))) +
      row2(fieldHTML('Storage Limit (GB)', inputHTML('cws-storage', ws.storage, 'number')), fieldHTML('Status', selectHTML('cws-status', stats, ws.status)));
    var footer =
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-create\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveWorkspace()">Save Workspace</button>';
    openModal('ws-m-create', isEdit ? 'Edit Workspace' : 'Create Workspace', body, footer, '500px');
  }

  function saveWorkspace() {
    var id = val('cws-id');
    var name = val('cws-name');
    if (!name || name.trim() === '') { toast('Workspace Name is required', 'error'); return; }
    var list = getWorkspaces();
    var dup = list.filter(function(w) { return w.name.toLowerCase() === name.toLowerCase() && w.id !== id; });
    if (dup.length > 0) { toast('Workspace name already exists', 'error'); return; }
    if (id) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          list[i].name = name; list[i].description = val('cws-desc'); list[i].type = val('cws-type');
          list[i].visibility = val('cws-vis'); list[i].storage = val('cws-storage'); list[i].status = val('cws-status');
          break;
        }
      }
      toast('Workspace updated successfully', 'success');
    } else {
      list.push({ id: 'WS-' + Math.floor(Math.random() * 1000000), name: name, description: val('cws-desc'), type: val('cws-type'), visibility: val('cws-vis'), storage: val('cws-storage'), status: val('cws-status') });
      toast('Workspace created successfully', 'success');
    }
    saveWorkspaces(list); 
    closeModal('ws-m-create');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     14.5. EMPLOYEE WORKSPACE PROVISIONING
     ══════════════════════════════════════════════════════════════════════════ */
  function getEmpWorkspaces() {
    var stored = localStorage.getItem('verde_emp_workspaces');
    return stored ? JSON.parse(stored) : [];
  }
  function saveEmpWorkspaces(list) {
    localStorage.setItem('verde_emp_workspaces', JSON.stringify(list));
  }
  
  function openWorkspaceProvisioning(editId) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_edit')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var dv = document.getElementById('ws-dashboard-view');
    var pv = document.getElementById('ws-provisioning-view');
    if(dv) dv.style.display = 'none';
    if(pv) pv.style.display = 'block';
    
    // Populate employees — merge state.members with Team module employees
    var empSelect = document.getElementById('prov-employee');
    var members = state.members ? state.members.slice() : [];
    var teamStored = localStorage.getItem('verde_os_team_employees');
    if (teamStored) {
      try {
        var teamEmps = JSON.parse(teamStored);
        var existingNames = {};
        members.forEach(function(m) { existingNames[m.name.toLowerCase()] = true; });
        teamEmps.forEach(function(te) {
          if (te.name && !existingNames[te.name.toLowerCase()]) {
            members.push({ id: te.id, name: te.name, email: te.email || '', role: te.role || 'Employee', status: te.status || 'Active' });
            existingNames[te.name.toLowerCase()] = true;
          }
        });
      } catch(e) {}
    }
    var depts = getDepts().filter(function(d){ return d.status === 'Active'; });
    empSelect.innerHTML = '<option value="">Select Employee...</option>' + members.map(function(m) {
      return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>';
    }).join('');
    
    // Departments Dropdown
    var deptSelect = document.getElementById('prov-dept');
    var sysDepts = getDepts().filter(function(d){ return d.status === 'Active'; });
    if(sysDepts.length === 0) {
      deptSelect.innerHTML = '<option value="">No departments found. Please create a department first.</option>';
      var btn = document.getElementById('prov-save-btn');
      if(btn) btn.disabled = true;
    } else {
      deptSelect.innerHTML = '<option value="">Select Department...</option>' + sysDepts.map(function(d) {
        return '<option value="' + esc(d.name) + '">' + esc(d.name) + '</option>';
      }).join('');
      var btn = document.getElementById('prov-save-btn');
      if(btn) btn.disabled = false;
    }

    // Roles
    var roleSelect = document.getElementById('prov-role');
    var roles = [];
    try {
      roles = JSON.parse(localStorage.getItem('verde_settings_roles') || '[]');
    } catch(e) {}
    
    var requiredOrder = ['CEO', 'Co-Founder', 'Administrator', 'Manager', 'Team Lead', 'Employee', 'Intern', 'Guest'];
    var roleMap = {};
    roles.forEach(function(r) { roleMap[r.name] = r; });
    
    var changed = false;
    requiredOrder.forEach(function(reqName) {
      if (!roleMap[reqName]) {
        roleMap[reqName] = { id: 'ROLE-' + Math.floor(1000 + Math.random() * 9000), name: reqName, description: 'System Role', status: 'Active', permissions: [] };
        roles.push(roleMap[reqName]);
        changed = true;
      }
    });
    
    if (changed) {
      localStorage.setItem('verde_settings_roles', JSON.stringify(roles));
    }
    
    var optionsHtml = '';
    requiredOrder.forEach(function(reqName) {
      optionsHtml += '<option value="' + esc(reqName) + '">' + esc(reqName) + '</option>';
    });
    
    roles.forEach(function(r) {
      if (requiredOrder.indexOf(r.name) === -1 && r.name !== 'Owner') {
        optionsHtml += '<option value="' + esc(r.name) + '">' + esc(r.name) + '</option>';
      }
    });
    
    roleSelect.innerHTML = optionsHtml;
    
    if (editId) {
      var ws = getEmpWorkspaces().find(function(w) { return w.id === editId; });
      if(ws) {
        var optExists = false;
        for(var i=0; i<roleSelect.options.length; i++) {
          if(roleSelect.options[i].value === ws.role) { optExists = true; break; }
        }
        if(!optExists && ws.role) {
          roleSelect.innerHTML += '<option value="' + esc(ws.role) + '">' + esc(ws.role) + '</option>';
        }
        document.getElementById('prov-edit-id').value = ws.id;
        document.getElementById('prov-employee').value = ws.employeeId;
        document.getElementById('prov-employee').disabled = true;
        document.getElementById('prov-name').value = ws.name;
        
        var deptSelect = document.getElementById('prov-dept');
        if(ws.department) {
          var dExists = false;
          for(var i=0; i<deptSelect.options.length; i++) {
            if(deptSelect.options[i].value === ws.department) { dExists = true; break; }
          }
          if(!dExists) deptSelect.innerHTML += '<option value="' + esc(ws.department) + '">' + esc(ws.department) + '</option>';
          deptSelect.value = ws.department;
          deptSelect.disabled = true;
          
          var btn = document.getElementById('prov-save-btn');
          if(btn) btn.disabled = false;
        } else {
          deptSelect.value = '';
          deptSelect.disabled = false;
        }
        
        document.getElementById('prov-role').value = ws.role;
        document.getElementById('prov-login').value = ws.canLogin;
        document.getElementById('prov-status').value = ws.status;
        document.getElementById('prov-userid').value = ws.userId || '';
        document.getElementById('prov-password').value = ws.password || '';
        document.getElementById('prov-notes').value = ws.notes || '';
      }
    } else {
      document.getElementById('prov-edit-id').value = '';
      document.getElementById('prov-employee').value = '';
      document.getElementById('prov-employee').disabled = false;
      document.getElementById('prov-name').value = '';
      var deptSelect = document.getElementById('prov-dept');
      deptSelect.value = '';
      deptSelect.disabled = false;
      document.getElementById('prov-role').selectedIndex = 0;
      document.getElementById('prov-login').value = 'Yes';
      document.getElementById('prov-status').value = 'Active';
      document.getElementById('prov-userid').value = '';
      document.getElementById('prov-password').value = '';
      document.getElementById('prov-notes').value = '';
    }
  }
  
  function closeWorkspaceProvisioning() {
    var dv = document.getElementById('ws-dashboard-view');
    var pv = document.getElementById('ws-provisioning-view');
    if(dv) dv.style.display = 'block';
    if(pv) pv.style.display = 'none';
    renderWorkspaceDirectory();
  }
  
  function onProvEmployeeChange() {
    var empId = document.getElementById('prov-employee').value;
    var deptSelect = document.getElementById('prov-dept');
    if(!empId) {
      deptSelect.value = '';
      deptSelect.disabled = false;
      return;
    }
    
    var workspaces = getEmpWorkspaces();
    var existing = workspaces.find(function(w) { return w.employeeId === empId; });
    if(existing) {
      toast('Employee already has a workspace. Switching to Edit mode.', 'info');
      openWorkspaceProvisioning(existing.id);
      return;
    }
    
    var members = state.members || [];
    var emp = members.find(function(m) { return m.id === empId; });
    if (!emp) {
      var ts = localStorage.getItem('verde_os_team_employees');
      if (ts) { try { var te = JSON.parse(ts); emp = te.find(function(t) { return t.id === empId; }); } catch(e) {} }
    }
    if(emp) {
      document.getElementById('prov-name').value = emp.name + " Workspace";
      var deptSelect = document.getElementById('prov-dept');
      if(emp.department) {
        var dExists = false;
        for(var i=0; i<deptSelect.options.length; i++) {
          if(deptSelect.options[i].value === emp.department) { dExists = true; break; }
        }
        if(!dExists) deptSelect.innerHTML += '<option value="' + esc(emp.department) + '">' + esc(emp.department) + '</option>';
        deptSelect.value = emp.department;
        deptSelect.disabled = true;
        
        var btn = document.getElementById('prov-save-btn');
        if(btn) btn.disabled = false;
      } else {
        deptSelect.value = '';
        deptSelect.disabled = false;
      }
    }
  }
  
  function saveEmpWorkspace() {
    var id = document.getElementById('prov-edit-id').value;
    var employeeId = document.getElementById('prov-employee').value;
    var name = document.getElementById('prov-name').value.trim();
    var dept = document.getElementById('prov-dept').value;
    var role = document.getElementById('prov-role').value;
    var canLogin = document.getElementById('prov-login').value;
    var status = document.getElementById('prov-status').value;
    var userId = document.getElementById('prov-userid').value.trim();
    var password = document.getElementById('prov-password').value;
    var notes = document.getElementById('prov-notes').value.trim();
    
    if(!dept) {
      toast('A valid Department is required.', 'error');
      return;
    }
    if(!employeeId || !name) {
      toast('Employee and Workspace Name are required.', 'error');
      return;
    }
    if(canLogin === 'Yes') {
      if(!userId || !password) {
        toast('User ID and Password are required when Can Login is Yes.', 'error');
        return;
      }
    }
    
    var list = getEmpWorkspaces();
    
    // Validate User ID uniqueness
    if(userId) {
      var isDuplicate = list.some(function(w) { return w.userId === userId && w.id !== id; });
      if(isDuplicate) {
        toast('User ID is already taken by another workspace.', 'error');
        return;
      }
    }
    
    var members = state.members || [];
    var emp = members.find(function(m) { return m.id === employeeId; });
    if (!emp) {
      var ts = localStorage.getItem('verde_os_team_employees');
      if (ts) { try { var te = JSON.parse(ts); emp = te.find(function(t) { return t.id === employeeId; }); } catch(e) {} }
    }
    
    if(id) {
      var idx = list.findIndex(function(w) { return w.id === id; });
      if(idx > -1) {
        list[idx].name = name;
        list[idx].role = role;
        list[idx].canLogin = canLogin;
        list[idx].status = status;
        list[idx].userId = userId;
        if (password) {
          list[idx].password = password; // Only overwrite if provided, though required if canLogin
        } else if (canLogin === 'No') {
          list[idx].password = ''; // Clear if canLogin is No and empty
        }
        list[idx].notes = notes;
        list[idx].lastUpdated = new Date().toISOString();
        saveEmpWorkspaces(list);
        toast('Workspace updated successfully', 'success');
      }
      closeWorkspaceProvisioning();
    } else {
      var newWs = {
        id: 'WS-' + Math.floor(1000 + Math.random() * 9000),
        employeeId: employeeId,
        employeeName: emp ? emp.name : 'Unknown',
        department: dept,
        role: role,
        canLogin: canLogin,
        status: status,
        userId: userId,
        password: password,
        notes: notes,
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      if (canLogin === 'Yes' && window.VERDE_FIREBASE_CONFIG && window.firebase) {
        toast('Provisioning secure Auth account...', 'info');
        
        var secondaryApp;
        try {
          secondaryApp = firebase.initializeApp(window.VERDE_FIREBASE_CONFIG, "Secondary");
        } catch(e) {
           secondaryApp = firebase.app("Secondary");
        }

        secondaryApp.auth().createUserWithEmailAndPassword(userId, password)
          .then(function() {
            secondaryApp.auth().signOut().then(function() {
              secondaryApp.delete();
            });
            
            list.push(newWs);
            saveEmpWorkspaces(list);
            toast('Workspace and Secure Login created successfully', 'success');
            closeWorkspaceProvisioning();
          })
          .catch(function(error) {
            if(secondaryApp) secondaryApp.delete();
            toast('Firebase Error: ' + error.message, 'error');
          });
      } else {
        list.push(newWs);
        saveEmpWorkspaces(list);
        toast('Workspace created successfully', 'success');
        closeWorkspaceProvisioning();
      }
    }
  }
  
  function renderWorkspaceDirectory() {
    var tbody = document.getElementById('wd-tbody');
    if(!tbody) return;
    
    var list = getEmpWorkspaces();
    
    // Get filters
    var elSearch = document.getElementById('wd-search');
    var elDept = document.getElementById('wd-filter-dept');
    var elRole = document.getElementById('wd-filter-role');
    var elStatus = document.getElementById('wd-filter-status');
    var elLogin = document.getElementById('wd-filter-login');
    
    var search = elSearch ? (elSearch.value || '').toLowerCase() : '';
    var filterDept = elDept ? elDept.value : '';
    var filterRole = elRole ? elRole.value : '';
    var filterStatus = elStatus ? elStatus.value : '';
    var filterLogin = elLogin ? elLogin.value : '';
    
    var activeCount = 0;
    var loginCount = 0;
    var deptsSet = {};
    
    var filtered = list.filter(function(w) {
      if(w.status === 'Active') activeCount++;
      if(w.canLogin === 'Yes') loginCount++;
      if(w.department) deptsSet[w.department] = true;
      
      if(search && w.name.toLowerCase().indexOf(search) === -1 && (w.employeeName || '').toLowerCase().indexOf(search) === -1) return false;
      if(filterDept && w.department !== filterDept) return false;
      if(filterRole && w.role !== filterRole) return false;
      if(filterStatus && w.status !== filterStatus) return false;
      if(filterLogin && w.canLogin !== filterLogin) return false;
      return true;
    });
    
    // Update dashboard
    var tTotal = document.getElementById('wd-total');
    if(tTotal) tTotal.innerText = list.length;
    var tActive = document.getElementById('wd-active');
    if(tActive) tActive.innerText = activeCount;
    var tLogin = document.getElementById('wd-login');
    if(tLogin) tLogin.innerText = loginCount;
    var tDepts = document.getElementById('wd-depts');
    if(tDepts) tDepts.innerText = Object.keys(deptsSet).length;
    
    if(filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-3); font-size:13px;">No workspaces found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map(function(w) {
      var d = new Date(w.createdDate);
      var dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      var badge = w.status === 'Active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Inactive</span>';
      return '<tr style="border-bottom:1px solid var(--border);">' +
        '<td style="padding:12px 16px; font-size:13px; font-weight:500; color:var(--text-1);">' + esc(w.name) + '</td>' +
        '<td style="padding:12px 16px; font-size:13px;">' + esc(w.employeeName) + '</td>' +
        '<td style="padding:12px 16px; font-size:13px;">' + esc(w.department || '-') + '</td>' +
        '<td style="padding:12px 16px; font-size:13px;">' + esc(w.role) + '</td>' +
        '<td style="padding:12px 16px; font-size:13px;">' + (w.canLogin === 'Yes' ? 'Yes' : 'No') + '</td>' +
        '<td style="padding:12px 16px;">' + badge + '</td>' +
        '<td style="padding:12px 16px; font-size:13px; color:var(--text-2);">' + dateStr + '</td>' +
        '<td style="padding:12px 16px; text-align:right;">' +
          '<button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="window._ws.toggleEmpWorkspaceMenu(\'' + w.id + '\', this)">Options</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    
    // Also populate dept filter if needed
    if(elDept && elDept.options.length <= 1) {
      var dlist = getDepts().filter(function(d){ return d.status === 'Active'; });
      elDept.innerHTML = '<option value="">All Depts</option>' + dlist.map(function(d){ return '<option value="'+esc(d.name)+'">'+esc(d.name)+'</option>';}).join('');
    }
  }
  
  function toggleEmpWorkspace(id) {
    var list = getEmpWorkspaces();
    var idx = list.findIndex(function(w) { return w.id === id; });
    if(idx > -1) {
      list[idx].status = list[idx].status === 'Active' ? 'Inactive' : 'Active';
      var actionStr = list[idx].status === 'Active' ? 'Workspace Enabled' : 'Workspace Disabled';
      
      saveEmpWorkspaces(list);
      toast('Workspace ' + list[idx].status.toLowerCase(), 'success');
      renderWorkspaceDirectory();
    }
  }
  
  /* ══════════════════════════════════════════════════════════════════════════
     Action Menu Portal
     ══════════════════════════════════════════════════════════════════════════ */
  function getEmpWsPortal() {
    var el = document.getElementById('emp-ws-action-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'emp-ws-action-portal';
      el.style.cssText = 'position:fixed; z-index:9999; display:none; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-md); min-width:180px; padding:4px 0;';
      document.body.appendChild(el);
    }
    return el;
  }

  function wsMenuItem(label, color, disabled, onclick) {
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
  function wsMenuDivider() {
    var el = document.createElement('div');
    el.style.cssText = 'height:1px; background:var(--border); margin:4px 0;';
    return el;
  }

  function toggleEmpWorkspaceMenu(id, btn) {
    var portal = getEmpWsPortal();
    if (portal.dataset.activeId === id && portal.style.display === 'block') {
      portal.style.display = 'none';
      portal.dataset.activeId = '';
      return;
    }

    var w = getEmpWorkspaces().find(function (x) { return x.id === id; });
    if (!w) return;

    portal.innerHTML = '';
    portal.appendChild(wsMenuItem('Edit Workspace', 'var(--text-1)', false, function () { portal.style.display = 'none'; window._ws.openWorkspaceProvisioning(id); }));
    
    var user = window.VERDE_SESSION ? window.VERDE_SESSION.getUser() : null;
    var isMgmt = user && ['SuperAdmin', 'Admin', 'CEO', 'Co-Founder'].indexOf(user.role) > -1;
    if (isMgmt) {
      portal.appendChild(wsMenuItem('Manage Permissions', 'var(--text-1)', false, function () { portal.style.display = 'none'; window._ws.openManagePermissions(id); }));
    }

    portal.appendChild(wsMenuItem(w.status === 'Active' ? 'Disable Workspace' : 'Enable Workspace', 'var(--text-1)', false, function () { portal.style.display = 'none'; window._ws.toggleEmpWorkspace(id); }));
    portal.appendChild(wsMenuDivider());
    portal.appendChild(wsMenuItem('Delete Workspace', 'var(--danger)', false, function () { portal.style.display = 'none'; window._ws.confirmDeleteEmpWorkspace(id); }));

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
  }

  function confirmDeleteEmpWorkspace(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_edit')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var ws = getEmpWorkspaces().find(function(w) { return w.id === id; });
    if(!ws) return;
    
    if (window.VerdeModal && window.VerdeModal.confirm) {
      window.VerdeModal.confirm({
        title: 'Delete Workspace',
        body: '<p style="color:var(--text-2);">Are you sure you want to delete this workspace? This action cannot be undone.</p>',
        confirmText: 'Delete Workspace',
        isDanger: true,
        onConfirm: function() {
          deleteEmpWorkspace(id);
        }
      });
    } else {
      var body = '<div style="padding:16px 0; font-size:14px; color:var(--text-2);">Are you sure you want to delete this workspace? This action cannot be undone.</div>';
      var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-del-emp-ws\')">Cancel</button>' +
                   '<button class="btn btn-primary btn-danger" style="background:var(--danger);" onclick="window._ws.deleteEmpWorkspace(\'' + id + '\'); window._ws.closeModal(\'ws-m-del-emp-ws\');">Delete Workspace</button>';
      openModal('ws-m-del-emp-ws', 'Delete Workspace', body, footer);
    }
  }
  
  function deleteEmpWorkspace(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_edit')) { if(window.toast) toast('Access Denied', 'error'); return; }
    var list = getEmpWorkspaces();
    var targetWs = list.find(function(w) { return w.id === id; });
    
    var next = list.filter(function(w) { return w.id !== id; });
    saveEmpWorkspaces(next);
    closeModal('ws-m-del-emp-ws');
    toast('Workspace deleted', 'success');
    renderWorkspaceDirectory();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     15. SEARCH
     ══════════════════════════════════════════════════════════════════════════ */

  function wireSearch() {
    var searchInput = document.querySelector('.ws-search input');
    if (!searchInput || searchInput._wired) return;
    searchInput._wired = true;

    searchInput.addEventListener('input', function () {
      var q = searchInput.value.toLowerCase().trim();

      // Filter dept cards
      document.querySelectorAll('.ws-dept-card').forEach(function (card) {
        card.style.display = card.textContent.toLowerCase().includes(q) || !q ? '' : 'none';
      });

      // Filter integration cards
      document.querySelectorAll('.ws-int-card').forEach(function (card) {
        card.style.display = card.textContent.toLowerCase().includes(q) || !q ? '' : 'none';
      });

      // Filter preference items
      var prefList = document.querySelector('.ws-half-grid .ws-box:nth-child(1) .ws-list');
      if (prefList) {
        prefList.querySelectorAll('.ws-list-item').forEach(function (item) {
          item.style.display = item.textContent.toLowerCase().includes(q) || !q ? '' : 'none';
        });
      }

      // Filter security items
      var secList = document.querySelector('.ws-half-grid .ws-box:nth-child(2) .ws-list');
      if (secList) {
        secList.querySelectorAll('.ws-list-item').forEach(function (item) {
          item.style.display = item.textContent.toLowerCase().includes(q) || !q ? '' : 'none';
        });
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     16. WIRE EDIT PROFILE BUTTON
     ══════════════════════════════════════════════════════════════════════════ */

  function wireEditProfile() {
    var editBtn = document.querySelector('.ws-profile-header .btn-secondary');
    if (editBtn) editBtn.onclick = function () { openEditProfile(); };
  }

  /* ══════════════════════════════════════════════════════════════════════════
     17. EXPOSE PUBLIC API
     ══════════════════════════════════════════════════════════════════════════ */


  /* ==========================================================================
     ORGANIZATION PROFILE (FEATURE EXTENSION)
     ========================================================================== */
  
  function getOrgProfile() {
    var stored = localStorage.getItem('organizationProfile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch(e) {}
    }
    return {
      orgName: '',
      legalName: '',
      orgCode: '',
      industry: '',
      companySize: '',
      email: '',
      phone: '',
      website: '',
      country: '',
      state: '',
      city: '',
      address: '',
      postalCode: '',
      timezone: '',
      currency: '',
      foundedDate: '',
      description: '',
      logo: ''
    };
  }

  function saveOrgProfileData(data) {
    localStorage.setItem('organizationProfile', JSON.stringify(data));
  }

  function openOrganizationProfile() {
    var p = getOrgProfile();
    
    var logoHtml = 
      '<div style="display:flex;gap:20px;margin-bottom:20px;align-items:center;">' +
        '<div id="org-logo-preview" style="width:80px;height:80px;border-radius:8px;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
          (p.logo ? '<img src="'+esc(p.logo)+'" style="width:100%;height:100%;object-fit:cover;">' : '<span style="color:var(--text-3);font-size:12px;">No Logo</span>') +
        '</div>' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:4px;">Organization Logo</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'org-logo-file\').click()">Upload</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.removeOrgLogo()">Remove</button>' +
          '</div>' +
          '<input type="file" id="org-logo-file" accept="image/*" style="display:none;" onchange="window._ws.handleOrgLogo(this)">' +
          '<input type="hidden" id="org-logo-data" value="'+esc(p.logo)+'">' +
        '</div>' +
      '</div>';

    var formHtml = 
      row2(fieldHTML('Organization Name *', inputHTML('org-name', p.orgName)), fieldHTML('Legal Business Name', inputHTML('org-legal', p.legalName))) +
      row2(fieldHTML('Organization Code', inputHTML('org-code', p.orgCode)), fieldHTML('Industry', inputHTML('org-industry', p.industry))) +
      row2(fieldHTML('Company Size', inputHTML('org-size', p.companySize)), fieldHTML('Founded Date', inputHTML('org-founded', p.foundedDate, 'date'))) +
      row2(fieldHTML('Business Email', inputHTML('org-email', p.email, 'email')), fieldHTML('Phone Number', inputHTML('org-phone', p.phone))) +
      row2(fieldHTML('Website', inputHTML('org-website', p.website)), fieldHTML('Currency', inputHTML('org-currency', p.currency))) +
      row2(fieldHTML('Country', inputHTML('org-country', p.country)), fieldHTML('State/Province', inputHTML('org-state', p.state))) +
      row2(fieldHTML('City', inputHTML('org-city', p.city)), fieldHTML('Postal Code', inputHTML('org-postal', p.postalCode))) +
      fieldHTML('Address', textareaHTML('org-addr', p.address)) +
      fieldHTML('Time Zone', inputHTML('org-tz', p.timezone)) +
      fieldHTML('Description', textareaHTML('org-desc', p.description));
      
    var body = logoHtml + formHtml;

    var footer = 
      '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.resetOrgProfile()">Reset Profile</button>' +
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-orgprofile\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveOrganizationProfile()">Save Changes</button>';
      
    openModal('ws-m-orgprofile', 'Organization Profile', body, footer, '650px');
  }

  function handleOrgLogo(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('org-logo-data').value = e.target.result;
        var prev = document.getElementById('org-logo-preview');
        if(prev) prev.innerHTML = '<img src="'+esc(e.target.result)+'" style="width:100%;height:100%;object-fit:cover;">';
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function removeOrgLogo() {
    document.getElementById('org-logo-data').value = '';
    var prev = document.getElementById('org-logo-preview');
    if(prev) prev.innerHTML = '<span style="color:var(--text-3);font-size:12px;">No Logo</span>';
  }

  function saveOrganizationProfile() {
    var name = val('org-name');
    if (!name) { toast('Organization Name is required', 'error'); return; }
    
    var email = val('org-email');
    if (email && !email.includes('@')) { toast('Invalid Business Email', 'error'); return; }
    
    var website = val('org-website');
    if (website && !website.includes('.')) { toast('Invalid Website URL', 'error'); return; }
    
    var data = {
      orgName: name,
      legalName: val('org-legal'),
      orgCode: val('org-code'),
      industry: val('org-industry'),
      companySize: val('org-size'),
      email: email,
      phone: val('org-phone'),
      website: website,
      country: val('org-country'),
      state: val('org-state'),
      city: val('org-city'),
      address: val('org-addr'),
      postalCode: val('org-postal'),
      timezone: val('org-tz'),
      currency: val('org-currency'),
      foundedDate: val('org-founded'),
      description: val('org-desc'),
      logo: val('org-logo-data')
    };
    
    saveOrgProfileData(data);
    toast('Organization Profile saved successfully', 'success');
    closeModal('ws-m-orgprofile');
  }

  function resetOrgProfile() {
    openModal('ws-m-org-reset-confirm', 'Reset Organization Profile?', 
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to completely reset the Organization Profile? This action cannot be undone.</div>', 
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-org-reset-confirm\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmResetOrgProfile()">Reset</button>', '400px');
  }

  function confirmResetOrgProfile() {
    localStorage.removeItem('organizationProfile');
    toast('Organization Profile reset', 'success');
    closeModal('ws-m-org-reset-confirm');
    closeModal('ws-m-orgprofile');
    openOrganizationProfile(); // Re-open in blank state
  }

  window._ws = {
    openOrganizationProfile: openOrganizationProfile,
    handleOrgLogo: handleOrgLogo,
    removeOrgLogo: removeOrgLogo,
    saveOrganizationProfile: saveOrganizationProfile,
    resetOrgProfile: resetOrgProfile,
    confirmResetOrgProfile: confirmResetOrgProfile,
    openCreateWorkspace: openCreateWorkspace,
    saveWorkspace: saveWorkspace,
    closeModal: closeModal,
    saveProfile: saveProfile,
    openWorkspaceProvisioning: openWorkspaceProvisioning,
    closeWorkspaceProvisioning: closeWorkspaceProvisioning,
    onProvEmployeeChange: onProvEmployeeChange,
    saveEmpWorkspace: saveEmpWorkspace,
    toggleEmpWorkspace: toggleEmpWorkspace,
    toggleEmpWorkspaceMenu: toggleEmpWorkspaceMenu,
    handleLogoUpload: handleLogoUpload,
    openManagePermissions: openManagePermissions,
    saveManagePermissions: saveManagePermissions,
    deleteEmpWorkspace: deleteEmpWorkspace,
    confirmDeleteEmpWorkspace: confirmDeleteEmpWorkspace,
    openCreateDept: openCreateDept,
    openViewDept: openViewDept,
    openEditDept: openEditDept,
    saveDept: saveDept,
    deleteDept: deleteDept,
    confirmDeleteDept: confirmDeleteDept,
    toggleDeptStatus: toggleDeptStatus,
    connectIntegration: connectIntegration,
    disconnectIntegration: disconnectIntegration,
    confirmDisconnect: confirmDisconnect,
    saveIntegration: saveIntegration,
    copyApiKey: copyApiKey,
    savePref: savePref,
    toggleTFA: toggleTFA,
    terminateSession: terminateSession,
    openTFAModal: openTFAModal,
    openSessionsModal: openSessionsModal,
    openLoginHistoryModal: openLoginHistoryModal,
    openAPIKeysModal: openAPIKeysModal,
    generateAPIKey: generateAPIKey,
    confirmGenerateKey: confirmGenerateKey,
    revokeAPIKey: revokeAPIKey,
    confirmRevokeKey: confirmRevokeKey,
    copyGeneratedKey: copyGeneratedKey,
    saveInviteMember: saveInviteMember
  };

  /* ══════════════════════════════════════════════════════════════════════════
     18. ADMIN PERMISSION MANAGEMENT
     ══════════════════════════════════════════════════════════════════════════ */

  var PERM_MODULES = [
    { id: 'dashboard', name: 'Mission Control' },
    { id: 'my-work', name: 'My Work' },
    { id: 'crm', name: 'CRM & Sales' },
    { id: 'projects', name: 'Projects' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'team', name: 'Team' },
    { id: 'finance', name: 'Finance' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'ai-hub', name: 'AI Hub' },
    { id: 'workspace', name: 'Workspace' },
    { id: 'reports', name: 'Reports' },
    { id: 'settings', name: 'Settings' }
  ];

  var PERM_ACTIONS = [
    { id: 'projects_view', name: 'View Projects', group: 'Projects' },
    { id: 'projects_create', name: 'Create Projects', group: 'Projects' },
    { id: 'projects_edit', name: 'Edit Projects', group: 'Projects' },
    { id: 'projects_delete', name: 'Delete Projects', group: 'Projects' },
    
    { id: 'tasks_view', name: 'View Tasks', group: 'Tasks' },
    { id: 'tasks_create', name: 'Create Tasks', group: 'Tasks' },
    { id: 'tasks_edit', name: 'Edit Tasks', group: 'Tasks' },
    { id: 'tasks_delete', name: 'Delete Tasks', group: 'Tasks' },
    { id: 'tasks_assign', name: 'Assign Tasks', group: 'Tasks' },
    
    { id: 'crm_view', name: 'View Leads', group: 'CRM' },
    { id: 'crm_create', name: 'Create Leads', group: 'CRM' },
    { id: 'crm_edit', name: 'Edit Leads', group: 'CRM' },
    { id: 'crm_delete', name: 'Delete Leads', group: 'CRM' },
    
    { id: 'finance_view', name: 'View Finance', group: 'Finance' },
    { id: 'finance_create', name: 'Create Transactions', group: 'Finance' },
    { id: 'finance_edit', name: 'Edit Transactions', group: 'Finance' },
    { id: 'finance_delete', name: 'Delete Transactions', group: 'Finance' },
    
    { id: 'team_view', name: 'View Team', group: 'Team' },
    { id: 'team_add', name: 'Add Employees', group: 'Team' },
    { id: 'team_edit', name: 'Edit Employees', group: 'Team' },
    { id: 'team_remove', name: 'Remove Employees', group: 'Team' },
    
    { id: 'workspace_view', name: 'View Workspace', group: 'Workspace' },
    { id: 'workspace_create', name: 'Create Workspace', group: 'Workspace' },
    { id: 'workspace_edit', name: 'Edit Workspace', group: 'Workspace' },
    { id: 'workspace_dept', name: 'Manage Departments', group: 'Workspace' },
    { id: 'workspace_perms', name: 'Manage Permissions', group: 'Workspace' },
    
    { id: 'reports_view', name: 'View Reports', group: 'Reports' },
    { id: 'reports_export', name: 'Export Reports', group: 'Reports' },
    
    { id: 'settings_view', name: 'View Settings', group: 'Settings' },
    { id: 'settings_edit', name: 'Modify Settings', group: 'Settings' }
  ];

  function openManagePermissions(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_perms')) {
      toast('Access Denied. Admin privileges required.', 'error');
      return;
    }

    var w = getEmpWorkspaces().find(function (x) { return x.id === id; });
    if (!w) return;

    var modHtml = '';
    PERM_MODULES.forEach(function(m) {
      modHtml += '<label style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--border); border-radius:8px; cursor:pointer; margin-bottom:8px;">' +
                 '<span style="font-weight:600; font-size:13px; color:var(--text-1);">' + m.name + '</span>' +
                 '<input type="checkbox" id="perm-mod-' + m.id + '" value="' + m.id + '" style="accent-color:var(--primary); width:16px; height:16px; cursor:pointer;">' +
                 '</label>';
    });

    var actHtml = '';
    var lastGroup = '';
    PERM_ACTIONS.forEach(function(a) {
      if (a.group !== lastGroup) {
        actHtml += '<div style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase; margin-top:16px; margin-bottom:8px;">' + a.group + '</div>';
        lastGroup = a.group;
      }
      actHtml += '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; margin-bottom:8px;">' +
                 '<input type="checkbox" id="perm-act-' + a.id + '" value="' + a.id + '" style="accent-color:var(--primary); width:14px; height:14px; cursor:pointer;">' +
                 '<span style="font-weight:500; font-size:13px; color:var(--text-2);">' + a.name + '</span>' +
                 '</label>';
    });

    var body = 
      '<div style="margin-bottom:24px; padding:16px; background:var(--bg-2); border-radius:12px; border:1px solid var(--border);">' +
        '<div style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:4px;">' + esc(w.employeeName) + '</div>' +
        '<div style="font-size:13px; font-weight:500; color:var(--text-2);">' + esc(w.name) + ' &bull; ' + esc(w.role) + '</div>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:32px;">' +
        '<div>' +
          '<h3 style="font-size:13px; font-weight:800; color:var(--text-2); text-transform:uppercase; margin-bottom:16px;">Module Access</h3>' +
          modHtml +
        '</div>' +
        '<div>' +
          '<h3 style="font-size:13px; font-weight:800; color:var(--text-2); text-transform:uppercase; margin-bottom:16px;">Action Permissions</h3>' +
          actHtml +
        '</div>' +
      '</div>';

    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\'ws-m-perms\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveManagePermissions(\'' + id + '\')">Save Permissions</button>';

    openModal('ws-m-perms', 'Manage Permissions', body, footer, '750px');

    setTimeout(function() {
      var allPerms = {};
      try {
        var raw = localStorage.getItem('verde_permissions');
        if (raw) allPerms = JSON.parse(raw);
      } catch(e) {}
      
      var uId = w.userId;
      var userPerms = allPerms[uId];
      if (!userPerms) {
        userPerms = { modules: {}, actions: {} };
        var isTargetMgmt = ['SuperAdmin', 'Admin', 'CEO', 'Co-Founder'].indexOf(w.role) > -1;
        PERM_MODULES.forEach(function(m) { userPerms.modules[m.id] = isTargetMgmt; });
        PERM_ACTIONS.forEach(function(a) { userPerms.actions[a.id] = isTargetMgmt; });
        if (!isTargetMgmt) {
          ['dashboard', 'my-work', 'tasks', 'projects'].forEach(function(m) { userPerms.modules[m] = true; });
          ['tasks_view', 'tasks_edit', 'projects_view'].forEach(function(a) { userPerms.actions[a] = true; });
        }
      }

      PERM_MODULES.forEach(function(m) {
        var el = document.getElementById('perm-mod-' + m.id);
        if (el) el.checked = userPerms.modules[m.id] === true;
      });
      PERM_ACTIONS.forEach(function(a) {
        var el = document.getElementById('perm-act-' + a.id);
        if (el) el.checked = userPerms.actions[a.id] === true;
      });
    }, 50);
  }

  function saveManagePermissions(id) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('workspace_perms')) {
      toast('Access Denied. Admin privileges required.', 'error');
      return;
    }

    var w = getEmpWorkspaces().find(function (x) { return x.id === id; });
    if (!w) return;
    
    var userPerms = { modules: {}, actions: {} };
    PERM_MODULES.forEach(function(m) {
      var el = document.getElementById('perm-mod-' + m.id);
      if (el) userPerms.modules[m.id] = el.checked;
    });
    PERM_ACTIONS.forEach(function(a) {
      var el = document.getElementById('perm-act-' + a.id);
      if (el) userPerms.actions[a.id] = el.checked;
    });

    var allPerms = {};
    try {
      var raw = localStorage.getItem('verde_permissions');
      if (raw) allPerms = JSON.parse(raw);
    } catch(e) {}
    
    allPerms[w.userId] = userPerms;
    localStorage.setItem('verde_permissions', JSON.stringify(allPerms));
    
    closeModal('ws-m-perms');
    toast('Permissions saved for ' + w.employeeName, 'success');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     19. INITIALIZATION
     ══════════════════════════════════════════════════════════════════════════ */

  function init() {
    renderProfile();
    wireEditProfile();
    renderKPIs();
    renderDepartments();
    renderWorkspaceDirectory();
    wireIntegrations();
    renderPreferences();
    renderSecurity();
    wireQuickActions();
    wireSearch();
    
    // Wire department filters
    var dSearch = document.getElementById('dept-search');
    var dFilter = document.getElementById('dept-status-filter');
    if(dSearch) dSearch.addEventListener('input', renderDepartments);
    if(dFilter) dFilter.addEventListener('change', renderDepartments);
    
    // Wire directory filters
    ['wd-search', 'wd-filter-dept', 'wd-filter-role', 'wd-filter-status', 'wd-filter-login'].forEach(function(fid) {
      var el = document.getElementById(fid);
      if(el) el.addEventListener(fid === 'wd-search' ? 'input' : 'change', renderWorkspaceDirectory);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
