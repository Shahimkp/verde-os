/* ==========================================================================
   VERDE OS — MY WORK MODULE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  function initializeMyWork() {
    // 1. Dynamic Greeting & Date
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetingEl = document.querySelector('.my-header-title');
    if (greetingEl) {
      greetingEl.textContent = greeting + ', Shahim 👋';
    }

    const d = new Date();
    const opts = { weekday: 'short', month: 'long', day: 'numeric' };
    const dateEl = document.querySelector('.my-header-desc');
    if (dateEl) {
      dateEl.textContent = d.toLocaleDateString('en-US', opts);
    }

    // Identify KPI for Completed Today
    let completedKpiValue = null;
    document.querySelectorAll('.my-kpi-card').forEach(card => {
      const label = card.querySelector('.my-kpi-label');
      if (label && label.textContent.includes('Completed Today')) {
        completedKpiValue = card.querySelector('.my-kpi-value');
      }
    });

    // 2. Checkbox interactions (Today's Focus)
    // Persist tasks in localStorage specific to My Work
    const TASKS_STATE_KEY = 'verde_mywork_tasks_state';
    let tasksState = {};
    try {
      tasksState = JSON.parse(localStorage.getItem(TASKS_STATE_KEY)) || {};
    } catch(e) {}

    document.querySelectorAll('.my-list-item').forEach((item, index) => {
      const taskId = 'task_' + index; // simplistic ID for DOM elements
      const input = item.querySelector('.focus-check');
      
      if (input) {
        // Restore state
        if (tasksState[taskId] === 'completed') {
          input.checked = true;
          item.style.opacity = '0.5';
          item.style.textDecoration = 'line-through';
          item.dataset.status = 'completed';
        }
        
        item.addEventListener('click', function(e) {
          if (e.target.closest('.btn')) return; // Ignore buttons

          if (e.target.tagName !== 'INPUT') {
            input.checked = !input.checked;
          }
          
          if (input.checked) {
            this.style.opacity = '0.5';
            this.style.textDecoration = 'line-through';
            this.dataset.status = 'completed';
            tasksState[taskId] = 'completed';
            if (completedKpiValue) {
              const currentVal = parseInt(completedKpiValue.textContent) || 0;
              completedKpiValue.textContent = currentVal + 1;
            }
          } else {
            this.style.opacity = '1';
            this.style.textDecoration = 'none';
            this.dataset.status = 'pending';
            tasksState[taskId] = 'pending';
            if (completedKpiValue) {
              const currentVal = parseInt(completedKpiValue.textContent) || 0;
              completedKpiValue.textContent = Math.max(0, currentVal - 1);
            }
          }
          localStorage.setItem(TASKS_STATE_KEY, JSON.stringify(tasksState));
        });
      }
    });

    // Recalculate KPI on load based on persisted state
    if (completedKpiValue) {
      let count = 0;
      Object.values(tasksState).forEach(val => { if(val === 'completed') count++; });
      // Combine with mock initial value of 4 + user completed ones
      // Wait, let's just make it exact to how many are checked right now.
      let checkedCount = 0;
      document.querySelectorAll('.focus-check').forEach(chk => { if(chk.checked) checkedCount++; });
      completedKpiValue.textContent = checkedCount;
    }

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
    const SESSION_KEY = 'verde_mywork_focus_session';
    const HISTORY_KEY = 'verde_mywork_focus_history';
    
    let timerInterval = null;
    let baseTimerSeconds = 6322; // 1h 45m 22s mock baseline
    
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

    function calculateTotalElapsedHistory() {
      const history = getFocusHistory();
      return history.reduce((total, session) => total + (session.elapsedSeconds || 0), 0);
    }
    
    function updateTimerUI(activeSession) {
      let currentSessionSeconds = 0;
      if (activeSession) {
        currentSessionSeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
      }
      
      const displaySeconds = baseTimerSeconds + currentSessionSeconds;
      
      const hrs = Math.floor(displaySeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((displaySeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (displaySeconds % 60).toString().padStart(2, '0');
      
      const timerEl = document.getElementById('workTimer');
      if (timerEl) {
        timerEl.textContent = `${hrs}:${mins}:${secs}`;
      }
      
      // Update Focus Time KPI (Base 2.5h + history elapsed + current session elapsed)
      document.querySelectorAll('.my-kpi-card').forEach(card => {
        const label = card.querySelector('.my-kpi-label');
        if (label && label.textContent.includes('Focus Time')) {
          const valEl = card.querySelector('.my-kpi-value');
          if (valEl) {
            const baseHours = 2.5;
            const historyElapsed = calculateTotalElapsedHistory();
            const totalHours = baseHours + ((historyElapsed + currentSessionSeconds) / 3600);
            valEl.textContent = totalHours.toFixed(1) + 'h';
          }
        }
      });
    }

    const focusBtn = Array.from(document.querySelectorAll('.btn')).find(b => b.textContent.includes('Start Focus Session'));
    
    // Resume session on page load if active
    let activeSession = getActiveSession();
    if (activeSession && focusBtn) {
      focusBtn.textContent = 'Stop Focus Session';
      focusBtn.classList.remove('btn-primary');
      focusBtn.classList.add('btn-danger');
      updateTimerUI(activeSession);
      timerInterval = setInterval(() => updateTimerUI(getActiveSession()), 1000);
    } else {
      updateTimerUI(null);
    }

    if (focusBtn) {
      focusBtn.addEventListener('click', function() {
        let currentSession = getActiveSession();
        
        if (!currentSession) {
          // START SESSION
          currentSession = {
            id: 'fs_' + Date.now(),
            user: 'Shahim',
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
        }
      });
    }

    // 6. View Project Buttons
    document.querySelectorAll('.proj-card').forEach(card => {
      const viewBtn = card.querySelector('.btn');
      const titleEl = card.querySelector('.proj-title');
      if (viewBtn && titleEl) {
        const projectName = titleEl.textContent.trim();
        viewBtn.setAttribute('data-project', projectName.toLowerCase().replace(/\s+/g, '-'));
        
        viewBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          
          let foundProject = null;
          if (window.VerdeMockData && window.VerdeMockData.projects) {
            foundProject = window.VerdeMockData.projects.find(p => p.name.includes(projectName) || projectName.includes(p.name));
          }
          
          if (foundProject) {
            localStorage.setItem('verde_pending_project_view', foundProject.id);
            const a = document.createElement('a');
            a.href = '../projects/index.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            if (window.VerdeToast) {
              window.VerdeToast.warning("Project record not found: " + projectName);
            }
          }
        });
      }
    });

    // 7. Personal Notes
    const notesInput = document.querySelector('.notes-input');
    const clearNotesBtn = Array.from(document.querySelectorAll('.btn')).find(b => b.textContent.includes('Clear'));
    const STORAGE_KEY = 'verde_mywork_notes';
    
    if (notesInput) {
      const savedNote = localStorage.getItem(STORAGE_KEY);
      if (savedNote) {
        notesInput.value = savedNote;
      }
      
      notesInput.addEventListener('input', function() {
        localStorage.setItem(STORAGE_KEY, this.value);
      });
    }
    
    if (clearNotesBtn && notesInput) {
      clearNotesBtn.addEventListener('click', function() {
        notesInput.value = '';
        localStorage.removeItem(STORAGE_KEY);
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