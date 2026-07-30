/* ==========================================================================
   VERDE OS — REUSABLE TOAST NOTIFICATION SYSTEM
   Success, Warning, Info, Error Toast Dispatcher
   ========================================================================== */

(function () {
  'use strict';

  function createToastContainer() {
    var container = document.getElementById('verde-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'verde-toast-container';
      container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:10px; max-width:380px; pointer-events:none;';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type, duration) {
    duration = duration || 4000;
    type = type || 'info';

    var container = createToastContainer();
    var toast = document.createElement('div');
    toast.className = 'alert alert-' + type;
    toast.style.cssText = 'pointer-events:auto; margin:0; box-shadow:0 10px 24px -4px rgba(15,23,42,0.12); transform:translateY(10px); opacity:0; transition:all 220ms ease;';

    var iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    if (type === 'success') {
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    }

    toast.innerHTML = iconSvg + '<span>' + message + '</span>';
    container.appendChild(toast);

    // Trigger animation
    setTimeout(function () {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 20);

    // Auto dismiss
    setTimeout(function () {
      toast.style.transform = 'translateY(10px)';
      toast.style.opacity = '0';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  }

  window.VerdeToast = {
    success: function (msg, duration) { showToast(msg, 'success', duration); },
    error: function (msg, duration) { showToast(msg, 'danger', duration); },
    warning: function (msg, duration) { showToast(msg, 'warning', duration); },
    info: function (msg, duration) { showToast(msg, 'info', duration); }
  };

})();
