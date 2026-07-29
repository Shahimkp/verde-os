/* ==========================================================================
   VERDE OS — PROJECTS WORKSPACE CONTROLLER (SPEC 008)
   Search Filtering, Milestone Tracking & Interactive Project Management
   ========================================================================== */

(function () {
  'use strict';

  function initProjectsWorkspace() {
    // 1. Search Filter for Projects Table & Cards
    const searchInput = document.getElementById('proj-search-input');
    const tableRows = document.querySelectorAll('#proj-table-tbody tr');

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
    const btnCreateProj = document.getElementById('btn-create-project-main');
    if (btnCreateProj) {
      btnCreateProj.addEventListener('click', function () {
        window.location.href = '../create-project/index.html';
      });
    }

    const btnImportProj = document.getElementById('btn-import-projects');
    if (btnImportProj) {
      btnImportProj.addEventListener('click', function () {
        alert('Projects Workspace: Jira / Asana / CSV Project Importer Ready.');
      });
    }

    const btnExportProj = document.getElementById('btn-export-projects');
    if (btnExportProj) {
      btnExportProj.addEventListener('click', function () {
        alert('Projects Workspace: Exporting Project Milestones & Budget to CSV...');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjectsWorkspace);
  } else {
    initProjectsWorkspace();
  }
})();