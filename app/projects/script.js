/* ==========================================================================
   VERDE OS — PROJECTS WORKSPACE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  var currentProjectId = null;
  var currentProjectData = null;
  var isEditMode = false;
  var projCurrentFilter = { key: null, value: null };
  var projSearchQuery = '';

  window.switchProjTab = function(tabId) {
    document.querySelectorAll('.proj-tab').forEach(function(el) { el.classList.remove('active'); });
    var activeTab = document.getElementById('tab-' + tabId);
    if(activeTab) activeTab.classList.add('active');
    
    document.getElementById('view-overview').style.display = 'none';
    document.getElementById('view-milestones').style.display = 'none';
    document.getElementById('view-files').style.display = 'none';
    document.getElementById('view-timeline').style.display = 'none';
    document.getElementById('view-team').style.display = 'none';
    document.getElementById('view-notes').style.display = 'none';
    
    var activeView = document.getElementById('view-' + tabId);
    if(activeView) activeView.style.display = 'flex';
  };

  window.populateProjectSubviews = function(proj) {
    // 1. Milestones
    var msList = document.getElementById('drawer-milestones-list');
    msList.innerHTML = '';
    if (proj.milestones && proj.milestones.length > 0) {
      proj.milestones.forEach(function(m) {
        var isDone = m.status === 'Completed';
        var color = isDone ? 'var(--success)' : 'var(--text-1)';
        var html = '<div class="proj-box" style="padding:16px; border-left:4px solid ' + color + ';">' +
          '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
            '<div>' +
              '<div style="font-size:14px; font-weight:700; text-decoration:' + (isDone ? 'line-through' : 'none') + ';">' + m.title + '</div>' +
              '<div style="font-size:13px; color:var(--text-2); margin-top:4px;">' + (m.description || 'No description') + '</div>' +
              '<div style="font-size:12px; color:var(--text-3); margin-top:8px;">Assignee: ' + m.assignee + ' &bull; Due: ' + (m.dueDate || 'N/A') + '</div>' +
            '</div>' +
            '<div style="display:flex; gap:8px;">' +
              (!isDone ? '<button class="btn btn-sm btn-ghost" onclick="completeMilestone(\'' + m.id + '\')" style="color:var(--success);">Complete</button>' : '') +
              '<button class="btn btn-sm btn-ghost" onclick="deleteMilestone(\'' + m.id + '\')" style="color:var(--danger);">Delete</button>' +
            '</div>' +
          '</div>' +
        '</div>';
        msList.innerHTML += html;
      });
    } else {
      msList.innerHTML = '<div style="color:var(--text-3); font-size:13px;">No tasks added yet.</div>';
    }

    // 2. Timeline (Activities)
    var timeList = document.getElementById('drawer-timeline-list');
    timeList.innerHTML = '';
    if (proj.activities && proj.activities.length > 0) {
      proj.activities.forEach(function(a) {
        var date = new Date(a.date);
        var timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        var html = '<div style="position:relative;">' +
          '<div style="position:absolute; left:-21px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--primary); border:2px solid var(--bg-1);"></div>' +
          '<div style="font-size:13px; font-weight:700;">' + a.action + '</div>' +
          '<div style="font-size:13px; color:var(--text-2);">' + a.details + '</div>' +
          '<div style="font-size:11px; color:var(--text-3); margin-top:4px;">' + timeStr + ' &bull; ' + a.user + '</div>' +
        '</div>';
        timeList.innerHTML += html;
      });
    }

    // 3. Files
    var fileList = document.getElementById('drawer-files-list');
    fileList.innerHTML = '';
    if (proj.files && proj.files.length > 0) {
      proj.files.forEach(function(f) {
        var sizeKb = (f.size / 1024).toFixed(1) + ' KB';
        var date = new Date(f.date).toLocaleDateString();
        var html = '<div class="proj-box" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="font-size:13px; font-weight:700;">' + f.name + '</div>' +
            '<div style="font-size:11px; color:var(--text-3);">' + sizeKb + ' &bull; ' + date + '</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-ghost" onclick="deleteFile(\'' + f.id + '\')" style="color:var(--danger);">Delete</button>' +
        '</div>';
        fileList.innerHTML += html;
      });
    } else {
      fileList.innerHTML = '<div style="color:var(--text-3); font-size:13px;">No files uploaded.</div>';
    }

    // 4. Notes
    var notesList = document.getElementById('drawer-notes-list');
    notesList.innerHTML = '';
    if (proj.internalNotes && proj.internalNotes.length > 0) {
      proj.internalNotes.forEach(function(n) {
        var date = new Date(n.date).toLocaleString();
        var html = '<div class="proj-box" style="padding:16px; background:var(--bg-2); border:none;">' +
          '<div style="font-size:13px; color:var(--text-1); white-space:pre-wrap;">' + n.text + '</div>' +
          '<div style="display:flex; justify-content:space-between; margin-top:12px; font-size:11px; color:var(--text-3);">' +
            '<span>' + n.author + ' &bull; ' + date + '</span>' +
            '<span onclick="deleteNote(\'' + n.id + '\')" style="cursor:pointer; color:var(--danger);">Delete</span>' +
          '</div>' +
        '</div>';
        notesList.innerHTML += html;
      });
    } else {
      notesList.innerHTML = '<div style="color:var(--text-3); font-size:13px;">No internal notes.</div>';
    }

    // 5. Team
    var teamList = document.getElementById('drawer-team-list');
    teamList.innerHTML = '';
    if (proj.detailedTeam && proj.detailedTeam.length > 0) {
      proj.detailedTeam.forEach(function(t) {
        var html = '<div class="proj-box" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div style="display:flex; align-items:center; gap:12px;">' +
            '<div class="proj-avatar">' + t.id + '</div>' +
            '<div>' +
              '<div style="font-size:13px; font-weight:700;">' + t.id + '</div>' +
              '<div style="font-size:11px; color:var(--text-3);">' + t.role + ' &bull; ' + t.workload + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
        teamList.innerHTML += html;
      });
    }
  };

  // Handlers
  window.showAddMilestoneForm = function() { document.getElementById('add-milestone-form').style.display = 'block'; };
  window.hideAddMilestoneForm = function() { 
    document.getElementById('add-milestone-form').style.display = 'none';
    document.getElementById('ms-title').value = '';
    document.getElementById('ms-desc').value = '';
    document.getElementById('ms-assignee').value = '';
    document.getElementById('ms-date').value = '';
  };

  window.submitMilestone = function() {
    var title = document.getElementById('ms-title').value;
    if (!title) return;
    var data = {
      title: title,
      description: document.getElementById('ms-desc').value,
      assignee: document.getElementById('ms-assignee').value,
      dueDate: document.getElementById('ms-date').value,
      status: 'Pending'
    };
    
    // Fallback: manually update project if service methods are missing
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var milestones = p.milestones || [];
        var act = p.activities || [];
        data.id = 'MS-' + Date.now();
        milestones.push(data);
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Task Created', details: title, date: new Date().toISOString(), user: 'System' });
        
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones, activities: act }).then(function(updated) {
          hideAddMilestoneForm();
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId); // Refresh progress
        });
      });
    }
  };

  window.completeMilestone = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var milestones = p.milestones || [];
        var act = p.activities || [];
        var taskTitle = '';
        milestones = milestones.map(function(m) { 
          if(m.id === id) { m.status = 'Completed'; taskTitle = m.title; }
          return m; 
        });
        
        if(taskTitle) {
          act.unshift({ id: 'ACT-' + Date.now(), action: 'Task Completed', details: taskTitle, date: new Date().toISOString(), user: 'System' });
        }
        
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones, activities: act }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId); // Refresh progress
        });
      });
    }
  };

  window.deleteMilestone = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var milestones = p.milestones || [];
        milestones = milestones.filter(function(m) { return m.id !== id; });
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId);
        });
      });
    }
  };

  window.handleMockFileUpload = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var files = p.files || [];
        files.push({ id: 'F-' + Date.now(), name: file.name, size: file.size, date: new Date().toISOString() });
        window.VerdeServices.Projects.updateProject(currentProjectId, { files: files }).then(function(updated) {
          if(window.VerdeToast) window.VerdeToast.success('File uploaded.');
          currentProjectData = updated;
          populateProjectSubviews(updated);
          e.target.value = '';
        });
      });
    }
  };

  window.deleteFile = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var files = p.files || [];
        files = files.filter(function(f) { return f.id !== id; });
        window.VerdeServices.Projects.updateProject(currentProjectId, { files: files }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.submitNote = function() {
    var text = document.getElementById('new-note-text').value;
    if (!text) return;
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var notes = p.internalNotes || [];
        notes.push({ id: 'N-' + Date.now(), text: text, author: 'System', date: new Date().toISOString() });
        window.VerdeServices.Projects.updateProject(currentProjectId, { internalNotes: notes }).then(function(updated) {
          document.getElementById('new-note-text').value = '';
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.deleteNote = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var notes = p.internalNotes || [];
        notes = notes.filter(function(n) { return n.id !== id; });
        window.VerdeServices.Projects.updateProject(currentProjectId, { internalNotes: notes }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.openProjectDetails = function(id) {
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(id).then(function (proj) {
        if (!proj) return;
        currentProjectId = proj.id;
        currentProjectData = proj;
        isEditMode = false;
        
        window.switchProjTab('overview');

        // Reset UI
        document.getElementById('drawer-edit-btn').style.display = 'inline-block';
        document.getElementById('drawer-save-btn').style.display = 'none';
        document.getElementById('drawer-proj-title').style.display = 'block';
        document.getElementById('edit-proj-title').style.display = 'none';
        document.getElementById('drawer-proj-client').style.display = 'block';
        document.getElementById('edit-proj-client').style.display = 'none';
        document.getElementById('drawer-proj-desc').style.display = 'block';
        document.getElementById('edit-proj-desc').style.display = 'none';
        document.getElementById('drawer-proj-status').style.display = 'block';
        document.getElementById('edit-proj-status').style.display = 'none';
        document.getElementById('drawer-proj-date').style.display = 'block';
        document.getElementById('edit-proj-date').style.display = 'none';
        
        // Progress Calculation
        var milestones = proj.milestones || [];
        var totalTasks = milestones.length;
        var completedTasks = milestones.filter(function(m) { return m.status === 'Completed'; }).length;
        var pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proj.progress || 0);
        
        // Save computed progress back if it changed
        if(pct !== proj.progress) {
          window.VerdeServices.Projects.updateProject(proj.id, { progress: pct });
        }

        // Populate Texts
        if (document.getElementById('drawer-proj-title')) document.getElementById('drawer-proj-title').textContent = proj.name || 'Project Details';
        if (document.getElementById('drawer-proj-client')) document.getElementById('drawer-proj-client').textContent = proj.client || 'Client';
        if (document.getElementById('drawer-proj-desc')) document.getElementById('drawer-proj-desc').textContent = proj.notes || proj.deliverables || (proj.category + ' project for ' + proj.client);
        if (document.getElementById('drawer-proj-status')) {
          var statusEl = document.getElementById('drawer-proj-status');
          statusEl.textContent = proj.isArchived ? 'Archived' : (proj.status || 'Planning');
          statusEl.style.color = (proj.status === 'Completed' ? 'var(--text-3)' : (proj.status === 'At Risk' || proj.status === 'Cancelled' ? 'var(--danger)' : 'var(--success)'));
        }
        if (document.getElementById('drawer-proj-date')) document.getElementById('drawer-proj-date').textContent = proj.dueDate || 'Aug 30, 2026';
        
        if (document.getElementById('drawer-proj-progress-pct')) document.getElementById('drawer-proj-progress-pct').textContent = pct + '%';
        if (document.getElementById('drawer-proj-progress-bar')) document.getElementById('drawer-proj-progress-bar').style.width = pct + '%';
        if (document.getElementById('drawer-proj-tasks-summary')) document.getElementById('drawer-proj-tasks-summary').textContent = completedTasks + ' / ' + totalTasks + ' Tasks Completed';
        
        var b = parseFloat(proj.budget || 0);
        if (document.getElementById('drawer-proj-budget')) document.getElementById('drawer-proj-budget').textContent = 'Est. Budget: $' + b.toLocaleString('en-US', { minimumFractionDigits: 2 });
        if (document.getElementById('drawer-proj-team')) document.getElementById('drawer-proj-team').textContent = 'Team: ' + (proj.team ? proj.team.join(', ') : 'SH, MI');

        // Populate Inputs
        if (document.getElementById('edit-proj-title')) document.getElementById('edit-proj-title').value = proj.name || '';
        if (document.getElementById('edit-proj-client')) document.getElementById('edit-proj-client').value = proj.client || '';
        if (document.getElementById('edit-proj-desc')) document.getElementById('edit-proj-desc').value = proj.notes || '';
        if (document.getElementById('edit-proj-status')) document.getElementById('edit-proj-status').value = proj.status || 'Planning';
        if (document.getElementById('edit-proj-date')) document.getElementById('edit-proj-date').value = proj.dueDate || '';

        window.populateProjectSubviews(proj);

        var pPanel = document.getElementById('projPanel');
        var pOverlay = document.getElementById('projOverlay');
        if(pPanel) pPanel.classList.add('active');
        if(pOverlay) pOverlay.classList.add('active');
      });
    }
  };

  window.toggleProjectEditMode = function() {
    isEditMode = true;
    document.getElementById('drawer-edit-btn').style.display = 'none';
    document.getElementById('drawer-save-btn').style.display = 'inline-block';
    
    document.getElementById('drawer-proj-title').style.display = 'none';
    document.getElementById('edit-proj-title').style.display = 'block';
    
    document.getElementById('drawer-proj-client').style.display = 'none';
    document.getElementById('edit-proj-client').style.display = 'block';
    
    document.getElementById('drawer-proj-desc').style.display = 'none';
    document.getElementById('edit-proj-desc').style.display = 'block';
    
    document.getElementById('drawer-proj-status').style.display = 'none';
    document.getElementById('edit-proj-status').style.display = 'block';
    
    document.getElementById('drawer-proj-date').style.display = 'none';
    document.getElementById('edit-proj-date').style.display = 'block';
  };

  window.saveProjectEdits = function() {
    if (!currentProjectId || !window.VerdeServices || !window.VerdeServices.Projects) return;
    
    var status = document.getElementById('edit-proj-status').value;
    var updates = {
      name: document.getElementById('edit-proj-title').value,
      client: document.getElementById('edit-proj-client').value,
      notes: document.getElementById('edit-proj-desc').value,
      status: status,
      dueDate: document.getElementById('edit-proj-date').value
    };

    if (updates.status !== 'Draft') updates.isDraft = false;
    if (updates.status === 'Draft') updates.isDraft = true;
    
    if (currentProjectData && currentProjectData.status !== status) {
      updates.activities = currentProjectData.activities || [];
      updates.activities.unshift({ id: 'ACT-' + Date.now(), action: 'Status Changed', details: 'Status moved to ' + status, date: new Date().toISOString(), user: 'System' });
    }

    window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function(updatedProj) {
      if (window.VerdeToast) window.VerdeToast.success('Project updated successfully.');
      window.openProjectDetails(currentProjectId); // Refresh panel
      window.renderProjectsList(); // Refresh grid
      if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
    });
  };

  window.deleteCurrentProject = function() {
    if (!currentProjectId) return;
    if (window.VerdeModal) {
      window.VerdeModal.delete('Delete Project', 'Are you sure you want to delete this project? It will be moved to the trash.', function() {
        if (window.VerdeServices && window.VerdeServices.Projects) {
          window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(proj) {
            var updates = { isDeleted: true };
            window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
              if (window.VerdeToast) window.VerdeToast.success('Project deleted.');
              window.closeProject();
              window.renderProjectsList();
              if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
            });
          });
        }
      });
    }
  };

  window.archiveCurrentProject = function() {
    if (!currentProjectId) return;
    if (window.VerdeModal) {
      window.VerdeModal.confirm({
        title: 'Archive Project',
        body: 'Archiving will remove this project from active views. You can restore it later from the Archives filter.',
        confirmText: 'Archive',
        confirmClass: 'btn-primary',
        onConfirm: function() {
          if (window.VerdeServices && window.VerdeServices.Projects) {
            var updates = { isArchived: true, status: 'Archived' };
            window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
              if (window.VerdeToast) window.VerdeToast.success('Project archived.');
              window.closeProject();
              window.renderProjectsList();
              if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
            });
          }
        }
      });
    }
  };

  window.closeProject = function() {
    var pPanel = document.getElementById('projPanel');
    var pOverlay = document.getElementById('projOverlay');
    if(pPanel) pPanel.classList.remove('active');
    if(pOverlay) pOverlay.classList.remove('active');
  };

  window.toggleFilterMenu = function() {
    var menu = document.getElementById('proj-filter-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  };

  window.setProjFilter = function(key, value) {
    projCurrentFilter = { key: key, value: value };
    window.renderProjectsList();
    var menu = document.getElementById('proj-filter-menu');
    if (menu) menu.style.display = 'none';
  };

  window.renderProjectsList = function() {
    if (!window.VerdeServices || !window.VerdeServices.Projects) return;

    var options = {};
    if (projCurrentFilter.key === 'status' && projCurrentFilter.value === 'Archived') {
      options.includeArchived = true;
    }

    window.VerdeServices.Projects.getProjects(options).then(function (allProjects) {
      var container = document.getElementById('proj-grid-container');
      if (!container || !allProjects) return;

      // Calculate KPIs from ALL active projects
      var activeProjects = allProjects.filter(function(p) { return !p.isArchived && !p.isDeleted; });
      var kpis = document.querySelectorAll('.proj-kpi-value');
      if (kpis && kpis.length >= 4) {
        kpis[0].textContent = activeProjects.length;
        kpis[1].textContent = activeProjects.filter(function (p) { return p.status === 'Completed'; }).length;
        kpis[2].textContent = activeProjects.filter(function (p) { return p.status === 'Review'; }).length;
        kpis[3].textContent = activeProjects.filter(function (p) { return p.status === 'In Progress'; }).length;
      }

      // Apply filters
      var filtered = allProjects.filter(function(p) {
        if (projCurrentFilter.key) {
          if (projCurrentFilter.key === 'status' && projCurrentFilter.value === 'Archived') {
            if (!p.isArchived && p.status !== 'Archived') return false;
          } else {
            if (p[projCurrentFilter.key] !== projCurrentFilter.value) return false;
            if (p.isArchived || p.status === 'Archived') return false;
          }
        } else {
          // Default: Hide archived unless explicitly requested
          if (p.isArchived || p.status === 'Archived') return false;
        }
        if (projSearchQuery) {
          var searchStr = ((p.name || '') + ' ' + (p.client || '') + ' ' + (p.id || '')).toLowerCase();
          if (searchStr.indexOf(projSearchQuery) === -1) return false;
        }
        return true;
      });

      // Render Cards
      container.innerHTML = '';
      if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; padding:48px; text-align:center; color:var(--text-3);">No projects found matching criteria.</div>';
        return;
      }

      filtered.forEach(function (p) {
        var badgeClass = 'badge-active';
        if (p.status === 'Completed') badgeClass = 'badge-completed';
        if (p.status === 'Review') badgeClass = 'badge-risk';
        if (p.status === 'Planning') badgeClass = 'badge-pending';
        if (p.isArchived || p.status === 'Archived') badgeClass = 'badge-closed';

        var milestones = p.milestones || [];
        var totalTasks = milestones.length;
        var completedTasks = milestones.filter(function(m) { return m.status === 'Completed'; }).length;
        var progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.progress || 0);

        var teamHtml = (p.team || ['SH']).map(function (m, idx) {
          var bg = idx === 1 ? 'background:var(--success);' : (idx === 2 ? 'background:var(--warning);' : '');
          return '<div class="proj-avatar" style="' + bg + '">' + m + '</div>';
        }).join('');

        var cardHtml = 
          '<div class="proj-card" onclick="openProjectDetails(\'' + p.id + '\')">' +
            '<div class="proj-card-header">' +
              '<div>' +
                '<div class="proj-card-title">' + p.name + '</div>' +
                '<div class="proj-card-client">' + p.client + ' &bull; ' + (p.category || 'Service') + '</div>' +
              '</div>' +
              '<span class="proj-badge ' + badgeClass + '">' + (p.isArchived ? 'Archived' : p.status) + '</span>' +
            '</div>' +
            '<div class="proj-progress-wrap">' +
              '<div class="proj-progress-label">' +
                '<span>Progress (' + completedTasks + '/' + totalTasks + ' Tasks)</span>' +
                '<span>' + progress + '%</span>' +
              '</div>' +
              '<div class="proj-progress">' +
                '<div class="proj-progress-bar" style="width: ' + progress + '%;"></div>' +
              '</div>' +
            '</div>' +
            '<div class="proj-card-meta">' +
              '<div>' + (p.dueDate || 'No Date') + '</div>' +
              '<div class="proj-avatars">' + teamHtml + '</div>' +
              '<div class="proj-actions">' +
                '<button class="btn btn-sm btn-ghost" style="border:1px solid var(--border);" onclick="event.stopPropagation(); openProjectDetails(\'' + p.id + '\');">View</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        container.innerHTML += cardHtml;
      });

    });
  };

  // Attach event listeners for search and filters
  document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('proj-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        projSearchQuery = e.target.value.toLowerCase();
        window.renderProjectsList();
      });
    }
    
    window.renderProjectsList();
  });

  document.addEventListener('click', function(e) {
    var filterBtn = document.getElementById('proj-filter-btn');
    var menu = document.getElementById('proj-filter-menu');
    if (filterBtn && menu && !filterBtn.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

})();