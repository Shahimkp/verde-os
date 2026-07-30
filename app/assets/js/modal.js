/* ==========================================================================
   VERDE OS — REUSABLE MODAL SYSTEM
   Create, Edit, Delete, Approve, Reject & Confirmation Dialog Manager
   ========================================================================== */

(function () {
  'use strict';

  function createModalMarkup(options) {
    options = options || {};
    var title = options.title || 'Confirmation';
    var body = options.body || 'Are you sure you want to proceed?';
    var confirmText = options.confirmText || 'Confirm';
    var confirmClass = options.confirmClass || 'btn-primary';
    var cancelText = options.cancelText || 'Cancel';

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    overlay.innerHTML =
      '<div class="modal-content">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="font-size:18px; font-weight:800; color:var(--text-1); margin:0;">' + title + '</h3>' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
        '</div>' +
        '<div style="font-size:14px; color:var(--text-2); line-height:1.5; margin-bottom:24px;">' + body + '</div>' +
        '<div style="display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="modal-cancel-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">' + cancelText + '</button>' +
          '<button class="modal-confirm-btn btn btn-sm ' + confirmClass + '">' + confirmText + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function close() {
      overlay.classList.remove('active');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }

    overlay.querySelector('.modal-close-btn').addEventListener('click', close);
    overlay.querySelector('.modal-cancel-btn').addEventListener('click', function () {
      close();
      if (typeof options.onCancel === 'function') options.onCancel();
    });

    overlay.querySelector('.modal-confirm-btn').addEventListener('click', function () {
      close();
      if (typeof options.onConfirm === 'function') options.onConfirm();
    });
  }

  window.VerdeModal = {
    confirm: function (opts) { createModalMarkup(opts); },
    create: function (title, body, onConfirm) {
      createModalMarkup({ title: title || 'Create Item', body: body, confirmText: 'Create', confirmClass: 'btn-primary', onConfirm: onConfirm });
    },
    edit: function (title, body, onConfirm) {
      createModalMarkup({ title: title || 'Edit Details', body: body, confirmText: 'Save Changes', confirmClass: 'btn-primary', onConfirm: onConfirm });
    },
    delete: function (title, body, onConfirm) {
      createModalMarkup({ title: title || 'Confirm Delete', body: body || 'This action is permanent and cannot be undone.', confirmText: 'Delete Item', confirmClass: 'btn-danger', onConfirm: onConfirm });
    },
    approve: function (title, body, onConfirm) {
      createModalMarkup({ title: title || 'Approve Request', body: body || 'Are you sure you want to approve this request?', confirmText: 'Approve', confirmClass: 'btn-success', onConfirm: onConfirm });
    },
    reject: function (title, body, onConfirm) {
      createModalMarkup({ title: title || 'Reject Request', body: body || 'Are you sure you want to reject this request?', confirmText: 'Reject', confirmClass: 'btn-danger', onConfirm: onConfirm });
    }
  };

})();
