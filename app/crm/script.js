/* ==========================================================================
   VERDE OS — CRM & SALES WORKSPACE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  var currentLeads = [];
  var currentClients = [];

  function initCRM() {
    if (!window.VerdeServices || !window.VerdeServices.Crm) return;
    
    // Custom select interaction handler
    window.selectCustomOption = function(optionEl, labelText) {
      var container = optionEl.closest('.verde-custom-select');
      if (!container) return;
      
      // Update selected class
      var options = container.querySelectorAll('.verde-select-option');
      options.forEach(function(o) { o.classList.remove('selected'); });
      optionEl.classList.add('selected');
      
      // Update label
      var labelEl = container.querySelector('.verde-select-value');
      if (labelEl) labelEl.textContent = labelText;
      
      // Update hidden input and trigger change
      var hiddenInput = container.querySelector('input[type="hidden"]');
      if (hiddenInput) {
        hiddenInput.value = optionEl.getAttribute('data-value');
        hiddenInput.dispatchEvent(new Event('change'));
      }
      
      // Close dropdown
      container.classList.remove('open');
    };

    // Close custom dropdowns on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.verde-custom-select')) {
        document.querySelectorAll('.verde-custom-select').forEach(function(el) {
          el.classList.remove('open');
        });
      }
    });
    
    // Initial fetch
    var promises = [
      window.VerdeServices.Crm.getLeads(),
      window.VerdeServices.Crm.getClients()
    ];
    if (window.VerdeServices.Projects) promises.push(window.VerdeServices.Projects.getProjects());

    Promise.all(promises).then(function(results) {
      currentLeads = results[0] || [];
      currentClients = results[1] || [];
      var allProjects = results[2] || [];
      
      renderKPIs();
      renderKanban();
      renderClients(allProjects);
      renderActivityFeed();
      setupSearch();
    });
  }

  function setupSearch() {
    var globalSearch = document.getElementById('crm-global-search');
    if (globalSearch) {
      globalSearch.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.crm-kanban-card').forEach(function(card) {
          card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
        });
      });
    }

    var clientSearch = document.getElementById('crm-client-search');
    if (clientSearch) {
      clientSearch.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('#clients-table-body tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(query) ? 'table-row' : 'none';
        });
      });
    }

    var clientStatusFilter = document.getElementById('crm-client-status-filter');
    if (clientStatusFilter) {
      clientStatusFilter.addEventListener('change', function() {
        initCRM();
      });
    }

    var leadStatusFilter = document.getElementById('crm-lead-status-filter');
    if (leadStatusFilter) {
      leadStatusFilter.addEventListener('change', function() {
        initCRM();
      });
    }
  }

  function renderKPIs() {
    var totalLeads = currentLeads.filter(function(l) { return l.lifecycle !== 'Deleted' && l.lifecycle !== 'Archived'; }).length;
    var activeClients = currentClients.filter(function(c) { return c.status !== 'Deleted' && c.status !== 'Archived'; }).length;
    var dealsInProgress = currentLeads.filter(function(l) { return l.status !== 'Won' && l.status !== 'Lost' && l.lifecycle !== 'Deleted' && l.lifecycle !== 'Archived'; }).length;
    var pipelineValue = currentLeads.filter(function(l) { return l.lifecycle !== 'Deleted' && l.lifecycle !== 'Archived'; }).reduce(function(sum, l) { return sum + (l.value || 0); }, 0);

    var kpiCards = document.querySelectorAll('.crm-kpi-value');
    if (kpiCards.length >= 4) {
      kpiCards[0].textContent = totalLeads;
      kpiCards[1].textContent = activeClients;
      kpiCards[2].textContent = dealsInProgress;
      kpiCards[3].textContent = '₹' + (pipelineValue / 100000).toFixed(1) + 'L';
    }
  }

  function renderKanban() {
    var stages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
    
    var leadStatusFilter = document.getElementById('crm-lead-status-filter');
    var filterValue = leadStatusFilter ? leadStatusFilter.value : 'active';

    stages.forEach(function(stage) {
      var container = document.getElementById('kanban-' + stage);
      var countBadge = document.getElementById('count-' + stage.toLowerCase().replace(/ /g, '-'));
      if (!container) return;

      var leadsInStage = currentLeads.filter(function(l) {
        if (l.lifecycle === 'Deleted') return false;
        var isArchived = l.lifecycle === 'Archived';
        if (filterValue === 'archived') return l.status === stage && isArchived;
        return l.status === stage && !isArchived;
      });
      if (countBadge) countBadge.textContent = leadsInStage.length;
      
      container.innerHTML = '';
      
      // Setup drop zone
      container.ondragover = function(e) { e.preventDefault(); container.style.background = 'var(--bg-1)'; };
      container.ondragleave = function(e) { e.preventDefault(); container.style.background = 'transparent'; };
      container.ondrop = function(e) {
        e.preventDefault();
        container.style.background = 'transparent';
        var leadId = e.dataTransfer.getData('text/plain');
        if (leadId) updateLeadStatus(leadId, stage);
      };

      if (leadsInStage.length === 0) {
        if (stage === 'Lost') {
          container.innerHTML = '<div style="text-align:center; padding:32px 0; color:var(--text-3); font-size:12px; font-weight:600;">No deals lost recently</div>';
        }
        return;
      }

      leadsInStage.forEach(function(l) {
        var valStr = '₹' + (l.value / 100000).toFixed(1) + 'L';
        var initials = l.assignedTo ? l.assignedTo.substring(0,2).toUpperCase() : 'UN';
        
        var card = document.createElement('div');
        card.className = 'crm-kanban-card';
        card.draggable = true;
        card.ondragstart = function(e) { e.dataTransfer.setData('text/plain', l.id); };
        card.onclick = function(e) { 
          if (e.target.tagName.toLowerCase() !== 'span') {
            window.showLeadDetails(l.id); 
          }
        };
        
        var valStyle = '';
        if (stage === 'Won') valStyle = 'color:var(--success); background:var(--success-10);';

        card.innerHTML = 
          '<div class="crm-kcard-header">' +
            '<div>' +
              '<div class="crm-kcard-client">' + l.name + '</div>' +
              '<div class="crm-kcard-company">' + l.company + '</div>' +
            '</div>' +
            '<div class="crm-kcard-value" style="' + valStyle + '">' + valStr + '</div>' +
          '</div>' +
          '<div class="crm-kcard-meta">' +
            '<div style="display:flex; align-items:center; gap:6px;">' +
              '<div class="crm-avatar">' + initials + '</div> ' + l.assignedTo +
            '</div>' +
            (stage === 'Won' && !l.clientId ? '<span style="color:var(--success); cursor:pointer; text-decoration:underline;" onclick="window.convertLead(\'' + l.id + '\')">Convert Client</span>' : '') +
          '</div>';
          
        container.appendChild(card);
      });
    });
  }

  function updateLeadStatus(leadId, newStatus) {
    var lead = currentLeads.find(function(l) { return l.id === leadId; });
    if (!lead || lead.status === newStatus) return;

    window.VerdeServices.Crm.updateLead(leadId, { status: newStatus }).then(function(updated) {
      if (window.VerdeToast) window.VerdeToast.success('Lead moved to ' + newStatus);
      if (newStatus === 'Won' && !updated.clientId) {
        if (window.VerdeModal) window.VerdeModal.confirm({
          title: 'Lead Won!',
          message: 'Would you like to convert ' + updated.name + ' into a Client?',
          confirmText: 'Convert',
          onConfirm: function() { window.convertLead(leadId); }
        });
      }
      initCRM();
    });
  }

  window.convertLead = function(leadId) {
    window.VerdeServices.Crm.convertLead(leadId).then(function(res) {
      initCRM();
      if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
    });
  };

  function renderClients(allProjects) {
    var tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    
    allProjects = allProjects || [];
    tbody.innerHTML = '';

    var statusFilter = document.getElementById('crm-client-status-filter');
    var filterValue = statusFilter ? statusFilter.value : 'active';

    var filteredClients = currentClients.filter(function(c) {
      if (c.status === 'Deleted') return false;
      if (filterValue === 'archived') return c.status === 'Archived';
      return c.status !== 'Archived';
    });

    if (filteredClients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-3);">No clients found for this view.</td></tr>';
      return;
    }

    filteredClients.forEach(function(c) {
      var lastActivityDate = 'No activity';
      if (c.activities && c.activities.length > 0) {
        var sorted = c.activities.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        lastActivityDate = new Date(sorted[0].date).toLocaleDateString();
      }

      var cProjects = allProjects.filter(function(p) { return p.clientId === c.id || p.client === c.company || p.client === c.contactPerson; });
      var activeProjectsCount = cProjects.filter(function(p) { return p.status !== 'Completed' && p.status !== 'Archived'; }).length;
      var projText = activeProjectsCount > 0 ? activeProjectsCount + ' Active' : '0 Active';

      var badgeClass = c.status === 'Archived' ? 'badge-neutral' : 'badge-success';

      var actionButtons = '';
      if (c.status === 'Archived') {
        actionButtons = '<button class="btn btn-sm btn-ghost" onclick="window.restoreClient(\'' + c.id + '\')" style="color:var(--success);">Restore</button>' +
                        '<button class="btn btn-sm btn-ghost" onclick="window.deleteClient(\'' + c.id + '\')" style="color:var(--danger);">Delete</button>';
      } else {
        actionButtons = '<button class="btn btn-sm btn-ghost" onclick="window.showClientDetails(\'' + c.id + '\')">View</button>' +
                        '<button class="btn btn-sm btn-ghost" onclick="window.editClient(\'' + c.id + '\')" style="color:var(--primary);">Edit</button>' +
                        '<button class="btn btn-sm btn-ghost" onclick="window.archiveClient(\'' + c.id + '\')" style="color:var(--warning);">Archive</button>' +
                        '<button class="btn btn-sm btn-ghost" onclick="window.deleteClient(\'' + c.id + '\')" style="color:var(--danger);">Delete</button>';
      }

      var html = '<tr style="border-bottom:1px solid var(--border-subtle);">' +
        '<td><div style="font-weight:700; color:var(--text-1);">' + (c.contactPerson || 'Unknown') + '</div><div class="td-sub">' + (c.email || 'No email') + '<br/>' + (c.phone || '') + '</div></td>' +
        '<td><div style="font-weight:600; color:var(--text-2);">' + (c.company || 'Unknown') + '</div><div class="td-sub">' + (c.industry || 'No industry') + '</div></td>' +
        '<td><div style="font-weight:600; color:var(--text-2);">₹' + (c.revenue || 0) + '</div><div class="td-sub">' + projText + ' Projects</div></td>' +
        '<td><span class="badge ' + badgeClass + '">' + c.status + '</span></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + lastActivityDate + '</div></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + (window.VerdeMockData ? window.VerdeMockData.user.name : 'Unassigned') + '</div></td>' +
        '<td style="text-align:right;">' +
          '<div style="display:flex; gap:8px; justify-content:flex-end;">' + actionButtons + '</div>' +
        '</td>' +
      '</tr>';
      tbody.innerHTML += html;
    });
  }

  function renderActivityFeed() {
    var feed = document.getElementById('crm-activity-feed-list');
    if (!feed) return;
    
    var allActivities = [];
    currentLeads.forEach(function(l) {
      (l.activities || []).forEach(function(a) { allActivities.push(a); });
    });
    currentClients.forEach(function(c) {
      (c.activities || []).forEach(function(a) { allActivities.push(a); });
    });
    
    allActivities.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    
    feed.innerHTML = '';
    allActivities.slice(0, 10).forEach(function(a) {
      var dateStr = new Date(a.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      var html = '<div class="crm-activity-item">' +
        '<div class="crm-activity-content">' +
          '<div class="crm-activity-icon" style="color:var(--primary);">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<circle cx="12" cy="12" r="10"></circle>' +
            '</svg>' +
          '</div>' +
          '<div class="crm-activity-text">' + a.action + ': ' + a.details + '</div>' +
        '</div>' +
        '<div class="crm-activity-time">' + dateStr + '</div>' +
      '</div>';
      feed.innerHTML += html;
    });
  }

  window.showCreateLeadModal = function() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    var formHtml = 
      '<div class="modal-content" style="max-width:600px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="font-size:18px; font-weight:800; color:var(--text-1); margin:0;">Create New Lead</h3>' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
        '</div>' +

        '<div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">' +
          
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Lead Name / Title *</label>' +
              '<input type="text" id="new-lead-name" class="form-input" placeholder="e.g. Website Revamp" />' +
              '<div id="err-lead-name" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Lead Name is required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Company *</label>' +
              '<input type="text" id="new-lead-company" class="form-input" placeholder="Company Name" />' +
              '<div id="err-lead-company" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Company Name is required.</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Contact Person *</label>' +
              '<input type="text" id="new-lead-contact" class="form-input" placeholder="John Doe" />' +
              '<div id="err-lead-contact" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Contact Person required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Email *</label>' +
              '<input type="email" id="new-lead-email" class="form-input" placeholder="Email Address" />' +
              '<div id="err-lead-email" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Valid Email is required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Phone *</label>' +
              '<input type="text" id="new-lead-phone" class="form-input" placeholder="Phone Number" />' +
              '<div id="err-lead-phone" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Phone is required.</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Pipeline Stage *</label>' +
              '<select id="new-lead-status" class="form-input">' +
                '<option value="New Lead">New Lead</option>' +
                '<option value="Qualified">Qualified</option>' +
                '<option value="Proposal Sent">Proposal Sent</option>' +
                '<option value="Negotiation">Negotiation</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Lead Source *</label>' +
              '<select id="new-lead-source" class="form-input">' +
                '<option value="Website">Website</option>' +
                '<option value="Referral">Referral</option>' +
                '<option value="Outbound">Outbound</option>' +
                '<option value="Event">Event</option>' +
                '<option value="Partner">Partner</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Priority *</label>' +
              '<select id="new-lead-priority" class="form-input">' +
                '<option value="Low">Low</option>' +
                '<option value="Medium" selected>Medium</option>' +
                '<option value="High">High</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Assigned Salesperson</label>' +
              '<select id="new-lead-assigned" class="form-input">' +
                '<option value="Shahim">Shahim</option>' +
                '<option value="Nihal">Nihal</option>' +
                '<option value="Midhul">Midhul</option>' +
                '<option value="Unassigned">Unassigned</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Expected Deal Value (₹)</label>' +
              '<input type="number" id="new-lead-value" class="form-input" placeholder="e.g. 500000" />' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Notes</label>' +
            '<textarea id="new-lead-notes" class="form-input" placeholder="Any initial notes about this lead..." style="min-height:80px; resize:vertical;"></textarea>' +
          '</div>' +

        '</div>' +
        '<div style="display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="modal-cancel-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">Cancel</button>' +
          '<button class="modal-draft-btn btn btn-ghost btn-sm" style="border:1px solid var(--primary); color:var(--primary);">Save Draft</button>' +
          '<button class="modal-confirm-btn btn btn-sm btn-primary">Create Lead</button>' +
        '</div>' +
      '</div>';
      
    overlay.innerHTML = formHtml;
    document.body.appendChild(overlay);

    function closeModal() {
      overlay.classList.remove('active');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }

    overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    overlay.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);

    function submitLead(isDraft) {
      var name = document.getElementById('new-lead-name').value.trim();
      var company = document.getElementById('new-lead-company').value.trim();
      var contact = document.getElementById('new-lead-contact').value.trim();
      var email = document.getElementById('new-lead-email').value.trim();
      var phone = document.getElementById('new-lead-phone').value.trim();
      var status = document.getElementById('new-lead-status').value;
      var priority = document.getElementById('new-lead-priority').value;
      var source = document.getElementById('new-lead-source').value;
      var assignedTo = document.getElementById('new-lead-assigned').value;
      var val = document.getElementById('new-lead-value').value;
      var notes = document.getElementById('new-lead-notes').value.trim();
      
      var isValid = true;
      
      if (!name) { document.getElementById('err-lead-name').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-lead-name').style.display = 'none'; }
      
      if (!company) { document.getElementById('err-lead-company').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-lead-company').style.display = 'none'; }
      
      if (!contact) { document.getElementById('err-lead-contact').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-lead-contact').style.display = 'none'; }
      
      if (!email || email.indexOf('@') === -1) { document.getElementById('err-lead-email').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-lead-email').style.display = 'none'; }
      
      if (!phone) { document.getElementById('err-lead-phone').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-lead-phone').style.display = 'none'; }
      
      if (!isValid) {
        if (window.VerdeToast) window.VerdeToast.error('Validation Failed. Please check the fields.');
        return;
      }

      closeModal();

      var leadData = {
        name: name,
        company: company,
        contactPerson: contact,
        email: email,
        phone: phone,
        status: status,
        priority: priority,
        source: source,
        assignedTo: assignedTo,
        value: parseFloat(val || 0),
        notes: notes ? [{ id: 'NOTE-' + Date.now(), text: notes, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() }] : [],
        isDraft: isDraft
      };

      window.VerdeServices.Crm.createLead(leadData).then(function(newLead) {
        if (window.VerdeToast) {
          if (isDraft) window.VerdeToast.success('Lead Draft Saved Successfully');
          else window.VerdeToast.success('Lead Created Successfully');
        }
        initCRM();
        if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
      });
    }

    overlay.querySelector('.modal-confirm-btn').addEventListener('click', function() { submitLead(false); });
    overlay.querySelector('.modal-draft-btn').addEventListener('click', function() { submitLead(true); });
  };

  window.showLeadDetails = function(leadId) {
    var lead = currentLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;
    
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    function renderModal(isEditMode) {
      var valStr = lead.value ? lead.value : '';
      
      var viewHtml = 
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Company</div>' +
            '<div style="font-size:14px; color:var(--text-1); font-weight:700;">' + lead.company + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Contact Person</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.contactPerson + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Email</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.email + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Phone</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.phone + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Lead Source</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.source + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Priority</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.priority + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Expected Deal Value</div>' +
            '<div style="font-size:14px; color:var(--text-1); font-weight:700;">₹' + valStr + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Assigned Salesperson</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + lead.assignedTo + '</div>' +
          '</div>' +
        '</div>';

      var editHtml = 
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Lead Name / Title</label>' +
            '<input type="text" id="edit-lead-name" class="form-input" value="' + lead.name + '" />' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Company</label>' +
            '<input type="text" id="edit-lead-company" class="form-input" value="' + lead.company + '" />' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Contact Person</label>' +
            '<input type="text" id="edit-lead-contact" class="form-input" value="' + lead.contactPerson + '" />' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Email</label>' +
            '<input type="email" id="edit-lead-email" class="form-input" value="' + lead.email + '" />' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Phone</label>' +
            '<input type="text" id="edit-lead-phone" class="form-input" value="' + lead.phone + '" />' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Lead Source</label>' +
            '<select id="edit-lead-source" class="form-input">' +
              '<option value="Website" ' + (lead.source === "Website" ? "selected" : "") + '>Website</option>' +
              '<option value="Referral" ' + (lead.source === "Referral" ? "selected" : "") + '>Referral</option>' +
              '<option value="Outbound" ' + (lead.source === "Outbound" ? "selected" : "") + '>Outbound</option>' +
              '<option value="Event" ' + (lead.source === "Event" ? "selected" : "") + '>Event</option>' +
              '<option value="Partner" ' + (lead.source === "Partner" ? "selected" : "") + '>Partner</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Priority</label>' +
            '<select id="edit-lead-priority" class="form-input">' +
              '<option value="Low" ' + (lead.priority === "Low" ? "selected" : "") + '>Low</option>' +
              '<option value="Medium" ' + (lead.priority === "Medium" ? "selected" : "") + '>Medium</option>' +
              '<option value="High" ' + (lead.priority === "High" ? "selected" : "") + '>High</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Assigned Salesperson</label>' +
            '<select id="edit-lead-assigned" class="form-input">' +
              '<option value="Shahim" ' + (lead.assignedTo === "Shahim" ? "selected" : "") + '>Shahim</option>' +
              '<option value="Nihal" ' + (lead.assignedTo === "Nihal" ? "selected" : "") + '>Nihal</option>' +
              '<option value="Midhul" ' + (lead.assignedTo === "Midhul" ? "selected" : "") + '>Midhul</option>' +
              '<option value="Unassigned" ' + (lead.assignedTo === "Unassigned" ? "selected" : "") + '>Unassigned</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Expected Deal Value (₹)</label>' +
            '<input type="number" id="edit-lead-value" class="form-input" value="' + valStr + '" />' +
          '</div>' +
        '</div>';

      var meetingsHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1);">Meeting History</h4>' +
          '<button id="btn-create-meeting" class="btn btn-ghost btn-sm" style="color:var(--primary); font-size:12px; font-weight:600;">+ Schedule</button>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2); max-height:150px; overflow-y:auto;">';
      
      var meetingsList = lead.meetings || [];
      if (meetingsList.length === 0) {
        meetingsHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No meetings scheduled</div>';
      } else {
        meetingsList.forEach(function(m) {
          var bg = m.status === 'Scheduled' ? 'var(--warning-10)' : (m.status === 'Completed' ? 'var(--success-10)' : 'var(--bg-3)');
          var col = m.status === 'Scheduled' ? 'var(--warning)' : (m.status === 'Completed' ? 'var(--success)' : 'var(--text-3)');
          meetingsHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + new Date(m.date).toLocaleDateString() + ' at ' + m.time + '</div>' +
            '<div style="font-size:12px; color:var(--text-3);">' + m.notes + '</div></div>' +
            '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">' +
              '<span class="badge" style="background:'+bg+'; color:'+col+';">' + m.status + '</span>' +
              (m.status === 'Scheduled' ? '<div style="font-size:11px;"><a href="#" class="btn-mtg-action" data-id="'+m.id+'" data-action="Completed" style="color:var(--success); margin-right:8px;">Complete</a><a href="#" class="btn-mtg-action" data-id="'+m.id+'" data-action="Cancelled" style="color:var(--danger);">Cancel</a></div>' : '') +
            '</div>' +
          '</div>';
        });
      }
      meetingsHtml += '</div></div>';

      var proposalsHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1);">Proposal History</h4>' +
          '<button id="btn-create-proposal" class="btn btn-ghost btn-sm" style="color:var(--primary); font-size:12px; font-weight:600;">+ New Proposal</button>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2);">';
      var proposalsList = lead.proposals || [];
      if (proposalsList.length === 0) proposalsHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No proposals sent</div>';
      else {
        proposalsList.forEach(function(p) {
          proposalsHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + p.number + '</div>' +
            '<div style="font-size:12px; color:var(--text-3);">' + new Date(p.date).toLocaleDateString() + ' &middot; ₹' + p.value + '</div></div>' +
            '<div style="display:flex; gap:8px; align-items:center;">' +
              '<span class="badge badge-neutral">' + p.status + '</span>' +
              '<a href="#" style="font-size:11px; color:var(--primary);">View</a>' +
            '</div>' +
          '</div>';
        });
      }
      proposalsHtml += '</div></div>';

      var notesHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1);">Internal Notes</h4>' +
          '<button id="btn-add-note" class="btn btn-ghost btn-sm" style="color:var(--primary); font-size:12px; font-weight:600;">+ Add Note</button>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2); max-height:150px; overflow-y:auto;">';
      var notesList = lead.notes || [];
      if (notesList.length === 0) notesHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No internal notes</div>';
      else {
        var sortedNotes = notesList.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        sortedNotes.forEach(function(n) {
          notesHtml += '<div style="padding:8px; border-bottom:1px solid var(--border);">' +
            '<div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-3); margin-bottom:4px;"><span>' + n.author + '</span><span>' + new Date(n.date).toLocaleString() + '</span></div>' +
            '<div style="font-size:13px;">' + n.text + '</div>' +
          '</div>';
        });
      }
      notesHtml += '</div></div>';

      var timelineHtml = '<div style="margin-top:24px;">' +
        '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:8px;">Activity Timeline</h4>' +
        '<div style="max-height:150px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; padding:12px; background:var(--bg-2);">';
      
      var acts = lead.activities || [];
      if (acts.length === 0) timelineHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center;">No activity yet.</div>';
      else {
        var sortedActs = acts.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        sortedActs.forEach(function(a) {
          timelineHtml += '<div style="margin-bottom:8px; font-size:12px; display:flex; justify-content:space-between;">' +
            '<div><span style="font-weight:700;">' + a.action + '</span> <span style="color:var(--text-3);">' + a.details + '</span></div>' +
            '<div style="color:var(--text-3); text-align:right; min-width:70px;">' + new Date(a.date).toLocaleDateString() + '</div>' +
          '</div>';
        });
      }
      timelineHtml += '</div></div>';

      var formHtml = 
        '<div class="modal-content" style="max-width:700px; max-height:90vh; overflow-y:auto;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<h3 style="font-size:20px; font-weight:800; color:var(--text-1); margin:0;">' + (isEditMode ? 'Edit Lead' : lead.name) + '</h3>' +
            '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
          '</div>' +
          (!isEditMode ? '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
            '<div style="display:flex; align-items:center; gap:8px;">' +
              '<span style="font-size:12px; font-weight:600; color:var(--text-3);">Stage:</span>' +
              '<select id="details-lead-status" class="form-input" style="padding:4px 8px; font-size:12px; height:auto;">' +
                '<option value="New Lead" ' + (lead.status === "New Lead" ? "selected" : "") + '>New Lead</option>' +
                '<option value="Qualified" ' + (lead.status === "Qualified" ? "selected" : "") + '>Qualified</option>' +
                '<option value="Proposal Sent" ' + (lead.status === "Proposal Sent" ? "selected" : "") + '>Proposal Sent</option>' +
                '<option value="Negotiation" ' + (lead.status === "Negotiation" ? "selected" : "") + '>Negotiation</option>' +
                '<option value="Won" ' + (lead.status === "Won" ? "selected" : "") + '>Won</option>' +
                '<option value="Lost" ' + (lead.status === "Lost" ? "selected" : "") + '>Lost</option>' +
              '</select>' +
              (lead.status === 'Won' && !lead.clientId ? '<button id="btn-convert-client" class="btn btn-sm btn-primary" style="padding:4px 8px; font-size:12px; margin-right:8px;">Convert to Client</button>' : '') +
              (lead.lifecycle === 'Archived' ? '<button id="btn-restore-lead" class="btn btn-sm btn-ghost" style="color:var(--success); border:1px solid var(--border); font-size:12px; margin-right:8px;">Restore</button>' : 
              '<button id="btn-archive-lead" class="btn btn-sm btn-ghost" style="color:var(--warning); border:1px solid var(--border); font-size:12px; margin-right:8px;">Archive</button>') +
              '<button id="btn-delete-lead" class="btn btn-sm btn-ghost" style="color:var(--danger); border:1px solid var(--border); font-size:12px; margin-right:8px;">Delete</button>' +
              '<button id="btn-edit-mode" class="btn btn-ghost btn-sm" style="border:1px solid var(--border); font-size:12px;">Edit</button>' +
            '</div>' +
          '</div>' : '') +
          
          (isEditMode ? editHtml : viewHtml) +
          (!isEditMode ? proposalsHtml + notesHtml + meetingsHtml + timelineHtml : '') +

          '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">' +
            (isEditMode ? '<button id="btn-cancel-edit" class="btn btn-ghost btn-sm" style="border:1px solid var(--border);">Cancel</button>' +
            '<button id="btn-save-edit" class="btn btn-sm btn-primary">Save Changes</button>' : '') +
          '</div>' +
        '</div>';

      overlay.innerHTML = formHtml;
      
      overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
      
      if (!isEditMode) {
        var statusSelect = overlay.querySelector('#details-lead-status');
        if (statusSelect) {
          statusSelect.addEventListener('change', function(e) {
            var newStatus = e.target.value;
            window.VerdeServices.Crm.updateLead(lead.id, { status: newStatus }).then(function(updated) {
               lead = updated;
               if (window.VerdeToast) window.VerdeToast.success('Stage updated to ' + newStatus);
               if (newStatus === 'Won' && !lead.clientId) {
                 window.convertLead(lead.id);
                 closeModal();
               } else {
                 renderModal(false);
                 initCRM();
                 if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
               }
            });
          });
        }
        
        var convertBtn = overlay.querySelector('#btn-convert-client');
        if (convertBtn) {
          convertBtn.addEventListener('click', function() {
            window.convertLead(lead.id);
            closeModal();
          });
        }
        
        var editBtn = overlay.querySelector('#btn-edit-mode');
        if (editBtn) editBtn.addEventListener('click', function() { renderModal(true); });

        var deleteBtn = overlay.querySelector('#btn-delete-lead');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function() {
            if (window.VerdeModal && window.VerdeModal.delete) {
              window.VerdeModal.delete(
                'Delete Lead?',
                'This lead will be moved to Deleted Leads and can be restored later.',
                function() {
                  var acts = lead.activities || [];
                  acts.push({ id: 'ACT-' + Date.now(), action: 'Lead Deleted', details: 'Lead moved to Deleted status', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
                  window.VerdeServices.Crm.updateLead(lead.id, { lifecycle: 'Deleted', activities: acts }).then(function() {
                    if (window.VerdeToast) window.VerdeToast.success('Lead Deleted');
                    closeModal();
                    initCRM();
                    if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
                  });
                }
              );
            } else {
              if (confirm('Delete Lead?')) {
                var acts = lead.activities || [];
                acts.push({ id: 'ACT-' + Date.now(), action: 'Lead Deleted', details: 'Lead moved to Deleted status', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
                window.VerdeServices.Crm.updateLead(lead.id, { lifecycle: 'Deleted', activities: acts }).then(function() {
                  if (window.VerdeToast) window.VerdeToast.success('Lead Deleted');
                  closeModal();
                  initCRM();
                  if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
                });
              }
            }
          });
        }

        var archiveBtn = overlay.querySelector('#btn-archive-lead');
        if (archiveBtn) {
          archiveBtn.addEventListener('click', function() {
            var acts = lead.activities || [];
            acts.push({ id: 'ACT-' + Date.now(), action: 'Lead Archived', details: 'Lead archived', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
            window.VerdeServices.Crm.updateLead(lead.id, { lifecycle: 'Archived', activities: acts }).then(function() {
              if (window.VerdeToast) window.VerdeToast.success('Lead Archived');
              closeModal();
              initCRM();
              if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
            });
          });
        }

        var restoreBtn = overlay.querySelector('#btn-restore-lead');
        if (restoreBtn) {
          restoreBtn.addEventListener('click', function() {
            var acts = lead.activities || [];
            acts.push({ id: 'ACT-' + Date.now(), action: 'Lead Restored', details: 'Lead restored to active', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
            window.VerdeServices.Crm.updateLead(lead.id, { lifecycle: 'Active', activities: acts }).then(function() {
              if (window.VerdeToast) window.VerdeToast.success('Lead Restored');
              closeModal();
              initCRM();
              if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
            });
          });
        }
        
        var createMeetingBtn = overlay.querySelector('#btn-create-meeting');
        if (createMeetingBtn) {
          createMeetingBtn.addEventListener('click', function() {
            var meetingHtml = 
              '<div style="display:flex; flex-direction:column; gap:12px;">' +
                '<input type="date" id="mtg-date" class="form-input" />' +
                '<input type="time" id="mtg-time" class="form-input" />' +
                '<input type="text" id="mtg-notes" class="form-input" placeholder="Meeting purpose" />' +
              '</div>';
            window.VerdeModal.create('Schedule Meeting', meetingHtml, function() {
               var date = document.getElementById('mtg-date').value;
               var time = document.getElementById('mtg-time').value;
               var notes = document.getElementById('mtg-notes').value;
               if (!date || !time) return;
               var m = { id: 'MTG-' + Date.now(), date: date, time: time, notes: notes, status: 'Scheduled' };
               var meetings = lead.meetings || [];
               meetings.push(m);
               
               var activities = lead.activities || [];
               activities.push({ id: 'ACT-' + Date.now(), action: 'Meeting Scheduled', details: notes + ' on ' + date, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
               
               window.VerdeServices.Crm.updateLead(lead.id, { meetings: meetings, activities: activities }).then(function(updated) {
                 lead = updated;
                 if (window.VerdeToast) window.VerdeToast.success('Meeting scheduled.');
                 renderModal(false);
               });
            });
          });
        }
        
        var createProposalBtn = overlay.querySelector('#btn-create-proposal');
        if (createProposalBtn) {
          createProposalBtn.addEventListener('click', function() {
            var propHtml = 
              '<div style="display:flex; flex-direction:column; gap:12px;">' +
                '<input type="number" id="prop-val" class="form-input" placeholder="Proposal Value (₹)" />' +
              '</div>';
            window.VerdeModal.create('Send Proposal', propHtml, function() {
               var pval = document.getElementById('prop-val').value;
               if (!pval) return;
               var p = { id: 'PROP-' + Date.now(), number: 'PRP-' + Math.floor(1000 + Math.random() * 9000), date: new Date().toISOString(), value: pval, status: 'Sent' };
               var proposals = lead.proposals || [];
               proposals.push(p);
               
               var activities = lead.activities || [];
               activities.push({ id: 'ACT-' + Date.now(), action: 'Proposal Sent', details: 'Value: ₹' + pval, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
               
               window.VerdeServices.Crm.updateLead(lead.id, { proposals: proposals, activities: activities }).then(function(updated) {
                 lead = updated;
                 if (window.VerdeToast) window.VerdeToast.success('Proposal Sent.');
                 renderModal(false);
               });
            });
          });
        }
        
        var addNoteBtn = overlay.querySelector('#btn-add-note');
        if (addNoteBtn) {
          addNoteBtn.addEventListener('click', function() {
            var noteHtml = 
              '<div style="display:flex; flex-direction:column; gap:12px;">' +
                '<textarea id="note-text" class="form-input" rows="4" placeholder="Enter internal note..."></textarea>' +
              '</div>';
            window.VerdeModal.create('Add Internal Note', noteHtml, function() {
               var text = document.getElementById('note-text').value;
               if (!text) return;
               var n = { id: 'NOTE-' + Date.now(), text: text, author: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() };
               var notes = lead.notes || [];
               notes.push(n);
               
               window.VerdeServices.Crm.updateLead(lead.id, { notes: notes }).then(function(updated) {
                 lead = updated;
                 if (window.VerdeToast) window.VerdeToast.success('Note Added.');
                 renderModal(false);
               });
            });
          });
        }
        
        var mtgActionBtns = overlay.querySelectorAll('.btn-mtg-action');
        mtgActionBtns.forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            var mid = btn.getAttribute('data-id');
            var action = btn.getAttribute('data-action');
            var meetings = lead.meetings || [];
            var mtg = meetings.find(function(m) { return m.id === mid; });
            if (mtg) {
              mtg.status = action;
              var activities = lead.activities || [];
              activities.push({ id: 'ACT-' + Date.now(), action: 'Meeting ' + action, details: mtg.notes, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
              window.VerdeServices.Crm.updateLead(lead.id, { meetings: meetings, activities: activities }).then(function(updated) {
                lead = updated;
                if (window.VerdeToast) window.VerdeToast.success('Meeting ' + action);
                renderModal(false);
              });
            }
          });
        });
      } else {
        overlay.querySelector('#btn-cancel-edit').addEventListener('click', function() { renderModal(false); });
        overlay.querySelector('#btn-save-edit').addEventListener('click', function() {
          var name = document.getElementById('edit-lead-name').value;
          var company = document.getElementById('edit-lead-company').value;
          var contact = document.getElementById('edit-lead-contact').value;
          var email = document.getElementById('edit-lead-email').value;
          var phone = document.getElementById('edit-lead-phone').value;
          var source = document.getElementById('edit-lead-source').value;
          var priority = document.getElementById('edit-lead-priority').value;
          var assignedTo = document.getElementById('edit-lead-assigned').value;
          var value = document.getElementById('edit-lead-value').value;
          
          var activities = lead.activities || [];
          activities.push({ id: 'ACT-' + Date.now(), action: 'Lead Updated', details: 'Details modified.', user: 'System', date: new Date().toISOString() });

          var data = {
            name: name, company: company, contactPerson: contact,
            email: email, phone: phone, source: source, priority: priority,
            assignedTo: assignedTo, value: parseFloat(value || 0), activities: activities
          };
          window.VerdeServices.Crm.updateLead(lead.id, data).then(function(updated) {
            lead = updated;
            if (window.VerdeToast) window.VerdeToast.success('Lead Updated Successfully');
            renderModal(false);
            initCRM();
          });
        });
      }
    }
    
    function closeModal() {
      overlay.classList.remove('active');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }
    
    document.body.appendChild(overlay);
    renderModal(false);
  };

  window.showCreateClientModal = function() {
    var formHtml = 
      '<div style="display:flex; flex-direction:column; gap:16px;">' +
        '<input type="text" id="new-client-company" class="form-input" placeholder="Company Name" />' +
        '<input type="text" id="new-client-contact" class="form-input" placeholder="Primary Contact Person" />' +
      '</div>';
      
    if (window.VerdeModal) {
      window.VerdeModal.create('New Client', formHtml, function() {
        var company = document.getElementById('new-client-company').value;
        var contact = document.getElementById('new-client-contact').value;
        if (!company) return;
        window.VerdeServices.Crm.createClient({
          company: company,
          contactPerson: contact,
          status: 'Active'
        }).then(function() {
          if (window.VerdeToast) window.VerdeToast.success('Client Created');
          initCRM();
        });
      });
    }
  };

  window.showClientDetails = function(clientId) {
    var client = currentClients.find(function(c) { return c.id === clientId; });
    if (!client) return;

    window.VerdeServices.Projects.getProjects().then(function(allProjects) {
      var clientProjects = allProjects.filter(function(p) { 
        return p.clientId === client.id || p.client === client.company || p.client === client.contactPerson; 
      });

      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';

      var infoHtml = 
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Contact Person</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + client.contactPerson + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Email</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + client.email + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Phone</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + client.phone + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Total Revenue</div>' +
            '<div style="font-size:14px; color:var(--text-1); font-weight:700;">₹' + (client.revenue || 0) + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Industry</div>' +
            '<div style="font-size:14px; color:var(--text-1);">' + client.industry + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px; color:var(--text-3); font-weight:600;">Status</div>' +
            '<div style="font-size:14px; color:var(--text-1);"><span class="badge badge-success">' + client.status + '</span></div>' +
          '</div>' +
        '</div>';

      var projHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1);">Project History</h4>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2);">';
      if (clientProjects.length === 0) projHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No projects yet</div>';
      else {
        clientProjects.forEach(function(p) {
          projHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + p.name + '</div>' +
            '<div style="font-size:12px; color:var(--text-3);">' + p.category + ' &middot; Due ' + new Date(p.dueDate).toLocaleDateString() + '</div></div>' +
            '<div><span class="badge badge-neutral">' + p.status + '</span></div>' +
          '</div>';
        });
      }
      projHtml += '</div></div>';

      var meetingsHtml = '<div style="margin-top:24px;">' +
        '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:8px;">Meeting History</h4>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2); max-height:150px; overflow-y:auto;">';
      var meetingsList = client.meetings || [];
      if (meetingsList.length === 0) meetingsHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No meetings</div>';
      else {
        meetingsList.forEach(function(m) {
          var bg = m.status === 'Scheduled' ? 'var(--warning-10)' : (m.status === 'Completed' ? 'var(--success-10)' : 'var(--bg-3)');
          var col = m.status === 'Scheduled' ? 'var(--warning)' : (m.status === 'Completed' ? 'var(--success)' : 'var(--text-3)');
          meetingsHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + new Date(m.date).toLocaleDateString() + ' at ' + m.time + '</div>' +
            '<div style="font-size:12px; color:var(--text-3);">' + m.notes + '</div></div>' +
            '<div><span class="badge" style="background:'+bg+'; color:'+col+';">' + m.status + '</span></div>' +
          '</div>';
        });
      }
      meetingsHtml += '</div></div>';

      var notesHtml = '<div style="margin-top:24px;">' +
        '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:8px;">Internal Notes</h4>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2); max-height:150px; overflow-y:auto;">';
      var notesList = client.notes || [];
      if (notesList.length === 0) notesHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No notes</div>';
      else {
        var sortedNotes = notesList.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        sortedNotes.forEach(function(n) {
          notesHtml += '<div style="padding:8px; border-bottom:1px solid var(--border);">' +
            '<div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-3); margin-bottom:4px;"><span>' + n.author + '</span><span>' + new Date(n.date).toLocaleString() + '</span></div>' +
            '<div style="font-size:13px;">' + n.text + '</div>' +
          '</div>';
        });
      }
      notesHtml += '</div></div>';

      var timelineHtml = '<div style="margin-top:24px;">' +
        '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin-bottom:8px;">Activity Timeline</h4>' +
        '<div style="max-height:150px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; padding:12px; background:var(--bg-2);">';
      var acts = client.activities || [];
      if (acts.length === 0) timelineHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center;">No activity yet.</div>';
      else {
        var sortedActs = acts.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
        sortedActs.forEach(function(a) {
          timelineHtml += '<div style="margin-bottom:8px; font-size:12px; display:flex; justify-content:space-between;">' +
            '<div><span style="font-weight:700;">' + a.action + '</span> <span style="color:var(--text-3);">' + a.details + '</span></div>' +
            '<div style="color:var(--text-3); text-align:right; min-width:70px;">' + new Date(a.date).toLocaleDateString() + '</div>' +
          '</div>';
        });
      }
      timelineHtml += '</div></div>';

      var html = 
        '<div class="modal-content" style="max-width:700px; max-height:90vh; overflow-y:auto;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
            '<h3 style="font-size:20px; font-weight:800; color:var(--text-1); margin:0;">Client: ' + client.company + '</h3>' +
            '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
          '</div>' +
          infoHtml + projHtml + meetingsHtml + notesHtml + timelineHtml +
          '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">' +
            '<button id="btn-create-project" class="btn btn-sm btn-primary">Create Project</button>' +
          '</div>' +
        '</div>';
      
      overlay.innerHTML = html;
      
      overlay.querySelector('.modal-close-btn').addEventListener('click', function() {
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
      });
      
      overlay.querySelector('#btn-create-project').addEventListener('click', function() {
        sessionStorage.setItem('verde_prefill_project', JSON.stringify({
          clientId: client.id,
          client: client.contactPerson,
          company: client.company,
          email: client.email,
          phone: client.phone
        }));
        window.location.href = '../create-project/index.html';
      });
      
      document.body.appendChild(overlay);
    });
  };

  function setupTabs() {
    var tabs = document.querySelectorAll('.crm-tab');
    var contents = document.querySelectorAll('.crm-tab-content');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--text-3)';
          t.style.fontWeight = '600';
        });
        tab.classList.add('active');
        tab.style.borderBottomColor = 'var(--primary)';
        tab.style.color = 'var(--text-1)';
        tab.style.fontWeight = '800';

        var targetId = tab.getAttribute('data-target');
        contents.forEach(function(c) {
          if (c.id === targetId) c.style.display = 'block';
          else c.style.display = 'none';
        });
      });
    });
  }

  window.editClient = function(clientId) {
    var client = currentClients.find(function(c) { return c.id === clientId; });
    if (!client) return;

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    var formHtml = 
      '<div class="modal-content" style="max-width:600px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="font-size:18px; font-weight:800; color:var(--text-1); margin:0;">Edit Client</h3>' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
        '</div>' +
        '<div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">' +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Company *</label><input type="text" id="edit-client-company" class="form-input" value="' + (client.company || '') + '" /></div>' +
            '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Contact Person *</label><input type="text" id="edit-client-contact" class="form-input" value="' + (client.contactPerson || '') + '" /></div>' +
          '</div>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">' +
            '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Email</label><input type="email" id="edit-client-email" class="form-input" value="' + (client.email || '') + '" /></div>' +
            '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Phone</label><input type="text" id="edit-client-phone" class="form-input" value="' + (client.phone || '') + '" /></div>' +
            '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Revenue (₹)</label><input type="number" id="edit-client-revenue" class="form-input" value="' + (client.revenue || 0) + '" /></div>' +
          '</div>' +
          '<div><label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Industry</label><input type="text" id="edit-client-industry" class="form-input" value="' + (client.industry || '') + '" /></div>' +
        '</div>' +
        '<div style="display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">Cancel</button>' +
          '<button id="btn-save-client" class="btn btn-primary btn-sm">Save Changes</button>' +
        '</div>' +
      '</div>';
    
    overlay.innerHTML = formHtml;
    
    var closeBtns = overlay.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
      });
    });

    overlay.querySelector('#btn-save-client').addEventListener('click', function() {
      var company = document.getElementById('edit-client-company').value;
      var contact = document.getElementById('edit-client-contact').value;
      if (!company || !contact) return;

      var activities = client.activities || [];
      activities.push({ id: 'ACT-' + Date.now(), action: 'Client Updated', details: 'Profile modified', user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });

      window.VerdeServices.Crm.updateClient(client.id, {
        company: company,
        contactPerson: contact,
        email: document.getElementById('edit-client-email').value,
        phone: document.getElementById('edit-client-phone').value,
        revenue: parseFloat(document.getElementById('edit-client-revenue').value || 0),
        industry: document.getElementById('edit-client-industry').value,
        activities: activities
      }).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Client Updated');
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        initCRM();
      });
    });

    document.body.appendChild(overlay);
  };

  window.archiveClient = function(clientId) {
    if (window.VerdeModal && window.VerdeModal.confirm) {
      window.VerdeModal.confirm({
        title: 'Archive Client',
        body: 'Are you sure you want to archive this client? They will be hidden from active lists.',
        confirmText: 'Archive',
        confirmClass: 'btn-warning',
        onConfirm: function() {
          window.VerdeServices.Crm.updateClient(clientId, { status: 'Archived' }).then(function() {
            if (window.VerdeToast) window.VerdeToast.success('Client Archived');
            initCRM();
          });
        }
      });
    } else {
      if (confirm('Archive this client?')) {
        window.VerdeServices.Crm.updateClient(clientId, { status: 'Archived' }).then(function() {
          if (window.VerdeToast) window.VerdeToast.success('Client Archived');
          initCRM();
        });
      }
    }
  };

  window.deleteClient = function(clientId) {
    if (window.VerdeModal && window.VerdeModal.delete) {
      window.VerdeModal.delete(
        'Delete this client?',
        'Are you sure you want to delete this client? This is a soft-delete and can be restored by an admin.',
        function() {
          window.VerdeServices.Crm.updateClient(clientId, { status: 'Deleted' }).then(function() {
            if (window.VerdeToast) window.VerdeToast.success('Client Deleted');
            initCRM();
            if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
          });
        }
      );
    } else {
      if (confirm('Delete this client?')) {
        window.VerdeServices.Crm.updateClient(clientId, { status: 'Deleted' }).then(function() {
          if (window.VerdeToast) window.VerdeToast.success('Client Deleted');
          initCRM();
          if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
        });
      }
    }
  };

  window.restoreClient = function(clientId) {
    window.VerdeServices.Crm.updateClient(clientId, { status: 'Active' }).then(function() {
      if (window.VerdeToast) window.VerdeToast.success('Client Restored');
      initCRM();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupTabs();
      initCRM();
    });
  } else {
    setupTabs();
    initCRM();
  }
})();