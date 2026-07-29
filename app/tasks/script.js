/* ==========================================================================
   VERDE OS — TASKS WORKSPACE CONTROLLER (SPEC 009)
   Task Board Interactivity, Search Filter & Actions
   ========================================================================== */

(function () {
  'use strict';

  function initTasksWorkspace() {
    // 1. Search Filter for Task List Table
    const searchInput = document.getElementById('tasks-search-input');
    const tableRows = document.querySelectorAll('#tasks-table-tbody tr');

    if (searchInput && tableRows.length > 0) {
      searchInput.addEventListener('input', function (e) {
        const query = e.target.value.toLowerCase().trim();
        tableRows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(query)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    }

    // 2. Action Buttons Triggers
    const btnCreateTask = document.getElementById('btn-create-task-main');
    if (btnCreateTask) {
      btnCreateTask.addEventListener('click', function () {
        alert('Tasks Workspace: Opening Create Task Modal...');
      });
    }

    const btnExportTasks = document.getElementById('btn-export-tasks');
    if (btnExportTasks) {
      btnExportTasks.addEventListener('click', function () {
        alert('Tasks Workspace: Exporting Task Backlog to CSV...');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTasksWorkspace);
  } else {
    initTasksWorkspace();
  }
})();