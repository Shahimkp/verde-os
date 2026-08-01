/* ==========================================================================
   VERDE OS — TASKS WORKSPACE CONTROLLER
   Enterprise Task Management System
   ========================================================================== */

(function () {
  'use strict';

  let currentSort = 'Newest';
  let currentFilter = 'All';
  let currentSearch = '';
  
  // Teams Mock if VerdeServices.Team is not fully implemented
  const teamMock = [
    { id: 'SH', name: 'Shahim', role: 'AI Engineer' },
    { id: 'MI', name: 'Midhul', role: 'Frontend Developer' },
    { id: 'NH', name: 'Nihal', role: 'Backend Developer' },
    { id: 'AM', name: 'Ameen', role: 'Project Manager' }
  ];

  function getAvatar(id) {
    if (!id || id === 'Unassigned') return { initials: '?', color: 'var(--text-3)' };
    const nameStr = id;
    const initials = nameStr.substring(0, 2).toUpperCase();
    const bgColors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#8B5CF6'];
    const idx = (initials.charCodeAt(0) || 0) % bgColors.length;
    return { initials: initials, color: bgColors[idx] };
  }

  function getPriorityBadge(priority) {
    switch (priority) {
      case 'Critical': return '<span class="badge badge-critical">Critical</span>';
      case 'High': return '<span class="badge badge-high">High</span>';
      case 'Medium': return '<span class="badge badge-medium">Medium</span>';
      case 'Low': return '<span class="badge badge-low">Low</span>';
      default: return '<span class="badge badge-low">None</span>';
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'Backlog': return '<span class="badge badge-low" style="background:var(--bg-2); color:var(--text-3);">Backlog</span>';
      case 'To Do': return '<span class="badge badge-low" style="background:var(--border); color:var(--text-2);">To Do</span>';
      case 'In Progress': return '<span class="badge badge-low" style="background:var(--primary-10); color:var(--primary);">In Progress</span>';
      case 'Review': return '<span class="badge badge-low" style="background:var(--warning-10); color:var(--warning);">Review</span>';
      case 'Completed': return '<span class="badge badge-low" style="background:var(--success-10); color:var(--success);">Completed</span>';
      case 'Archived': return '<span class="badge badge-low" style="background:var(--border); color:var(--text-3);">Archived</span>';
      default: return '<span class="badge badge-low">Unknown</span>';
    }
  }

  // ── UPDATE PROJECT PROGRESS ──
  function updateProjectProgressFromTasks(projectId) {
    if (!projectId || !window.VerdeServices || !window.VerdeServices.Projects) return;
    
    window.VerdeServices.Tasks.getTasks().then(function(allTasks) {
      const projTasks = allTasks.filter(t => t.projectId === projectId && !t.isDeleted);
      if (projTasks.length === 0) return;
      
      let totalProgressSum = 0;
      projTasks.forEach(t => {
        if (t.subtasks && t.subtasks.length > 0) {
          const stDone = t.subtasks.filter(st => st.completed).length;
          totalProgressSum += (stDone / t.subtasks.length) * 100;
        } else {
          totalProgressSum += (t.status === 'Completed') ? 100 : 0;
        }
      });
      const progress = Math.round(totalProgressSum / projTasks.length);
      
      window.VerdeServices.Projects.getProjectById(projectId).then(function(proj) {
        if (proj && proj.progress !== progress) {
          window.VerdeServices.Projects.updateProject(projectId, { progress: progress }).then(function() {
            // Also add a timeline event to the project
            window.VerdeServices.Projects.addActivity(projectId, 'Progress Auto-updated', `Task completions updated project progress to ${progress}%.`);
            // Sync dashboard to reflect project updates
            if (window.syncDashboardWithProjects) window.syncDashboardWithProjects();
          });
        }
      });
    });
  }

  // ── RENDER ENGINE ──
  function renderTasks() {
    if (!window.VerdeServices || !window.VerdeServices.Tasks) return;
    
    window.VerdeServices.Tasks.getTasks({ includeArchived: currentFilter === 'Archived' }).then(function(tasks) {
      if (!tasks) tasks = [];
      
      // 1. Filter
      let filtered = tasks;
      if (currentFilter !== 'All') {
        if (['Critical', 'High', 'Medium', 'Low'].includes(currentFilter)) {
          filtered = filtered.filter(t => t.priority === currentFilter);
        } else {
          filtered = filtered.filter(t => t.status === currentFilter);
        }
      } else {
        // By default hide archived from 'All'
        filtered = filtered.filter(t => t.status !== 'Archived');
      }
      
      // 2. Search
      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        filtered = filtered.filter(t => 
          (t.title && t.title.toLowerCase().includes(q)) || 
          (t.projectId && t.projectId.toLowerCase().includes(q)) || 
          (t.assigneeId && t.assigneeId.toLowerCase().includes(q))
        );
      }
      
      // 3. Sort
      filtered.sort(function(a, b) {
        if (currentSort === 'Newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (currentSort === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (currentSort === 'Deadline') {
          if (!a.dueDate) return 1; if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (currentSort === 'Priority') {
          const p = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return (p[b.priority] || 0) - (p[a.priority] || 0);
        }
        if (currentSort === 'Alphabetically') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });

      // 4. Render Kanban Board
      const board = document.getElementById('tasks-board');
      if (board) {
        board.innerHTML = '';
        board.style.display = 'flex';
        board.style.gap = '24px';
        board.style.overflowX = 'auto';
        board.style.paddingBottom = '24px';
        board.style.alignItems = 'flex-start';

        const columns = [
          { id: 'Backlog', title: 'Backlog', color: 'var(--text-3)' },
          { id: 'To Do', title: 'To Do', color: 'var(--text-1)' },
          { id: 'In Progress', title: 'In Progress', color: 'var(--primary)' },
          { id: 'Review', title: 'Review', color: 'var(--warning)' },
          { id: 'Completed', title: 'Completed', color: 'var(--success)' }
        ];

        columns.forEach(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          
          const colEl = document.createElement('div');
          colEl.className = 'task-col';
          colEl.style.flex = '0 0 320px';
          colEl.style.display = 'flex';
          colEl.style.flexDirection = 'column';
          colEl.style.gap = '16px';
          colEl.style.background = 'var(--bg-2)';
          colEl.style.padding = '16px';
          colEl.style.borderRadius = '12px';
          colEl.style.minHeight = '400px';
          
          // Drag and Drop events on column
          colEl.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.background = 'var(--bg)';
            this.style.border = '2px dashed var(--primary)';
          });
          colEl.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.background = 'var(--bg-2)';
            this.style.border = 'none';
          });
          colEl.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.background = 'var(--bg-2)';
            this.style.border = 'none';
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) {
              window.VerdeServices.Tasks.updateTask(taskId, { status: col.id }).then(function() {
                renderTasks();
                // update project progress automatically handled inside updateTask timeline? 
                // wait, updateProjectProgressFromTasks needs to be called. 
                // We'll call it if we have the task data.
                window.VerdeServices.Tasks.getTaskById(taskId).then(t => {
                   if (t && t.projectId) updateProjectProgressFromTasks(t.projectId);
                });
                if (window.syncDashboardWithTasks) window.syncDashboardWithTasks();
              });
            }
          });

          // Header
          const header = document.createElement('div');
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.alignItems = 'center';
          header.style.marginBottom = '8px';
          
          header.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; border-radius:50%; background:${col.color};"></div>
              <h3 style="font-size:14px; font-weight:800; color:var(--text-1);">${col.title}</h3>
            </div>
            <div style="background:var(--border); padding:2px 8px; border-radius:12px; font-size:12px; font-weight:700; color:var(--text-2);">${colTasks.length}</div>
          `;
          colEl.appendChild(header);

          // Cards
          if (colTasks.length === 0) {
            const empty = document.createElement('div');
            empty.style.textAlign = 'center';
            empty.style.padding = '24px 16px';
            empty.style.border = '2px dashed var(--border)';
            empty.style.borderRadius = '8px';
            empty.style.color = 'var(--text-3)';
            empty.style.fontSize = '13px';
            empty.style.fontWeight = '600';
            empty.innerHTML = 'No tasks in this stage.';
            colEl.appendChild(empty);
          } else {
            colTasks.forEach(t => {
              const card = document.createElement('div');
              card.className = 'task-card';
              card.draggable = true;
              card.style.background = 'var(--surface)';
              card.style.padding = '16px';
              card.style.borderRadius = '8px';
              card.style.boxShadow = 'var(--shadow-sm)';
              card.style.cursor = 'grab';
              card.style.display = 'flex';
              card.style.flexDirection = 'column';
              card.style.gap = '12px';
              card.style.transition = 'transform 0.2s, box-shadow 0.2s';
              if (t.status === 'Completed') card.style.opacity = '0.7';

              card.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => { this.style.opacity = '0.5'; }, 0);
              });
              card.addEventListener('dragend', function(e) {
                this.style.opacity = t.status === 'Completed' ? '0.7' : '1';
              });

              const avatar = getAvatar(t.assigneeId);
              const isLate = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed';
              const dateColor = isLate ? 'var(--danger)' : 'var(--text-2)';
              
              let subtaskHtml = '';
              if (t.subtasks && t.subtasks.length > 0) {
                const c = t.subtasks.filter(s => s.completed).length;
                subtaskHtml = `
                  <div style="display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:var(--text-2);" title="Subtasks">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    ${c}/${t.subtasks.length}
                  </div>
                `;
              }
              
              let tagsHtml = '';
              if (t.tags && t.tags.length > 0) {
                 tagsHtml = '<div style="display:flex; gap:4px; flex-wrap:wrap;">' + 
                   t.tags.map(tag => `<span style="background:var(--bg-2); color:var(--text-2); font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">${tag}</span>`).join('') +
                 '</div>';
              }

              card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>${getPriorityBadge(t.priority)}</div>
                  <div class="task-card-menu" style="position:relative;">
                    <button class="btn btn-ghost btn-sm btn-quick-menu" style="padding:4px; color:var(--text-3);" data-id="${t.id}">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:4px; ${t.status === 'Completed' ? 'text-decoration:line-through; color:var(--text-3);' : ''}">${t.title}</div>
                  <div style="font-size:12px; font-weight:600; color:var(--primary);">${t.projectId || ''}</div>
                </div>
                
                ${tagsHtml}
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:12px; margin-top:auto;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size:12px; font-weight:700; color:${dateColor};">${t.dueDate ? new Date(t.dueDate).toLocaleString([], {month:'short', day:'numeric'}) : 'No Date'}</div>
                    ${subtaskHtml}
                  </div>
                  <div style="background:${avatar.color}; width:24px; height:24px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800;" title="${t.assigneeId}">${avatar.initials}</div>
                </div>
              `;
              
              colEl.appendChild(card);
            });
          }
          
          board.appendChild(colEl);
        });
        
        // Quick Menu Logic
        document.querySelectorAll('.btn-quick-menu').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const existing = document.querySelector('.quick-menu-dropdown');
            if (existing) existing.remove();
            
            const taskId = this.getAttribute('data-id');
            const dropdown = document.createElement('div');
            dropdown.className = 'quick-menu-dropdown';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.right = '0';
            dropdown.style.background = 'var(--surface)';
            dropdown.style.border = '1px solid var(--border)';
            dropdown.style.boxShadow = 'var(--shadow-lg)';
            dropdown.style.borderRadius = '8px';
            dropdown.style.padding = '8px';
            dropdown.style.zIndex = '100';
            dropdown.style.display = 'flex';
            dropdown.style.flexDirection = 'column';
            dropdown.style.minWidth = '140px';
            
            const btnStyle = "background:none; border:none; text-align:left; padding:8px 12px; font-size:13px; font-weight:600; color:var(--text-2); cursor:pointer; border-radius:4px;";
            
            dropdown.innerHTML = `
              <button class="qm-open" style="${btnStyle}">Open Drawer</button>
              <button class="qm-edit" style="${btnStyle}">Edit Task</button>
              <button class="qm-dup" style="${btnStyle}">Duplicate</button>
              <button class="qm-done" style="${btnStyle} color:var(--success);">Mark Complete</button>
              <button class="qm-archive" style="${btnStyle}">Archive Task</button>
              <div class="qm-move-container" style="position:relative; margin-top:4px; padding-top:4px; border-top:1px solid var(--border);">
                 <div style="font-size:11px; font-weight:700; color:var(--text-3); padding:4px 12px; text-transform:uppercase;">Move to</div>
                 <button class="qm-move" data-col="Backlog" style="${btnStyle}">Backlog</button>
                 <button class="qm-move" data-col="To Do" style="${btnStyle}">To Do</button>
                 <button class="qm-move" data-col="In Progress" style="${btnStyle}">In Progress</button>
                 <button class="qm-move" data-col="Review" style="${btnStyle}">Review</button>
              </div>
              <hr style="border:none; border-top:1px solid var(--border); margin:4px 0;">
              <button class="qm-del" style="${btnStyle} color:var(--danger);">Delete Task</button>
            `;
            
            this.parentElement.appendChild(dropdown);
            
            dropdown.querySelector('.qm-open').onclick = () => { openTaskDrawer(taskId); dropdown.remove(); };
            dropdown.querySelector('.qm-edit').onclick = () => { openCreateModal(taskId); dropdown.remove(); };
            dropdown.querySelector('.qm-dup').onclick = () => { 
               window.VerdeServices.Tasks.getTaskById(taskId).then(t => {
                  let d = Object.assign({}, t);
                  delete d.id;
                  d.title = d.title + ' (Copy)';
                  window.VerdeServices.Tasks.createTask(d).then(() => {
                     renderTasks();
                     if(window.VerdeToast) window.VerdeToast.success('Task duplicated');
                  });
               });
            };
            dropdown.querySelector('.qm-done').onclick = () => {
               window.VerdeServices.Tasks.updateTask(taskId, {status: 'Completed'}).then(nt => {
                  renderTasks();
                  if(nt.projectId) updateProjectProgressFromTasks(nt.projectId);
               });
            };
            dropdown.querySelector('.qm-archive').onclick = () => {
               window.VerdeServices.Tasks.updateTask(taskId, {status: 'Archived'}).then(nt => {
                  renderTasks();
                  if(nt.projectId) updateProjectProgressFromTasks(nt.projectId);
               });
            };
            dropdown.querySelectorAll('.qm-move').forEach(b => {
               b.onclick = () => {
                  const col = b.getAttribute('data-col');
                  window.VerdeServices.Tasks.updateTask(taskId, {status: col}).then(nt => {
                     renderTasks();
                     if(nt.projectId) updateProjectProgressFromTasks(nt.projectId);
                  });
               };
            });
            dropdown.querySelector('.qm-del').onclick = () => {
               if(confirm('Delete task?')) {
                 window.VerdeServices.Tasks.deleteTask(taskId, false).then(() => renderTasks());
               }
            };
            
            // Close when clicking outside
            const closeDropdown = () => { if(dropdown) dropdown.remove(); document.removeEventListener('click', closeDropdown); };
            setTimeout(() => document.addEventListener('click', closeDropdown), 0);
          });
        });
        
        // Also clicking card opens drawer
        document.querySelectorAll('.task-card').forEach(card => {
           card.addEventListener('click', function(e) {
             if (e.target.closest('.task-card-menu')) return; // ignore if clicking menu
             const taskId = this.querySelector('.btn-quick-menu').getAttribute('data-id');
             openTaskDrawer(taskId);
           });
        });
      }
      
      // 5. Update KPIs

      updateKPIs(tasks);
    });
  }

  function updateKPIs(allTasks) {
    if (!allTasks) return;
    const today = new Date().toISOString().split('T')[0];
    
    let todaysTasks = 0;
    let inProgress = 0;
    let overdue = 0;
    let completedToday = 0;
    
    allTasks.forEach(t => {
      if (t.status === 'In Progress') inProgress++;
      if (t.status === 'Completed' && t.updatedAt && t.updatedAt.startsWith(today)) completedToday++;
      
      if (t.dueDate) {
        if (t.dueDate.startsWith(today) && t.status !== 'Completed') todaysTasks++;
        if (t.dueDate < today && t.status !== 'Completed' && t.status !== 'Archived') overdue++;
      }
    });
    
    const kpiEls = document.querySelectorAll('.task-kpi-value');
    if (kpiEls.length >= 4) {
      kpiEls[0].textContent = todaysTasks;
      kpiEls[1].textContent = inProgress;
      kpiEls[2].textContent = overdue;
      kpiEls[3].textContent = completedToday;
    }
  }

  // ── MODAL & DRAWER ──
  let editingTaskId = null;

  function openCreateModal(taskId) {
    editingTaskId = taskId || null;
    const modal = document.getElementById('create-task-modal');
    const titleEl = document.getElementById('task-modal-title');
    
    // Populate projects dropdown
    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.getProjects().then(function(projects) {
        const sel = document.getElementById('selTaskProject');
        sel.innerHTML = '<option value="">Select Project...</option>';
        projects.forEach(p => {
          sel.innerHTML += `<option value="${p.id}">${p.name} (${p.id})</option>`;
        });
        
        // Populate assignees
        const selAssignee = document.getElementById('selTaskAssignee');
        selAssignee.innerHTML = '<option value="Unassigned">Unassigned</option>';
        teamMock.forEach(m => {
          selAssignee.innerHTML += `<option value="${m.id}">${m.name} - ${m.role}</option>`;
        });
        
        if (editingTaskId) {
          titleEl.textContent = 'Edit Task';
          window.VerdeServices.Tasks.getTaskById(editingTaskId).then(function(t) {
            document.getElementById('inpTaskTitle').value = t.title || '';
            document.getElementById('inpTaskDesc').value = t.description || '';
            document.getElementById('selTaskProject').value = t.projectId || '';
            document.getElementById('selTaskAssignee').value = t.assigneeId || 'Unassigned';
            document.getElementById('selTaskStatus').value = t.status || 'To Do';
            document.getElementById('selTaskPriority').value = t.priority || 'Medium';
            document.getElementById('inpTaskDate').value = t.dueDate || '';
            document.getElementById('inpTaskHours').value = t.estimatedHours || 0;
            modal.style.display = 'flex';
          });
        } else {
          titleEl.textContent = 'Create Task';
          document.getElementById('inpTaskTitle').value = '';
          document.getElementById('inpTaskDesc').value = '';
          document.getElementById('selTaskProject').value = '';
          document.getElementById('selTaskAssignee').value = 'Unassigned';
          document.getElementById('selTaskStatus').value = 'To Do';
          document.getElementById('selTaskPriority').value = 'Medium';
          document.getElementById('inpTaskDate').value = '';
          document.getElementById('inpTaskHours').value = 0;
          modal.style.display = 'flex';
        }
      });
    }
  }

  function closeCreateModal() {
    document.getElementById('create-task-modal').style.display = 'none';
  }

  function saveTask(e) {
    if (e && e.preventDefault) e.preventDefault();
    const data = {
      title: document.getElementById('inpTaskTitle').value.trim(),
      description: document.getElementById('inpTaskDesc').value.trim(),
      projectId: document.getElementById('selTaskProject').value,
      assigneeId: document.getElementById('selTaskAssignee').value,
      status: document.getElementById('selTaskStatus').value,
      priority: document.getElementById('selTaskPriority').value,
      dueDate: document.getElementById('inpTaskDate').value,
      estimatedHours: parseFloat(document.getElementById('inpTaskHours').value) || 0
    };
    
    if (!data.title) {
      if(window.VerdeToast) window.VerdeToast.error("Task title is required");
      return;
    }

    if (editingTaskId) {
      window.VerdeServices.Tasks.updateTask(editingTaskId, data).then(function(res) {
        closeCreateModal();
        if(window.VerdeToast) window.VerdeToast.success("Task updated");
        renderTasks();
        if (data.projectId) updateProjectProgressFromTasks(data.projectId);
        if (window.syncDashboardWithTasks) window.syncDashboardWithTasks();
        
        // If drawer is open for this task, refresh it
        const drawer = document.getElementById('task-drawer');
        if (drawer && drawer.style.transform === 'translateX(0px)' && document.getElementById('task-drawer-content').getAttribute('data-active-id') === editingTaskId) {
          openTaskDrawer(editingTaskId);
        }
      });
    } else {
      window.VerdeServices.Tasks.createTask(data).then(function(res) {
        closeCreateModal();
        if(window.VerdeToast) window.VerdeToast.success("Task created");
        renderTasks();
        if (data.projectId) updateProjectProgressFromTasks(data.projectId);
        if (window.syncDashboardWithTasks) window.syncDashboardWithTasks();
      });
    }
  }


  // ── DRAWER STATE ──
  let currentDrawerTask = null;
  let currentDrawerTab = 'Overview';

  window.switchDrawerTab = function(tabName) {
    currentDrawerTab = tabName;
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    const activeEl = document.querySelector(`.drawer-tab[data-tab="${tabName}"]`);
    if(activeEl) activeEl.classList.add('active');
    renderCurrentDrawerTab();
  };

  function renderCurrentDrawerTab() {
    if (!currentDrawerTask) return;
    const t = currentDrawerTask;
    const container = document.getElementById('task-drawer-tab-content');
    if (!container) return;
    
    if (currentDrawerTab === 'Overview') {
      const avatar = getAvatar(t.assigneeId);
      container.innerHTML = `
        <div style="display:flex; gap:24px; margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid var(--border);">
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Assignee</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="background:${avatar.color}; width:24px; height:24px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800;">${avatar.initials}</div>
              <span style="font-size:13px; font-weight:600; color:var(--text-1);">${t.assigneeId}</span>
            </div>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Due Date</div>
            <div style="font-size:13px; font-weight:600; color:var(--text-1);">${t.dueDate || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Est. Hours</div>
            <div style="font-size:13px; font-weight:600; color:var(--text-1);">${t.estimatedHours || '0'}h</div>
          </div>
        </div>
        
        <div style="margin-bottom:24px;">
          <h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:8px;">Description</h4>
          <p style="font-size:14px; color:var(--text-2); line-height:1.6; white-space:pre-wrap;">${t.description || 'No description provided.'}</p>
        </div>
        
        <div style="display:flex; gap:12px; margin-top:32px;">
          <button class="btn btn-primary" style="flex:1;" id="btn-drawer-edit">Edit Task</button>
          <button class="btn btn-ghost" style="flex:1; border:1px solid var(--border); color:var(--danger);" id="btn-drawer-delete">Delete Task</button>
        </div>
      `;
      document.getElementById('btn-drawer-edit').addEventListener('click', function() { openCreateModal(t.id); });
      document.getElementById('btn-drawer-delete').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this task?')) {
          window.VerdeServices.Tasks.deleteTask(t.id, false).then(function() {
            closeTaskDrawer();
            if(window.VerdeToast) window.VerdeToast.success('Task deleted');
            renderTasks();
            if (t.projectId) updateProjectProgressFromTasks(t.projectId);
            if (window.syncDashboardWithTasks) window.syncDashboardWithTasks();
          });
        }
      });
    } else if (currentDrawerTab === 'Subtasks') {
      const subtasks = t.subtasks || [];
      const completed = subtasks.filter(s => s.completed).length;
      const total = subtasks.length;
      const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h4 style="font-size:14px; font-weight:800; color:var(--text-1);">Subtasks (${completed}/${total})</h4>
          <span style="font-size:12px; font-weight:700; color:var(--primary);">${prog}%</span>
        </div>
        <div style="height:6px; background:var(--bg-2); border-radius:3px; margin-bottom:24px; overflow:hidden;">
          <div style="height:100%; width:${prog}%; background:var(--primary); transition:width 0.3s ease;"></div>
        </div>
      `;
      
      html += '<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">';
      subtasks.forEach(s => {
        html += `
          <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--surface);">
            <input type="checkbox" class="subtask-checkbox" data-id="${s.id}" ${s.completed ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;">
            <div style="flex:1; font-size:14px; font-weight:600; color:var(--text-1); ${s.completed ? 'text-decoration:line-through; color:var(--text-3);' : ''}">${s.title}</div>
            <button class="btn btn-ghost btn-delete-subtask" data-id="${s.id}" style="padding:4px; color:var(--danger);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </div>
        `;
      });
      if(subtasks.length === 0) {
        html += '<div style="color:var(--text-3); font-size:13px; text-align:center; padding:16px;">No subtasks added yet.</div>';
      }
      html += '</div>';
      
      html += `
        <div style="display:flex; gap:8px;">
          <input type="text" id="inpNewSubtask" class="form-input" placeholder="Add new subtask..." style="flex:1; border:1px solid var(--border); border-radius:8px; padding:8px 12px; outline:none;" />
          <button class="btn btn-primary" id="btn-add-subtask">Add</button>
        </div>
      `;
      container.innerHTML = html;
      
      // Events
      document.querySelectorAll('.subtask-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
          const sid = this.getAttribute('data-id');
          const isDone = this.checked;
          window.VerdeServices.Tasks.toggleSubtask(t.id, sid, isDone).then(nt => refreshDrawerTask(nt));
        });
      });
      document.querySelectorAll('.btn-delete-subtask').forEach(btn => {
        btn.addEventListener('click', function() {
          const sid = this.getAttribute('data-id');
          if(confirm('Delete subtask?')) {
            window.VerdeServices.Tasks.deleteSubtask(t.id, sid).then(nt => refreshDrawerTask(nt));
          }
        });
      });
      document.getElementById('btn-add-subtask').addEventListener('click', function() {
        const val = document.getElementById('inpNewSubtask').value.trim();
        if(val) window.VerdeServices.Tasks.addSubtask(t.id, val).then(nt => refreshDrawerTask(nt));
      });
      document.getElementById('inpNewSubtask').addEventListener('keypress', function(e) {
        if(e.key === 'Enter') document.getElementById('btn-add-subtask').click();
      });
      
    } else if (currentDrawerTab === 'Comments') {
      const comments = t.comments || [];
      let html = '<div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px; max-height:400px; overflow-y:auto; padding-right:8px;">';
      
      comments.forEach(c => {
        const cAv = getAvatar(c.authorId);
        const cDt = new Date(c.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        html += `
          <div style="display:flex; gap:12px;">
            <div style="width:28px; height:28px; border-radius:50%; background:${cAv.color}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:800; flex-shrink:0;">${cAv.initials}</div>
            <div style="background:var(--bg-2); padding:12px 16px; border-radius:0 12px 12px 12px; flex:1; position:relative;">
              <div style="font-size:12px; font-weight:700; color:var(--text-1); margin-bottom:4px;">${c.authorId} <span style="color:var(--text-3); font-weight:400; margin-left:8px;">${cDt}</span></div>
              <div style="font-size:13px; color:var(--text-2); line-height:1.5;">${c.text}</div>
              <button class="btn-delete-comment" data-id="${c.id}" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--danger); cursor:pointer; opacity:0.5; padding:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
          </div>
        `;
      });
      if(comments.length === 0) html += '<div style="color:var(--text-3); font-size:13px; text-align:center; padding:16px;">No comments yet.</div>';
      html += '</div>';
      
      html += `
        <div style="display:flex; gap:8px;">
          <textarea id="inpNewComment" class="form-input" placeholder="Write a comment..." rows="2" style="flex:1; border:1px solid var(--border); border-radius:8px; padding:8px 12px; outline:none; resize:none;"></textarea>
          <button class="btn btn-primary" id="btn-add-comment" style="align-self:flex-end;">Send</button>
        </div>
      `;
      container.innerHTML = html;
      
      document.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.addEventListener('click', function() {
          const cid = this.getAttribute('data-id');
          if(confirm('Delete comment?')) {
            window.VerdeServices.Tasks.deleteComment(t.id, cid).then(nt => refreshDrawerTask(nt));
          }
        });
      });
      document.getElementById('btn-add-comment').addEventListener('click', function() {
        const val = document.getElementById('inpNewComment').value.trim();
        // Use a mock author, e.g. current user Shahim
        if(val) window.VerdeServices.Tasks.addComment(t.id, 'Shahim', val).then(nt => refreshDrawerTask(nt));
      });
      
    } else if (currentDrawerTab === 'Attachments') {
      const att = t.attachments || [];
      let html = '<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">';
      att.forEach(a => {
        const aDt = new Date(a.createdAt).toLocaleString([], {month:'short', day:'numeric'});
        html += `
          <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--surface);">
            <div style="width:32px; height:32px; border-radius:4px; background:var(--primary-10); color:var(--primary); display:flex; align-items:center; justify-content:center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
            </div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:700; color:var(--text-1);">${a.name}</div>
              <div style="font-size:11px; color:var(--text-3);">${a.size} &bull; ${aDt}</div>
            </div>
            <button class="btn btn-ghost btn-delete-att" data-id="${a.id}" style="padding:4px; color:var(--danger);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
        `;
      });
      if(att.length === 0) html += '<div style="color:var(--text-3); font-size:13px; text-align:center; padding:16px;">No attachments.</div>';
      html += '</div>';
      
      html += `
        <div style="border:1px dashed var(--border); border-radius:8px; padding:24px; text-align:center; background:var(--bg-2); cursor:pointer;" id="dropzone-att">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3); margin-bottom:8px;"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"/><path d="M16 16l-4-4-4 4"/></svg>
          <div style="font-size:13px; font-weight:600; color:var(--text-1);">Click to upload file</div>
          <div style="font-size:11px; color:var(--text-3);">Simulated local storage upload</div>
        </div>
      `;
      container.innerHTML = html;
      
      document.querySelectorAll('.btn-delete-att').forEach(btn => {
        btn.addEventListener('click', function() {
          const aid = this.getAttribute('data-id');
          if(confirm('Delete attachment?')) {
            window.VerdeServices.Tasks.deleteAttachment(t.id, aid).then(nt => refreshDrawerTask(nt));
          }
        });
      });
      document.getElementById('dropzone-att').addEventListener('click', function() {
        const name = prompt("Enter mock file name (e.g. design.png):");
        if(name) {
          const size = (Math.random() * 5 + 0.1).toFixed(1) + ' MB';
          window.VerdeServices.Tasks.addAttachment(t.id, name, size).then(nt => refreshDrawerTask(nt));
        }
      });
      
    } else if (currentDrawerTab === 'Activity') {
      let timelineHtml = '<div style="display:flex; flex-direction:column; gap:20px;">';
      if (t.timeline && t.timeline.length > 0) {
        t.timeline.forEach(a => {
          const dt = new Date(a.date).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
          timelineHtml += `
            <div style="display:flex; gap:12px;">
              <div style="width:28px; height:28px; border-radius:50%; background:var(--bg-2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-2); font-size:12px; flex-shrink:0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div>
                <div style="font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:2px;">${a.action}</div>
                <div style="font-size:13px; color:var(--text-2);">${a.details}</div>
                <div style="font-size:11px; color:var(--text-3); margin-top:4px;">${dt} &bull; ${a.user || 'System'}</div>
              </div>
            </div>
          `;
        });
      } else {
        timelineHtml += '<div style="color:var(--text-3); font-size:13px; text-align:center; padding:16px;">No activity logged.</div>';
      }
      timelineHtml += '</div>';
      container.innerHTML = timelineHtml;
    }
  }

  function refreshDrawerTask(newTask) {
    currentDrawerTask = newTask;
    
    // Update header dynamically
    const headerTitle = document.getElementById('task-drawer-title');
    const headerStatus = document.getElementById('task-drawer-status');
    const headerProject = document.getElementById('task-drawer-project');
    if (headerTitle) headerTitle.textContent = newTask.title;
    if (headerStatus) headerStatus.innerHTML = `${getPriorityBadge(newTask.priority)} ${getStatusBadge(newTask.status)}`;
    if (headerProject) headerProject.textContent = `Project: ${newTask.projectId || 'None'}`;
    
    // Update underlying table/board implicitly
    renderTasks();
    if (newTask.projectId) updateProjectProgressFromTasks(newTask.projectId);
    
    renderCurrentDrawerTab();
  }

  function openTaskDrawer(taskId) {
    if (!window.VerdeServices || !window.VerdeServices.Tasks) return;
    
    window.VerdeServices.Tasks.getTaskById(taskId).then(function(t) {
      if (!t) return;
      currentDrawerTask = t;
      currentDrawerTab = 'Overview'; // Reset on open
      
      const drawer = document.getElementById('task-drawer');
      const content = document.getElementById('task-drawer-content');
      content.setAttribute('data-active-id', taskId);
      
      const tabsHtml = `
        <style>
          .drawer-tab { padding:10px 16px; font-size:13px; font-weight:700; color:var(--text-3); cursor:pointer; border-bottom:2px solid transparent; transition:color 0.2s, border-color 0.2s; white-space:nowrap; }
          .drawer-tab:hover { color:var(--text-1); }
          .drawer-tab.active { color:var(--primary); border-bottom-color:var(--primary); }
        </style>
        <div style="margin-bottom:24px;">
          <div id="task-drawer-status">${getPriorityBadge(t.priority)} ${getStatusBadge(t.status)}</div>
          <h2 id="task-drawer-title" style="font-size:24px; font-weight:800; color:var(--text-1); margin-top:12px;">${t.title}</h2>
          <div id="task-drawer-project" style="color:var(--primary); font-weight:600; font-size:14px; margin-top:4px;">Project: ${t.projectId || 'None'}</div>
        </div>
        
        <div style="display:flex; overflow-x:auto; border-bottom:1px solid var(--border); margin-bottom:24px; scrollbar-width:none;">
          <div class="drawer-tab active" data-tab="Overview" onclick="switchDrawerTab('Overview')">Overview</div>
          <div class="drawer-tab" data-tab="Subtasks" onclick="switchDrawerTab('Subtasks')">Subtasks</div>
          <div class="drawer-tab" data-tab="Comments" onclick="switchDrawerTab('Comments')">Comments</div>
          <div class="drawer-tab" data-tab="Attachments" onclick="switchDrawerTab('Attachments')">Attachments</div>
          <div class="drawer-tab" data-tab="Activity" onclick="switchDrawerTab('Activity')">Activity</div>
        </div>
        
        <div id="task-drawer-tab-content"></div>
      `;
      
      content.innerHTML = tabsHtml;
      
      drawer.style.display = 'block';
      setTimeout(() => { drawer.style.transform = 'translateX(0px)'; }, 10);
      
      renderCurrentDrawerTab();
    });
  }

  function closeTaskDrawer() {
    const drawer = document.getElementById('task-drawer');
    if (drawer) {
      drawer.style.transform = 'translateX(100%)';
      setTimeout(() => {
        drawer.style.display = 'none';
      }, 300);
    }
  }

  // ── INITIALIZATION ──
  function initTasksWorkspace() {
    // ── EVENT DELEGATION FOR TASKS MODULE ──
    if (!window._verdeTasksEventsBound) {
      document.addEventListener('click', function(e) {
        
        if (e.target.closest('#btn-create-task') || e.target.closest('#btn-create-task-empty')) {
          e.preventDefault();
          openCreateModal(null);
          return;
        }
        
        if (e.target.closest('#btn-cancel-task')) {
          e.preventDefault();
          closeCreateModal();
          return;
        }
        
        if (e.target.closest('#btn-save-task')) {
          e.preventDefault();
          saveTask(e);
          return;
        }
        
        if (e.target.closest('#btn-close-task-drawer')) {
          e.preventDefault();
          closeTaskDrawer();
          return;
        }
        
        if (e.target.closest('#btn-filter-tasks')) {
          e.preventDefault();
          const filters = ['All', 'Backlog', 'To Do', 'In Progress', 'Review', 'Completed', 'Archived', 'Critical', 'High', 'Medium', 'Low'];
          let idx = filters.indexOf(currentFilter);
          idx = (idx + 1) % filters.length;
          currentFilter = filters[idx];
          if(window.VerdeToast) window.VerdeToast.success('Filter: ' + currentFilter);
          renderTasks();
          return;
        }
        
        if (e.target.closest('#btn-sort-tasks')) {
          e.preventDefault();
          const sorts = ['Newest', 'Oldest', 'Priority', 'Deadline', 'Alphabetically'];
          let idx = sorts.indexOf(currentSort);
          idx = (idx + 1) % sorts.length;
          currentSort = sorts[idx];
          if(window.VerdeToast) window.VerdeToast.success('Sort: ' + currentSort);
          renderTasks();
          return;
        }
        
      });
      window._verdeTasksEventsBound = true;
    }

    // Search
    const searchInput = document.getElementById('tasks-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        currentSearch = e.target.value;
        renderTasks();
      });
    }

    const globalSearch = document.getElementById('tasks-global-search');
    if (globalSearch) {
      globalSearch.addEventListener('input', function(e) {
        currentSearch = e.target.value;
        renderTasks();
      });
    }
    
    // Quick mock for filters/sort (In a real app, these would be proper dropdowns. We'll use prompts for now or cycle through states)
    const btnFilter = document.getElementById('btn-filter-tasks');
    if (btnFilter) {
      btnFilter.addEventListener('click', function() {
        const filters = ['All', 'Backlog', 'To Do', 'In Progress', 'Review', 'Completed', 'Archived', 'Critical', 'High', 'Medium', 'Low'];
        let idx = filters.indexOf(currentFilter);
        idx = (idx + 1) % filters.length;
        currentFilter = filters[idx];
        if(window.VerdeToast) window.VerdeToast.success('Filter: ' + currentFilter);
        renderTasks();
      });
    }
    
    const btnSort = document.getElementById('btn-sort-tasks');
    if (btnSort) {
      btnSort.addEventListener('click', function() {
        const sorts = ['Newest', 'Oldest', 'Priority', 'Deadline', 'Alphabetically'];
        let idx = sorts.indexOf(currentSort);
        idx = (idx + 1) % sorts.length;
        currentSort = sorts[idx];
        if(window.VerdeToast) window.VerdeToast.success('Sort: ' + currentSort);
        renderTasks();
      });
    }
    
    renderTasks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTasksWorkspace);
  } else {
    initTasksWorkspace();
  }
})();
