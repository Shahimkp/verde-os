#!/usr/bin/env python3
"""
Rebuild workspace.js by:
1. Extracting the clean uncorrupted sections
2. Removing all duplicate CRUD injections
3. Reconstructing the corrupted openMemberDetail and openInviteMember functions
4. Placing CRUD, Org Profile, and Workspace Members code ONCE at the correct location
"""
import io
import re

path = r'c:\verde studios\verde labs erp\app\workspace\workspace.js'
with io.open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# === PART 1: Clean header (lines 1-349) ===
part1 = ''.join(lines[0:349])  # lines 1-349 (0-indexed: 0-348)

# === PART 2: Reconstruct openMemberDetail ===
part2 = """
  function openMemberDetail(id) {
    var m = state.members.find(function(x){ return x.id === id; });
    if(!m) return;
    
    var roleOpts = state.roles.map(function(r){ return {label:r.name, value:r.id}; });
    var deptOpts = [{label:'None',value:''}].concat(state.departments.map(function(d){ return {label:d.name, value:d.id}; }));

    var actHtml = '';
    if(m.status === 'Pending') actHtml = '<button class="btn btn-ghost" onclick="window._ws.resendInvite(\\'\\'+m.id+\\'\\')">Resend Invite</button>';
    else if(m.status === 'Suspended') actHtml = '<button class="btn btn-ghost" style="color:var(--success);" onclick="window._ws.actionMember(\\'\\'+m.id+\\'\\', \\'restore\\')">Restore Account</button>';
    else actHtml = '<button class="btn btn-ghost" style="color:var(--warning);" onclick="window._ws.actionMember(\\'\\'+m.id+\\'\\', \\'suspend\\')">Suspend Account</button>';

    var body =
      '<div style="display:flex;gap:16px;margin-bottom:20px;padding:16px;background:var(--bg);border-radius:12px;">' +
        '<div><div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Joined</div><div style="font-size:13px;color:var(--text-1);margin-top:4px;">'+m.joined+'</div></div>' +
        '<div style="border-left:1px solid var(--border);"></div>' +
        '<div><div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Last Active</div><div style="font-size:13px;color:var(--text-1);margin-top:4px;">'+m.lastActive+'</div></div>' +
      '</div>' +
      '<input type="hidden" id="md-id" value="'+m.id+'">' +
      row2( fieldHTML('Name', inputHTML('md-name', m.name)), fieldHTML('Email', inputHTML('md-email', m.email, 'email')) ) +
      row2( fieldHTML('Role', selectHTML('md-role', roleOpts, m.roleId)), fieldHTML('Department', selectHTML('md-dept', deptOpts, m.deptId)) );

    var footer = '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.actionMember(\\'\\'+m.id+\\'\\', \\'delete\\')">Remove</button>' +
                 actHtml +
                 '<button class="btn btn-primary" onclick="window._ws.saveMemberDetail(this)">Save Changes</button>';
    openModal('ws-m-memdetail', 'Edit Member: ' + m.name, body, footer, '600px');
  }

"""

# === PART 3: saveMemberDetail through resendInvite (lines 742-768) ===
part3 = ''.join(lines[741:768])  # 0-indexed

# === PART 4: Reconstruct openInviteMember ===
part4 = """
  function openInviteMember() {
    var roleOpts = state.roles.map(function(r){ return {label:r.name, value:r.id}; });
    var deptOpts = [{label:'None',value:''}].concat(state.departments.map(function(d){ return {label:d.name, value:d.id}; }));
    var body =
      row2( fieldHTML('Full Name', inputHTML('inv-name', ''), true), fieldHTML('Email Address', inputHTML('inv-email', '', 'email'), true) ) +
      row2( fieldHTML('Role', selectHTML('inv-role', roleOpts, '')), fieldHTML('Department', selectHTML('inv-dept', deptOpts, '')) ) +
      '<div style="margin-top:20px;padding:16px;background:var(--bg-2);border-radius:12px;border:1px solid var(--border);">' +
        '<div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px;text-transform:uppercase;">Email Preview</div>' +
        '<div style="font-size:14px;color:var(--text-1);"><strong>Subject:</strong> You have been invited to join VERDE LABS</div>' +
        '<div style="font-size:13px;color:var(--text-2);margin-top:8px;">Hello, you have been invited to access the VERDE OS workspace as a team member. Click the link below to set up your account.</div>' +
      '</div>';
    var footer = '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-invite\\')">Cancel</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.sendInvite(this)">Send Invitation</button>';
    openModal('ws-m-invite', 'Invite Member', body, footer, '600px');
  }

"""

# === PART 5: sendInvite (lines 1150-1161) ===
part5 = ''.join(lines[1149:1161])

# === PART 6: Roles & Permissions Matrix (section 7, lines 1163-1257) ===
part6 = ''.join(lines[1162:1257])

# === PART 7: Activity Log (section 8, lines 1259-1276) ===
part7 = ''.join(lines[1258:1276])

# === PART 8: Departments - reconstructed openEditDept and openCreateDept ===
part8 = """
  /* ══════════════════════════════════════════════════════════════════════════
     9. DEPARTMENTS (Extended)
     ══════════════════════════════════════════════════════════════════════════ */
  // Inherits rendering from Phase 1 but uses API save/delete.
  function openEditDept(id) {
    var d = state.departments.find(function(x) { return x.id === id; });
    if (!d) return;
    var memOpts = [{label:'None',value:''}].concat(state.members.map(function(m){ return {label:m.name, value:m.id}; }));
    var body =
      '<div style="display:flex;gap:12px;margin-bottom:20px;">' +
        '<div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:24px;font-weight:900;color:var(--primary);">'+d.members.length+'</div><div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:4px;">Members</div>' +
        '</div>' +
        '<div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:24px;font-weight:900;color:var(--success);">'+(d.activity||0)+'</div><div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:4px;">Activities</div>' +
        '</div>' +
      '</div>' +
      '<input type="hidden" id="dp-edit-id" value="' + id + '">' +
      fieldHTML('Department Name', inputHTML('dp-name', d.name), true) +
      fieldHTML('Description', textareaHTML('dp-desc', d.desc || '')) +
      row2( fieldHTML('Department Head', selectHTML('dp-head', memOpts, d.headId)), fieldHTML('Status', selectHTML('dp-status', ['Active', 'Inactive'], d.status)) );
    var footer = '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.deleteDept(\\'\\' + id + \\'\\')">' + 'Delete</button>' +
                 '<button class="btn btn-primary" onclick="window._ws.saveDept(this)">Save Changes</button>';
    openModal('ws-m-dept', 'Edit Department', body, footer, '500px');
  }

  function openCreateDept() {
    var memOpts = [{label:'None',value:''}].concat(state.members.map(function(m){ return {label:m.name, value:m.id}; }));
    var body = fieldHTML('Department Name', inputHTML('dp-name', ''), true) + fieldHTML('Description', textareaHTML('dp-desc', '')) + row2( fieldHTML('Department Head', selectHTML('dp-head', memOpts, '')), fieldHTML('Status', selectHTML('dp-status', ['Active', 'Inactive'], 'Active')) );
    openModal('ws-m-dept', 'Create Department', body, '<button class="btn btn-primary" onclick="window._ws.saveDept(this)">Create Department</button>', '500px');
  }

"""

# === PART 9: saveDept through confirmDeleteDept (lines 1674-1703) ===
part9 = ''.join(lines[1673:1703])

# === PART 10: Quick Actions & Search (section 10, lines 1705-1755) ===
part10 = ''.join(lines[1704:1755])

# === PART 11: Preferences & Security (section 11, lines 1757-1820) ===
part11 = ''.join(lines[1756:1820])

# === PART 12: CRUD (single copy), Organization Profile, Workspace Members ===
part12 = """
  /* ══════════════════════════════════════════════════════════════════════════
     13. WORKSPACE CRUD
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

  function renderWorkspaceTable() {
    var tableBody = document.querySelector('.ws-table tbody');
    if (!tableBody) return;
    var list = getWorkspaces();
    if (list.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-3);">No workspaces found. Create one to get started.</td></tr>';
      return;
    }
    tableBody.innerHTML = list.map(function(ws) {
      var badgeStyle = ws.status === 'Active' ? 'background:rgba(46,204,113,0.1);color:#2ecc71;' : 'background:rgba(231,76,60,0.1);color:#e74c3c;';
      return '<tr>' +
        '<td style="padding:12px;border-bottom:1px solid var(--border);color:var(--text-1);font-weight:600;">' + esc(ws.name) + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid var(--border);color:var(--text-2);">' + esc(ws.type) + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid var(--border);color:var(--text-2);">' + esc(ws.visibility) + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid var(--border);"><span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;' + badgeStyle + '">' + esc(ws.status) + '</span></td>' +
        '<td style="padding:12px;border-bottom:1px solid var(--border);text-align:right;">' +
          '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.viewWorkspace(\\'' + ws.id + '\\')">View</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.editWorkspace(\\'' + ws.id + '\\')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window._ws.deleteWorkspace(\\'' + ws.id + '\\')">Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function updateWorkspaceCounters() {
    var list = getWorkspaces();
    var countEl = document.getElementById('ws-page-count') || document.getElementById('total-workspaces-count');
    if (countEl) countEl.textContent = list.length;
    var activeCount = list.filter(function(ws) { return ws.status === 'Active'; }).length;
    var activeEl = document.getElementById('active-workspaces-count');
    if (activeEl) activeEl.textContent = activeCount;
  }

  function openCreateWorkspace(id) {
    var list = getWorkspaces();
    var ws = { name: '', description: '', type: 'Team', visibility: 'Internal', storage: '50', status: 'Active' };
    var isEdit = false;
    if (id) {
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
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-create\\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveWorkspace()">Save Workspace</button>';
    openModal('ws-m-create', isEdit ? 'Edit Workspace' : 'Create Workspace', body, footer, '500px');
  }

  function editWorkspace(id) { openCreateWorkspace(id); }

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
    saveWorkspaces(list); renderWorkspaceTable(); updateWorkspaceCounters(); closeModal('ws-m-create');
  }

  function viewWorkspace(id) {
    var list = getWorkspaces();
    var ws = list.filter(function(w) { return w.id === id; })[0];
    if (!ws) return;
    var badgeStyle = ws.status === 'Active' ? 'background:rgba(46,204,113,0.1);color:#2ecc71;' : 'background:rgba(231,76,60,0.1);color:#e74c3c;';
    var body =
      '<div style="margin-bottom:15px;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Workspace ID</label><div style="font-size:14px;color:var(--text-1);">' + esc(ws.id) + '</div></div>' +
      '<div style="margin-bottom:15px;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Workspace Name</label><div style="font-size:14px;color:var(--text-1);font-weight:600;">' + esc(ws.name) + '</div></div>' +
      '<div style="margin-bottom:15px;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Description</label><div style="font-size:14px;color:var(--text-1);">' + (esc(ws.description) || '<i>No description</i>') + '</div></div>' +
      '<div style="display:flex;gap:20px;margin-bottom:15px;">' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Type</label><div style="font-size:14px;color:var(--text-1);">' + esc(ws.type) + '</div></div>' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Visibility</label><div style="font-size:14px;color:var(--text-1);">' + esc(ws.visibility) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:20px;margin-bottom:15px;">' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Storage Limit</label><div style="font-size:14px;color:var(--text-1);">' + esc(ws.storage) + ' GB</div></div>' +
        '<div style="flex:1;"><label style="font-size:12px;color:var(--text-3);font-weight:600;display:block;margin-bottom:4px;">Status</label><div><span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;' + badgeStyle + '">' + esc(ws.status) + '</span></div></div>' +
      '</div>';
    openModal('ws-m-view', 'Workspace Details', body, '<button class="btn btn-primary" onclick="window._ws.closeModal(\\'ws-m-view\\')">Close</button>', '450px');
  }

  function deleteWorkspace(id) {
    openModal('ws-m-del-confirm', 'Delete Workspace?',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to delete this workspace? This action cannot be undone.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-del-confirm\\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmDeleteWorkspace(\\'' + id + '\\')">Delete Workspace</button>', '400px');
  }

  function confirmDeleteWorkspace(id) {
    var list = getWorkspaces().filter(function(w) { return w.id !== id; });
    saveWorkspaces(list); toast('Workspace deleted successfully', 'success');
    renderWorkspaceTable(); updateWorkspaceCounters(); closeModal('ws-m-del-confirm');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     14. ORGANIZATION PROFILE
     ══════════════════════════════════════════════════════════════════════════ */
  function getOrgProfile() {
    var stored = localStorage.getItem('organizationProfile');
    if (stored) { try { return JSON.parse(stored); } catch(e) {} }
    return { orgName:'', legalName:'', orgCode:'', industry:'', companySize:'', email:'', phone:'', website:'', country:'', state:'', city:'', address:'', postalCode:'', timezone:'', currency:'', foundedDate:'', description:'', logo:'' };
  }
  function saveOrgProfileData(data) { localStorage.setItem('organizationProfile', JSON.stringify(data)); }

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
            '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(&quot;org-logo-file&quot;).click()">Upload</button>' +
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
    var footer =
      '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.resetOrgProfile()">Reset Profile</button>' +
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-orgprofile\\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveOrganizationProfile()">Save Changes</button>';
    openModal('ws-m-orgprofile', 'Organization Profile', logoHtml + formHtml, footer, '650px');
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
    saveOrgProfileData({
      orgName: name, legalName: val('org-legal'), orgCode: val('org-code'), industry: val('org-industry'),
      companySize: val('org-size'), email: email, phone: val('org-phone'), website: website,
      country: val('org-country'), state: val('org-state'), city: val('org-city'), address: val('org-addr'),
      postalCode: val('org-postal'), timezone: val('org-tz'), currency: val('org-currency'),
      foundedDate: val('org-founded'), description: val('org-desc'), logo: val('org-logo-data')
    });
    toast('Organization Profile saved successfully', 'success'); closeModal('ws-m-orgprofile');
  }
  function resetOrgProfile() {
    openModal('ws-m-org-reset', 'Reset Organization Profile?',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to completely reset the Organization Profile? This cannot be undone.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-org-reset\\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmResetOrgProfile()">Reset</button>', '400px');
  }
  function confirmResetOrgProfile() {
    localStorage.removeItem('organizationProfile'); toast('Organization Profile reset', 'success');
    closeModal('ws-m-org-reset'); closeModal('ws-m-orgprofile'); openOrganizationProfile();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     15. WORKSPACE MEMBERS
     ══════════════════════════════════════════════════════════════════════════ */
  var WS_MEMBERS_KEY = 'verdeWorkspaceMembers';
  var memberIdCounter = parseInt(localStorage.getItem('verdeWsMemberIdCounter') || '1000', 10);

  function getWsMembers() {
    var stored = localStorage.getItem(WS_MEMBERS_KEY);
    if (stored) { try { return JSON.parse(stored); } catch(e) {} }
    return [];
  }
  function saveWsMembers(list) { localStorage.setItem(WS_MEMBERS_KEY, JSON.stringify(list)); }
  function nextMemberId() { memberIdCounter++; localStorage.setItem('verdeWsMemberIdCounter', String(memberIdCounter)); return 'EMP-' + memberIdCounter; }

  function openWorkspaceMembers() {
    var members = getWsMembers();
    var body =
      '<div style="display:flex;gap:12px;margin-bottom:16px;">' +
        '<div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:24px;font-weight:900;color:var(--primary);">' + members.length + '</div>' +
          '<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:4px;">Total Members</div>' +
        '</div>' +
        '<div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:24px;font-weight:900;color:var(--success);">' + members.filter(function(m){return m.status==='Active';}).length + '</div>' +
          '<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:4px;">Active</div>' +
        '</div>' +
        '<div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:24px;font-weight:900;color:var(--warning);">' + members.filter(function(m){return m.status==='Inactive';}).length + '</div>' +
          '<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:4px;">Inactive</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<input type="text" id="wm-search" class="input" placeholder="Search members..." style="flex:1;min-width:180px;">' +
        '<select id="wm-filter-dept" class="input" style="width:140px;"><option value="">All Depts</option>' + state.departments.map(function(d){ return '<option value="'+esc(d.name)+'">'+esc(d.name)+'</option>'; }).join('') + '</select>' +
        '<select id="wm-filter-role" class="input" style="width:140px;"><option value="">All Roles</option>' + state.roles.map(function(r){ return '<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>'; }).join('') + '</select>' +
        '<select id="wm-filter-status" class="input" style="width:120px;"><option value="">All Status</option><option>Active</option><option>Inactive</option><option>Suspended</option></select>' +
        '<button class="btn btn-secondary" onclick="window._ws.openAddWsMember()">+ Add Member</button>' +
      '</div>' +
      '<div id="wm-table-container" style="border:1px solid var(--border);border-radius:12px;overflow:hidden;max-height:380px;overflow-y:auto;">' +
        renderWsMemberRows(members) +
      '</div>';
    openModal('ws-m-wsmembers', 'Workspace Members', body, null, '900px');

    // Wire filters
    setTimeout(function() {
      var search = document.getElementById('wm-search');
      var fDept = document.getElementById('wm-filter-dept');
      var fRole = document.getElementById('wm-filter-role');
      var fStatus = document.getElementById('wm-filter-status');
      function applyFilters() {
        var q = (search ? search.value : '').toLowerCase();
        var dept = fDept ? fDept.value : '';
        var role = fRole ? fRole.value : '';
        var st = fStatus ? fStatus.value : '';
        var filtered = getWsMembers().filter(function(m) {
          if (q && m.fullName.toLowerCase().indexOf(q) === -1 && m.email.toLowerCase().indexOf(q) === -1 && m.employeeId.toLowerCase().indexOf(q) === -1) return false;
          if (dept && m.department !== dept) return false;
          if (role && m.role !== role) return false;
          if (st && m.status !== st) return false;
          return true;
        });
        var container = document.getElementById('wm-table-container');
        if (container) container.innerHTML = renderWsMemberRows(filtered);
      }
      if (search) search.addEventListener('input', applyFilters);
      if (fDept) fDept.addEventListener('change', applyFilters);
      if (fRole) fRole.addEventListener('change', applyFilters);
      if (fStatus) fStatus.addEventListener('change', applyFilters);
    }, 100);
  }

  function renderWsMemberRows(members) {
    if (members.length === 0) return '<div style="padding:30px;text-align:center;color:var(--text-3);">No members found.</div>';
    return '<table style="width:100%;border-collapse:collapse;text-align:left;">' +
      '<thead style="background:var(--bg);position:sticky;top:0;z-index:2;"><tr style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;">' +
        '<th style="padding:10px 16px;">Employee</th><th style="padding:10px 16px;">Department</th><th style="padding:10px 16px;">Role</th><th style="padding:10px 16px;">Status</th><th style="padding:10px 16px;">Login</th><th style="padding:10px 16px;"></th>' +
      '</tr></thead><tbody>' +
      members.map(function(m) {
        var statBadge = m.status === 'Active' ? 'badge-success' : (m.status === 'Inactive' ? 'badge-neutral' : 'badge-danger');
        return '<tr>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div style="width:32px;height:32px;border-radius:50%;background:var(--primary-10);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">' + m.fullName.charAt(0) + '</div>' +
              '<div><div style="font-size:13px;font-weight:700;color:var(--text-1);">' + esc(m.fullName) + '</div><div style="font-size:12px;color:var(--text-3);">' + esc(m.email) + '</div></div>' +
            '</div>' +
          '</td>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text-2);">' + esc(m.department || '-') + '</td>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text-2);">' + esc(m.role || '-') + '</td>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);"><span class="badge ' + statBadge + '">' + m.status + '</span></td>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:12px;color:' + (m.canLogin ? 'var(--success)' : 'var(--text-3)') + ';">' + (m.canLogin ? 'Yes' : 'No') + '</td>' +
          '<td style="padding:12px 16px;border-bottom:1px solid var(--border);text-align:right;">' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
              '<button class="btn btn-ghost btn-sm" onclick="window._ws.viewWsMember(\\'' + m.employeeId + '\\')">View</button>' +
              '<button class="btn btn-ghost btn-sm" onclick="window._ws.editWsMember(\\'' + m.employeeId + '\\')">Edit</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  function openAddWsMember(editId) {
    var members = getWsMembers();
    var m = { fullName:'', email:'', phone:'', department:'', role:'', jobTitle:'', status:'Active', canLogin:true, joinedDate:'', photo:'' };
    var isEdit = false;
    if (editId) {
      var found = members.filter(function(x) { return x.employeeId === editId; })[0];
      if (found) { m = found; isEdit = true; }
    }
    var deptOpts = [{label:'None',value:''}].concat(state.departments.map(function(d){ return {label:d.name, value:d.name}; }));
    var roleOpts = state.roles.map(function(r){ return {label:r.name, value:r.name}; });
    var statusOpts = [{label:'Active',value:'Active'},{label:'Inactive',value:'Inactive'},{label:'Suspended',value:'Suspended'}];
    var loginOpts = [{label:'Yes',value:'yes'},{label:'No',value:'no'}];

    var body =
      '<input type="hidden" id="wm-edit-id" value="' + (isEdit ? esc(editId) : '') + '">' +
      (isEdit ? '<div style="margin-bottom:12px;font-size:12px;color:var(--text-3);">Employee ID: <strong>'+esc(m.employeeId)+'</strong></div>' : '') +
      row2(fieldHTML('Full Name *', inputHTML('wm-name', m.fullName), true), fieldHTML('Email *', inputHTML('wm-email', m.email, 'email'), true)) +
      row2(fieldHTML('Phone', inputHTML('wm-phone', m.phone)), fieldHTML('Job Title', inputHTML('wm-title', m.jobTitle))) +
      row2(fieldHTML('Department', selectHTML('wm-dept', deptOpts, m.department)), fieldHTML('Role', selectHTML('wm-role', roleOpts, m.role))) +
      row2(fieldHTML('Status', selectHTML('wm-status', statusOpts, m.status)), fieldHTML('Can Login', selectHTML('wm-login', loginOpts, m.canLogin ? 'yes' : 'no'))) +
      fieldHTML('Joined Date', inputHTML('wm-joined', m.joinedDate, 'date'));

    var footer = '';
    if (isEdit) {
      footer += '<button class="btn btn-ghost" style="color:var(--danger);margin-right:auto;" onclick="window._ws.deleteWsMember(\\'' + editId + '\\')">Delete</button>';
    }
    footer +=
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-addmember\\')">Cancel</button>' +
      '<button class="btn btn-primary" onclick="window._ws.saveWsMember()">' + (isEdit ? 'Save Changes' : 'Add Member') + '</button>';

    openModal('ws-m-addmember', isEdit ? 'Edit Member' : 'Add Member', body, footer, '600px');
  }

  function editWsMember(id) { openAddWsMember(id); }

  function saveWsMember() {
    var editId = val('wm-edit-id');
    var name = val('wm-name');
    var email = val('wm-email');
    if (!name) { toast('Full Name is required', 'error'); return; }
    if (!email || !email.includes('@')) { toast('Valid email is required', 'error'); return; }

    var members = getWsMembers();
    if (editId) {
      for (var i = 0; i < members.length; i++) {
        if (members[i].employeeId === editId) {
          members[i].fullName = name; members[i].email = email; members[i].phone = val('wm-phone');
          members[i].jobTitle = val('wm-title'); members[i].department = val('wm-dept');
          members[i].role = val('wm-role'); members[i].status = val('wm-status');
          members[i].canLogin = val('wm-login') === 'yes'; members[i].joinedDate = val('wm-joined');
          break;
        }
      }
      toast('Member updated successfully', 'success');
    } else {
      members.push({
        employeeId: nextMemberId(), fullName: name, email: email, phone: val('wm-phone'),
        jobTitle: val('wm-title'), department: val('wm-dept'), role: val('wm-role'),
        status: val('wm-status'), canLogin: val('wm-login') === 'yes', joinedDate: val('wm-joined'), photo: ''
      });
      toast('Member added successfully', 'success');
    }
    saveWsMembers(members); closeModal('ws-m-addmember'); openWorkspaceMembers();
    updateMemberDashboard(members);
  }

  function viewWsMember(id) {
    var m = getWsMembers().filter(function(x) { return x.employeeId === id; })[0];
    if (!m) return;
    var statBadge = m.status === 'Active' ? 'badge-success' : (m.status === 'Inactive' ? 'badge-neutral' : 'badge-danger');
    var body =
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:var(--bg);border-radius:12px;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:var(--primary-10);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;">' + m.fullName.charAt(0) + '</div>' +
        '<div><div style="font-size:16px;font-weight:800;color:var(--text-1);">' + esc(m.fullName) + '</div><div style="font-size:13px;color:var(--text-3);">' + esc(m.employeeId) + ' &middot; ' + esc(m.jobTitle || 'No Title') + '</div></div>' +
        '<div style="margin-left:auto;"><span class="badge ' + statBadge + '">' + m.status + '</span></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Email</label><div style="font-size:14px;color:var(--text-1);margin-top:4px;">' + esc(m.email) + '</div></div>' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Phone</label><div style="font-size:14px;color:var(--text-1);margin-top:4px;">' + esc(m.phone || '-') + '</div></div>' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Department</label><div style="font-size:14px;color:var(--text-1);margin-top:4px;">' + esc(m.department || '-') + '</div></div>' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Role</label><div style="font-size:14px;color:var(--text-1);margin-top:4px;">' + esc(m.role || '-') + '</div></div>' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Can Login</label><div style="font-size:14px;color:' + (m.canLogin ? 'var(--success)' : 'var(--text-3)') + ';margin-top:4px;">' + (m.canLogin ? 'Yes' : 'No') + '</div></div>' +
        '<div><label style="font-size:12px;color:var(--text-3);font-weight:600;">Joined</label><div style="font-size:14px;color:var(--text-1);margin-top:4px;">' + esc(m.joinedDate || '-') + '</div></div>' +
      '</div>';
    var footer =
      '<button class="btn btn-ghost" onclick="window._ws.editWsMember(\\'' + id + '\\')">Edit</button>' +
      '<button class="btn btn-primary" onclick="window._ws.closeModal(\\'ws-m-viewmember\\')">Close</button>';
    openModal('ws-m-viewmember', 'Member Details', body, footer, '550px');
  }

  function deleteWsMember(id) {
    openModal('ws-m-delmember', 'Delete Member?',
      '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to permanently delete this member? This action cannot be undone.</div>',
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-delmember\\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmDeleteWsMember(\\'' + id + '\\')">Delete</button>', '400px');
  }

  function confirmDeleteWsMember(id) {
    var list = getWsMembers().filter(function(m) { return m.employeeId !== id; });
    saveWsMembers(list); toast('Member deleted successfully', 'success');
    closeModal('ws-m-delmember'); closeModal('ws-m-addmember');
    updateMemberDashboard(list); openWorkspaceMembers();
  }

  function deactivateWsMember(id) {
    var list = getWsMembers();
    for (var i = 0; i < list.length; i++) { if (list[i].employeeId === id) { list[i].status = 'Inactive'; break; } }
    saveWsMembers(list); toast('Member deactivated', 'success'); openWorkspaceMembers();
  }
  function reactivateWsMember(id) {
    var list = getWsMembers();
    for (var i = 0; i < list.length; i++) { if (list[i].employeeId === id) { list[i].status = 'Active'; break; } }
    saveWsMembers(list); toast('Member reactivated', 'success'); openWorkspaceMembers();
  }

  function updateMemberDashboard(members) {
    var kpiGrid = document.querySelector('.ws-kpi-grid');
    if (!kpiGrid) return;
    var vals = kpiGrid.querySelectorAll('.ws-kpi-value');
    if (vals.length >= 2) vals[1].textContent = String(members.length);
  }

"""

# === PART 13: Public API & Bootstrap ===
part13 = """
  /* ══════════════════════════════════════════════════════════════════════════
     16. PUBLIC API & BOOTSTRAP
     ══════════════════════════════════════════════════════════════════════════ */
  window._ws = {
    toast: toast, closeModal: closeModal,
    saveProfile: saveProfile, removeLogo: removeLogo, handleLogoChange: handleLogoChange,
    openMemberDetail: openMemberDetail, saveMemberDetail: saveMemberDetail, actionMember: actionMember, resendInvite: resendInvite, openInviteMember: openInviteMember, sendInvite: sendInvite,
    openCreateRole: openCreateRole, saveNewRole: saveNewRole, deleteRole: deleteRole, savePermissions: savePermissions,
    openActivityModal: openActivityModal,
    openCreateDept: openCreateDept, saveDept: saveDept, deleteDept: deleteDept, confirmDeleteDept: confirmDeleteDept,
    savePref: savePref, connectIntegration: connectIntegration, disconnectIntegration: disconnectIntegration,
    // CRUD
    openCreateWorkspace: openCreateWorkspace, saveWorkspace: saveWorkspace, editWorkspace: editWorkspace,
    viewWorkspace: viewWorkspace, deleteWorkspace: deleteWorkspace, confirmDeleteWorkspace: confirmDeleteWorkspace,
    renderWorkspaceTable: renderWorkspaceTable, updateWorkspaceCounters: updateWorkspaceCounters,
    // Org Profile
    openOrganizationProfile: openOrganizationProfile, handleOrgLogo: handleOrgLogo, removeOrgLogo: removeOrgLogo,
    saveOrganizationProfile: saveOrganizationProfile, resetOrgProfile: resetOrgProfile, confirmResetOrgProfile: confirmResetOrgProfile,
    // Workspace Members
    openWorkspaceMembers: openWorkspaceMembers, openAddWsMember: openAddWsMember, editWsMember: editWsMember,
    saveWsMember: saveWsMember, viewWsMember: viewWsMember, deleteWsMember: deleteWsMember,
    confirmDeleteWsMember: confirmDeleteWsMember, deactivateWsMember: deactivateWsMember, reactivateWsMember: reactivateWsMember
  };

  function init() {
    // Render workspace table & counters if elements exist
    renderWorkspaceTable();
    updateWorkspaceCounters();

    // Event Listeners for static buttons
    var btnCreate = document.getElementById('btn-create-workspace');
    if (btnCreate) btnCreate.addEventListener('click', function() { openCreateWorkspace(); });

    var btnInvite = document.getElementById('btn-invite-member');
    if (btnInvite) btnInvite.addEventListener('click', function() { openInviteMember(); });

    var btnUpload = document.getElementById('btn-upload-file');
    if (btnUpload) btnUpload.addEventListener('click', function() { toast('Upload File opened', 'info'); });

    var btnSettings = document.getElementById('btn-workspace-settings');
    if (btnSettings) btnSettings.addEventListener('click', function() { toast('Workspace settings opened', 'info'); });

    // Show skeleton loading (simulate network)
    var profileName = document.querySelector('.ws-profile-name');
    if (profileName) profileName.textContent = 'Loading...';

    Promise.all([
      API.getOrganization(),
      API.getDepartments(),
      API.getMembers(),
      API.getRoles(),
      API.getPermissions(),
      API.getIntegrations()
    ]).then(function(res) {
      state.organization = res[0];
      state.departments = res[1];
      state.members = res[2];
      state.roles = res[3];
      state.permissions = res[4];
      state.integrations = res[5];

      renderProfile();
      renderKPIs();
      renderDepartments();
      wireIntegrations();
      renderPreferences();
      renderSecurity();
      wireQuickActions();
      wireSearch();

      var editBtn = document.querySelector('.ws-profile-header .btn-secondary');
      if (editBtn) editBtn.onclick = openEditProfile;

      // Wire member card
      var memCard = document.querySelector('.ws-kpi-grid .ws-kpi-card:nth-child(2)');
      if(memCard) { memCard.style.cursor='pointer'; memCard.onclick = openMemberManagement; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
"""

# === Assemble the clean file ===
clean_js = part1 + part2 + part3 + part4 + part5 + part6 + part7 + part8 + part9 + part10 + part11 + part12 + part13

with io.open(path, 'w', encoding='utf-8') as f:
    f.write(clean_js)

print("workspace.js rebuilt successfully.")
print("Total length: {} chars".format(len(clean_js)))
