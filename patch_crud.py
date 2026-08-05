import io
import re
import json

path = r'c:\verde studios\verde labs erp\app\workspace\workspace.js'
with io.open(path, 'r', encoding='utf-8') as f:
    js = f.read()

real_funcs = """
  /* ==========================================================================
     WORKSPACE CRUD FUNCTIONALITY
     ========================================================================== */
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
    if (!tableBody) return; // Table might not exist in current view
    
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
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.viewWorkspace(\\'\\' + ws.id + \\'\\')">View</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="window._ws.editWorkspace(\\'\\' + ws.id + \\'\\')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window._ws.deleteWorkspace(\\'\\' + ws.id + \\'\\')">Delete</button>' +
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

  function editWorkspace(id) {
    openCreateWorkspace(id);
  }

  function saveWorkspace() {
    var id = val('cws-id');
    var name = val('cws-name');
    if (!name || name.trim() === '') { toast('Workspace Name is required', 'error'); return; }

    var list = getWorkspaces();
    
    // Check duplicates
    var dup = list.filter(function(w) { return w.name.toLowerCase() === name.toLowerCase() && w.id !== id; });
    if (dup.length > 0) { toast('Workspace name already exists', 'error'); return; }

    if (id) {
      // Edit
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          list[i].name = name;
          list[i].description = val('cws-desc');
          list[i].type = val('cws-type');
          list[i].visibility = val('cws-vis');
          list[i].storage = val('cws-storage');
          list[i].status = val('cws-status');
          break;
        }
      }
      toast('Workspace updated successfully', 'success');
    } else {
      // Create
      var newWs = {
        id: 'WS-' + Math.floor(Math.random() * 1000000),
        name: name,
        description: val('cws-desc'),
        type: val('cws-type'),
        visibility: val('cws-vis'),
        storage: val('cws-storage'),
        status: val('cws-status')
      };
      list.push(newWs);
      toast('Workspace created successfully', 'success');
    }

    saveWorkspaces(list);
    renderWorkspaceTable();
    updateWorkspaceCounters();
    closeModal('ws-m-create');
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

    var footer = '<button class="btn btn-primary" onclick="window._ws.closeModal(\\'ws-m-view\\')">Close</button>';

    openModal('ws-m-view', 'Workspace Details', body, footer, '450px');
  }

  function deleteWorkspace(id) {
    var body = '<div style="font-size:14px;color:var(--text-2);">Are you sure you want to delete this workspace? This action cannot be undone and all associated data will be lost.</div>';
    var footer = 
      '<button class="btn btn-ghost" onclick="window._ws.closeModal(\\'ws-m-del-confirm\\')">Cancel</button>' +
      '<button class="btn btn-primary" style="background:var(--danger);" onclick="window._ws.confirmDeleteWorkspace(\\'\\' + id + \\'\\')">Delete Workspace</button>';
    
    openModal('ws-m-del-confirm', 'Delete Workspace?', body, footer, '400px');
  }

  function confirmDeleteWorkspace(id) {
    var list = getWorkspaces();
    list = list.filter(function(w) { return w.id !== id; });
    saveWorkspaces(list);
    toast('Workspace deleted successfully', 'success');
    renderWorkspaceTable();
    updateWorkspaceCounters();
    closeModal('ws-m-del-confirm');
  }

  // Override old dummy functions if they existed
  window.openCreateWorkspace = openCreateWorkspace;
  window.saveWorkspace = saveWorkspace;
  window.editWorkspace = editWorkspace;
  window.viewWorkspace = viewWorkspace;
  window.deleteWorkspace = deleteWorkspace;
"""

# Let's cleanly inject this into workspace.js.
# I'll just append it before the IIFE closes.
if "WORKSPACE CRUD FUNCTIONALITY" not in js:
    js = js.replace("return {", real_funcs + "\n  return {")
    
    # Expose renderWorkspaceTable and updateWorkspaceCounters to init
    js = js.replace("init: init,", "init: init, openCreateWorkspace: openCreateWorkspace, saveWorkspace: saveWorkspace, viewWorkspace: viewWorkspace, editWorkspace: editWorkspace, deleteWorkspace: deleteWorkspace, confirmDeleteWorkspace: confirmDeleteWorkspace, renderWorkspaceTable: renderWorkspaceTable, updateWorkspaceCounters: updateWorkspaceCounters,")

    # Hook up the initial rendering of the table to init()
    init_search = "function init() {"
    init_replace = "function init() {\n    if (window._ws && window._ws.renderWorkspaceTable) { window._ws.renderWorkspaceTable(); window._ws.updateWorkspaceCounters(); }"
    js = js.replace(init_search, init_replace)

    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Workspace CRUD injected.")
else:
    print("Already injected.")
