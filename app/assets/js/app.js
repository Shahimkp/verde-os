/* ==========================================================================
   VERDE OS — APPLICATION ENTRY POINT & ORCHESTRATOR
   Initializes Components, Navigation & Session Management
   ========================================================================== */

(function () {
  'use strict';

  window.VERDE_APP = {
    version: '1.0.0',
    name: 'VERDE OS Shared Framework Orchestrator',
    
    init: function () {
      // 1. Render Layout Components into placeholder IDs
      if (window.VERDE_COMPONENTS && typeof window.VERDE_COMPONENTS.render === 'function') {
        window.VERDE_COMPONENTS.render();
      }

      // 2. Initialize Navigation & Active Link Controllers
      if (window.VERDE_NAVIGATION && typeof window.VERDE_NAVIGATION.init === 'function') {
        window.VERDE_NAVIGATION.init();
      }

      // 3. Initialize Session & User UI Binding
      if (window.VERDE_SESSION && typeof window.VERDE_SESSION.init === 'function') {
        window.VERDE_SESSION.init();
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.VERDE_APP.init();
    });
  } else {
    window.VERDE_APP.init();
  }
})();

