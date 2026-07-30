/* ==========================================================================
   VERDE OS — APPLICATION ENTRY POINT & ORCHESTRATOR
   Initializes State, Components, Services, Navigation & Permissions
   ========================================================================== */

(function () {
  'use strict';

  window.VERDE_APP = {
    version: '2.0.0-REST-READY',
    name: 'VERDE OS Shared Framework Orchestrator',

    init: function () {
      // 0. Initialize Global App State Store
      if (window.VerdeState && typeof window.VerdeState.init === 'function') {
        window.VerdeState.init();
      }

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
