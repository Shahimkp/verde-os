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
      'team': 'Team Management',
      'create-project': 'Create Project',
      'ai-hub': 'VERDE Copilot',
      'workspace': 'Organization Workspace',
      'marketing': 'Digital Marketing Command Center'
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

    if (notifToggle && notifDropdown && !notifToggle.dataset.listener) {
      notifToggle.dataset.listener = 'true';
      notifToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) notifDropdown.classList.add('active');
      });
    }

    if (profileToggle && profileDropdown && !profileToggle.dataset.listener) {
      profileToggle.dataset.listener = 'true';
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
      
      if (notifDropdown && notifDropdown.classList.contains('active') && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
      
      if (profileDropdown && profileDropdown.classList.contains('active') && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('active');
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

    // 5.5 Reveal layout only after everything is fully injected
    requestAnimationFrame(function () {
      const appContent = document.querySelector('.app-content');
      if (appContent) {
        appContent.classList.add('layout-ready');
      }
    });

    // 6. SPA (PJAX) Router
    if (!window.__verdeRouterInitialized) {
      document.addEventListener('click', function (e) {
        // Find closest anchor tag
        let target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentNode;
        }
        if (!target) return;

        const rawHref = target.getAttribute('href');
        if (!rawHref || rawHref.startsWith('mailto') || rawHref.startsWith('#')) {
          return;
        }
        
        if (target.getAttribute('target') === '_blank') {
          return;
        }

        if (target.origin !== window.location.origin) {
          return;
        }

        const href = target.href; // fully resolved absolute URL
        if (href.includes('#') && href.split('#')[0] === window.location.href.split('#')[0]) {
          return; // same page hash link
        }

        e.preventDefault();
        navigateTo(href);
      });

      window.addEventListener('popstate', function () {
        navigateTo(location.pathname, true);
      });

      function navigateTo(url, isPopState = false) {
        if (window.VERDE_APP && typeof window.VERDE_APP.clearIntervals === 'function') {
          window.VERDE_APP.clearIntervals();
        }

        closeAllDropdowns();
        if (shellContainer) shellContainer.classList.remove('sidebar-open');

        const mainContent = document.querySelector('.app-content');
        if (mainContent) {
          mainContent.style.minHeight = 'calc(100vh - 80px)'; // prevent layout collapse
          mainContent.classList.add('fade-out');
        }

        fetch(url)
          .then(res => res.text())
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('.app-content');
            
            if (newMain && mainContent) {
              // 1. Identify Module-Specific CSS in fetched document
              const newLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
                .filter(link => !link.href.includes('/assets/css/'));
              
              let cssPromises = [];
              
              newLinks.forEach(link => {
                // Only inject if it doesn't already exist
                if (!document.querySelector('link[href="' + link.getAttribute('href') + '"]')) {
                  const p = new Promise(resolve => {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = link.getAttribute('href');
                    newLink.className = 'pjax-module-style';
                    newLink.onload = resolve;
                    newLink.onerror = resolve; // proceed even on error
                    document.head.appendChild(newLink);
                  });
                  cssPromises.push(p);
                }
              });

              // 2. Wait for Fade-Out (150ms) AND new CSS to load
              const fadePromise = new Promise(resolve => setTimeout(resolve, 150));
              
              Promise.all([...cssPromises, fadePromise]).then(() => {
                // 3. Swap DOM
                mainContent.innerHTML = newMain.innerHTML;
                document.title = doc.title;
                
                if (!isPopState) {
                  history.pushState(null, '', url);
                }

                initIntegratedNavigation();

                // Scroll to top
                window.scrollTo(0, 0);
                if (document.querySelector('.shell-main')) {
                  document.querySelector('.shell-main').scrollTo(0, 0);
                }

                // 4. Cleanup old CSS (remove styles that are module-specific but not in the new document)
                const currentModuleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                  .filter(l => !l.href.includes('/assets/css/'));
                
                const newHrefs = newLinks.map(l => l.getAttribute('href'));
                
                currentModuleLinks.forEach(l => {
                  const hrefAttr = l.getAttribute('href');
                  if (hrefAttr && !newHrefs.includes(hrefAttr)) {
                    l.parentNode.removeChild(l);
                  }
                });

                // 5. Cleanup old module scripts
                document.querySelectorAll('script.pjax-module-script').forEach(s => s.parentNode.removeChild(s));

                // 6. Execute new module scripts
                const scripts = Array.from(doc.querySelectorAll('script'))
                  .filter(s => !s.src || !s.src.includes('/assets/js/'));
                
                scripts.forEach(s => {
                  const newScript = document.createElement('script');
                  newScript.className = 'pjax-module-script';
                  if (s.src) {
                    newScript.src = s.getAttribute('src'); // Use exact relative path
                  } else {
                    newScript.textContent = s.textContent;
                  }
                  document.body.appendChild(newScript);
                });

                // 7. Fade In
                mainContent.classList.remove('fade-out');
                mainContent.classList.add('fade-in');
                setTimeout(() => {
                  mainContent.classList.remove('fade-in');
                  mainContent.style.minHeight = ''; // reset constraint
                }, 150);
              });
            } else {
              window.location.href = url;
            }
          })
          .catch(err => {
            console.error('Navigation failed', err);
            window.location.href = url;
          });
      }
      window.__verdeRouterInitialized = true;
    }
  }

  window.VERDE_NAVIGATION = {
    init: initIntegratedNavigation
  };

  // Execute immediately to inject layout before first paint!
  initIntegratedNavigation();
})();

