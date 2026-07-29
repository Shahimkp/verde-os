/* ==========================================================================
   VERDE OS — TEAM MANAGEMENT WORKSPACE CONTROLLER (SPEC 010)
   Employee Search, Department Filtering & Quick Actions
   ========================================================================== */

(function () {
  'use strict';

  function initTeamWorkspace() {
    // 1. Search Filter for Employee Directory
    const searchInput = document.getElementById('team-search-input');
    const memberCards = document.querySelectorAll('#team-grid-container .company-card');

    if (searchInput && memberCards.length > 0) {
      searchInput.addEventListener('input', function (e) {
        const query = e.target.value.toLowerCase().trim();
        memberCards.forEach(card => {
          const text = card.textContent.toLowerCase();
          if (text.includes(query)) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }

    // 2. Action Buttons Triggers
    const btnInvite = document.getElementById('btn-invite-member-main');
    if (btnInvite) {
      btnInvite.addEventListener('click', function () {
        alert('Team Workspace: Opening Team Member Invitation Modal...');
      });
    }

    const btnExport = document.getElementById('btn-export-team');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        alert('Team Workspace: Exporting Team Roster to CSV...');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamWorkspace);
  } else {
    initTeamWorkspace();
  }
})();