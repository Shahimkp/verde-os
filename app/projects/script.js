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
  
  // Team Modal State
  var teamModalFilter = 'All';
  var teamModalSearch = '';
  var teamModalSelected = [];
  
  var MOCK_EMPLOYEES = [
    { id: 'Shahim', name: 'Shahim', department: 'Engineering', role: 'AI Engineer', workload: 'Projects: 2', availability: '🟢' },
    { id: 'Midhul', name: 'Midhul', department: 'Engineering', role: 'Frontend Developer', workload: 'Projects: 1', availability: '🟢' },
    { id: 'Nihal', name: 'Nihal', department: 'Engineering', role: 'Backend Developer', workload: 'Projects: 4', availability: '🟡' },
    { id: 'Akhil', name: 'Akhil', department: 'Design', role: 'UI Designer', workload: 'Projects: 6', availability: '🔴' },
    { id: 'Sarah', name: 'Sarah', department: 'Management', role: 'Product Manager', workload: 'Projects: 3', availability: '🟢' },
    { id: 'Alex', name: 'Alex', department: 'Marketing', role: 'Marketing Lead', workload: 'Projects: 2', availability: '🟢' },
    { id: 'John', name: 'John', department: 'Sales', role: 'Account Executive', workload: 'Projects: 5', availability: '🟡' },
    { id: 'Emma', name: 'Emma', department: 'Finance', role: 'Financial Analyst', workload: 'Projects: 1', availability: '🟢' }
  ];

  window.switchProjTab = function(tabId) {
    document.querySelectorAll('.proj-tab').forEach(function(el) { el.classList.remove('active'); });
    var activeTab = document.getElementById('tab-' + tabId);
    if(activeTab) activeTab.classList.add('active');
    
    document.getElementById('view-analytics').style.display = 'none';
    document.getElementById('view-overview').style.display = 'none';
    document.getElementById('view-milestones').style.display = 'none';
    document.getElementById('view-files').style.display = 'none';
    document.getElementById('view-timeline').style.display = 'none';
    document.getElementById('view-team').style.display = 'none';
    document.getElementById('view-notes').style.display = 'none';
    
    var activeView = document.getElementById('view-' + tabId);
    if(activeView) activeView.style.display = 'flex';
  };

  window.populateAnalytics = function(proj) {
    // 1. Overall Progress & Milestones
    var milestones = proj.milestones || [];
    var totalTasks = milestones.length;
    var msCompleted = milestones.filter(function(m) { return m.status === 'Completed'; }).length;
    var msPending = milestones.filter(function(m) { return m.status === 'Pending' || m.status === 'In Progress'; }).length;
    
    var progress = totalTasks > 0 ? Math.round((msCompleted / totalTasks) * 100) : (proj.progress || 0);
    document.getElementById('analytics-progress').textContent = progress + '%';
    document.getElementById('analytics-ms-completed').textContent = msCompleted;
    document.getElementById('analytics-ms-pending').textContent = msPending;
    
    // 2. Deadlines & Health
    var today = new Date();
    today.setHours(0,0,0,0);
    var dueDate = new Date(proj.dueDate || '9999-12-31');
    dueDate.setHours(0,0,0,0);
    
    var daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    var isOverdue = daysDiff < 0;
    
    document.getElementById('analytics-days').textContent = proj.status === 'Completed' ? '-' : (isOverdue ? 'Overdue' : daysDiff);
    document.getElementById('analytics-days').style.color = isOverdue && proj.status !== 'Completed' ? 'var(--danger)' : 'var(--text-1)';
    
    var msOverdue = milestones.filter(function(m) {
      if (m.status === 'Completed') return false;
      var mdDate = new Date(m.dueDate || '9999-12-31');
      mdDate.setHours(0,0,0,0);
      return mdDate < today;
    }).length;
    document.getElementById('analytics-ms-overdue').textContent = msOverdue;

    var deadlineBadge = '<span class="badge badge-neutral">No Date</span>';
    if (proj.status === 'Completed') {
      deadlineBadge = '<span class="badge badge-success">Delivered</span>';
    } else if (proj.dueDate) {
      if (isOverdue) deadlineBadge = '<span class="badge badge-danger">Overdue</span>';
      else if (daysDiff === 0) deadlineBadge = '<span class="badge badge-warning">Due Today</span>';
      else if (daysDiff === 1) deadlineBadge = '<span class="badge badge-warning">Due Tomorrow</span>';
      else if (daysDiff <= 7) deadlineBadge = '<span class="badge badge-info">This Week</span>';
      else deadlineBadge = '<span class="badge badge-active">On Track</span>';
    }
    document.getElementById('analytics-deadline').innerHTML = deadlineBadge;

    var healthHtml = '<span class="badge badge-active">Healthy</span>';
    if (proj.status === 'Completed') {
      healthHtml = '<span class="badge badge-success">Completed</span>';
    } else if (proj.status === 'Archived' || proj.status === 'Cancelled' || proj.isArchived || proj.isDeleted) {
      healthHtml = '<span class="badge badge-closed">' + (proj.status || 'Archived') + '</span>';
    } else if (isOverdue || msOverdue > 2) {
      healthHtml = '<span class="badge badge-danger">Critical</span>';
    } else if (daysDiff <= 3 && progress < 80) {
      healthHtml = '<span class="badge badge-warning">Attention</span>';
    }
    document.getElementById('analytics-health').innerHTML = healthHtml;

    // 3. Budget Tracker
    var estBudget = parseFloat(proj.budget || 0);
    var spentBudget = estBudget * (progress / 100);
    var remBudget = estBudget - spentBudget;
    document.getElementById('analytics-budget-est').textContent = '₹' + estBudget.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('analytics-budget-used').textContent = '₹' + spentBudget.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('analytics-budget-rem').textContent = '₹' + remBudget.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('analytics-budget-bar').style.width = progress + '%';

    // 4. Statistics
    document.getElementById('stat-tasks').textContent = totalTasks;
    document.getElementById('stat-members').textContent = (proj.team || []).length;
    document.getElementById('stat-files').textContent = (proj.files || []).length;
    document.getElementById('stat-notes').textContent = (proj.internalNotes || []).length;
    document.getElementById('stat-timeline').textContent = (proj.activities || []).length;

    // 5. Recent Activity
    var actList = document.getElementById('analytics-activity');
    actList.innerHTML = '';
    var activities = proj.activities || [];
    var recentActivities = activities.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 10);
    if (recentActivities.length === 0) {
      actList.innerHTML = '<div style="font-size:12px; color:var(--text-3); text-align:center;">No recent activity.</div>';
    } else {
      recentActivities.forEach(function(a) {
        var date = new Date(a.date);
        var timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        var html = '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:8px;">' +
          '<div><div style="font-size:13px; font-weight:700; color:var(--text-1);">' + a.action + '</div>' +
          '<div style="font-size:11px; color:var(--text-3); margin-top:2px;">' + a.details + '</div></div>' +
          '<div style="font-size:11px; color:var(--text-2); text-align:right;">' + timeStr + '</div>' +
        '</div>';
        actList.innerHTML += html;
      });
    }

    // 6. Project Insights (Text Generation)
    var insightsList = document.getElementById('analytics-insights');
    var insights = [];
    if (proj.status === 'Completed') insights.push('Project completed successfully.');
    else if (proj.status === 'Archived') insights.push('Project is archived.');
    else {
      if (progress === 0) insights.push('Project just started. No milestones completed yet.');
      else if (progress >= 80 && !isOverdue) insights.push('Project is on schedule and nearing completion.');
      else if (progress > 0 && !isOverdue) insights.push('Project is progressing steadily.');

      if (isOverdue) insights.push('Deadline missed. Project is overdue by ' + Math.abs(daysDiff) + ' days.');
      else if (daysDiff <= 7) insights.push('Deadline approaching soon (' + daysDiff + ' days left).');

      if (msOverdue > 0) insights.push(msOverdue + ' milestone(s) are overdue.');
      if (progress > 70 && estBudget > 0) insights.push('Budget usage is above 70%.');
    }

    insightsList.innerHTML = insights.map(function(ins) {
      return '<div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--primary); font-weight:600;">' +
        '<div style="width:6px; height:6px; background:var(--primary); border-radius:50%;"></div>' + ins + '</div>';
    }).join('');
  };

  window.populateProjectSubviews = function(proj) {
    if (window.populateAnalytics) window.populateAnalytics(proj);
    
    // 1. Milestones
    var msList = document.getElementById('drawer-milestones-list');
    msList.innerHTML = '';
    if (proj.milestones && proj.milestones.length > 0) {
      proj.milestones.sort(function(a, b) { return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'); });
      proj.milestones.forEach(function(m) {
        var status = m.status || 'Pending';
        var isDone = status === 'Completed';
        var isInProg = status === 'In Progress';
        var color = isDone ? 'var(--success)' : (isInProg ? 'var(--primary)' : 'var(--text-1)');
        
        var badge = '<span style="font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:' + color + '20; color:' + color + ';">' + status + '</span>';
        var html = '<div class="proj-box" style="padding:16px; border-left:4px solid ' + color + ';">' +
          '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
            '<div style="flex:1; padding-right:16px;">' +
              '<div style="display:flex; align-items:center; gap:8px;" id="ms-view-title-wrap-' + m.id + '">' +
                '<div style="font-size:14px; font-weight:700; text-decoration:' + (isDone ? 'line-through' : 'none') + ';">' + m.title + '</div>' + badge +
              '</div>' +
              '<div style="font-size:13px; color:var(--text-2); margin-top:4px;" id="ms-view-desc-' + m.id + '">' + (m.description || 'No description') + '</div>' +
              '<div style="font-size:12px; color:var(--text-3); margin-top:8px;" id="ms-view-meta-' + m.id + '">Assignee: ' + m.assignee + ' &bull; Due: ' + (m.dueDate || 'N/A') + '</div>' +
              '<div id="ms-edit-' + m.id + '" style="display:none; margin-top:12px;">' +
                '<div style="display:flex; flex-direction:column; gap:8px;">' +
                  '<input type="text" class="input" id="ms-edit-title-' + m.id + '" value="' + m.title + '" />' +
                  '<textarea class="input" id="ms-edit-desc-' + m.id + '">' + (m.description || '') + '</textarea>' +
                  '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
                    '<input type="text" class="input" id="ms-edit-assignee-' + m.id + '" value="' + (m.assignee || '') + '" />' +
                    '<input type="date" class="input" id="ms-edit-date-' + m.id + '" value="' + (m.dueDate || '') + '" />' +
                  '</div>' +
                  '<div style="display:flex; justify-content:flex-end; gap:8px;">' +
                    '<button class="btn btn-sm btn-ghost" onclick="cancelEditMilestone(\'' + m.id + '\')">Cancel</button>' +
                    '<button class="btn btn-sm btn-primary" onclick="saveMilestone(\'' + m.id + '\')">Save</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;" id="ms-actions-' + m.id + '">' +
              (!isDone ? '<button class="btn btn-sm btn-ghost" onclick="completeMilestone(\'' + m.id + '\')" style="color:var(--success); padding:0 8px; font-size:11px; height:24px;">Complete</button>' : '') +
              (status === 'Pending' ? '<button class="btn btn-sm btn-ghost" onclick="markMilestoneInProgress(\'' + m.id + '\')" style="color:var(--primary); padding:0 8px; font-size:11px; height:24px;">Start</button>' : '') +
              '<button class="btn btn-sm btn-ghost" onclick="editMilestone(\'' + m.id + '\')" style="color:var(--text-2); padding:0 8px; font-size:11px; height:24px;">Edit</button>' +
              '<button class="btn btn-sm btn-ghost" onclick="deleteMilestone(\'' + m.id + '\')" style="color:var(--danger); padding:0 8px; font-size:11px; height:24px;">Delete</button>' +
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
      var acts = proj.activities.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      acts.forEach(function(a) {
        var date = new Date(a.date);
        var timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        var iconMap = {
          'Project Created': '<circle cx="12" cy="12" r="10" stroke="var(--primary)"></circle>',
          'Project Edited': '<path d="M12 20h9" stroke="var(--primary)"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="var(--primary)"></path>',
          'Project Status Changed': '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="var(--primary)"></path>',
          'Priority Changed': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--primary)"></path>',
          'Milestone Added': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--success)"></path>',
          'Milestone Completed': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="var(--success)"></path><polyline points="22 4 12 14.01 9 11.01" stroke="var(--success)"></polyline>',
          'Milestone Deleted': '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="var(--danger)"></path>',
          'File Uploaded': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--text-2)"></path><polyline points="14 2 14 8 20 8" stroke="var(--text-2)"></polyline>',
          'File Deleted': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--danger)"></path>',
          'Note Added': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--text-2)"></path><line x1="16" y1="13" x2="8" y2="13" stroke="var(--text-2)"></line><line x1="16" y1="17" x2="8" y2="17" stroke="var(--text-2)"></line><polyline points="10 9 9 9 8 9" stroke="var(--text-2)"></polyline>',
          'Note Edited': '<path d="M12 20h9" stroke="var(--text-2)"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="var(--text-2)"></path>',
          'Note Deleted': '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="var(--danger)"></path>',
          'Member Added': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--text-1)"></path><circle cx="8.5" cy="7" r="4" stroke="var(--text-1)"></circle><line x1="20" y1="8" x2="20" y2="14" stroke="var(--text-1)"></line><line x1="23" y1="11" x2="17" y2="11" stroke="var(--text-1)"></line>',
          'Member Removed': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--danger)"></path><circle cx="8.5" cy="7" r="4" stroke="var(--danger)"></circle><line x1="23" y1="11" x2="17" y2="11" stroke="var(--danger)"></line>',
        };
        var iconHtml = '<svg style="position:absolute; left:-15px; top:4px; background:var(--bg-1); padding:2px; width:20px; height:20px; border-radius:50%; margin-left:-7px;" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' + (iconMap[a.action] || '<circle cx="12" cy="12" r="10" stroke="var(--text-3)"></circle>') + '</svg>';
        
        var html = '<div style="position:relative; margin-bottom:12px; padding-left:16px;">' +
          iconHtml +
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
      var files = proj.files.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      files.forEach(function(f) {
        var sizeKb = (f.size / 1024).toFixed(1) + ' KB';
        var date = new Date(f.date).toLocaleDateString();
        var html = '<div class="proj-box" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div style="display:flex; align-items:center; gap:12px;">' +
            '<div style="width:32px; height:32px; border-radius:6px; background:var(--bg-2); display:flex; align-items:center; justify-content:center; color:var(--primary);">' +
              '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:13px; font-weight:700;">' + f.name + '</div>' +
              '<div style="font-size:11px; color:var(--text-3);">' + sizeKb + ' &bull; ' + date + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; gap:4px;">' +
            '<button class="btn btn-sm btn-ghost" onclick="previewFile(\'' + f.id + '\')" style="color:var(--text-2);">Preview</button>' +
            '<button class="btn btn-sm btn-ghost" onclick="downloadFile(\'' + f.id + '\')" style="color:var(--text-2);">Download</button>' +
            '<button class="btn btn-sm btn-ghost" onclick="renameFile(\'' + f.id + '\')" style="color:var(--text-2);">Rename</button>' +
            '<button class="btn btn-sm btn-ghost" onclick="deleteFile(\'' + f.id + '\')" style="color:var(--danger);">Delete</button>' +
          '</div>' +
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
      var notes = proj.internalNotes.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      notes.forEach(function(n) {
        var date = new Date(n.date).toLocaleString();
        var html = '<div class="proj-box" style="padding:16px; background:var(--bg-2); border:none;">' +
          '<div style="font-size:13px; color:var(--text-1); white-space:pre-wrap;" id="note-text-' + n.id + '">' + n.text + '</div>' +
          '<textarea class="input" id="note-edit-' + n.id + '" style="display:none; width:100%; min-height:60px; font-size:13px;">' + n.text + '</textarea>' +
          '<div style="display:flex; justify-content:space-between; margin-top:12px; font-size:11px; color:var(--text-3);">' +
            '<span>' + n.author + ' &bull; ' + date + '</span>' +
            '<div>' +
              '<span id="note-btn-edit-' + n.id + '" onclick="editNote(\'' + n.id + '\')" style="cursor:pointer; color:var(--text-2); margin-right:12px;">Edit</span>' +
              '<span id="note-btn-save-' + n.id + '" onclick="saveNote(\'' + n.id + '\')" style="display:none; cursor:pointer; color:var(--primary); margin-right:12px; font-weight:700;">Save</span>' +
              '<span onclick="deleteNote(\'' + n.id + '\')" style="cursor:pointer; color:var(--danger);">Delete</span>' +
            '</div>' +
          '</div>' +
        '</div>';
        notesList.innerHTML += html;
      });
    } else {
      notesList.innerHTML = '<div style="color:var(--text-3); font-size:13px;">No internal notes.</div>';
    }

    // 5. Team
    var teamList = document.getElementById('drawer-team-list');
    teamList.innerHTML = '<div style="margin-bottom:12px; text-align:right;"><button class="btn btn-sm btn-primary" onclick="openTeamModal()">+ Assign Member</button></div>';
    if (proj.detailedTeam && proj.detailedTeam.length > 0) {
      proj.detailedTeam.forEach(function(t) {
        var html = '<div class="proj-box" style="padding:16px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div style="display:flex; align-items:center; gap:16px;">' +
            '<div class="proj-avatar" style="width:40px; height:40px; font-size:14px;">' + t.id.substring(0,2).toUpperCase() + '</div>' +
            '<div>' +
              '<div style="font-size:14px; font-weight:700;">' + t.id + '</div>' +
              '<div style="font-size:12px; color:var(--text-2); margin-top:4px;">' + (t.role || 'Member') + ' &bull; ' + (t.department || 'General') + '</div>' +
              '<div style="font-size:11px; color:var(--text-3); margin-top:4px;">Assigned: ' + (t.assignedDate || new Date().toLocaleDateString()) + '</div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<button class="btn btn-sm btn-ghost" onclick="removeMember(\'' + t.id + '\')" style="color:var(--danger);">Remove</button>' +
          '</div>' +
        '</div>';
        teamList.innerHTML += html;
      });
    } else {
      teamList.innerHTML += '<div style="color:var(--text-3); font-size:13px;">No team members assigned.</div>';
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
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Milestone Added', details: title, date: new Date().toISOString(), user: 'System Admin' });
        
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones, activities: act }).then(function(updated) {
          hideAddMilestoneForm();
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId); // Refresh progress
        });
      });
    }
  };

  window.editMilestone = function(id) {
    document.getElementById('ms-view-title-wrap-' + id).style.display = 'none';
    document.getElementById('ms-view-desc-' + id).style.display = 'none';
    document.getElementById('ms-view-meta-' + id).style.display = 'none';
    document.getElementById('ms-actions-' + id).style.display = 'none';
    document.getElementById('ms-edit-' + id).style.display = 'block';
  };

  window.cancelEditMilestone = function(id) {
    document.getElementById('ms-view-title-wrap-' + id).style.display = 'flex';
    document.getElementById('ms-view-desc-' + id).style.display = 'block';
    document.getElementById('ms-view-meta-' + id).style.display = 'block';
    document.getElementById('ms-actions-' + id).style.display = 'flex';
    document.getElementById('ms-edit-' + id).style.display = 'none';
  };

  window.saveMilestone = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var milestones = p.milestones || [];
        milestones = milestones.map(function(m) {
          if (m.id === id) {
            m.title = document.getElementById('ms-edit-title-' + id).value;
            m.description = document.getElementById('ms-edit-desc-' + id).value;
            m.assignee = document.getElementById('ms-edit-assignee-' + id).value;
            m.dueDate = document.getElementById('ms-edit-date-' + id).value;
          }
          return m;
        });
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId);
        });
      });
    }
  };

  window.markMilestoneInProgress = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var milestones = p.milestones || [];
        milestones = milestones.map(function(m) { 
          if(m.id === id) { m.status = 'In Progress'; }
          return m; 
        });
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId);
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
          act.unshift({ id: 'ACT-' + Date.now(), action: 'Milestone Completed', details: taskTitle, date: new Date().toISOString(), user: 'System Admin' });
        }
        
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones, activities: act }).then(function(updated) {
          if (taskTitle && p.clientId) window.logClientActivity(p.clientId, 'Milestone Completed', p.name + ': ' + taskTitle + ' was completed.');
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
        var act = p.activities || [];
        var taskTitle = '';
        milestones = milestones.filter(function(m) { 
          if (m.id === id) { taskTitle = m.title; return false; }
          return true; 
        });
        if(taskTitle) {
          act.unshift({ id: 'ACT-' + Date.now(), action: 'Milestone Deleted', details: taskTitle, date: new Date().toISOString(), user: 'System Admin' });
        }
        window.VerdeServices.Projects.updateProject(currentProjectId, { milestones: milestones, activities: act }).then(function(updated) {
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
        var act = p.activities || [];
        files.push({ id: 'F-' + Date.now(), name: file.name, size: file.size, date: new Date().toISOString() });
        act.unshift({ id: 'ACT-' + Date.now(), action: 'File Uploaded', details: file.name, date: new Date().toISOString(), user: 'System Admin' });
        window.VerdeServices.Projects.updateProject(currentProjectId, { files: files, activities: act }).then(function(updated) {
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
        var act = p.activities || [];
        var fileName = '';
        files = files.filter(function(f) { 
          if (f.id === id) { fileName = f.name; return false; }
          return true; 
        });
        if (fileName) {
          act.unshift({ id: 'ACT-' + Date.now(), action: 'File Deleted', details: fileName, date: new Date().toISOString(), user: 'System Admin' });
        }
        window.VerdeServices.Projects.updateProject(currentProjectId, { files: files, activities: act }).then(function(updated) {
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
        var act = p.activities || [];
        notes.push({ id: 'N-' + Date.now(), text: text, author: 'System Admin', date: new Date().toISOString() });
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Note Added', details: 'Added a new internal note', date: new Date().toISOString(), user: 'System Admin' });
        window.VerdeServices.Projects.updateProject(currentProjectId, { internalNotes: notes, activities: act }).then(function(updated) {
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
        var act = p.activities || [];
        notes = notes.filter(function(n) { return n.id !== id; });
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Note Deleted', details: 'Deleted an internal note', date: new Date().toISOString(), user: 'System Admin' });
        window.VerdeServices.Projects.updateProject(currentProjectId, { internalNotes: notes, activities: act }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.editNote = function(id) {
    document.getElementById('note-text-' + id).style.display = 'none';
    document.getElementById('note-edit-' + id).style.display = 'block';
    document.getElementById('note-btn-edit-' + id).style.display = 'none';
    document.getElementById('note-btn-save-' + id).style.display = 'inline-block';
  };

  window.saveNote = function(id) {
    var newText = document.getElementById('note-edit-' + id).value;
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var notes = p.internalNotes || [];
        var act = p.activities || [];
        notes = notes.map(function(n) {
          if (n.id === id) n.text = newText;
          return n;
        });
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Note Edited', details: 'Edited an internal note', date: new Date().toISOString(), user: 'System Admin' });
        window.VerdeServices.Projects.updateProject(currentProjectId, { internalNotes: notes, activities: act }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.previewFile = function(id) {
    if (window.VerdeToast) window.VerdeToast.info('Previewing file... (Mock)');
  };

  window.downloadFile = function(id) {
    if (window.VerdeToast) window.VerdeToast.success('Downloading file... (Mock)');
  };

  window.renameFile = function(id) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      var newName = prompt('Enter new filename:');
      if (!newName) return;
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var files = p.files || [];
        files = files.map(function(f) {
          if (f.id === id) f.name = newName;
          return f;
        });
        window.VerdeServices.Projects.updateProject(currentProjectId, { files: files }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.openTeamModal = function() {
    teamModalFilter = 'All';
    teamModalSearch = '';
    teamModalSelected = [];
    document.getElementById('team-search-input').value = '';
    
    document.querySelectorAll('.team-filter-btn').forEach(function(btn) {
      if(btn.dataset.filter === 'All') {
        btn.classList.add('active');
        btn.classList.remove('btn-ghost');
      } else {
        btn.classList.remove('active');
        btn.classList.add('btn-ghost');
      }
    });
    
    window.renderEmployeeList();
    document.getElementById('team-assign-modal').classList.add('active');
  };

  window.closeTeamModal = function() {
    document.getElementById('team-assign-modal').classList.remove('active');
  };

  window.setTeamFilter = function(filter) {
    teamModalFilter = filter;
    document.querySelectorAll('.team-filter-btn').forEach(function(btn) {
      if(btn.dataset.filter === filter) {
        btn.classList.add('active');
        btn.classList.remove('btn-ghost');
      } else {
        btn.classList.remove('active');
        btn.classList.add('btn-ghost');
      }
    });
    window.renderEmployeeList();
  };

  window.renderEmployeeList = function() {
    teamModalSearch = document.getElementById('team-search-input').value.toLowerCase();
    var listEl = document.getElementById('team-modal-list');
    listEl.innerHTML = '';
    
    // In future, pull from Team module. For now, use MOCK_EMPLOYEES
    var existingTeamIds = currentProjectData && currentProjectData.team ? currentProjectData.team : [];
    
    var filtered = MOCK_EMPLOYEES.filter(function(emp) {
      if (existingTeamIds.includes(emp.id)) return false; // Hide already assigned members
      if (teamModalFilter !== 'All' && emp.department !== teamModalFilter) return false;
      if (teamModalSearch) {
        var matchName = emp.name.toLowerCase().includes(teamModalSearch);
        var matchRole = emp.role.toLowerCase().includes(teamModalSearch);
        var matchDept = emp.department.toLowerCase().includes(teamModalSearch);
        if (!matchName && !matchRole && !matchDept) return false;
      }
      return true;
    });
    
    if(filtered.length === 0) {
      listEl.innerHTML = '<div style="color:var(--text-3); font-size:13px; text-align:center; padding:24px 0;">No matching employees found.</div>';
      return;
    }
    
    filtered.forEach(function(emp) {
      var isSelected = teamModalSelected.includes(emp.id);
      var borderStyle = isSelected ? 'border:1px solid var(--primary); background:var(--primary-light, rgba(0,200,83,0.05));' : 'border:1px solid transparent; background:var(--bg-1);';
      var checkHtml = isSelected ? '<div style="color:var(--primary); font-size:16px;">✓</div>' : '<div style="width:16px; height:16px; border:1px solid var(--border); border-radius:4px;"></div>';
      
      var html = '<div class="proj-box" style="padding:12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; ' + borderStyle + '" onclick="toggleEmployeeSelection(\'' + emp.id + '\')">' +
        '<div style="display:flex; align-items:center; gap:12px;">' +
          '<div class="proj-avatar" style="width:36px; height:36px; font-size:12px;">' + emp.name.substring(0,2).toUpperCase() + '</div>' +
          '<div>' +
            '<div style="font-size:13px; font-weight:700;">' + emp.availability + ' ' + emp.name + ' <span style="font-weight:500; color:var(--text-3);">(' + emp.department + ')</span></div>' +
            '<div style="font-size:11px; color:var(--text-2); margin-top:2px;">' + emp.role + ' &bull; ' + emp.workload + '</div>' +
          '</div>' +
        '</div>' +
        '<div>' + checkHtml + '</div>' +
      '</div>';
      listEl.innerHTML += html;
    });
  };

  window.toggleEmployeeSelection = function(id) {
    var idx = teamModalSelected.indexOf(id);
    if(idx > -1) {
      teamModalSelected.splice(idx, 1);
    } else {
      teamModalSelected.push(id);
    }
    window.renderEmployeeList();
  };

  window.assignSelectedMembers = function() {
    if(teamModalSelected.length === 0) {
      window.closeTeamModal();
      return;
    }
    
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var dTeam = p.detailedTeam || [];
        var team = p.team || [];
        var act = p.activities || [];
        
        teamModalSelected.forEach(function(memberId) {
          if (!team.includes(memberId)) {
            team.push(memberId);
            var empData = MOCK_EMPLOYEES.find(function(e) { return e.id === memberId; });
            dTeam.push({ 
              id: memberId, 
              role: empData ? empData.role : 'Member', 
              department: empData ? empData.department : 'General',
              assignedDate: new Date().toLocaleDateString() 
            });
            act.unshift({ id: 'ACT-' + Date.now() + Math.floor(Math.random()*1000), action: 'Member Assigned', details: memberId + ' was assigned to the project', date: new Date().toISOString(), user: 'System Admin' });
          }
        });
        
        window.VerdeServices.Projects.updateProject(currentProjectId, { team: team, detailedTeam: dTeam, activities: act }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId);
          window.renderProjectsList();
          window.closeTeamModal();
          if(window.VerdeToast) window.VerdeToast.success('Members assigned successfully.');
        });
      });
    }
  };

  window.removeMember = function(memberId) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var dTeam = p.detailedTeam || [];
        var team = p.team || [];
        dTeam = dTeam.filter(function(t) { return t.id !== memberId; });
        team = team.filter(function(t) { return t !== memberId; });
        var act = p.activities || [];
        act.unshift({ id: 'ACT-' + Date.now(), action: 'Member Removed', details: memberId + ' left the project', date: new Date().toISOString(), user: 'System Admin' });
        window.VerdeServices.Projects.updateProject(currentProjectId, { team: team, detailedTeam: dTeam, activities: act }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
          window.openProjectDetails(currentProjectId);
          window.renderProjectsList();
        });
      });
    }
  };

  window.changeRole = function(memberId, newRole) {
    if(window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(currentProjectId).then(function(p) {
        var dTeam = p.detailedTeam || [];
        dTeam = dTeam.map(function(t) {
          if (t.id === memberId) t.role = newRole;
          return t;
        });
        window.VerdeServices.Projects.updateProject(currentProjectId, { detailedTeam: dTeam }).then(function(updated) {
          currentProjectData = updated;
          populateProjectSubviews(updated);
        });
      });
    }
  };

  window.logClientActivity = function(clientId, action, details) {
    if (!clientId || !window.VerdeServices || !window.VerdeServices.Crm) return Promise.resolve();
    return window.VerdeServices.Crm.getClientById(clientId).then(function(clientData) {
      if (clientData) {
        var acts = clientData.activities || [];
        acts.push({ id: 'ACT-' + Date.now() + Math.floor(Math.random()*1000), action: action, details: details, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System Admin', date: new Date().toISOString() });
        return window.VerdeServices.Crm.updateClient(clientId, { activities: acts });
      }
    });
  };

  window.openProjectDetails = function(id) {
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjectById(id).then(function (proj) {
        if (!proj) return;
        currentProjectId = proj.id;
        currentProjectData = proj;
        isEditMode = false;
        
        window.switchProjTab('analytics');

        // Reset UI
        document.getElementById('drawer-edit-btn').style.display = 'inline-block';
        document.getElementById('drawer-save-btn').style.display = 'none';
        
        // Setup Action Buttons
        var completeBtn = document.getElementById('drawer-mark-completed-btn');
        var restoreBtn = document.getElementById('drawer-restore-btn');
        var archiveBtn = document.getElementById('drawer-archive-btn');
        var editBtn = document.getElementById('drawer-edit-btn');
        
        if (proj.isArchived) {
          if (completeBtn) completeBtn.style.display = 'none';
          if (restoreBtn) restoreBtn.style.display = 'inline-block';
          if (archiveBtn) archiveBtn.style.display = 'none';
          if (editBtn) editBtn.style.display = 'none';
        } else {
          if (restoreBtn) restoreBtn.style.display = 'none';
          if (archiveBtn) archiveBtn.style.display = 'inline-block';
          if (editBtn) editBtn.style.display = 'inline-block';
          
          if (proj.status === 'Completed' || proj.status === 'Cancelled') {
            if (completeBtn) completeBtn.style.display = 'none';
          } else {
            if (completeBtn) completeBtn.style.display = 'inline-block';
          }
        }
        
        // Load Client Data
        if (proj.clientId && window.VerdeServices.Crm) {
           window.VerdeServices.Crm.getClientById(proj.clientId).then(function(clientData) {
             if (clientData) {
               document.getElementById('drawer-client-logo').textContent = clientData.company.substring(0,2).toUpperCase();
               document.getElementById('drawer-proj-client').textContent = clientData.company;
               document.getElementById('drawer-client-meta').innerHTML = clientData.contactPerson + ' &bull; ' + (clientData.industry || 'General');
               document.getElementById('drawer-client-contact').style.display = 'block';
               document.getElementById('drawer-client-email').textContent = clientData.email || 'N/A';
               document.getElementById('drawer-client-phone').textContent = clientData.phone || 'N/A';
               document.getElementById('drawer-client-btn').style.display = 'inline-block';
               document.getElementById('drawer-client-btn').setAttribute('onclick', 'window.location.href = "../crm/index.html?client=' + proj.clientId + '"');
             }
           });
        } else {
           document.getElementById('drawer-client-logo').textContent = (proj.client || 'CL').substring(0,2).toUpperCase();
           document.getElementById('drawer-proj-client').textContent = proj.client || 'Unknown Client';
           document.getElementById('drawer-client-meta').innerHTML = 'External Client &bull; General';
           document.getElementById('drawer-client-contact').style.display = 'none';
           document.getElementById('drawer-client-btn').style.display = 'none';
        }

        var reopenBtn = document.getElementById('drawer-reopen-btn');
        if (proj.status === 'Completed' || proj.status === 'Archived' || proj.status === 'Cancelled' || proj.isArchived) {
          if (reopenBtn) reopenBtn.style.display = 'inline-block';
        } else {
          if (reopenBtn) reopenBtn.style.display = 'none';
        }

        document.getElementById('drawer-proj-title').style.display = 'block';
        document.getElementById('edit-proj-title').style.display = 'none';
        document.getElementById('drawer-proj-client-container').style.display = 'flex';
        document.getElementById('edit-proj-client').style.display = 'none';
        document.getElementById('drawer-proj-desc').style.display = 'block';
        document.getElementById('edit-proj-desc').style.display = 'none';
        document.getElementById('drawer-proj-status').style.display = 'block';
        document.getElementById('edit-proj-status').style.display = 'none';
        document.getElementById('drawer-proj-date').style.display = 'block';
        document.getElementById('edit-proj-date').style.display = 'none';
        
        if (document.getElementById('drawer-proj-owner')) document.getElementById('drawer-proj-owner').style.display = 'block';
        if (document.getElementById('edit-proj-owner')) document.getElementById('edit-proj-owner').style.display = 'none';
        if (document.getElementById('drawer-proj-dept')) document.getElementById('drawer-proj-dept').style.display = 'block';
        if (document.getElementById('edit-proj-dept')) document.getElementById('edit-proj-dept').style.display = 'none';
        if (document.getElementById('drawer-proj-tags')) document.getElementById('drawer-proj-tags').style.display = 'block';
        if (document.getElementById('edit-proj-tags')) document.getElementById('edit-proj-tags').style.display = 'none';
        
        // Progress Calculation
        var milestones = proj.milestones || [];
        var totalTasks = milestones.length;
        var completedTasks = milestones.filter(function(m) { return m.status === 'Completed'; }).length;
        var pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proj.progress || 0);
        
        // Save computed progress back if it changed
        if(pct !== proj.progress) {
          window.VerdeServices.Projects.updateProject(proj.id, { progress: pct }).then(function() {
            if (proj.clientId) window.logClientActivity(proj.clientId, 'Progress Updated', proj.name + ' progress updated to ' + pct + '%');
          });
        }

        if (document.getElementById('drawer-proj-title')) document.getElementById('drawer-proj-title').textContent = proj.name || 'Project Details';
        if (document.getElementById('drawer-proj-desc')) document.getElementById('drawer-proj-desc').textContent = proj.notes || proj.deliverables || (proj.category + ' project for ' + proj.client);
        if (document.getElementById('drawer-proj-status')) {
          var statusEl = document.getElementById('drawer-proj-status');
          statusEl.textContent = proj.isArchived ? 'Archived' : (proj.status || 'Active');
          statusEl.style.color = (proj.status === 'Completed' ? 'var(--text-3)' : (proj.status === 'At Risk' || proj.status === 'Cancelled' ? 'var(--danger)' : (proj.status === 'On Hold' ? 'var(--warning)' : 'var(--success)')));
        }
        if (document.getElementById('drawer-proj-priority')) document.getElementById('drawer-proj-priority').textContent = proj.priority || 'Medium';
        if (document.getElementById('drawer-proj-date')) document.getElementById('drawer-proj-date').textContent = proj.dueDate || 'Aug 30, 2026';
        
        if (document.getElementById('drawer-proj-owner')) document.getElementById('drawer-proj-owner').textContent = proj.owner || 'System Admin';
        if (document.getElementById('drawer-proj-dept')) document.getElementById('drawer-proj-dept').textContent = proj.department || 'Engineering';
        if (document.getElementById('drawer-proj-tags')) document.getElementById('drawer-proj-tags').textContent = (proj.tags && proj.tags.length > 0) ? proj.tags.join(', ') : 'None';
        if (document.getElementById('drawer-proj-created')) document.getElementById('drawer-proj-created').textContent = new Date(proj.createdAt || proj.startDate || Date.now()).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'});
        if (document.getElementById('drawer-proj-updated')) document.getElementById('drawer-proj-updated').textContent = new Date(proj.updatedAt || Date.now()).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'});
        
        if (document.getElementById('drawer-proj-progress-pct')) document.getElementById('drawer-proj-progress-pct').textContent = pct + '%';
        if (document.getElementById('drawer-proj-progress-bar')) document.getElementById('drawer-proj-progress-bar').style.width = pct + '%';
        if (document.getElementById('drawer-proj-tasks-summary')) document.getElementById('drawer-proj-tasks-summary').textContent = completedTasks + ' / ' + totalTasks + ' Tasks Completed';
        
        var b = parseFloat(proj.budget || 0);
        if (document.getElementById('drawer-proj-budget')) document.getElementById('drawer-proj-budget').textContent = 'Est. Budget: ₹' + b.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (document.getElementById('drawer-proj-team')) document.getElementById('drawer-proj-team').textContent = 'Team: ' + (proj.detailedTeam ? proj.detailedTeam.length : 0) + ' Members';

        // Populate Inputs
        if (document.getElementById('edit-proj-title')) document.getElementById('edit-proj-title').value = proj.name || '';
        if (document.getElementById('edit-proj-client')) document.getElementById('edit-proj-client').value = proj.client || '';
        if (document.getElementById('edit-proj-desc')) document.getElementById('edit-proj-desc').value = proj.notes || '';
        if (document.getElementById('edit-proj-status')) document.getElementById('edit-proj-status').value = proj.status || 'Active';
        if (document.getElementById('edit-proj-priority')) document.getElementById('edit-proj-priority').value = proj.priority || 'Medium';
        if (document.getElementById('edit-proj-date')) document.getElementById('edit-proj-date').value = proj.dueDate || '';
        if (document.getElementById('edit-proj-owner')) document.getElementById('edit-proj-owner').value = proj.owner || '';
        if (document.getElementById('edit-proj-dept')) document.getElementById('edit-proj-dept').value = proj.department || '';
        if (document.getElementById('edit-proj-tags')) document.getElementById('edit-proj-tags').value = (proj.tags && proj.tags.length > 0) ? proj.tags.join(', ') : '';

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
    
    document.getElementById('drawer-proj-client-container').style.display = 'none';
    document.getElementById('edit-proj-client').style.display = 'block';
    
    document.getElementById('drawer-proj-desc').style.display = 'none';
    document.getElementById('edit-proj-desc').style.display = 'block';
    
    document.getElementById('drawer-proj-status').style.display = 'none';
    document.getElementById('edit-proj-status').style.display = 'block';
    
    document.getElementById('drawer-proj-date').style.display = 'none';
    document.getElementById('edit-proj-date').style.display = 'block';
    
    if (document.getElementById('drawer-proj-owner')) document.getElementById('drawer-proj-owner').style.display = 'none';
    if (document.getElementById('edit-proj-owner')) document.getElementById('edit-proj-owner').style.display = 'block';
    
    if (document.getElementById('drawer-proj-dept')) document.getElementById('drawer-proj-dept').style.display = 'none';
    if (document.getElementById('edit-proj-dept')) document.getElementById('edit-proj-dept').style.display = 'block';
    
    if (document.getElementById('drawer-proj-tags')) document.getElementById('drawer-proj-tags').style.display = 'none';
    if (document.getElementById('edit-proj-tags')) document.getElementById('edit-proj-tags').style.display = 'block';
    
    var pri = document.getElementById('drawer-proj-priority');
    if (pri) pri.style.display = 'none';
    var editPri = document.getElementById('edit-proj-priority');
    if (editPri) editPri.style.display = 'block';
  };

  window.saveProjectEdits = function() {
    if (!currentProjectId || !window.VerdeServices || !window.VerdeServices.Projects) return;
    
    var status = document.getElementById('edit-proj-status').value;
    var priority = document.getElementById('edit-proj-priority') ? document.getElementById('edit-proj-priority').value : 'Medium';
    var updates = {
      name: document.getElementById('edit-proj-title').value,
      client: document.getElementById('edit-proj-client').value,
      notes: document.getElementById('edit-proj-desc').value,
      status: status,
      priority: priority,
      dueDate: document.getElementById('edit-proj-date').value,
      updatedAt: new Date().toISOString()
    };
    
    if (document.getElementById('edit-proj-owner')) updates.owner = document.getElementById('edit-proj-owner').value;
    if (document.getElementById('edit-proj-dept')) updates.department = document.getElementById('edit-proj-dept').value;
    if (document.getElementById('edit-proj-tags')) {
      var tagsVal = document.getElementById('edit-proj-tags').value;
      updates.tags = tagsVal ? tagsVal.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }) : [];
    }

    if (updates.status !== 'Draft') updates.isDraft = false;
    if (updates.status === 'Draft') updates.isDraft = true;
    
    updates.activities = currentProjectData.activities || [];
    
    if (currentProjectData && currentProjectData.status !== status) {
      updates.activities.unshift({ id: 'ACT-' + Date.now(), action: 'Project Status Changed', details: 'Status moved to ' + status, date: new Date().toISOString(), user: 'System Admin' });
    }
    
    if (currentProjectData && currentProjectData.priority !== priority) {
      updates.activities.unshift({ id: 'ACT-' + Date.now() + 1, action: 'Priority Changed', details: 'Priority moved to ' + priority, date: new Date().toISOString(), user: 'System Admin' });
    }
    
    // Check if Project Updated timeline should be logged
    var isMajorUpdate = (currentProjectData.name !== updates.name || currentProjectData.client !== updates.client || currentProjectData.dueDate !== updates.dueDate);
    if (isMajorUpdate) {
      updates.activities.unshift({ id: 'ACT-' + Date.now() + 2, action: 'Project Edited', details: 'Project details were modified', date: new Date().toISOString(), user: 'System Admin' });
    }

    window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function(updatedProj) {
      if (isMajorUpdate && currentProjectData.clientId) {
         window.logClientActivity(currentProjectData.clientId, 'Project Updated', 'Project ' + updatedProj.name + ' was updated.');
      }
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
              if (proj.clientId) window.logClientActivity(proj.clientId, 'Project Deleted', proj.name + ' was deleted.');
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
            var activities = currentProjectData ? (currentProjectData.activities || []) : [];
            activities.unshift({ id: 'ACT-' + Date.now(), action: 'Archived', details: 'Project was archived.', date: new Date().toISOString(), user: 'System' });
            var updates = { isArchived: true, status: 'Archived', activities: activities };
            window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
              if (currentProjectData && currentProjectData.clientId) window.logClientActivity(currentProjectData.clientId, 'Project Archived', currentProjectData.name + ' was archived.');
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
  
  window.reopenProject = function() {
    if (!currentProjectId || !currentProjectData) return;
    if (window.VerdeModal) {
      window.VerdeModal.confirm({
        title: 'Reopen Project',
        body: 'Are you sure you want to reopen this project? Its status will be set to Active.',
        confirmText: 'Reopen',
        confirmClass: 'btn-primary',
        onConfirm: function() {
          var activities = currentProjectData.activities || [];
          activities.unshift({ id: 'ACT-' + Date.now(), action: 'Status Changed', details: 'Project reopened and set to Active', date: new Date().toISOString(), user: 'System Admin' });
          var updates = { isArchived: false, status: 'Active', activities: activities, updatedAt: new Date().toISOString() };
          window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
            if (currentProjectData && currentProjectData.clientId) window.logClientActivity(currentProjectData.clientId, 'Project Reopened', currentProjectData.name + ' was reopened.');
            if (window.VerdeToast) window.VerdeToast.success('Project reopened.');
            window.openProjectDetails(currentProjectId);
            window.renderProjectsList();
            if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
          });
        }
      });
    }
  };

  window.duplicateCurrentProject = function() {
    if (!currentProjectData || !window.VerdeServices || !window.VerdeServices.Projects) return;
    if (window.VerdeModal) {
      window.VerdeModal.confirm({
        title: 'Duplicate Project',
        body: 'Are you sure you want to duplicate "' + currentProjectData.name + '"?',
        confirmText: 'Duplicate',
        confirmClass: 'btn-primary',
        onConfirm: function() {
          var dup = JSON.parse(JSON.stringify(currentProjectData));
          delete dup.id;
          dup.name = dup.name + ' (Copy)';
          dup.status = 'Active';
          dup.isArchived = false;
          dup.progress = 0;
          dup.activities = [{ id: 'ACT-' + Date.now(), action: 'Project Created', details: 'Project duplicated', date: new Date().toISOString(), user: 'System Admin' }];
          dup.createdAt = new Date().toISOString();
          dup.updatedAt = new Date().toISOString();
          window.VerdeServices.Projects.createProject(dup).then(function(newProj) {
            if (window.VerdeToast) window.VerdeToast.success('Project duplicated.');
            window.closeProject();
            window.renderProjectsList();
            if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
          });
        }
      });
    }
  };

  window.openClientProfile = function() {
    if (!currentProjectData || !currentProjectData.client) return;
    if (currentProjectData.client.toLowerCase() !== 'internal') {
      // In a real app, we'd navigate to CRM with client ID.
      // For now, redirect to CRM.
      window.location.href = '../crm/index.html?search=' + encodeURIComponent(currentProjectData.client);
    }
  };

  window.restoreProject = function() {
    if (!currentProjectId) return;
    if (window.VerdeServices && window.VerdeServices.Projects) {
      var activities = currentProjectData ? (currentProjectData.activities || []) : [];
      activities.unshift({ id: 'ACT-' + Date.now(), action: 'Restored', details: 'Project restored from archive.', date: new Date().toISOString(), user: 'System Admin' });
      var updates = { isArchived: false, status: 'Active', activities: activities, updatedAt: new Date().toISOString() };
      window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
        if (currentProjectData && currentProjectData.clientId) window.logClientActivity(currentProjectData.clientId, 'Project Restored', currentProjectData.name + ' was restored.');
        if (window.VerdeToast) window.VerdeToast.success('Project restored.');
        window.openProjectDetails(currentProjectId);
        window.renderProjectsList();
        if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
      });
    }
  };

  window.markProjectCompleted = function() {
    if (!currentProjectId) return;
    if (window.VerdeServices && window.VerdeServices.Projects) {
      var activities = currentProjectData ? (currentProjectData.activities || []) : [];
      activities.unshift({ id: 'ACT-' + Date.now(), action: 'Completed', details: 'Project marked as completed.', date: new Date().toISOString(), user: 'System Admin' });
      var updates = { status: 'Completed', progress: 100, activities: activities, updatedAt: new Date().toISOString() };
      window.VerdeServices.Projects.updateProject(currentProjectId, updates).then(function() {
        if (currentProjectData && currentProjectData.clientId) window.logClientActivity(currentProjectData.clientId, 'Project Completed', currentProjectData.name + ' was marked as completed.');
        if (window.VerdeToast) window.VerdeToast.success('Project completed!');
        window.openProjectDetails(currentProjectId);
        window.renderProjectsList();
        if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
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

  var projCurrentSort = null;
  
  window.setProjFilter = function(key, value) {
    projCurrentFilter = { key: key, value: value };
    window.renderProjectsList();
    var menu = document.getElementById('proj-filter-menu');
    if (menu) menu.style.display = 'none';
  };

  window.setProjSort = function(sortType) {
    projCurrentSort = sortType;
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
        kpis[2].textContent = activeProjects.filter(function (p) { return p.status === 'On Hold'; }).length;
        kpis[3].textContent = activeProjects.filter(function (p) { return p.status === 'Cancelled'; }).length;
        
        var kpiLabels = document.querySelectorAll('.proj-kpi-label');
        if (kpiLabels.length >= 4) {
          kpiLabels[2].textContent = 'On Hold';
          kpiLabels[3].textContent = 'Cancelled';
        }
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
          var teamStr = p.team ? p.team.join(' ') : '';
          var tagStr = p.tags ? p.tags.join(' ') : '';
          var ownerStr = p.owner || '';
          var searchStr = ((p.name || '') + ' ' + (p.client || '') + ' ' + (p.id || '') + ' ' + teamStr + ' ' + tagStr + ' ' + ownerStr).toLowerCase();
          if (searchStr.indexOf(projSearchQuery) === -1) return false;
        }
        return true;
      });

      // Apply Sort
      if (projCurrentSort) {
        filtered.sort(function(a, b) {
          if (projCurrentSort === 'createdAt') {
            return new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0);
          } else if (projCurrentSort === 'createdAt_asc') {
            return new Date(a.createdAt || a.startDate || 0) - new Date(b.createdAt || b.startDate || 0);
          } else if (projCurrentSort === 'dueDate') {
            return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
          } else if (projCurrentSort === 'priority') {
            var pMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
          } else if (projCurrentSort === 'progress') {
            return (b.progress || 0) - (a.progress || 0);
          } else if (projCurrentSort === 'name') {
            return (a.name || '').localeCompare(b.name || '');
          }
          return 0;
        });
      }

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