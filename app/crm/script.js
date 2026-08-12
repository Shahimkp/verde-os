/* ==========================================================================
   VERDE OS — CRM & SALES WORKSPACE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  var currentLeads = [];
  var currentClients = [];
  var currentMeetings = [];
  var currentProposals = [];
  var currentProjects = [];
  var currentEmployees = [];

  function checkCrmWritePermission() {
    if (window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can) {
      if (!window.VERDE_PERMISSIONS.can('crm_create') && 
          !window.VERDE_PERMISSIONS.can('crm_write') && 
          !window.VERDE_PERMISSIONS.can('crm_edit') &&
          !window.VERDE_PERMISSIONS.can('workspace_write')) {
        return false;
      }
    }
    if (window.VerdePermissions && window.VerdePermissions.hasPermission) {
      if (!window.VerdePermissions.hasPermission('crm.write')) {
        return false;
      }
    }
    return true;
  }

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
      window.VerdeServices.Crm.getClients(),
      window.VerdeServices.Meetings ? window.VerdeServices.Meetings.getMeetings() : Promise.resolve([]),
      window.VerdeServices.Crm.getProposals ? window.VerdeServices.Crm.getProposals() : Promise.resolve([])
    ];
    if (window.VerdeServices.Projects) promises.push(window.VerdeServices.Projects.getProjects());
    else promises.push(Promise.resolve([]));
    if (window.VerdeServices.Identity) promises.push(window.VerdeServices.Identity.resolveUsers());
    else promises.push(Promise.resolve([]));

    Promise.all(promises).then(function(results) {
      currentLeads = results[0] || [];
      currentClients = results[1] || [];
      currentMeetings = results[2] || [];
      currentProposals = results[3] || [];
      currentProjects = results[4] || [];
      currentEmployees = results[5] || [];
      
      renderKPIs();
      renderKanban();
      renderClients(currentProjects);
      renderMeetingsTab();
      renderProposalsTab();
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

    var meetingsSearch = document.getElementById('crm-meetings-search');
    if (meetingsSearch) {
      meetingsSearch.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('#crm-all-meetings-body tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(query) ? 'table-row' : 'none';
        });
      });
    }

    var meetingsFilter = document.getElementById('crm-meetings-filter');
    if (meetingsFilter) {
      meetingsFilter.addEventListener('change', function() {
        renderMeetingsTab();
      });
    }

    var proposalsSearch = document.getElementById('crm-proposals-search');
    if (proposalsSearch) {
      proposalsSearch.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('#crm-all-proposals-body tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(query) ? 'table-row' : 'none';
        });
      });
    }

    var proposalsFilter = document.getElementById('crm-proposals-filter');
    if (proposalsFilter) {
      proposalsFilter.addEventListener('change', function() {
        renderProposalsTab();
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

    var todayStr = new Date().toISOString().split('T')[0];
    var meetingsTodayCount = 0;
    
    // Count from global meetings
    currentMeetings.forEach(function(m) {
      if (m.date === todayStr && m.status !== 'Cancelled') meetingsTodayCount++;
    });

    // Also count any lead-specific meetings for today that might not be in global
    currentLeads.forEach(function(l) {
      (l.meetings || []).forEach(function(m) {
        if (m.date === todayStr && m.status !== 'Cancelled' && !currentMeetings.some(function(gm) { return gm.id === m.id; })) {
          meetingsTodayCount++;
        }
      });
    });

    var kpiCards = document.querySelectorAll('.crm-kpi-value');
    if (kpiCards.length >= 5) {
      kpiCards[0].textContent = totalLeads;
      kpiCards[1].textContent = activeClients;
      kpiCards[2].textContent = dealsInProgress;
      kpiCards[3].textContent = '₹' + (pipelineValue / 100000).toFixed(1) + 'L';
      kpiCards[4].textContent = meetingsTodayCount;
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
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied: You do not have permission to update leads.');
      return;
    }
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
      if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
    });
  }

  window.convertLead = function(leadId) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied: You do not have permission to convert leads.');
      return;
    }
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
        '<td><div style="font-weight:600; color:var(--text-2);">₹' + (c.revenue || 0).toLocaleString('en-IN') + '</div><div class="td-sub">' + projText + ' Projects</div></td>' +
        '<td><span class="badge ' + badgeClass + '">' + c.status + '</span></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + lastActivityDate + '</div></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + (window.VERDE_SESSION ? window.VERDE_SESSION.getUser().name : 'Unassigned') + '</div></td>' +
        '<td style="text-align:right;">' +
          '<div style="display:flex; gap:8px; justify-content:flex-end;">' + actionButtons + '</div>' +
        '</td>' +
      '</tr>';
      tbody.innerHTML += html;
    });
  }

  function renderMeetingsTab() {
    // 1. Overview table on Leads tab
    var todayTbody = document.getElementById('crm-today-meetings-body');
    var allTbody = document.getElementById('crm-all-meetings-body');
    
    var todayStr = new Date().toISOString().split('T')[0];
    
    // Aggregate all meetings
    var combinedMeetings = [];
    currentMeetings.forEach(function(m) {
      if (!m.isDeleted) combinedMeetings.push(m);
    });
    
    currentLeads.forEach(function(l) {
      (l.meetings || []).forEach(function(m) {
        if (!combinedMeetings.some(function(cm) { return cm.id === m.id; })) {
          combinedMeetings.push({
            id: m.id,
            title: m.notes || m.purpose || ('Sync with ' + (l.company || l.name)),
            purpose: m.notes || m.purpose || 'Lead Consultation',
            client: l.company || l.name,
            date: m.date,
            time: m.time,
            duration: m.duration || '30 min',
            owner: m.owner || l.assignedTo || 'Shahim',
            status: m.status || 'Scheduled',
            leadId: l.id
          });
        }
      });
    });

    combinedMeetings.sort(function(a, b) {
      var dateA = new Date((a.date || todayStr) + 'T' + (a.time ? a.time.replace(/ AM| PM/, '') : '00:00'));
      var dateB = new Date((b.date || todayStr) + 'T' + (b.time ? b.time.replace(/ AM| PM/, '') : '00:00'));
      return dateA - dateB;
    });

    if (todayTbody) {
      todayTbody.innerHTML = '';
      var todayMtgs = combinedMeetings.filter(function(m) { return m.date === todayStr; });
      if (todayMtgs.length === 0) {
        todayTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-3); font-size:12px;">No meetings scheduled for today.</td></tr>';
      } else {
        todayMtgs.forEach(function(m) {
          var badgeClass = m.status === 'Completed' ? 'badge-success' : (m.status === 'Cancelled' ? 'badge-neutral' : 'badge-warning');
          var html = '<tr>' +
            '<td><div style="font-weight:700; color:var(--text-1);">' + (m.title || m.purpose || 'Meeting') + '</div><div class="td-sub">' + (m.client || 'Internal') + '</div></td>' +
            '<td><div style="font-size:13px; font-weight:600; color:var(--text-1);">' + (m.time || '10:00 AM') + '</div><div class="td-sub">' + (m.duration || '30 min') + '</div></td>' +
            '<td><div style="font-size:13px; color:var(--text-2);">' + (m.owner || 'Shahim') + '</div></td>' +
            '<td style="text-align:right;"><span class="badge ' + badgeClass + '">' + (m.status || 'Scheduled') + '</span></td>' +
          '</tr>';
          todayTbody.innerHTML += html;
        });
      }
    }

    if (allTbody) {
      allTbody.innerHTML = '';
      var filterEl = document.getElementById('crm-meetings-filter');
      var filterVal = filterEl ? filterEl.value : 'all';

      var filtered = combinedMeetings.filter(function(m) {
        if (filterVal === 'today') return m.date === todayStr;
        if (filterVal === 'upcoming') return m.date >= todayStr && m.status !== 'Completed' && m.status !== 'Cancelled';
        if (filterVal === 'completed') return m.status === 'Completed';
        return true;
      });

      if (filtered.length === 0) {
        allTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-3);">No meetings match this filter.</td></tr>';
      } else {
        filtered.forEach(function(m) {
          var badgeClass = m.status === 'Completed' ? 'badge-success' : (m.status === 'Cancelled' ? 'badge-neutral' : 'badge-warning');
          var dateFormatted = m.date ? new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
          
          var actionBtns = '';
          if (m.status !== 'Completed' && m.status !== 'Cancelled') {
            actionBtns += '<button class="btn btn-ghost btn-sm" style="color:var(--success);" onclick="window.completeMeeting(\'' + m.id + '\')">Complete</button>';
            actionBtns += '<button class="btn btn-ghost btn-sm" style="color:var(--warning);" onclick="window.cancelMeeting(\'' + m.id + '\')">Cancel</button>';
          }
          actionBtns += '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window.deleteMeetingAction(\'' + m.id + '\')">Delete</button>';

          var html = '<tr>' +
            '<td><div style="font-weight:700; color:var(--text-1);">' + (m.title || m.purpose || 'Meeting') + '</div><div class="td-sub">' + (m.notes || 'No agenda specified') + '</div></td>' +
            '<td><div style="font-weight:600; color:var(--text-1);">' + (m.client || 'Internal') + '</div></td>' +
            '<td><div style="font-size:13px; font-weight:600; color:var(--text-1);">' + dateFormatted + '</div><div class="td-sub">' + (m.time || '10:00 AM') + '</div></td>' +
            '<td><div style="font-size:13px; color:var(--text-2);">' + (m.duration || '30 min') + '</div></td>' +
            '<td><div style="font-size:13px; color:var(--text-2);">' + (m.owner || 'Shahim') + '</div></td>' +
            '<td><span class="badge ' + badgeClass + '">' + (m.status || 'Scheduled') + '</span></td>' +
            '<td style="text-align:right;"><div style="display:flex; gap:6px; justify-content:flex-end;">' + actionBtns + '</div></td>' +
          '</tr>';
          allTbody.innerHTML += html;
        });
      }
    }
  }

  window.completeMeeting = function(id) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    if (window.VerdeServices.Meetings) {
      window.VerdeServices.Meetings.updateMeeting(id, { status: 'Completed' }).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Meeting marked as Completed');
        initCRM();
        if (window.syncMeetings) window.syncMeetings();
      });
    }
  };

  window.cancelMeeting = function(id) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    if (window.VerdeServices.Meetings) {
      window.VerdeServices.Meetings.updateMeeting(id, { status: 'Cancelled' }).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Meeting cancelled');
        initCRM();
        if (window.syncMeetings) window.syncMeetings();
      });
    }
  };

  window.deleteMeetingAction = function(id) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    if (window.VerdeServices.Meetings) {
      window.VerdeServices.Meetings.deleteMeeting(id).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Meeting deleted');
        initCRM();
        if (window.syncMeetings) window.syncMeetings();
      });
    }
  };

  function renderProposalsTab() {
    var tbody = document.getElementById('crm-all-proposals-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    var filterEl = document.getElementById('crm-proposals-filter');
    var filterVal = filterEl ? filterEl.value : 'all';

    // Aggregate from proposals storage and lead proposals
    var combinedProposals = [];
    currentProposals.forEach(function(p) {
      if (!p.isDeleted) combinedProposals.push(p);
    });

    currentLeads.forEach(function(l) {
      (l.proposals || []).forEach(function(p) {
        if (!combinedProposals.some(function(cp) { return cp.id === p.id; })) {
          combinedProposals.push({
            id: p.id,
            title: p.title || ('Proposal for ' + (l.company || l.name)),
            client: l.company || l.name,
            value: parseFloat(p.value || 0),
            validUntil: p.validUntil || '',
            assignedTo: l.assignedTo || 'Shahim',
            status: p.status || 'Sent',
            notes: p.notes || '',
            leadId: l.id
          });
        }
      });
    });

    var filtered = combinedProposals.filter(function(p) {
      if (filterVal !== 'all' && p.status !== filterVal) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-3);">No proposals found.</td></tr>';
      return;
    }

    filtered.forEach(function(p) {
      var badgeClass = p.status === 'Accepted' ? 'badge-success' : (p.status === 'Sent' ? 'badge-warning' : (p.status === 'Under Review' ? 'badge-primary' : 'badge-neutral'));
      var validUntilFormatted = p.validUntil ? new Date(p.validUntil).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '30 Days';

      var actionBtns = '';
      if (p.status !== 'Accepted') {
        actionBtns += '<button class="btn btn-ghost btn-sm" style="color:var(--success);" onclick="window.acceptProposalAction(\'' + p.id + '\')">Accept</button>';
      }
      actionBtns += '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="window.deleteProposalAction(\'' + p.id + '\')">Delete</button>';

      var html = '<tr>' +
        '<td><div style="font-weight:700; color:var(--text-1);">' + (p.title || 'Proposal') + '</div><div class="td-sub">' + (p.notes || 'Commercial Proposal') + '</div></td>' +
        '<td><div style="font-weight:600; color:var(--text-1);">' + (p.client || 'Unknown') + '</div></td>' +
        '<td><div style="font-weight:700; color:var(--text-1);">₹' + (parseFloat(p.value || 0)).toLocaleString('en-IN') + '</div></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + validUntilFormatted + '</div></td>' +
        '<td><div style="font-size:13px; color:var(--text-2);">' + (p.assignedTo || 'Shahim') + '</div></td>' +
        '<td><span class="badge ' + badgeClass + '">' + (p.status || 'Sent') + '</span></td>' +
        '<td style="text-align:right;"><div style="display:flex; gap:6px; justify-content:flex-end;">' + actionBtns + '</div></td>' +
      '</tr>';
      tbody.innerHTML += html;
    });
  }

  window.acceptProposalAction = function(id) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    if (window.VerdeServices.Crm && window.VerdeServices.Crm.updateProposal) {
      window.VerdeServices.Crm.updateProposal(id, { status: 'Accepted' }).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Proposal marked as Accepted');
        initCRM();
        if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
      });
    }
  };

  window.deleteProposalAction = function(id) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    if (window.VerdeServices.Crm && window.VerdeServices.Crm.deleteProposal) {
      window.VerdeServices.Crm.deleteProposal(id).then(function() {
        if (window.VerdeToast) window.VerdeToast.success('Proposal deleted');
        initCRM();
      });
    }
  };

  function renderActivityFeed() {
    var feedList = document.getElementById('crm-activity-feed-list');
    var fullFeed = document.getElementById('crm-full-activity-feed');
    
    var allActivities = [];
    currentLeads.forEach(function(l) {
      (l.activities || []).forEach(function(a) { 
        allActivities.push({
          action: a.action || 'Lead Event',
          details: (a.details || '') + ' (' + (l.company || l.name) + ')',
          date: a.date || new Date().toISOString(),
          user: a.user || 'System'
        }); 
      });
    });
    currentClients.forEach(function(c) {
      (c.activities || []).forEach(function(a) { 
        allActivities.push({
          action: a.action || 'Client Event',
          details: (a.details || '') + ' (' + (c.company || c.contactPerson) + ')',
          date: a.date || new Date().toISOString(),
          user: a.user || 'System'
        }); 
      });
    });
    
    allActivities.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    
    if (feedList) {
      feedList.innerHTML = '';
      if (allActivities.length === 0) {
        feedList.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-3); font-size:12px;">No activity logged yet.</div>';
      } else {
        allActivities.slice(0, 8).forEach(function(a) {
          var dateStr = new Date(a.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
          var html = '<div class="crm-activity-item">' +
            '<div class="crm-activity-content">' +
              '<div class="crm-activity-icon" style="color:var(--primary);">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<circle cx="12" cy="12" r="10"></circle>' +
                '</svg>' +
              '</div>' +
              '<div class="crm-activity-text"><strong>' + a.action + '</strong>: ' + a.details + '</div>' +
            '</div>' +
            '<div class="crm-activity-time">' + dateStr + '</div>' +
          '</div>';
          feedList.innerHTML += html;
        });
      }
    }

    if (fullFeed) {
      fullFeed.innerHTML = '';
      if (allActivities.length === 0) {
        fullFeed.innerHTML = '<div style="padding:24px; text-align:center; color:var(--text-3);">No CRM activity records available.</div>';
      } else {
        allActivities.forEach(function(a) {
          var dateStr = new Date(a.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          var html = '<div class="crm-activity-item" style="border-bottom:1px solid var(--border-subtle); padding:12px 0;">' +
            '<div class="crm-activity-content">' +
              '<div class="crm-activity-icon" style="color:var(--primary);">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<circle cx="12" cy="12" r="10"></circle>' +
                '</svg>' +
              '</div>' +
              '<div>' +
                '<div class="crm-activity-text"><strong>' + a.action + '</strong>: ' + a.details + '</div>' +
                '<div style="font-size:11px; color:var(--text-3); margin-top:2px;">Logged by ' + (a.user || 'System') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="crm-activity-time">' + dateStr + '</div>' +
          '</div>';
          fullFeed.innerHTML += html;
        });
      }
    }
  }

  // ==========================================
  // 1. SCHEDULE MEETING MODAL
  // ==========================================
  window.showScheduleMeetingModal = function(prefillLeadId, prefillClientId) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied: You do not have access to schedule meetings.');
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    var clientOptionsHtml = '<option value="">-- Select Client or Lead --</option>';
    
    currentLeads.forEach(function(l) {
      if (l.lifecycle !== 'Deleted') {
        var isSel = (prefillLeadId && prefillLeadId === l.id) ? 'selected' : '';
        clientOptionsHtml += '<option value="lead:' + l.id + '" ' + isSel + '>[Lead] ' + (l.company ? l.company + ' (' + l.name + ')' : l.name) + '</option>';
      }
    });

    currentClients.forEach(function(c) {
      if (c.status !== 'Deleted') {
        var isSel = (prefillClientId && prefillClientId === c.id) ? 'selected' : '';
        clientOptionsHtml += '<option value="client:' + c.id + '" ' + isSel + '>[Client] ' + (c.company ? c.company + ' (' + c.contactPerson + ')' : c.contactPerson) + '</option>';
      }
    });

    var teamOptionsHtml = '';
    var currentUser = window.VERDE_SESSION ? window.VERDE_SESSION.getUser().name : 'Shahim';
    var teamList = currentEmployees || [];
    teamList.forEach(function(t) {
      var isSel = (t.name === currentUser) ? 'selected' : '';
      teamOptionsHtml += '<option value="' + t.name + '" ' + isSel + '>' + (t.displayName || t.name) + '</option>';
    });

    var todayStr = new Date().toISOString().split('T')[0];

    var formHtml = 
      '<div class="modal-content" style="max-width:600px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="font-size:18px; font-weight:800; color:var(--text-1); margin:0;">Schedule Meeting</h3>' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
        '</div>' +

        '<div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">' +
          
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Meeting Title / Purpose *</label>' +
            '<input type="text" id="meeting-title" class="form-input" placeholder="e.g. Discovery Call & Scope Review" />' +
            '<div id="err-meeting-title" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Meeting Title is required.</div>' +
          '</div>' +

          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Client or Lead *</label>' +
            '<select id="meeting-target" class="form-input">' + clientOptionsHtml + '</select>' +
            '<div id="err-meeting-target" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Please select a client or lead.</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Date *</label>' +
              '<input type="date" id="meeting-date" class="form-input" value="' + todayStr + '" />' +
              '<div id="err-meeting-date" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Date is required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Time *</label>' +
              '<input type="time" id="meeting-time" class="form-input" value="10:00" />' +
              '<div id="err-meeting-time" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Time is required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Duration</label>' +
              '<select id="meeting-duration" class="form-input">' +
                '<option value="15 min">15 min</option>' +
                '<option value="30 min" selected>30 min</option>' +
                '<option value="45 min">45 min</option>' +
                '<option value="1 hour">1 hour</option>' +
                '<option value="1.5 hours">1.5 hours</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Host / Owner</label>' +
              '<select id="meeting-owner" class="form-input">' + teamOptionsHtml + '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Status</label>' +
              '<select id="meeting-status" class="form-input">' +
                '<option value="Scheduled" selected>Scheduled</option>' +
                '<option value="Completed">Completed</option>' +
                '<option value="Cancelled">Cancelled</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Agenda & Notes</label>' +
            '<textarea id="meeting-notes" class="form-input" placeholder="Outline key topics to discuss..." style="min-height:80px; resize:vertical;"></textarea>' +
          '</div>' +

        '</div>' +

        '<div style="display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="modal-cancel-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">Cancel</button>' +
          '<button id="btn-save-meeting-action" class="btn btn-sm btn-primary">Schedule Meeting</button>' +
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

    overlay.querySelector('#btn-save-meeting-action').addEventListener('click', function() {
      var title = document.getElementById('meeting-title').value.trim();
      var targetVal = document.getElementById('meeting-target').value;
      var date = document.getElementById('meeting-date').value;
      var time = document.getElementById('meeting-time').value;
      var duration = document.getElementById('meeting-duration').value;
      var owner = document.getElementById('meeting-owner').value;
      var status = document.getElementById('meeting-status').value;
      var notes = document.getElementById('meeting-notes').value.trim();

      var isValid = true;
      if (!title) { document.getElementById('err-meeting-title').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-meeting-title').style.display = 'none'; }

      if (!targetVal) { document.getElementById('err-meeting-target').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-meeting-target').style.display = 'none'; }

      if (!date) { document.getElementById('err-meeting-date').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-meeting-date').style.display = 'none'; }

      if (!time) { document.getElementById('err-meeting-time').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-meeting-time').style.display = 'none'; }

      if (!isValid) return;

      var targetType = targetVal.split(':')[0];
      var targetId = targetVal.split(':')[1];
      var clientName = 'Internal';
      var leadObj = null;
      var clientObj = null;

      if (targetType === 'lead') {
        leadObj = currentLeads.find(function(l) { return l.id === targetId; });
        if (leadObj) clientName = leadObj.company || leadObj.name;
      } else if (targetType === 'client') {
        clientObj = currentClients.find(function(c) { return c.id === targetId; });
        if (clientObj) clientName = clientObj.company || clientObj.contactPerson;
      }

      var meetingData = {
        title: title,
        purpose: title,
        client: clientName,
        date: date,
        time: time,
        duration: duration,
        owner: owner,
        status: status,
        notes: notes,
        leadId: targetType === 'lead' ? targetId : null,
        clientId: targetType === 'client' ? targetId : null
      };

      window.VerdeServices.Meetings.createMeeting(meetingData).then(function(newMeeting) {
        // Also associate with lead history
        if (leadObj) {
          var meetings = leadObj.meetings || [];
          meetings.push(newMeeting);
          var activities = leadObj.activities || [];
          activities.unshift({
            id: 'ACT-' + Date.now(),
            action: 'Meeting Scheduled',
            details: title + ' with ' + clientName + ' on ' + date + ' at ' + time,
            user: owner,
            date: new Date().toISOString()
          });
          window.VerdeServices.Crm.updateLead(leadObj.id, { meetings: meetings, activities: activities });
        } else if (clientObj) {
          var cMeetings = clientObj.meetings || [];
          cMeetings.push(newMeeting);
          var cActivities = clientObj.activities || [];
          cActivities.unshift({
            id: 'ACT-' + Date.now(),
            action: 'Meeting Scheduled',
            details: title + ' on ' + date + ' at ' + time,
            user: owner,
            date: new Date().toISOString()
          });
          window.VerdeServices.Crm.updateClient(clientObj.id, { meetings: cMeetings, activities: cActivities });
        }

        if (window.VerdeToast) window.VerdeToast.success('Meeting scheduled successfully.');
        closeModal();
        initCRM();
        if (window.syncMeetings) window.syncMeetings();
      }).catch(function(err) {
        if (window.VerdeToast) window.VerdeToast.error('Failed to schedule meeting: ' + (err.message || 'Error occurred'));
      });
    });
  };

  // ==========================================
  // 2. CREATE PROPOSAL MODAL
  // ==========================================
  window.showCreateProposalModal = function(prefillLeadId, prefillClientId) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied: You do not have access to create proposals.');
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    var clientOptionsHtml = '<option value="">-- Select Client or Lead --</option>';
    var defaultVal = '';

    currentLeads.forEach(function(l) {
      if (l.lifecycle !== 'Deleted') {
        var isSel = (prefillLeadId && prefillLeadId === l.id) ? 'selected' : '';
        if (isSel) defaultVal = l.value || '';
        clientOptionsHtml += '<option value="lead:' + l.id + '" ' + isSel + ' data-val="' + (l.value || 0) + '">[Lead] ' + (l.company ? l.company + ' (' + l.name + ')' : l.name) + '</option>';
      }
    });

    currentClients.forEach(function(c) {
      if (c.status !== 'Deleted') {
        var isSel = (prefillClientId && prefillClientId === c.id) ? 'selected' : '';
        clientOptionsHtml += '<option value="client:' + c.id + '" ' + isSel + '>[Client] ' + (c.company ? c.company + ' (' + c.contactPerson + ')' : c.contactPerson) + '</option>';
      }
    });

    var teamOptionsHtml = '';
    var currentUser = window.VERDE_SESSION ? window.VERDE_SESSION.getUser().name : 'Shahim';
    var teamList = currentEmployees || [];
    teamList.forEach(function(t) {
      var isSel = (t.name === currentUser) ? 'selected' : '';
      teamOptionsHtml += '<option value="' + t.name + '" ' + isSel + '>' + (t.displayName || t.name) + '</option>';
    });

    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    var validUntilStr = futureDate.toISOString().split('T')[0];

    var formHtml = 
      '<div class="modal-content" style="max-width:600px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="font-size:18px; font-weight:800; color:var(--text-1); margin:0;">Create Proposal</h3>' +
          '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
        '</div>' +

        '<div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">' +
          
          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Proposal Title *</label>' +
            '<input type="text" id="prop-title" class="form-input" placeholder="e.g. Enterprise Cloud ERP Implementation" />' +
            '<div id="err-prop-title" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Proposal Title is required.</div>' +
          '</div>' +

          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Client or Lead *</label>' +
            '<select id="prop-target" class="form-input">' + clientOptionsHtml + '</select>' +
            '<div id="err-prop-target" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Please select a client or lead.</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Proposal Value (₹) *</label>' +
              '<input type="number" id="prop-val" class="form-input" placeholder="e.g. 1500000" value="' + defaultVal + '" />' +
              '<div id="err-prop-val" style="color:var(--danger); font-size:11px; margin-top:4px; display:none;">Valid Proposal Value is required.</div>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Valid Until</label>' +
              '<input type="date" id="prop-valid-until" class="form-input" value="' + validUntilStr + '" />' +
            '</div>' +
          '</div>' +

          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Prepared By</label>' +
              '<select id="prop-assigned" class="form-input">' + teamOptionsHtml + '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Status / Stage</label>' +
              '<select id="prop-status" class="form-input">' +
                '<option value="Sent" selected>Sent</option>' +
                '<option value="Draft">Draft</option>' +
                '<option value="Under Review">Under Review</option>' +
                '<option value="Accepted">Accepted</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Scope & Deliverables</label>' +
            '<textarea id="prop-notes" class="form-input" placeholder="Summarize proposal scope and deliverables..." style="min-height:80px; resize:vertical;"></textarea>' +
          '</div>' +

        '</div>' +

        '<div style="display:flex; justify-content:flex-end; gap:12px;">' +
          '<button class="modal-cancel-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">Cancel</button>' +
          '<button id="btn-save-proposal-action" class="btn btn-sm btn-primary">Create Proposal</button>' +
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

    // Auto update value if lead changes
    var targetSelect = overlay.querySelector('#prop-target');
    targetSelect.addEventListener('change', function() {
      var opt = targetSelect.options[targetSelect.selectedIndex];
      var v = opt ? opt.getAttribute('data-val') : '';
      if (v && !document.getElementById('prop-val').value) {
        document.getElementById('prop-val').value = v;
      }
    });

    overlay.querySelector('#btn-save-proposal-action').addEventListener('click', function() {
      var title = document.getElementById('prop-title').value.trim();
      var targetVal = document.getElementById('prop-target').value;
      var val = document.getElementById('prop-val').value;
      var validUntil = document.getElementById('prop-valid-until').value;
      var assignedTo = document.getElementById('prop-assigned').value;
      var status = document.getElementById('prop-status').value;
      var notes = document.getElementById('prop-notes').value.trim();

      var isValid = true;
      if (!title) { document.getElementById('err-prop-title').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-prop-title').style.display = 'none'; }

      if (!targetVal) { document.getElementById('err-prop-target').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-prop-target').style.display = 'none'; }

      if (!val || parseFloat(val) < 0) { document.getElementById('err-prop-val').style.display = 'block'; isValid = false; }
      else { document.getElementById('err-prop-val').style.display = 'none'; }

      if (!isValid) return;

      var targetType = targetVal.split(':')[0];
      var targetId = targetVal.split(':')[1];
      var clientName = 'Unknown';
      var leadObj = null;
      var clientObj = null;

      if (targetType === 'lead') {
        leadObj = currentLeads.find(function(l) { return l.id === targetId; });
        if (leadObj) clientName = leadObj.company || leadObj.name;
      } else if (targetType === 'client') {
        clientObj = currentClients.find(function(c) { return c.id === targetId; });
        if (clientObj) clientName = clientObj.company || clientObj.contactPerson;
      }

      var propData = {
        title: title,
        client: clientName,
        leadId: targetType === 'lead' ? targetId : null,
        clientId: targetType === 'client' ? targetId : null,
        value: parseFloat(val || 0),
        validUntil: validUntil,
        assignedTo: assignedTo,
        status: status,
        notes: notes
      };

      window.VerdeServices.Crm.createProposal(propData).then(function(newProposal) {
        // Also associate with lead history & advance stage if in New Lead or Qualified
        if (leadObj) {
          var proposals = leadObj.proposals || [];
          proposals.push(newProposal);
          var activities = leadObj.activities || [];
          activities.unshift({
            id: 'ACT-' + Date.now(),
            action: 'Proposal Created',
            details: title + ' — ₹' + (parseFloat(val || 0)).toLocaleString('en-IN') + ' (' + status + ')',
            user: assignedTo,
            date: new Date().toISOString()
          });
          var updateData = { proposals: proposals, activities: activities };
          if (leadObj.status === 'New Lead' || leadObj.status === 'Qualified') {
            updateData.status = 'Proposal Sent';
          }
          window.VerdeServices.Crm.updateLead(leadObj.id, updateData);
        } else if (clientObj) {
          var cProposals = clientObj.proposals || [];
          cProposals.push(newProposal);
          var cActivities = clientObj.activities || [];
          cActivities.unshift({
            id: 'ACT-' + Date.now(),
            action: 'Proposal Created',
            details: title + ' — ₹' + (parseFloat(val || 0)).toLocaleString('en-IN'),
            user: assignedTo,
            date: new Date().toISOString()
          });
          window.VerdeServices.Crm.updateClient(clientObj.id, { proposals: cProposals, activities: cActivities });
        }

        if (window.VerdeToast) window.VerdeToast.success('Proposal created successfully.');
        closeModal();
        initCRM();
        if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
      }).catch(function(err) {
        if (window.VerdeToast) window.VerdeToast.error('Failed to create proposal: ' + (err.message || 'Error occurred'));
      });
    });
  };

  // ==========================================
  // CREATE NEW LEAD MODAL
  // ==========================================
  window.showCreateLeadModal = function() {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    var teamOptionsHtml = '';
    var teamList = currentEmployees || [];
    teamList.forEach(function(t) {
      teamOptionsHtml += '<option value="' + t.name + '">' + (t.displayName || t.name) + '</option>';
    });

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
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Email</label>' +
              '<input type="email" id="new-lead-email" class="form-input" placeholder="Email Address" />' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Phone</label>' +
              '<input type="text" id="new-lead-phone" class="form-input" placeholder="Phone Number" />' +
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
                teamOptionsHtml +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:12px; font-weight:600; color:var(--text-3); margin-bottom:4px;">Expected Value (₹)</label>' +
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

    overlay.querySelector('.modal-confirm-btn').addEventListener('click', function() {
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

      if (!isValid) return;

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
        notes: notes ? [{ id: 'NOTE-' + Date.now(), text: notes, author: 'Shahim', date: new Date().toISOString() }] : []
      };

      window.VerdeServices.Crm.createLead(leadData).then(function() {
        closeModal();
        initCRM();
        if (window.syncDashboardWithCRM) window.syncDashboardWithCRM();
      });
    });
  };

  // ==========================================
  // LEAD DETAILS MODAL
  // ==========================================
  window.showLeadDetails = function(leadId) {
    var lead = currentLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';

    function renderModal(isEditMode) {
      var contentHtml = '';
      if (!isEditMode) {
        contentHtml = 
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Contact Person</div><div style="font-size:14px; color:var(--text-1);">' + (lead.contactPerson || lead.name) + '</div></div>' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Company</div><div style="font-size:14px; color:var(--text-1);">' + (lead.company || 'Unknown') + '</div></div>' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Email</div><div style="font-size:14px; color:var(--text-1);">' + (lead.email || 'No email') + '</div></div>' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Phone</div><div style="font-size:14px; color:var(--text-1);">' + (lead.phone || 'No phone') + '</div></div>' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Stage</div><div style="font-size:14px; color:var(--text-1);"><span class="badge badge-primary">' + lead.status + '</span></div></div>' +
            '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Deal Value</div><div style="font-size:14px; color:var(--text-1); font-weight:700;">₹' + (lead.value || 0).toLocaleString('en-IN') + '</div></div>' +
          '</div>';
      }

      var proposalsHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin:0;">Proposals</h4>' +
          '<button id="btn-lead-create-prop" class="btn btn-ghost btn-sm" style="color:var(--primary); font-size:12px; font-weight:600;">+ New Proposal</button>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2);">';
      var proposalsList = lead.proposals || [];
      if (proposalsList.length === 0) proposalsHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No proposals sent</div>';
      else {
        proposalsList.forEach(function(p) {
          proposalsHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + (p.title || 'Proposal') + ' — ₹' + (parseFloat(p.value || 0)).toLocaleString('en-IN') + '</div>' +
            '<div style="font-size:11px; color:var(--text-3);">' + (p.validUntil ? 'Valid until ' + p.validUntil : 'Standard') + '</div></div>' +
            '<div><span class="badge badge-warning">' + (p.status || 'Sent') + '</span></div>' +
          '</div>';
        });
      }
      proposalsHtml += '</div></div>';

      var meetingsHtml = '<div style="margin-top:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
          '<h4 style="font-size:14px; font-weight:800; color:var(--text-1); margin:0;">Meetings</h4>' +
          '<button id="btn-lead-schedule-mtg" class="btn btn-ghost btn-sm" style="color:var(--primary); font-size:12px; font-weight:600;">+ Schedule Meeting</button>' +
        '</div>' +
        '<div style="border:1px solid var(--border); border-radius:8px; padding:8px; background:var(--bg-2);">';
      var meetingsList = lead.meetings || [];
      if (meetingsList.length === 0) meetingsHtml += '<div style="font-size:12px; color:var(--text-3); text-align:center; padding:12px;">No meetings scheduled</div>';
      else {
        meetingsList.forEach(function(m) {
          meetingsHtml += '<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px; font-weight:700;">' + (m.title || m.purpose || 'Meeting') + '</div>' +
            '<div style="font-size:11px; color:var(--text-3);">' + m.date + ' at ' + m.time + ' (' + (m.duration || '30 min') + ')</div></div>' +
            '<div><span class="badge badge-warning">' + (m.status || 'Scheduled') + '</span></div>' +
          '</div>';
        });
      }
      meetingsHtml += '</div></div>';

      var html = 
        '<div class="modal-content" style="max-width:650px; max-height:90vh; overflow-y:auto;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
            '<h3 style="font-size:20px; font-weight:800; color:var(--text-1); margin:0;">Lead: ' + lead.name + '</h3>' +
            '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
          '</div>' +
          contentHtml + proposalsHtml + meetingsHtml +
          '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">' +
            '<button class="modal-close-btn btn btn-ghost btn-sm" style="border:1px solid var(--border);">Close</button>' +
          '</div>' +
        '</div>';

      overlay.innerHTML = html;

      overlay.querySelectorAll('.modal-close-btn').forEach(function(btn) {
        btn.addEventListener('click', closeModal);
      });

      var leadSchedBtn = overlay.querySelector('#btn-lead-schedule-mtg');
      if (leadSchedBtn) {
        leadSchedBtn.addEventListener('click', function() {
          closeModal();
          window.showScheduleMeetingModal(lead.id);
        });
      }

      var leadPropBtn = overlay.querySelector('#btn-lead-create-prop');
      if (leadPropBtn) {
        leadPropBtn.addEventListener('click', function() {
          closeModal();
          window.showCreateProposalModal(lead.id);
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

  // ==========================================
  // CLIENT DETAILS & MODALS
  // ==========================================
  window.showCreateClientModal = function() {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    var formHtml = 
      '<div style="display:flex; flex-direction:column; gap:16px;">' +
        '<input type="text" id="new-client-company" class="form-input" placeholder="Company Name *" />' +
        '<input type="text" id="new-client-contact" class="form-input" placeholder="Primary Contact Person *" />' +
        '<input type="email" id="new-client-email" class="form-input" placeholder="Email Address" />' +
        '<input type="text" id="new-client-phone" class="form-input" placeholder="Phone Number" />' +
        '<input type="text" id="new-client-industry" class="form-input" placeholder="Industry (e.g. Technology)" />' +
      '</div>';
      
    if (window.VerdeModal) {
      window.VerdeModal.create('New Client', formHtml, function() {
        var company = document.getElementById('new-client-company').value.trim();
        var contact = document.getElementById('new-client-contact').value.trim();
        var email = document.getElementById('new-client-email').value.trim();
        var phone = document.getElementById('new-client-phone').value.trim();
        var industry = document.getElementById('new-client-industry').value.trim();
        if (!company || !contact) {
          if (window.VerdeToast) window.VerdeToast.error('Company and Contact Person are required.');
          return;
        }
        window.VerdeServices.Crm.createClient({
          company: company,
          contactPerson: contact,
          email: email,
          phone: phone,
          industry: industry || 'Other',
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
          '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Contact Person</div><div style="font-size:14px; color:var(--text-1);">' + client.contactPerson + '</div></div>' +
          '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Email</div><div style="font-size:14px; color:var(--text-1);">' + (client.email || 'No email') + '</div></div>' +
          '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Phone</div><div style="font-size:14px; color:var(--text-1);">' + (client.phone || 'No phone') + '</div></div>' +
          '<div><div style="font-size:12px; color:var(--text-3); font-weight:600;">Total Revenue</div><div style="font-size:14px; color:var(--text-1); font-weight:700;">₹' + (client.revenue || 0).toLocaleString('en-IN') + '</div></div>' +
        '</div>';

      var html = 
        '<div class="modal-content" style="max-width:700px; max-height:90vh; overflow-y:auto;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
            '<h3 style="font-size:20px; font-weight:800; color:var(--text-1); margin:0;">Client: ' + client.company + '</h3>' +
            '<button class="modal-close-btn btn btn-ghost btn-sm" style="font-size:16px;">✕</button>' +
          '</div>' +
          infoHtml +
          '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">' +
            '<button id="btn-client-sched" class="btn btn-sm btn-ghost" style="border:1px solid var(--primary); color:var(--primary);">Schedule Meeting</button>' +
            '<button id="btn-client-prop" class="btn btn-sm btn-ghost" style="border:1px solid var(--warning); color:var(--warning);">Create Proposal</button>' +
          '</div>' +
        '</div>';
      
      overlay.innerHTML = html;
      
      overlay.querySelector('.modal-close-btn').addEventListener('click', function() {
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
      });

      overlay.querySelector('#btn-client-sched').addEventListener('click', function() {
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        window.showScheduleMeetingModal(null, client.id);
      });

      overlay.querySelector('#btn-client-prop').addEventListener('click', function() {
        overlay.classList.remove('active');
        setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        window.showCreateProposalModal(null, client.id);
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

        if (targetId === 'tab-meetings') renderMeetingsTab();
        if (targetId === 'tab-proposals') renderProposalsTab();
        if (targetId === 'tab-activity') renderActivityFeed();
      });
    });
  }

  window.editClient = function(clientId) {
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
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
      var company = document.getElementById('edit-client-company').value.trim();
      var contact = document.getElementById('edit-client-contact').value.trim();
      if (!company || !contact) return;

      var activities = client.activities || [];
      activities.unshift({ id: 'ACT-' + Date.now(), action: 'Client Updated', details: 'Profile modified', user: window.VERDE_SESSION ? window.VERDE_SESSION.getUser().name : 'System', date: new Date().toISOString() });

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
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
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
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
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
    if (!checkCrmWritePermission()) {
      if (window.VerdeToast) window.VerdeToast.error('Permission denied.');
      return;
    }
    window.VerdeServices.Crm.updateClient(clientId, { status: 'Active' }).then(function() {
      if (window.VerdeToast) window.VerdeToast.success('Client Restored');
      initCRM();
    });
  };

  // Cross-module auto re-sync
  window.addEventListener('storage', function(e) {
    if (e.key === 'verde_os_crm_leads' || e.key === 'verde_os_crm_clients' || e.key === 'verde_os_meetings' || e.key === 'verde_os_crm_proposals') {
      initCRM();
    }
  });

  window.addEventListener('focus', function() {
    initCRM();
  });

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