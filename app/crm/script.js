/* ==========================================================================
   VERDE OS — CRM & SALES WORKSPACE CONTROLLER (SPEC 007)
   Search Filtering, Lead Triggers & Interactive Deal Board
   ========================================================================== */

(function () {
  'use strict';

  function initCrmWorkspace() {
    // 1. Search Filter for Recent Leads Table
    const searchInput = document.getElementById('crm-search-input');
    const tableRows = document.querySelectorAll('#crm-leads-tbody tr');

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
    const btnNewLead = document.getElementById('btn-create-lead');
    if (btnNewLead) {
      btnNewLead.addEventListener('click', function () {
        alert('CRM Workspace: Opening New Lead Creation Modal...');
      });
    }

    const btnImport = document.getElementById('btn-import-leads');
    if (btnImport) {
      btnImport.addEventListener('click', function () {
        alert('CRM Workspace: CSV / Excel Contact Importer Ready.');
      });
    }

    const btnExport = document.getElementById('btn-export-leads');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        alert('CRM Workspace: Exporting Sales Pipeline to CSV...');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCrmWorkspace);
  } else {
    initCrmWorkspace();
  }
})();