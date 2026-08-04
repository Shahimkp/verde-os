/* ==========================================================================
   VERDE OS — SETTINGS & ADMINISTRATION CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'verde_admin_settings';

  var defaults = {
    appName: 'VERDE OS',
    orgName: 'VERDE LABS',
    dashboard: 'Mission Control',
    timezone: 'UTC+05:30',
    weekStart: 'Monday',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    coName: 'VERDE LABS',
    coLogo: '',
    coEmail: 'info@verdelabs.co',
    coPhone: '+91 9876543210',
    coWeb: 'https://verdelabs.co',
    coGst: '',
    coAddr: '',
    coCurrency: 'INR',
    locLang: 'English',
    locCurrency: 'INR',
    locNumFmt: '1,00,000.00',
    locDateFmt: 'DD/MM/YYYY',
    locTz: 'UTC+05:30',
    appTheme: 'System',
    appColor: '#10b981',
    appSidebar: 'Full',
    appCompact: false,
    appAnims: true,
    secTimeout: '30',
    secPwPolicy: 'Standard',
    sec2fa: true,
    secLoginNotif: true,
    secDevTrust: false
  };

  var settings = {};

  function loadSettings() {
    var s = localStorage.getItem(STORAGE_KEY);
    settings = s ? Object.assign({}, defaults, JSON.parse(s)) : Object.assign({}, defaults);
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  // ── TAB SWITCHING ── //
  window.switchSetTab = function (tabId) {
    document.querySelectorAll('.set-tab').forEach(function (t) {
      t.classList.remove('active');
      t.style.borderBottomColor = 'transparent';
      t.style.color = 'var(--text-3)';
      t.style.fontWeight = '600';
    });
    document.querySelectorAll('.set-tab-content').forEach(function (v) { v.style.display = 'none'; });

    var viewEl = document.getElementById('stab-' + tabId);
    if (viewEl) viewEl.style.display = 'block';

    document.querySelectorAll('.set-tab').forEach(function (t) {
      if (t.textContent.trim().toLowerCase() === tabId) {
        t.classList.add('active');
        t.style.borderBottomColor = 'var(--primary)';
        t.style.color = 'var(--text-1)';
        t.style.fontWeight = '800';
      }
    });
  };

  // ── POPULATE ALL INPUTS FROM STATE ── //
  function populateUI() {
    function setVal(id, val) { var el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = val; else el.value = val; } }

    setVal('gs-app-name', settings.appName);
    setVal('gs-org-name', settings.orgName);
    setVal('gs-dashboard', settings.dashboard);
    setVal('gs-timezone', settings.timezone);
    setVal('gs-weekstart', settings.weekStart);
    setVal('gs-dateformat', settings.dateFormat);
    setVal('gs-timeformat', settings.timeFormat);

    setVal('gs-co-name', settings.coName);
    setVal('gs-co-email', settings.coEmail);
    setVal('gs-co-phone', settings.coPhone);
    setVal('gs-co-web', settings.coWeb);
    setVal('gs-co-gst', settings.coGst);
    setVal('gs-co-addr', settings.coAddr);
    setVal('gs-co-currency', settings.coCurrency);

    if (settings.coLogo) {
      var prev = document.getElementById('co-logo-preview');
      if (prev) prev.innerHTML = '<img src="' + settings.coLogo + '" style="width:100%; height:100%; object-fit:cover; border-radius:16px;">';
    }

    setVal('gs-loc-lang', settings.locLang);
    setVal('gs-loc-currency', settings.locCurrency);
    setVal('gs-loc-numfmt', settings.locNumFmt);
    setVal('gs-loc-datefmt', settings.locDateFmt);
    setVal('gs-loc-tz', settings.locTz);

    setVal('gs-app-theme', settings.appTheme);
    setVal('gs-app-color', settings.appColor);
    var colorLabel = document.getElementById('gs-color-label');
    if (colorLabel) colorLabel.textContent = settings.appColor;
    setVal('gs-app-sidebar', settings.appSidebar);
    setVal('gs-app-compact', settings.appCompact);
    setVal('gs-app-anims', settings.appAnims);

    setVal('gs-sec-timeout', settings.secTimeout);
    setVal('gs-sec-pwpolicy', settings.secPwPolicy);
    setVal('gs-sec-2fa', settings.sec2fa);
    setVal('gs-sec-loginnotif', settings.secLoginNotif);
    setVal('gs-sec-devtrust', settings.secDevTrust);

    // Apply appearance live
    applyAppearance();
  }

  // ── GATHER ALL INPUTS INTO STATE ── //
  function gatherUI() {
    function getVal(id) { var el = document.getElementById(id); if (!el) return undefined; return el.type === 'checkbox' ? el.checked : el.value; }

    settings.appName = getVal('gs-app-name') || settings.appName;
    settings.orgName = getVal('gs-org-name') || settings.orgName;
    settings.dashboard = getVal('gs-dashboard') || settings.dashboard;
    settings.timezone = getVal('gs-timezone') || settings.timezone;
    settings.weekStart = getVal('gs-weekstart') || settings.weekStart;
    settings.dateFormat = getVal('gs-dateformat') || settings.dateFormat;
    settings.timeFormat = getVal('gs-timeformat') || settings.timeFormat;

    settings.coName = getVal('gs-co-name') || settings.coName;
    settings.coEmail = getVal('gs-co-email') || settings.coEmail;
    settings.coPhone = getVal('gs-co-phone') || settings.coPhone;
    settings.coWeb = getVal('gs-co-web') || settings.coWeb;
    settings.coGst = getVal('gs-co-gst') || '';
    settings.coAddr = getVal('gs-co-addr') || '';
    settings.coCurrency = getVal('gs-co-currency') || settings.coCurrency;

    settings.locLang = getVal('gs-loc-lang') || settings.locLang;
    settings.locCurrency = getVal('gs-loc-currency') || settings.locCurrency;
    settings.locNumFmt = getVal('gs-loc-numfmt') || settings.locNumFmt;
    settings.locDateFmt = getVal('gs-loc-datefmt') || settings.locDateFmt;
    settings.locTz = getVal('gs-loc-tz') || settings.locTz;

    settings.appTheme = getVal('gs-app-theme') || settings.appTheme;
    settings.appColor = getVal('gs-app-color') || settings.appColor;
    settings.appSidebar = getVal('gs-app-sidebar') || settings.appSidebar;
    var compactVal = getVal('gs-app-compact');
    if (compactVal !== undefined) settings.appCompact = compactVal;
    var animsVal = getVal('gs-app-anims');
    if (animsVal !== undefined) settings.appAnims = animsVal;

    settings.secTimeout = getVal('gs-sec-timeout') || settings.secTimeout;
    settings.secPwPolicy = getVal('gs-sec-pwpolicy') || settings.secPwPolicy;
    var v2fa = getVal('gs-sec-2fa');
    if (v2fa !== undefined) settings.sec2fa = v2fa;
    var vLogin = getVal('gs-sec-loginnotif');
    if (vLogin !== undefined) settings.secLoginNotif = vLogin;
    var vTrust = getVal('gs-sec-devtrust');
    if (vTrust !== undefined) settings.secDevTrust = vTrust;

    saveSettings();
  }

  // ── APPLY APPEARANCE LIVE ── //
  function applyAppearance() {
    // Primary color
    if (settings.appColor) {
      document.documentElement.style.setProperty('--primary', settings.appColor);
    }

    // Animations toggle
    if (!settings.appAnims) {
      document.documentElement.style.setProperty('--transition-speed', '0s');
    } else {
      document.documentElement.style.removeProperty('--transition-speed');
    }
  }

  // ── AUTO-SAVE BINDINGS ── //
  document.querySelectorAll('.gs-inp').forEach(function (inp) {
    inp.addEventListener('change', function () {
      gatherUI();
      applyAppearance();
    });
    inp.addEventListener('input', function () {
      // Live update color label
      if (inp.id === 'gs-app-color') {
        var lbl = document.getElementById('gs-color-label');
        if (lbl) lbl.textContent = inp.value;
      }
      gatherUI();
    });
  });

  // ── LOGO UPLOAD ── //
  var logoInput = document.getElementById('gs-co-logo');
  if (logoInput) {
    logoInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        settings.coLogo = ev.target.result;
        var prev = document.getElementById('co-logo-preview');
        if (prev) prev.innerHTML = '<img src="' + ev.target.result + '" style="width:100%; height:100%; object-fit:cover; border-radius:16px;">';
        saveSettings();
      };
      reader.readAsDataURL(file);
    });
  }

  // ── BACKUP ACTIONS ── //
  window.exportAppSettings = function () {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    var a = document.createElement('a');
    a.href = dataStr;
    a.download = 'verde_admin_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (window.VerdeToast) window.VerdeToast.show('Settings Exported', 'success');
  };

  window.importAppSettings = function (e) {
    var file = e.target.files[0];
    if (!file) return;

    if (window.VerdeModal) {
      window.VerdeModal.confirm('Import Settings', 'This will replace all current settings with the imported file. Continue?', function () {
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var imported = JSON.parse(ev.target.result);
            settings = Object.assign({}, defaults, imported);
            saveSettings();
            populateUI();
            if (window.VerdeToast) window.VerdeToast.show('Settings Imported', 'success');
          } catch (err) {
            if (window.VerdeToast) window.VerdeToast.show('Invalid settings file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  };

  window.resetAppSettings = function () {
    if (window.VerdeModal) {
      window.VerdeModal.confirm('Reset Settings', 'Are you sure you want to reset all administration settings to factory defaults? This cannot be undone.', function () {
        settings = Object.assign({}, defaults);
        saveSettings();
        populateUI();
        if (window.VerdeToast) window.VerdeToast.show('Settings Reset to Defaults', 'success');
      });
    }
  };

  // ── INIT ── //
  loadSettings();
  populateUI();



  /* ==========================================================================
     ROLES & PERMISSIONS LOGIC
     ========================================================================== */

  var ROLES_KEY = 'verde_admin_roles';
  var USER_ROLES_KEY = 'verde_admin_user_roles';

  var modulesList = [
    'Dashboard', 'CRM & Sales', 'Projects', 'Tasks', 'Team', 'Finance', 'Marketing', 'AI Hub', 'Workspace', 'Reports', 'Settings'
  ];

  var permsList = ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'];

  var defaultAdminMatrix = {};
  modulesList.forEach(function(m) {
    defaultAdminMatrix[m] = { View: true, Create: true, Edit: true, Delete: true, Export: true, Manage: true };
  });

  var roles = [];
  var userRoles = [];

  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function loadRoles() {
    var r = localStorage.getItem(ROLES_KEY);
    if (r) {
      roles = JSON.parse(r);
    } else {
      // Default Admin role
      roles = [{
        id: 'ROL-001',
        name: 'Administrator',
        desc: 'Full system access',
        status: 'Active',
        matrix: defaultAdminMatrix
      }];
      saveRoles();
    }

    var ur = localStorage.getItem(USER_ROLES_KEY);
    if (ur) {
      userRoles = JSON.parse(ur);
    } else {
      userRoles = [];
      saveUserRoles();
    }
  }

  function saveRoles() {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  }

  function saveUserRoles() {
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(userRoles));
  }

  // ── RENDER ROLES TABLE ── //
  window.renderRolesTable = function() {
    var tbody = document.getElementById('roles-table-body');
    if (!tbody) return;

    var search = (document.getElementById('role-search').value || '').toLowerCase();
    var filter = document.getElementById('role-filter').value || 'All';

    var html = '';
    roles.forEach(function(role) {
      if (search && !role.name.toLowerCase().includes(search) && !role.desc.toLowerCase().includes(search)) return;
      if (filter !== 'All' && role.status !== filter) return;

      var statusBadge = role.status === 'Active' 
        ? '<span class="badge badge-success">Active</span>' 
        : '<span class="badge badge-neutral">Inactive</span>';

      html += `
        <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
          <td style="padding:16px; font-size:14px; font-weight:700; color:var(--text-1);">${role.name}</td>
          <td style="padding:16px; font-size:13px; color:var(--text-2);">${role.desc}</td>
          <td style="padding:16px;">${statusBadge}</td>
          <td style="padding:16px; text-align:right;">
            <button class="btn btn-ghost btn-sm" onclick="window.openRoleActions(event, '${role.id}')" style="padding:4px; color:var(--text-3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
          </td>
        </tr>
      `;
    });

    if (!html) html = '<tr><td colspan="4" style="padding:32px; text-align:center; color:var(--text-3); font-size:14px;">No roles found</td></tr>';
    tbody.innerHTML = html;
  };

  // ── RENDER USER ROLES TABLE ── //
  window.renderUserRolesTable = function() {
    var tbody = document.getElementById('user-roles-table-body');
    var roleFilterEl = document.getElementById('user-role-filter');
    if (!tbody) return;

    // Populate role filter dropdown once if empty (except "All")
    if (roleFilterEl && roleFilterEl.options.length <= 1) {
      roles.forEach(function(r) {
        var opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        roleFilterEl.appendChild(opt);
      });
    }

    var search = (document.getElementById('user-role-search').value || '').toLowerCase();
    var filter = roleFilterEl ? roleFilterEl.value : 'All';

    var html = '';
    userRoles.forEach(function(ur) {
      // Find employee details from mock data
      var emp = window.VerdeMockData && window.VerdeMockData.employees ? window.VerdeMockData.employees.find(e => e.id === ur.empId) : null;
      var empName = emp ? emp.name : 'Unknown User';
      var initials = emp ? emp.initials : 'UU';
      
      var role = roles.find(r => r.id === ur.roleId);
      var roleName = role ? role.name : 'Deleted Role';

      if (search && !empName.toLowerCase().includes(search)) return;
      if (filter !== 'All' && ur.roleId !== filter) return;

      var statusBadge = ur.status === 'Active' 
        ? '<span class="badge badge-success">Active</span>' 
        : '<span class="badge badge-warning">Suspended</span>';

      html += `
        <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
          <td style="padding:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${initials}</div>
              <div style="font-size:14px; font-weight:600; color:var(--text-1);">${empName}</div>
            </div>
          </td>
          <td style="padding:16px; font-size:13px; font-weight:600; color:var(--text-2);">${roleName}</td>
          <td style="padding:16px; font-size:13px; color:var(--text-3);">${ur.assignedDate}</td>
          <td style="padding:16px;">${statusBadge}</td>
          <td style="padding:16px; text-align:right;">
            <button class="btn btn-ghost btn-sm" onclick="window.openAssignModal('${ur.id}')" style="padding:4px; color:var(--text-3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.removeUserRole('${ur.id}')" style="padding:4px; color:var(--danger); margin-left:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `;
    });

    if (!html) html = '<tr><td colspan="5" style="padding:32px; text-align:center; color:var(--text-3); font-size:14px;">No assignments found</td></tr>';
    tbody.innerHTML = html;
  };

  // ── ROLE CRUD ── //
  window.openRoleEditor = function(roleId = null, duplicate = false) {
    document.getElementById('roles-list-view').style.display = 'none';
    document.getElementById('roles-editor-view').style.display = 'block';

    var isEdit = roleId && !duplicate;
    document.getElementById('role-editor-title').textContent = duplicate ? 'Duplicate Role' : (isEdit ? 'Edit Role' : 'Create Role');
    
    var role = null;
    if (roleId) {
      role = roles.find(r => r.id === roleId);
    }

    document.getElementById('role-id').value = isEdit ? roleId : '';
    document.getElementById('role-name').value = role ? (duplicate ? role.name + ' (Copy)' : role.name) : '';
    document.getElementById('role-desc').value = role ? role.desc : '';
    document.getElementById('role-status').value = role ? role.status : 'Active';

    var matrixBody = document.getElementById('role-matrix-body');
    var mHtml = '';

    modulesList.forEach(function(m, idx) {
      var view = role && role.matrix && role.matrix[m] && role.matrix[m].View ? 'checked' : '';
      var create = role && role.matrix && role.matrix[m] && role.matrix[m].Create ? 'checked' : '';
      var edit = role && role.matrix && role.matrix[m] && role.matrix[m].Edit ? 'checked' : '';
      var del = role && role.matrix && role.matrix[m] && role.matrix[m].Delete ? 'checked' : '';
      var exp = role && role.matrix && role.matrix[m] && role.matrix[m].Export ? 'checked' : '';
      var manage = role && role.matrix && role.matrix[m] && role.matrix[m].Manage ? 'checked' : '';

      var bg = idx % 2 === 0 ? 'transparent' : 'var(--bg-2)';

      mHtml += `
        <tr style="background:${bg}; border-bottom:1px solid var(--border-light);">
          <td style="padding:12px 16px; text-align:left; font-size:13px; font-weight:600; color:var(--text-1);">${m}</td>
          <td><input type="checkbox" class="cb-view" data-mod="${m}" ${view}></td>
          <td><input type="checkbox" class="cb-create" data-mod="${m}" ${create}></td>
          <td><input type="checkbox" class="cb-edit" data-mod="${m}" ${edit}></td>
          <td><input type="checkbox" class="cb-del" data-mod="${m}" ${del}></td>
          <td><input type="checkbox" class="cb-exp" data-mod="${m}" ${exp}></td>
          <td><input type="checkbox" class="cb-manage" data-mod="${m}" ${manage}></td>
        </tr>
      `;
    });
    matrixBody.innerHTML = mHtml;

    
  };

  
  window.closeRoleEditor = function() {
    document.getElementById('roles-editor-view').style.display = 'none';
    document.getElementById('roles-list-view').style.display = 'block';
  };

  window.saveRole = function() {
    var id = document.getElementById('role-id').value;
    var name = document.getElementById('role-name').value;
    var desc = document.getElementById('role-desc').value;
    var status = document.getElementById('role-status').value;

    if (!name.trim()) {
      if (window.VerdeToast) window.VerdeToast.show('Role Name is required', 'error');
      return;
    }

    var matrix = {};
    modulesList.forEach(function(m) {
      var tr = Array.from(document.getElementById('role-matrix-body').querySelectorAll('tr')).find(r => r.querySelector(`input[data-mod="${m}"]`));
      if (tr) {
        matrix[m] = {
          View: tr.querySelector('.cb-view').checked,
          Create: tr.querySelector('.cb-create').checked,
          Edit: tr.querySelector('.cb-edit').checked,
          Delete: tr.querySelector('.cb-del').checked,
          Export: tr.querySelector('.cb-exp').checked,
          Manage: tr.querySelector('.cb-manage').checked,
        };
      }
    });

    if (id) {
      var idx = roles.findIndex(r => r.id === id);
      if (idx > -1) {
        roles[idx].name = name;
        roles[idx].desc = desc;
        roles[idx].status = status;
        roles[idx].matrix = matrix;
      }
    } else {
      roles.push({
        id: 'ROL-' + generateId().toUpperCase(),
        name: name,
        desc: desc,
        status: status,
        matrix: matrix
      });
    }

    saveRoles();
    window.renderRolesTable();
    window.renderUserRolesTable(); // in case a role name changed
    
    // update assignment dropdown if needed
    var roleFilterEl = document.getElementById('user-role-filter');
    if (roleFilterEl) {
        roleFilterEl.innerHTML = '<option value="All">All Roles</option>';
    }

    window.closeRoleEditor();
    if (window.VerdeToast) window.VerdeToast.show(id ? 'Role Updated' : 'Role Created', 'success');
  };

  window.deleteRole = function(id) {
    if (window.VerdeModal) {
      window.VerdeModal.confirm('Delete Role', 'Are you sure you want to delete this role? This will not affect active users immediately, but they will lose permissions.', function() {
        roles = roles.filter(r => r.id !== id);
        saveRoles();
        window.renderRolesTable();
        // update assignment dropdown if needed
        var roleFilterEl = document.getElementById('user-role-filter');
        if (roleFilterEl) {
            roleFilterEl.innerHTML = '<option value="All">All Roles</option>';
        }
        window.renderUserRolesTable();
        if (window.VerdeToast) window.VerdeToast.show('Role Deleted', 'success');
      });
    }
  };

  // ── USER ROLE ASSIGNMENT CRUD ── //
  window.openAssignModal = function(urId = null) {
    var modal = document.getElementById('assign-modal');
    if (!modal) return;

    document.getElementById('assign-modal-title').textContent = urId ? 'Change Assignment' : 'Assign Role';
    document.getElementById('assign-id').value = urId || '';

    var empSelect = document.getElementById('assign-employee');
    var roleSelect = document.getElementById('assign-role');

    // Populate employees from mock data
    empSelect.innerHTML = '';
    if (window.VerdeMockData && window.VerdeMockData.employees) {
      window.VerdeMockData.employees.forEach(function(e) {
        var opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.name + ' (' + e.role + ')';
        empSelect.appendChild(opt);
      });
    }

    // Populate roles
    roleSelect.innerHTML = '';
    roles.forEach(function(r) {
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      roleSelect.appendChild(opt);
    });

    if (urId) {
      var ur = userRoles.find(u => u.id === urId);
      if (ur) {
        empSelect.value = ur.empId;
        roleSelect.value = ur.roleId;
        document.getElementById('assign-status').value = ur.status;
      }
    } else {
      document.getElementById('assign-status').value = 'Active';
    }

    
  };

  window.saveUserRole = function() {
    var id = document.getElementById('assign-id').value;
    var empId = document.getElementById('assign-employee').value;
    var roleId = document.getElementById('assign-role').value;
    var status = document.getElementById('assign-status').value;

    if (!empId || !roleId) {
      if (window.VerdeToast) window.VerdeToast.show('Please select employee and role', 'error');
      return;
    }

    // Check for duplicates if creating new
    if (!id && userRoles.some(u => u.empId === empId)) {
      if (window.VerdeToast) window.VerdeToast.show('This employee already has a role assigned. Please edit the existing assignment.', 'error');
      return;
    }

    if (id) {
      var idx = userRoles.findIndex(u => u.id === id);
      if (idx > -1) {
        userRoles[idx].empId = empId;
        userRoles[idx].roleId = roleId;
        userRoles[idx].status = status;
      }
    } else {
      var today = new Date();
      var dateStr = today.toLocaleString('default', { month: 'short' }) + ' ' + today.getDate() + ', ' + today.getFullYear();
      
      userRoles.push({
        id: 'UR-' + generateId().toUpperCase(),
        empId: empId,
        roleId: roleId,
        assignedDate: dateStr,
        status: status
      });
    }

    saveUserRoles();
    window.renderUserRolesTable();
    document.getElementById('assign-modal').style.display = 'none';
    if (window.VerdeToast) window.VerdeToast.show('Assignment Saved', 'success');
  };

  window.removeUserRole = function(id) {
    if (window.VerdeModal) {
      window.VerdeModal.confirm('Remove Assignment', 'Are you sure you want to remove this role assignment? The employee will lose access.', function() {
        userRoles = userRoles.filter(u => u.id !== id);
        saveUserRoles();
        window.renderUserRolesTable();
        if (window.VerdeToast) window.VerdeToast.show('Assignment Removed', 'success');
      });
    }
  };

  // ── EXTERNAL ACTION MENU (Unclipped) ── //
  var currentActionRole = null;
  var actionMenuEl = null;

  function createActionMenu() {
    if (actionMenuEl) return;
    actionMenuEl = document.createElement('div');
    actionMenuEl.style.position = 'absolute';
    actionMenuEl.style.background = 'var(--bg-1)';
    actionMenuEl.style.border = '1px solid var(--border)';
    actionMenuEl.style.borderRadius = '8px';
    actionMenuEl.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    actionMenuEl.style.zIndex = '99999';
    actionMenuEl.style.display = 'none';
    actionMenuEl.style.minWidth = '140px';
    actionMenuEl.style.padding = '8px 0';
    
    actionMenuEl.innerHTML = `
      <div onclick="window.closeActionMenu(); window.openRoleEditor(currentActionRole)" style="padding:10px 16px; font-size:13px; font-weight:600; color:var(--text-1); cursor:pointer; display:flex; gap:8px; align-items:center;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View
      </div>
      <div onclick="window.closeActionMenu(); window.openRoleEditor(currentActionRole)" style="padding:10px 16px; font-size:13px; font-weight:600; color:var(--text-1); cursor:pointer; display:flex; gap:8px; align-items:center;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit
      </div>
      <div onclick="window.closeActionMenu(); window.openRoleEditor(currentActionRole, true)" style="padding:10px 16px; font-size:13px; font-weight:600; color:var(--text-1); cursor:pointer; display:flex; gap:8px; align-items:center;" onmouseover="this.style.background='var(--bg-2)'" onmouseout="this.style.background='transparent'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Duplicate
      </div>
      <div style="height:1px; background:var(--border); margin:4px 0;"></div>
      <div onclick="window.closeActionMenu(); window.deleteRole(currentActionRole)" style="padding:10px 16px; font-size:13px; font-weight:600; color:var(--danger); cursor:pointer; display:flex; gap:8px; align-items:center;" onmouseover="this.style.background='var(--danger-10)'" onmouseout="this.style.background='transparent'">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete
      </div>
    `;
    document.body.appendChild(actionMenuEl);

    document.addEventListener('click', function(e) {
      if (actionMenuEl && actionMenuEl.style.display === 'block' && !e.target.closest('.action-btn')) {
        actionMenuEl.style.display = 'none';
      }
    });
  }

  window.openRoleActions = function(e, id) {
    e.stopPropagation();
    currentActionRole = id;
    if (!actionMenuEl) createActionMenu();
    
    var rect = e.currentTarget.getBoundingClientRect();
    actionMenuEl.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    actionMenuEl.style.left = (rect.right + window.scrollX - 140) + 'px'; // align right
    actionMenuEl.style.display = 'block';
    e.currentTarget.classList.add('action-btn'); // for click outside logic
  };

  window.closeActionMenu = function() {
    if (actionMenuEl) actionMenuEl.style.display = 'none';
  };

  // ── INIT ROLES ── //
  loadRoles();
  setTimeout(function() {
    window.renderRolesTable();
    window.renderUserRolesTable();
  }, 100);


})();


// ==========================================
// NOTIFICATIONS MODULE
// ==========================================

const NOTIF_STORAGE_KEY = 'verde_admin_notifications';

let notifData = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY));
if (!notifData) {
  notifData = {
    templates: [
      { id: "NT-001", title: "System Alert", category: "System", message: "A system event has occurred.", priority: "High", status: "Active" },
      { id: "NT-002", title: "Welcome Onboard", category: "Onboarding", message: "Welcome to VERDE OS!", priority: "Medium", status: "Active" }
    ],
    channels: [
      { name: "Email", enabled: true, isDefault: true },
      { name: "In-App", enabled: true, isDefault: true },
      { name: "SMS", enabled: false, isDefault: false },
      { name: "Push", enabled: false, isDefault: false },
      { name: "Webhook", enabled: false, isDefault: false }
    ],
    events: [
      { name: "New Lead", enabled: true },
      { name: "Project Created", enabled: true },
      { name: "Task Assigned", enabled: true },
      { name: "Task Completed", enabled: false },
      { name: "Leave Request", enabled: true },
      { name: "Payroll Generated", enabled: true },
      { name: "Invoice Paid", enabled: true },
      { name: "Expense Added", enabled: true },
      { name: "Campaign Published", enabled: true },
      { name: "AI Workflow Finished", enabled: true },
      { name: "Settings Changed", enabled: false },
      { name: "Role Changed", enabled: false },
      { name: "Permission Changed", enabled: false },
      { name: "System Backup", enabled: true }
    ],
    deliveryRule: "Instant",
    history: [
      { id: "NH-001", date: "2026-08-04", title: "System Backup Complete", recipient: "Admin User", channel: "Email", priority: "Low", status: "Sent" },
      { id: "NH-002", date: "2026-08-03", title: "New Lead Assigned", recipient: "Sales Team", channel: "In-App", priority: "Medium", status: "Sent" },
      { id: "NH-003", date: "2026-08-02", title: "Failed Login Attempt", recipient: "Admin User", channel: "Email", priority: "Critical", status: "Pending" }
    ]
  };
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifData));
}

function saveNotifData() {
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifData));
}

// ------------------------------------------
// NOTIFICATION TEMPLATES
// ------------------------------------------
window.renderNotifTemplates = function() {
  const tbody = document.getElementById('notif-templates-body');
  if (!tbody) return;
  let html = '';
  if (notifData.templates.length === 0) {
    html = `<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-3);">No templates found.</td></tr>`;
  } else {
    notifData.templates.forEach(t => {
      let badgeColor = 'var(--primary)';
      if (t.priority === 'Critical') badgeColor = '#ff4d4f';
      if (t.priority === 'High') badgeColor = '#faad14';
      if (t.priority === 'Low') badgeColor = 'var(--text-3)';
      
      let statusColor = t.status === 'Active' ? '#52c41a' : 'var(--text-3)';

      html += `
        <tr style="border-bottom:1px solid var(--border-light);">
          <td style="padding:16px; font-size:13px; font-weight:600; color:var(--text-1);">${t.title}</td>
          <td style="padding:16px; font-size:13px; color:var(--text-2);">${t.category}</td>
          <td style="padding:16px; font-size:13px;"><span style="background:${badgeColor}20; color:${badgeColor}; padding:4px 8px; border-radius:4px; font-weight:700; font-size:11px;">${t.priority}</span></td>
          <td style="padding:16px; font-size:13px;"><span style="color:${statusColor}; font-weight:600;">${t.status}</span></td>
          <td style="padding:16px; position:relative; text-align:right;">
            <button class="btn btn-ghost" onclick="window.toggleActionMenu(event, 'notif-tpl-action-${t.id}')" style="padding:4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
            <div id="notif-tpl-action-${t.id}" class="action-menu" style="display:none; position:fixed; background:var(--bg-1); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:8px; z-index:99999; width:140px; text-align:left;">
              <div class="action-item" onclick="window.openNotifTemplateModal('${t.id}')">Edit</div>
              <div class="action-item" onclick="window.openNotifTemplateModal('${t.id}', true)">Duplicate</div>
              <div class="action-item" style="color:#ff4d4f;" onclick="window.deleteNotifTemplate('${t.id}')">Delete</div>
            </div>
          </td>
        </tr>
      `;
    });
  }
  tbody.innerHTML = html;
};

window.openNotifTemplateModal = function(id = null, duplicate = false) {
  const modal = document.getElementById('notif-template-modal');
  if (!modal) return;
  document.getElementById('notif-template-modal-title').innerText = id && !duplicate ? 'Edit Template' : 'Create Template';
  
  if (id) {
    const t = notifData.templates.find(x => x.id === id);
    if (t) {
      document.getElementById('notif-tpl-id').value = duplicate ? '' : t.id;
      document.getElementById('notif-tpl-title').value = t.title + (duplicate ? ' (Copy)' : '');
      document.getElementById('notif-tpl-category').value = t.category;
      document.getElementById('notif-tpl-status').value = t.status;
      document.getElementById('notif-tpl-priority').value = t.priority;
      document.getElementById('notif-tpl-message').value = t.message;
    }
  } else {
    document.getElementById('notif-tpl-id').value = '';
    document.getElementById('notif-tpl-title').value = '';
    document.getElementById('notif-tpl-category').value = '';
    document.getElementById('notif-tpl-status').value = 'Active';
    document.getElementById('notif-tpl-priority').value = 'Medium';
    document.getElementById('notif-tpl-message').value = '';
  }
  modal.style.display = 'flex';
};

window.saveNotifTemplate = function() {
  const id = document.getElementById('notif-tpl-id').value;
  const title = document.getElementById('notif-tpl-title').value.trim();
  const category = document.getElementById('notif-tpl-category').value.trim();
  const status = document.getElementById('notif-tpl-status').value;
  const priority = document.getElementById('notif-tpl-priority').value;
  const message = document.getElementById('notif-tpl-message').value.trim();

  if (!title) {
    if (window.VerdeToast) window.VerdeToast.show('Title is required.', 'error');
    return;
  }

  if (id) {
    const idx = notifData.templates.findIndex(x => x.id === id);
    if (idx !== -1) {
      notifData.templates[idx] = { id, title, category, status, priority, message };
    }
  } else {
    const newId = 'NT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    notifData.templates.push({ id: newId, title, category, status, priority, message });
  }

  saveNotifData();
  window.renderNotifTemplates();
  document.getElementById('notif-template-modal').style.display = 'none';
  if (window.VerdeToast) window.VerdeToast.show('Template saved.', 'success');
};

window.deleteNotifTemplate = function(id) {
  if (window.VerdeModal && window.VerdeModal.confirm) {
    window.VerdeModal.confirm('Delete Template', 'Are you sure you want to delete this template?', () => {
      notifData.templates = notifData.templates.filter(x => x.id !== id);
      saveNotifData();
      window.renderNotifTemplates();
      if (window.VerdeToast) window.VerdeToast.show('Template deleted.', 'success');
    });
  } else {
    if(confirm("Are you sure?")) {
      notifData.templates = notifData.templates.filter(x => x.id !== id);
      saveNotifData();
      window.renderNotifTemplates();
    }
  }
};

// ------------------------------------------
// CHANNELS & EVENTS
// ------------------------------------------
window.renderNotifChannels = function() {
  const cont = document.getElementById('notif-channels-body');
  if (!cont) return;
  let html = `<div style="display:flex; flex-direction:column; gap:16px;">`;
  notifData.channels.forEach((c, idx) => {
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid var(--border-light);">
        <div style="font-size:13px; font-weight:600; color:var(--text-1);">${c.name}</div>
        <div style="display:flex; gap:24px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-2); cursor:pointer;">
            <input type="checkbox" onchange="window.updateChannel(${idx}, 'enabled', this.checked)" ${c.enabled ? 'checked' : ''}>
            Enabled
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-2); cursor:pointer;">
            <input type="checkbox" onchange="window.updateChannel(${idx}, 'isDefault', this.checked)" ${c.isDefault ? 'checked' : ''}>
            Default
          </label>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  cont.innerHTML = html;
};

window.updateChannel = function(idx, field, val) {
  notifData.channels[idx][field] = val;
  saveNotifData();
  if (window.VerdeToast) window.VerdeToast.show('Channel settings updated.', 'success');
};

window.renderNotifEvents = function() {
  const cont = document.getElementById('notif-events-body');
  if (!cont) return;
  let html = `<div style="display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto; padding-right:8px;">`;
  notifData.events.forEach((e, idx) => {
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:13px; font-weight:600; color:var(--text-2);">${e.name}</div>
        <label style="display:flex; align-items:center; cursor:pointer;">
          <input type="checkbox" onchange="window.updateEvent(${idx}, this.checked)" ${e.enabled ? 'checked' : ''}>
        </label>
      </div>
    `;
  });
  html += `</div>`;
  cont.innerHTML = html;
};

window.updateEvent = function(idx, val) {
  notifData.events[idx].enabled = val;
  saveNotifData();
  if (window.VerdeToast) window.VerdeToast.show('Event settings updated.', 'success');
};

// ------------------------------------------
// DELIVERY RULES
// ------------------------------------------
window.renderNotifDelivery = function() {
  const radios = document.getElementsByName('notif-delivery');
  radios.forEach(r => {
    if (r.value === notifData.deliveryRule) {
      r.checked = true;
    }
  });
};

window.saveNotifDelivery = function() {
  const radios = document.getElementsByName('notif-delivery');
  let val = 'Instant';
  radios.forEach(r => { if(r.checked) val = r.value; });
  notifData.deliveryRule = val;
  saveNotifData();
  if (window.VerdeToast) window.VerdeToast.show('Delivery rule updated.', 'success');
};

// ------------------------------------------
// NOTIFICATION HISTORY
// ------------------------------------------
window.renderNotifHistory = function() {
  const tbody = document.getElementById('notif-hist-body');
  if (!tbody) return;
  
  const search = (document.getElementById('notif-hist-search')?.value || '').toLowerCase();
  const pri = document.getElementById('notif-hist-filter-pri')?.value || 'All';
  const stat = document.getElementById('notif-hist-filter-stat')?.value || 'All';
  const chan = document.getElementById('notif-hist-filter-chan')?.value || 'All';

  let filtered = notifData.history.filter(h => {
    if (search && !h.title.toLowerCase().includes(search) && !h.recipient.toLowerCase().includes(search)) return false;
    if (pri !== 'All' && h.priority !== pri) return false;
    if (stat !== 'All' && h.status !== stat) return false;
    if (chan !== 'All' && h.channel !== chan) return false;
    return true;
  });

  let html = '';
  if (filtered.length === 0) {
    html = `<tr><td colspan="7" style="padding:24px; text-align:center; color:var(--text-3);">No history found.</td></tr>`;
  } else {
    filtered.forEach(h => {
      let badgeColor = 'var(--primary)';
      if (h.priority === 'Critical') badgeColor = '#ff4d4f';
      if (h.priority === 'High') badgeColor = '#faad14';
      if (h.priority === 'Low') badgeColor = 'var(--text-3)';
      
      let statusColor = h.status === 'Sent' ? '#52c41a' : (h.status === 'Failed' ? '#ff4d4f' : '#faad14');

      html += `
        <tr style="border-bottom:1px solid var(--border-light);">
          <td style="padding:16px; font-size:13px; color:var(--text-2);">${h.date}</td>
          <td style="padding:16px; font-size:13px; font-weight:600; color:var(--text-1);">${h.title}</td>
          <td style="padding:16px; font-size:13px; color:var(--text-2);">${h.recipient}</td>
          <td style="padding:16px; font-size:13px; color:var(--text-2);">${h.channel}</td>
          <td style="padding:16px; font-size:13px;"><span style="background:${badgeColor}20; color:${badgeColor}; padding:4px 8px; border-radius:4px; font-weight:700; font-size:11px;">${h.priority}</span></td>
          <td style="padding:16px; font-size:13px;"><span style="color:${statusColor}; font-weight:600;">${h.status}</span></td>
          <td style="padding:16px; position:relative; text-align:right;">
            <button class="btn btn-ghost" onclick="window.toggleActionMenu(event, 'notif-hist-action-${h.id}')" style="padding:4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
            <div id="notif-hist-action-${h.id}" class="action-menu" style="display:none; position:fixed; background:var(--bg-1); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:8px; z-index:99999; width:120px; text-align:left;">
              <div class="action-item" onclick="if(window.VerdeToast) window.VerdeToast.show('Viewing details...', 'info');">View</div>
              <div class="action-item" onclick="window.resendNotifHistory('${h.id}')">Resend</div>
              <div class="action-item" style="color:#ff4d4f;" onclick="window.deleteNotifHistory('${h.id}')">Delete</div>
            </div>
          </td>
        </tr>
      `;
    });
  }
  tbody.innerHTML = html;
};

window.resendNotifHistory = function(id) {
  if (window.VerdeToast) window.VerdeToast.show('Notification resent.', 'success');
};

window.deleteNotifHistory = function(id) {
  if (window.VerdeModal && window.VerdeModal.confirm) {
    window.VerdeModal.confirm('Delete History', 'Are you sure you want to delete this record?', () => {
      notifData.history = notifData.history.filter(x => x.id !== id);
      saveNotifData();
      window.renderNotifHistory();
      if (window.VerdeToast) window.VerdeToast.show('Record deleted.', 'success');
    });
  } else {
    if(confirm("Are you sure?")) {
      notifData.history = notifData.history.filter(x => x.id !== id);
      saveNotifData();
      window.renderNotifHistory();
    }
  }
};
