/* ==========================================================================
   VERDE OS — MY WORK MODULE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  function initializeMyWork() {
    // 1. Dynamic Greeting & Date
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const currentUser = window.VERDE_SESSION ? window.VERDE_SESSION.getUser() : null;
    const userName = (currentUser && currentUser.name) ? currentUser.name.split(' ')[0] : 'User';
    const userInitials = (currentUser && currentUser.initials) ? currentUser.initials : '';
    const userId = currentUser ? (currentUser.userId || currentUser.id || '') : '';
    const greetingEl = document.querySelector('.my-header-title');
    if (greetingEl) {
      greetingEl.textContent = greeting + ', ' + userName + ' 👋';
    }

    const d = new Date();
    const opts = { weekday: 'short', month: 'long', day: 'numeric' };
    const dateEl = document.querySelector('.my-header-desc');
    if (dateEl) {
      dateEl.textContent = d.toLocaleDateString('en-US', opts);
    }

    // STATE KEYS
    const TASKS_STATE_KEY = 'verde_mywork_tasks_state';
    const SESSION_KEY = 'verde_mywork_focus_session';
    const HISTORY_KEY = 'verde_mywork_focus_history';
    const NOTES_KEY = 'verde_mywork_notes';

    // ── KPI DASHBOARD CENTRAL UPDATER ──
    function updateMyWorkDashboard() {
      // Find DOM Elements safely
      let tasksEl = null, dueEl = null, compEl = null, focusEl = null;
      document.querySelectorAll('.my-kpi-card').forEach(card => {
        const label = card.querySelector('.my-kpi-label');
        const val = card.querySelector('.my-kpi-value');
        if (!label || !val) return;
        const text = label.textContent.trim().toLowerCase();
        if (text === 'my tasks today') tasksEl = val;
        else if (text === 'due today') dueEl = val;
        else if (text === 'completed today') compEl = val;
        else if (text === 'focus time') focusEl = val;
      });

      // A. COMPLETED TODAY
      try {
        const tasksState = JSON.parse(localStorage.getItem(TASKS_STATE_KEY)) || {};
        let completedCount = 0;
        // Count checkboxes directly mapped from state
        // To prevent unbounded incrementing, we strictly count how many 'completed' values exist in state.
        Object.values(tasksState).forEach(val => {
          if (val === 'completed') completedCount++;
        });
        if (compEl) compEl.textContent = completedCount;
      } catch(e) {
        if (compEl) compEl.textContent = '0';
      }

      // B. FOCUS TIME
      try {
        let currentSessionSeconds = 0;
        const activeSession = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (activeSession && activeSession.status === 'active') {
          currentSessionSeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
        }

        let historyElapsed = 0;
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        historyElapsed = history.reduce((acc, s) => acc + (s.elapsedSeconds || 0), 0);

        const totalHours = (historyElapsed + currentSessionSeconds) / 3600;
        
        // Format to up to 2 decimal places to show short session increments, while keeping whole/half numbers clean (e.g. 2.5h, 0h, 0.02h)
        const displayHours = Number(totalHours.toFixed(2));
        if (focusEl) focusEl.textContent = displayHours + 'h';
      } catch(e) {
        if (focusEl) focusEl.textContent = '0h';
      }

      // C. MY TASKS TODAY & DUE TODAY
      const today = new Date();
      const todayIso = today.toISOString().split('T')[0];
      
      function isDueToday(task) {
        if (!task.dueDate) return false;
        const dd = String(task.dueDate).trim().toLowerCase();
        if (dd === 'today') return true;
        if (dd.includes(todayIso)) return true;
        try {
          const dt = new Date(task.dueDate);
          if (!isNaN(dt.getTime())) {
            return dt.getFullYear() === today.getFullYear() && 
                   dt.getMonth() === today.getMonth() && 
                   dt.getDate() === today.getDate();
          }
        } catch(e) {}
        return false;
      }

      function isMyTask(task) {
        if (currentUser && currentUser.role === 'SuperAdmin') return true;
        var n = userName.toLowerCase();
        return (task.assignee && task.assignee.toLowerCase().includes(n)) ||
               (task.assigneeId && (task.assigneeId === userInitials || task.assigneeId === userId)) ||
               (task.assigneeInitials && task.assigneeInitials === userInitials);
      }

      function processTasks(tasks) {
        let myTasksCount = 0;
        let dueTodayCount = 0;
        
        (tasks || []).forEach(t => {
          if (t.status !== 'Archived' && isMyTask(t)) {
            const dueToday = isDueToday(t);
            // My Tasks Today: Count all relevant tasks for Shahim today (whether due today or active today).
            // Usually, if a task is due today, it's definitely Shahim's task today.
            // If they are just open tasks, they might be included too, but to be strictly safe and not show 0, we count tasks due today.
            if (dueToday) {
               myTasksCount++;
               if (t.status !== 'Completed') {
                 dueTodayCount++;
               }
            }
          }
        });

        if (tasksEl) tasksEl.textContent = myTasksCount;
        if (dueEl) dueEl.textContent = dueTodayCount;
        
        renderTasks(tasks); // Render lists dynamically
      }

      // Try fetching from the actual service layer first
      if (window.VerdeServices && window.VerdeServices.Tasks && window.VerdeServices.Tasks.getTasks) {
        window.VerdeServices.Tasks.getTasks().then(processTasks).catch(() => {
           if (tasksEl) tasksEl.textContent = '0';
           if (dueEl) dueEl.textContent = '0';
        });
      } else if (window.VerdeMockData && window.VerdeMockData.tasks) {
        processTasks(window.VerdeMockData.tasks);
      } else {
        if (tasksEl) tasksEl.textContent = '0';
        if (dueEl) dueEl.textContent = '0';
      }
    }

    // Expose update function so other parts of the module can call it
    window.updateMyWorkDashboard = updateMyWorkDashboard;

    // 2. Render Tasks Dynamically
    function renderTasks(tasks) {
      const todayIso = new Date().toISOString().split('T')[0];
      const today = new Date();
      
      const tasksList = document.getElementById('my-work-tasks-list');
      const deadlinesList = document.getElementById('my-work-deadlines-list');
      
      if (!tasksList || !deadlinesList) return;
      
      tasksList.innerHTML = '';
      deadlinesList.innerHTML = '';
      
      // We only care about our tasks
      const myTasks = (tasks || []).filter(t => {
        if (t.status === 'Archived') return false;
        const n = userName.toLowerCase();
        return (t.assignee && t.assignee.toLowerCase().includes(n)) ||
               (t.assigneeId && (t.assigneeId === userInitials || t.assigneeId === userId)) ||
               (t.assigneeInitials && t.assigneeInitials === userInitials);
      });
      
      // Render Today's Focus (Pending Tasks)
      const focusTasks = myTasks.filter(t => t.status !== 'Completed');
      if (focusTasks.length === 0) {
        tasksList.innerHTML = '<div style="color:var(--text-3); font-size:14px; padding:16px;">No tasks for today! Enjoy your focus time.</div>';
      } else {
        focusTasks.slice(0, 8).forEach(t => {
          const isCritical = t.priority === 'Critical';
          const isHigh = t.priority === 'High';
          const badgeClass = isCritical ? 'badge-critical' : (isHigh ? 'badge-high' : 'badge-medium');
          
          const item = document.createElement('div');
          item.className = 'my-list-item';
          item.dataset.taskId = t.id;
          item.innerHTML = `
            <div class="my-list-content">
              <input type="checkbox" class="focus-check" />
              <div>
                <div class="my-item-text">${t.title}</div>
                <div class="my-item-sub">${t.project || 'General'} • ${t.estimatedHours ? t.estimatedHours + 'h' : '30m'}</div>
              </div>
            </div>
            <span class="badge ${badgeClass}">${t.priority}</span>
          `;
          
          // Wire up checkbox
          const check = item.querySelector('.focus-check');
          item.addEventListener('click', function(e) {
            if (e.target.closest('.btn')) return;
            if (e.target.tagName !== 'INPUT') {
              check.checked = !check.checked;
            }
            if (check.checked) {
              this.style.opacity = '0.5';
              this.style.textDecoration = 'line-through';
              if (window.VerdeServices && window.VerdeServices.Tasks) {
                window.VerdeServices.Tasks.updateTask(t.id, { status: 'Completed' }).then(updateMyWorkDashboard);
              }
            } else {
              this.style.opacity = '1';
              this.style.textDecoration = 'none';
            }
          });
          tasksList.appendChild(item);
        });
      }
      
      // Render Upcoming Deadlines
      const dueTasks = myTasks.filter(t => t.status !== 'Completed' && t.dueDate).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (dueTasks.length === 0) {
        deadlinesList.innerHTML = '<div style="color:var(--text-3); font-size:14px; padding:16px;">No upcoming deadlines!</div>';
      } else {
        dueTasks.slice(0, 5).forEach(t => {
          let dueStr = t.dueDate;
          let dotClass = '';
          let textStyle = '';
          try {
            const dt = new Date(t.dueDate);
            if (!isNaN(dt.getTime())) {
              if (dt < today && dt.toDateString() !== today.toDateString()) {
                dueStr = 'Overdue';
                dotClass = 'danger';
                textStyle = 'color:var(--danger); font-weight:700;';
              } else if (dt.toDateString() === today.toDateString()) {
                dueStr = 'Due Today';
                dotClass = 'warning';
                textStyle = 'color:var(--warning); font-weight:700;';
              } else {
                dueStr = 'Due ' + dt.toLocaleDateString();
              }
            }
          } catch(e) {}
          
          const dItem = document.createElement('div');
          dItem.className = 'timeline-item';
          dItem.innerHTML = `
            <div class="timeline-dot ${dotClass}"></div>
            <div class="timeline-content">
              <div class="timeline-title">${t.title}</div>
              <div class="timeline-meta" style="${textStyle}">${dueStr}</div>
              <div class="timeline-meta">Priority: ${t.priority}</div>
            </div>
          `;
          deadlinesList.appendChild(dItem);
        });
      }
    }

    // Call initially
    updateMyWorkDashboard();

    // 3. Search Functionality
    const searchInput = document.querySelector('.my-search input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.my-list-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(term) ? '' : 'none';
        });
      });
    }

    // 4. Filter Button using VerdeModal
    const filterBtn = Array.from(document.querySelectorAll('.btn')).find(b => b.textContent.includes('Filter'));
    if (filterBtn) {
      filterBtn.addEventListener('click', function() {
        if (window.VerdeModal) {
          const bodyHtml = `
            <div style="margin-bottom:8px;">Select task status to filter:</div>
            <select id="myWorkFilterSelect" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:4px; background:var(--bg-1); color:var(--text-1);">
              <option value="all">All Tasks</option>
              <option value="critical">Critical Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          `;
          window.VerdeModal.confirm({
            title: 'Filter Tasks',
            body: bodyHtml,
            confirmText: 'Apply Filter',
            confirmClass: 'btn-primary',
            onConfirm: function() {
              const select = document.getElementById('myWorkFilterSelect');
              if (!select) return;
              const filterValue = select.value;
              
              document.querySelectorAll('.my-list-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                const isCompleted = item.querySelector('.focus-check')?.checked;
                
                let show = true;
                if (filterValue === 'critical' && !text.includes('critical')) show = false;
                if (filterValue === 'high' && !text.includes('high')) show = false;
                if (filterValue === 'medium' && !text.includes('medium')) show = false;
                if (filterValue === 'completed' && !isCompleted) show = false;
                if (filterValue === 'pending' && isCompleted) show = false;
                
                item.style.display = show ? '' : 'none';
              });
            }
          });
        }
      });
    }

    // 5. Focus Session Persistence & Timer Logic
    let timerInterval = null;
    
    function getFocusHistory() {
      try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
      } catch(e) {
        return [];
      }
    }
    
    function saveFocusHistory(history) {
      if (history.length > 50) history = history.slice(-50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function getActiveSession() {
      try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (session && session.status === 'active') return session;
        return null;
      } catch(e) {
        return null;
      }
    }
    
    function updateTimerUI(activeSession) {
      let displaySeconds = 0;
      if (activeSession) {
        displaySeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
      }
      
      const hrs = Math.floor(displaySeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((displaySeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (displaySeconds % 60).toString().padStart(2, '0');
      
      const timerEl = document.getElementById('workTimer');
      if (timerEl) {
        timerEl.textContent = `${hrs}:${mins}:${secs}`;
      }
      
      // Update the KPI dashboard to reflect elapsed Focus Time
      updateMyWorkDashboard();
    }

    // Safely find the focus button regardless of its current text state
    const focusBtn = Array.from(document.querySelectorAll('.btn')).find(b => b.textContent.includes('Focus Session'));
    
    // Resume session on page load if active
    let activeSession = getActiveSession();
    if (activeSession && focusBtn) {
      focusBtn.textContent = 'Stop Focus Session';
      focusBtn.classList.remove('btn-primary');
      focusBtn.classList.add('btn-danger');
      updateTimerUI(activeSession);
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => updateTimerUI(getActiveSession()), 1000);
    } else if (focusBtn) {
      focusBtn.textContent = 'Start Focus Session';
      focusBtn.classList.remove('btn-danger');
      focusBtn.classList.add('btn-primary');
      updateTimerUI(null);
    } else {
      updateTimerUI(null);
    }

    if (focusBtn) {
      // Avoid duplicate listeners
      const newFocusBtn = focusBtn.cloneNode(true);
      if (focusBtn.parentNode) {
        focusBtn.parentNode.replaceChild(newFocusBtn, focusBtn);
      }
      
      newFocusBtn.addEventListener('click', function() {
        let currentSession = getActiveSession();
        
        if (!currentSession) {
          // START SESSION
          currentSession = {
            id: 'fs_' + Date.now(),
            user: userName,
            status: 'active',
            startedAt: Date.now(),
            elapsedSeconds: 0
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
          
          this.textContent = 'Stop Focus Session';
          this.classList.remove('btn-primary');
          this.classList.add('btn-danger');
          
          if (timerInterval) clearInterval(timerInterval);
          updateTimerUI(currentSession);
          timerInterval = setInterval(() => updateTimerUI(getActiveSession()), 1000);
        } else {
          // STOP SESSION
          currentSession.status = 'completed';
          currentSession.endedAt = Date.now();
          currentSession.elapsedSeconds = Math.floor((Date.now() - currentSession.startedAt) / 1000);
          
          const history = getFocusHistory();
          history.push(currentSession);
          saveFocusHistory(history);
          
          localStorage.removeItem(SESSION_KEY);
          
          this.textContent = 'Start Focus Session';
          this.classList.remove('btn-danger');
          this.classList.add('btn-primary');
          
          if (timerInterval) clearInterval(timerInterval);
          updateTimerUI(null);
          
          // One final KPI update to lock in the completed session
          updateMyWorkDashboard();
        }
      });
    }

    // 6. My Projects — Dynamic Rendering from Real Data
    function renderMyProjects(allProjects, allTasks) {
      const grid = document.getElementById('my-projects-grid');
      if (!grid) return;

      // Filter to current user's projects (team array includes user initials or name)
      const myProjects = (allProjects || []).filter(p => {
        if (p.isDeleted || p.isArchived) return false;
        // SuperAdmin sees all projects
        if (currentUser && currentUser.role === 'SuperAdmin') return true;
        
        const inSimpleTeam = Array.isArray(p.team) && (p.team.includes(userInitials) || p.team.includes(userName));
        const inDetailedTeam = Array.isArray(p.detailedTeam) && p.detailedTeam.some(m => m.id === userInitials || m.id === userName);
        
        return inSimpleTeam || inDetailedTeam;
      });

      // Clear existing content
      grid.innerHTML = '';

      if (myProjects.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;color:var(--text-3);font-size:14px;padding:24px 0;text-align:center;">No projects assigned yet.</div>';
        return;
      }

      myProjects.forEach(project => {
        const progress = typeof project.progress === 'number' ? project.progress : 0;
        const dueLabel = project.dueDate || 'Not set';
        const name = project.name || 'Unnamed Project';

        // Determine progress bar colour
        let barColor = '';
        if (progress >= 80) barColor = 'background:var(--success);';
        else if (progress >= 50) barColor = '';               // default primary colour
        else if (progress >= 30) barColor = 'background:var(--warning);';
        else if (progress < 30) barColor = 'background:var(--danger);';

        // Find the next open task for this project (first non-completed task)
        const nextTask = (allTasks || []).find(t =>
          (t.projectId === project.id || t.project === project.name || t.project === project.client) &&
          t.status !== 'Completed'
        );
        const nextLabel = nextTask ? nextTask.title : 'Not set';

        // Build card HTML matching the exact existing template
        const card = document.createElement('div');
        card.className = 'proj-card';
        card.dataset.projectId = project.id;
        card.innerHTML = `
          <div>
            <div class="proj-title">${name}</div>
            <div class="proj-due">Due: ${dueLabel}</div>
          </div>
          <div class="proj-progress">
            <div class="proj-prog-label"><span>Progress</span> <span>${progress}%</span></div>
            <div class="proj-prog-bar">
              <div class="proj-prog-fill" style="width: ${progress}%; ${barColor}"></div>
            </div>
          </div>
          <div class="proj-next">Next: ${nextLabel}</div>
          <button class="btn btn-ghost btn-sm proj-view-btn"
            style="border:1px solid var(--border); width:100%; margin-top:4px;">View Project</button>
        `;

        // Attach View Project click handler using real project ID
        const viewBtn = card.querySelector('.proj-view-btn');
        if (viewBtn) {
          viewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            localStorage.setItem('verde_pending_project_view', project.id);
            const a = document.createElement('a');
            a.href = '../projects/index.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        }

        grid.appendChild(card);
      });
    }

    // Load real project data and render
    function loadAndRenderProjects() {
      if (window.VerdeServices && window.VerdeServices.Projects && window.VerdeServices.Tasks) {
        Promise.all([
          window.VerdeServices.Projects.getProjects(),
          window.VerdeServices.Tasks.getTasks()
        ]).then(([projects, tasks]) => {
          renderMyProjects(projects, tasks);
        }).catch(err => {
          console.error("Failed to fetch data for My Projects:", err);
          renderMyProjects([], []);
        });
      } else {
        // Fallback if services fail
        const projects = window.VerdeMockData && window.VerdeMockData.projects ? window.VerdeMockData.projects : [];
        const tasks    = window.VerdeMockData && window.VerdeMockData.tasks    ? window.VerdeMockData.tasks    : [];
        renderMyProjects(projects, tasks);
      }
    }
    
    // Call load once directly
    loadAndRenderProjects();

    // 7. Personal Notes
    const notesInput = document.querySelector('.notes-input');
    const clearNotesBtn = Array.from(document.querySelectorAll('.btn')).find(b => b.textContent.includes('Clear'));
    
    if (notesInput) {
      const savedNote = localStorage.getItem(NOTES_KEY);
      if (savedNote) {
        notesInput.value = savedNote;
      }
      
      notesInput.addEventListener('input', function() {
        localStorage.setItem(NOTES_KEY, this.value);
      });
    }
    
    if (clearNotesBtn && notesInput) {
      clearNotesBtn.addEventListener('click', function() {
        notesInput.value = '';
        localStorage.removeItem(NOTES_KEY);
      });
    }

    // 8. Quick Access Cards
    document.querySelectorAll('.quick-card').forEach(card => {
      card.addEventListener('click', function() {
        const title = this.querySelector('.quick-text')?.textContent.trim();
        let targetHref = '';
        if (title === 'Pinned Projects') targetHref = '../projects/index.html';
        else if (title === 'Recent Files') targetHref = '../workspace/index.html';
        else if (title === 'Bookmarked Tasks') targetHref = '../tasks/index.html';
        else if (title === 'Draft Documents') targetHref = '../workspace/index.html';

        if (targetHref) {
          const a = document.createElement('a');
          a.href = targetHref;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });

  }

  // Safe Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMyWork);
  } else {
    initializeMyWork();
  }

})();