/* ==========================================================================
   VERDE OS — SPEC 011 INTEGRATED NAVIGATION & ROUTING CONTROLLER
   Dynamic Breadcrumbs, Global Search Modal (Ctrl+K), Smooth Transitions & Session
   ========================================================================== */

(function () {
  'use strict';

  function initIntegratedNavigation() {
    const sidebar = document.getElementById('app-sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const shellContainer = document.querySelector('.shell-container');
    const searchModal = document.getElementById('global-search-modal');
    const searchTrigger = document.getElementById('topbar-search-trigger');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('global-search-results');

    // 1. Sidebar Collapse State Persisted with localStorage
    const SAVED_STATE_KEY = 'verde_sidebar_collapsed';

    function setSidebarCollapse(isCollapsed) {
      if (!sidebar) return;
      if (isCollapsed) {
        sidebar.classList.add('collapsed');
        localStorage.setItem(SAVED_STATE_KEY, 'true');
      } else {
        sidebar.classList.remove('collapsed');
        localStorage.setItem(SAVED_STATE_KEY, 'false');
      }
    }

    const savedCollapsed = localStorage.getItem(SAVED_STATE_KEY);
    if (savedCollapsed === 'true') {
      setSidebarCollapse(true);
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
        setSidebarCollapse(!isCurrentlyCollapsed);
      });
    }

    if (mobileToggle && shellContainer) {
      mobileToggle.addEventListener('click', function () {
        shellContainer.classList.toggle('sidebar-open');
      });
    }

    // 2. Dynamic Active Page Matching & Breadcrumb Generation
    const currentPath = window.location.pathname.toLowerCase();
    const topbarPageTitle = document.getElementById('topbar-page-title');
    const pageTitlesMap = {
      'dashboard': 'Mission Control',
      'my-work': 'My Work Workspace',
      'projects': 'Projects Workspace',
      'tasks': 'Tasks Workspace',
      'crm': 'CRM & Sales Workspace',
      'finance': 'Finance Workspace',
      'reports': 'Reports & Analytics',
      'communication': 'Communication Workspace',
      'team': 'Team Management',
      'create-project': 'Create Project',
      'ai-hub': 'VERDE Copilot',
      'workspace': 'Organization Workspace'
    };

    let activePageKey = 'dashboard';
    Object.keys(pageTitlesMap).forEach(key => {
      if (currentPath.includes(key)) {
        activePageKey = key;
      }
    });

    if (topbarPageTitle) {
      topbarPageTitle.textContent = pageTitlesMap[activePageKey] || 'VERDE OS';
    }

    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
      const page = item.getAttribute('data-page');
      if (page === activePageKey) {
        item.classList.add('active');
      } else if (page === 'dashboard' && (currentPath.endsWith('/dashboard/') || currentPath.endsWith('/dashboard/index.html'))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 3. Global Search Modal (⌘K / Ctrl+K)
    function openGlobalSearch() {
      if (searchModal) {
        searchModal.classList.add('active');
        if (searchInput) searchInput.focus();
      }
    }

    function closeGlobalSearch() {
      if (searchModal) searchModal.classList.remove('active');
    }

    if (searchTrigger) {
      searchTrigger.addEventListener('click', function () {
        openGlobalSearch();
      });
    }

    // Live search input filtering within global search modal
    if (searchInput && searchResults) {
      const resultItems = searchResults.querySelectorAll('a');
      searchInput.addEventListener('input', function (e) {
        const query = e.target.value.toLowerCase().trim();
        resultItems.forEach(item => {
          const text = item.textContent.toLowerCase();
          if (text.includes(query)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    // 4. Dropdowns (Notifications & Profile)
    const notifToggle = document.getElementById('topbar-notifications-toggle');
    const notifDropdown = document.getElementById('notifications-dropdown');
    const profileToggle = document.getElementById('topbar-profile-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');

    function closeAllDropdowns() {
      if (notifDropdown) notifDropdown.classList.remove('active');
      if (profileDropdown) profileDropdown.classList.remove('active');
      closeGlobalSearch();
    }

    if (notifToggle && notifDropdown) {
      notifToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) notifDropdown.classList.add('active');
      });
    }

    if (profileToggle && profileDropdown) {
      profileToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = profileDropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) profileDropdown.classList.add('active');
      });
    }

    document.addEventListener('click', function (e) {
      if (searchModal && e.target === searchModal) {
        closeGlobalSearch();
      }
    });

    // 5. Keyboard Shortcuts: CTRL+K (Search), CTRL+B (Sidebar), ESC (Close)
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openGlobalSearch();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (sidebar) {
          setSidebarCollapse(!sidebar.classList.contains('collapsed'));
        }
      }
      if (e.key === 'Escape') {
        closeAllDropdowns();
        if (shellContainer) shellContainer.classList.remove('sidebar-open');
      }
    });
  }

  window.VERDE_NAVIGATION = {
    init: initIntegratedNavigation
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntegratedNavigation);
  } else {
    initIntegratedNavigation();
  }
})();

