/* ==========================================================================
   VERDE OS — APPLICATION INTEGRATION LAYER (SPEC 011)
   Unified Shell, Global Search Modal, Notifications, Profile & Overlays
   ========================================================================== */

(function () {
  'use strict';

  // 1. Universal Sidebar Template String (SPEC 011 Unified Links)
  const SIDEBAR_HTML = `
<aside class="app-sidebar sidebar" id="app-sidebar">
  <div class="sidebar-top-content">
    <!-- Brand Header -->
    <div class="sidebar-header sidebar-brand">
      <div class="sidebar-logo">V</div>
      <div class="sidebar-title">
        <span class="sidebar-name">VERDE OS</span>
        <span class="sidebar-subtitle">MISSION CONTROL</span>
      </div>
      <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Toggle Sidebar (Ctrl+B)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Navigation Scroll Area -->
    <nav class="sidebar-nav">

      <!-- GROUP 1: MAIN -->
      <div class="sidebar-section-title">MAIN</div>

      <a href="../dashboard/index.html" class="sidebar-item nav-item" data-page="dashboard" title="Mission Control">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Mission Control</span>
      </a>

      <a href="../my-work/index.html" class="sidebar-item nav-item" data-page="my-work" title="My Work">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>My Work</span>
        <span class="badge badge-primary nav-badge">4</span>
      </a>

      <a href="../crm/index.html" class="sidebar-item nav-item" data-page="crm" title="CRM & Sales">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>CRM & Sales</span>
      </a>

      <a href="../projects/index.html" class="sidebar-item nav-item" data-page="projects" title="Projects">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Projects</span>
        <span class="badge badge-neutral nav-badge">8</span>
      </a>

      <a href="../tasks/index.html" class="sidebar-item nav-item" data-page="tasks" title="Tasks">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>Tasks</span>
        <span class="badge badge-warning nav-badge">18</span>
      </a>

      <a href="../team/index.html" class="sidebar-item nav-item" data-page="team" title="Team">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        <span>Team</span>
      </a>

      <!-- GROUP 2: BUSINESS -->
      <div class="sidebar-section-title">BUSINESS</div>

      <a href="../finance/index.html" class="sidebar-item nav-item" data-page="finance" title="Finance">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <span>Finance</span>
      </a>

      <a href="#" class="sidebar-item nav-item" data-page="marketing" title="Marketing">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
        <span>Marketing</span>
      </a>

      <a href="../ai-hub/index.html" class="sidebar-item nav-item" data-page="ai-hub" title="AI Hub">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>AI Hub</span>
      </a>

      <!-- GROUP 3: SYSTEM -->
      <div class="sidebar-section-title">SYSTEM</div>

      <a href="#" class="sidebar-item nav-item" data-page="workspace" title="Workspace">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <span>Workspace</span>
      </a>

      <a href="../reports/index.html" class="sidebar-item nav-item" data-page="reports" title="Reports">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Reports</span>
      </a>

      <a href="../global/settings.html" class="sidebar-item nav-item" data-page="settings" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Settings</span>
      </a>
    </nav>
  </div>

  <!-- User Profile Footer -->
  <div class="sidebar-footer">
    <div class="sidebar-user-avatar" id="sidebar-user-avatar">SH</div>
    <div class="sidebar-user-info">
      <span class="sidebar-user-name" id="sidebar-user-name">Shahim</span>
      <span class="sidebar-user-role" id="sidebar-user-role">CEO • Admin</span>
    </div>
  </div>
</aside>
`;

  // 2. Universal Topbar Template String (SPEC 011 Integration Topbar)
  const TOPBAR_HTML = `
<div class="app-topbar page-header">
  <div class="topbar-left">
    <button class="mobile-toggle" id="mobile-sidebar-toggle" title="Toggle Sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <span class="topbar-page" id="topbar-page-title">VERDE OS</span>
    <div class="topbar-search" id="topbar-search-trigger" title="Global Search (Ctrl+K)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span>Search workspace (Ctrl+K)…</span>
      <kbd>⌘K</kbd>
    </div>
  </div>

  <div class="topbar-right">
    <span class="topbar-date" id="topbar-date-display">Sunday, July 27, 2026</span>

    <button class="tb-btn tb-btn-primary" title="Quick Create (+)" id="topbar-quick-create" onclick="window.location.href='../create-project/index.html'">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- AI Assistant Floating Button with Glow & Pulse -->
    <button class="topbar-ai pulse-glow" title="AI Copilot Assistant" id="topbar-ai-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      <span>AI</span>
    </button>

    <!-- Notifications Dropdown -->
    <div style="position: relative;">
      <button class="tb-btn" title="Notifications" id="topbar-notifications-toggle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span class="dot"></span>
      </button>

      <div class="dropdown-menu" id="notifications-dropdown">
        <div style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid var(--border-subtle); font-size: 12px; display:flex; justify-content:space-between; align-items:center;">
          <span>Notifications</span>
          <span style="font-size:11px;color:var(--primary);cursor:pointer;" id="mark-all-read">Mark all as read</span>
        </div>
        <div style="padding: 6px 12px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase;">Today</div>
        <div class="dropdown-item">
          <div>
            <div style="font-weight: 600; font-size: 12px;">Cabo Travels Deliverable</div>
            <div style="font-size: 11px; color: var(--text-3);">Wireframe feedback submitted by client</div>
          </div>
        </div>
        <div style="padding: 6px 12px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase;">Earlier</div>
        <div class="dropdown-item">
          <div>
            <div style="font-weight: 600; font-size: 12px;">Payment Processed</div>
            <div style="font-size: 11px; color: var(--text-3);">GreenLeaf invoice #VL-0042 cleared (₹85,000)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Dropdown Menu -->
    <div style="position: relative;">
      <div class="tb-avatar" id="topbar-profile-toggle">SH</div>
      <div class="dropdown-menu" id="profile-dropdown">
        <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; font-size: 13px;" id="profile-dropdown-name">Shahim</div>
          <div style="font-size: 11px; color: var(--text-3);">shahim@verdelabs.com • SuperAdmin</div>
        </div>
        <a href="../create-project/index.html" class="dropdown-item">Create New Project</a>
        <a href="../finance/index.html" class="dropdown-item">Billing & Subscription</a>
        <a href="../auth/index.html" class="dropdown-item" id="topbar-signout" style="color:var(--danger);">Sign Out</a>
      </div>
    </div>
  </div>
</div>
`;

  // 3. Statusbar Component Template String
  const STATUSBAR_HTML = `
<footer class="app-statusbar" id="app-statusbar">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span class="status-dot"></span>
    <span>VERDE OS v2.0 Enterprise • Operational</span>
  </div>
  <div style="display: flex; align-items: center; gap: 16px;">
    <span>Workspace: VERDE LABS</span>
    <span>Latency: 18ms</span>
  </div>
</footer>
`;

  // 4. Overlays & Global Search Modal Template String (SPEC 011 Global Search Modal)
  const OVERLAYS_HTML = `
<div class="app-overlays" id="app-overlays">
  <div class="v-toast-container" id="v-toast-container"></div>

  <!-- Unified Global Search Modal (⌘K / Ctrl+K) -->
  <div class="modal-overlay" id="global-search-modal">
    <div class="modal-content modal-lg">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--border-subtle);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="global-search-input" placeholder="Type a command or search across Projects, Tasks, Clients, Team…" style="width:100%;border:none;outline:none;font-size:15px;font-weight:600;color:var(--text-1);" autofocus />
        <kbd style="font-size:10px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;">ESC to close</kbd>
      </div>

      <div style="max-height:360px;overflow-y:auto;padding-top:12px;display:flex;flex-direction:column;gap:8px;" id="global-search-results">
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Quick Navigation</div>
        <a href="../dashboard/index.html" class="dropdown-item" style="border-radius:6px;">📊 Mission Control Dashboard</a>
        <a href="../projects/index.html" class="dropdown-item" style="border-radius:6px;">📁 Projects Workspace (8 Active)</a>
        <a href="../tasks/index.html" class="dropdown-item" style="border-radius:6px;">✅ Task Board (18 Pending)</a>
        <a href="../crm/index.html" class="dropdown-item" style="border-radius:6px;">🤝 CRM & Sales Pipeline</a>
        <a href="../team/index.html" class="dropdown-item" style="border-radius:6px;">👥 Team Directory & Roster</a>
        <a href="../finance/index.html" class="dropdown-item" style="border-radius:6px;">💳 Finance & Invoicing</a>

        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-top:8px;">Recent Clients & Projects</div>
        <a href="../projects/index.html" class="dropdown-item" style="border-radius:6px;">🔹 Cabo Travels Redesign (72%)</a>
        <a href="../projects/index.html" class="dropdown-item" style="border-radius:6px;">🔹 MedCare ERP Mobile App (45%)</a>
        <a href="../crm/index.html" class="dropdown-item" style="border-radius:6px;">🔹 BlueWave Tech Lead (₹4.5L)</a>
      </div>
    </div>
  </div>
</div>
`;

  window.VERDE_COMPONENTS = {
    render: function () {
      const sidebarContainer = document.getElementById('sidebar-container');
      const topbarContainer = document.getElementById('topbar-container');
      const statusbarContainer = document.getElementById('statusbar-container');
      const overlaysContainer = document.getElementById('overlays-container');

      if (sidebarContainer) sidebarContainer.innerHTML = SIDEBAR_HTML;
      if (topbarContainer) topbarContainer.innerHTML = TOPBAR_HTML;
      if (statusbarContainer) statusbarContainer.innerHTML = STATUSBAR_HTML;
      if (overlaysContainer) overlaysContainer.innerHTML = OVERLAYS_HTML;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.VERDE_COMPONENTS.render);
  } else {
    window.VERDE_COMPONENTS.render();
  }
})();
