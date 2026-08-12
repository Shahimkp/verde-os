/* ==========================================================================
   VERDE OS — 5-STEP CREATE PROJECT WIZARD CONTROLLER
   Restored Onboarding Stepper, Card Selections & REST Launch Integration
   ========================================================================== */

(function () {
  'use strict';

  var steps = [
    { id: 1, name: 'Project Details' },
    { id: 2, name: 'Project Type' },
    { id: 3, name: 'Execution Plan' },
    { id: 4, name: 'Team Assignment' },
    { id: 5, name: 'Review & Launch' }
  ];

  var currentStep = 1;
  var totalSteps = steps.length;

  var selectedType = 'Website Development';
  var selectedOwner = 'Shahim';
  var selectedTeam = [];

  // Render Stepper Header
  function renderStepper() {
    var container = document.getElementById('stepper');
    if (!container) return;
    container.innerHTML = '';

    steps.forEach(function (step, index) {
      var isDone = step.id < currentStep;
      var isActive = step.id === currentStep;
      var cls = 'step-item';
      if (isDone) cls += ' done';
      if (isActive) cls += ' active';

      var numContent = isDone
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
        : step.id;

      container.innerHTML +=
        '<div class="' + cls + '" onclick="goToStep(' + step.id + ')">' +
          '<div class="step-num">' + numContent + '</div>' +
          '<span>' + step.name + '</span>' +
        '</div>';

      if (index < totalSteps - 1) {
        container.innerHTML += '<div class="step-div"></div>';
      }
    });

    // Control Buttons
    var btnBack = document.getElementById('btnBack');
    var btnNext = document.getElementById('btnNext');
    var btnLaunch = document.getElementById('btnLaunch');

    if (btnBack) btnBack.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
    
    if (currentStep === totalSteps) {
      if (btnNext) btnNext.style.display = 'none';
      if (btnLaunch) btnLaunch.style.display = 'inline-flex';
      populateReview();
    } else {
      if (btnNext) btnNext.style.display = 'inline-flex';
      if (btnLaunch) btnLaunch.style.display = 'none';
    }

    // Toggle Active Step Panel
    document.querySelectorAll('.step-content').forEach(function (el) {
      el.classList.remove('active');
    });
    var activePanel = document.getElementById('step-' + currentStep);
    if (activePanel) activePanel.classList.add('active');
  }

  // Validation before proceeding
  function validateStep1() {
    var name = document.getElementById('inpName');
    var client = document.getElementById('inpClientName');
    var clientVal = document.getElementById('clientSelectValue');
    var date = document.getElementById('inpDate');
    var valid = true;

    if (name && !name.value.trim()) {
      name.style.borderColor = 'var(--danger)';
      valid = false;
    } else if (name) {
      name.style.borderColor = 'var(--border)';
    }

    if (client && !client.value) {
      if (document.getElementById('customClientSelect')) {
        document.getElementById('customClientSelect').style.borderColor = 'var(--danger)';
      }
      valid = false;
    } else {
      if (document.getElementById('customClientSelect')) {
        document.getElementById('customClientSelect').style.borderColor = 'var(--border)';
      }
    }

    if (date && !date.value) {
      date.style.borderColor = 'var(--danger)';
      valid = false;
    } else if (date) {
      date.style.borderColor = 'var(--border)';
    }

    if (!valid && window.VerdeToast) {
      window.VerdeToast.error('Please fill in all required fields.');
    }

    return valid;
  }

  window.nextStep = function () {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < totalSteps) {
      currentStep++;
      renderStepper();
    }
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      renderStepper();
    }
  };

  window.goToStep = function (stepId) {
    if (stepId < currentStep || (stepId === currentStep + 1 && validateStep1())) {
      currentStep = stepId;
      renderStepper();
    }
  };

  // Step 2 Template Card Selection
  window.selectTemplate = function (element) {
    document.querySelectorAll('.t-card').forEach(function (el) { el.classList.remove('active'); });
    element.classList.add('active');
    selectedType = element.getAttribute('data-type') || 'Website Development';
  };

  // Step 4 Team Member Selection
  window.toggleTeamMember = function (element) {
    element.classList.toggle('active');
    var empId = element.getAttribute('data-member');
    if (element.classList.contains('active')) {
      if (selectedTeam.indexOf(empId) === -1) selectedTeam.push(empId);
    } else {
      var idx = selectedTeam.indexOf(empId);
      if (idx > -1) selectedTeam.splice(idx, 1);
    }
  };

  // Step 5 Review Population
  function populateReview() {
    var elName = document.getElementById('inpName');
    var elClient = document.getElementById('inpClientName');
    var elDate = document.getElementById('inpDate');
    var elBudget = document.getElementById('inpBudget');

    if (document.getElementById('revName')) document.getElementById('revName').textContent = elName ? elName.value || 'Cabo Travels Website' : 'Cabo Travels Website';
    if (document.getElementById('revClient')) document.getElementById('revClient').textContent = elClient ? elClient.value || 'None selected' : 'None selected';
    if (document.getElementById('revService')) document.getElementById('revService').textContent = selectedType;
    if (document.getElementById('revDate')) document.getElementById('revDate').textContent = elDate ? elDate.value || 'Aug 30, 2026' : 'Aug 30, 2026';
    
    if (document.getElementById('revTeam')) {
      var selectedNames = [];
      document.querySelectorAll('.tm-card.active').forEach(function (card) {
        var name = card.getAttribute('data-name');
        if (name) selectedNames.push(name);
      });
      document.getElementById('revTeam').textContent = selectedNames.length ? selectedNames.join(', ') : 'None assigned';
    }

    if (document.getElementById('revBudget')) {
      var b = parseFloat(elBudget ? elBudget.value || 25000 : 25000).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      document.getElementById('revBudget').textContent = '₹' + b;
    }
  }

  // Save Draft
  window.saveDraftWizard = function () {
    var payload = {
      name: document.getElementById('inpName') ? (document.getElementById('inpName').value.trim() || 'Draft Project') : 'Draft Project',
      client: document.getElementById('inpClientName') ? document.getElementById('inpClientName').value : 'Unknown Client',
      category: selectedType,
      dueDate: document.getElementById('inpDate') ? document.getElementById('inpDate').value : '',
      budget: parseFloat(document.getElementById('inpBudget') ? document.getElementById('inpBudget').value : 0),
      team: selectedTeam,
      isDraft: true
    };

    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.saveDraft(payload).then(function (res) {
        if (window.VerdeToast) window.VerdeToast.info('Project draft "' + res.name + '" saved to storage.');
        setTimeout(function () {
          window.location.href = '../projects/index.html';
        }, 1000);
      });
    } else {
      if (window.VerdeToast) window.VerdeToast.info('Project draft saved.');
      setTimeout(function () {
        window.location.href = '../projects/index.html';
      }, 1000);
    }
  };

  // Launch Project
  window.launchProject = function () {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('projects_create')) {
      if (window.VerdeToast) window.VerdeToast.error('Access Denied. You do not have permission to perform this action.');
      return;
    }

    var btn = document.getElementById('btnLaunch');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Launching...';
    }

    var payload = {
      name: document.getElementById('inpName') ? document.getElementById('inpName').value : 'New Project',
      client: document.getElementById('inpClientName') ? document.getElementById('inpClientName').value : 'Unknown Client',
      category: selectedType,
      dueDate: document.getElementById('inpDate') ? document.getElementById('inpDate').value : '2026-08-30',
      budget: parseFloat(document.getElementById('inpBudget') ? document.getElementById('inpBudget').value : 25000),
      team: selectedTeam
    };
    if (currentClientId) payload.clientId = currentClientId;

    if (window.VerdeServices && window.VerdeServices.Projects) {
      window.VerdeServices.Projects.createProject(payload).then(function (res) {
        if (currentClientId && window.VerdeServices.Crm) {
          window.VerdeServices.Crm.getClientById(currentClientId).then(function(clientData) {
             if (clientData) {
               var acts = clientData.activities || [];
               acts.push({ id: 'ACT-' + Date.now(), action: 'Project Created', details: res.name, user: window.VerdeMockData ? window.VerdeMockData.user.name : 'System', date: new Date().toISOString() });
               window.VerdeServices.Crm.updateClient(currentClientId, { activities: acts }).then(function() {
                 if (window.VerdeToast) window.VerdeToast.success('Project "' + res.name + '" created successfully!');
                 setTimeout(function () { window.location.href = '../projects/index.html'; }, 1200);
               });
             } else {
               if (window.VerdeToast) window.VerdeToast.success('Project "' + res.name + '" created successfully!');
               setTimeout(function () { window.location.href = '../projects/index.html'; }, 1200);
             }
          });
        } else {
          if (window.VerdeToast) window.VerdeToast.success('Project "' + res.name + '" created successfully!');
          setTimeout(function () { window.location.href = '../projects/index.html'; }, 1200);
        }
      });
    } else {
      if (window.VerdeToast) window.VerdeToast.success('Project created successfully!');
      setTimeout(function () {
        window.location.href = '../projects/index.html';
      }, 1200);
    }
  };

  var currentClientId = null;
  var allClients = [];

  // Handle Client Dropdown UI
  function setupClientDropdown() {
    var selectBox = document.getElementById('customClientSelect');
    if (!selectBox) return;

    selectBox.addEventListener('click', function(e) {
      if(e.target.id === 'clientSelectSearch') return;
      var dropdown = selectBox.querySelector('.verde-select-dropdown');
      var isClosed = dropdown.style.display === 'none';
      if(isClosed) {
        dropdown.style.display = 'block';
        document.getElementById('clientSelectSearch').focus();
      } else {
        dropdown.style.display = 'none';
      }
    });

    document.addEventListener('click', function(e) {
      if (!selectBox.contains(e.target)) {
        selectBox.querySelector('.verde-select-dropdown').style.display = 'none';
      }
    });
  }

  window.filterClientSelect = function() {
    var query = document.getElementById('clientSelectSearch').value.toLowerCase().trim();
    document.querySelectorAll('.client-option-item').forEach(function(el) {
      var text = el.textContent.toLowerCase();
      el.style.display = text.includes(query) ? 'flex' : 'none';
    });
  };

  window.selectClientOption = function(id, name) {
    currentClientId = id;
    document.getElementById('inpClientId').value = id;
    document.getElementById('inpClientName').value = name;
    
    var valEl = document.getElementById('clientSelectValue');
    valEl.textContent = name;
    valEl.style.color = 'var(--text-1)';
    valEl.style.fontWeight = '700';
    
    document.querySelector('#customClientSelect .verde-select-dropdown').style.display = 'none';
    document.getElementById('customClientSelect').style.borderColor = 'var(--border)'; // Clear error state if any
  };

  function renderClientOptions(prefillCompany) {
    var container = document.getElementById('clientSelectOptions');
    if (!container) return;
    
    var activeClients = allClients.filter(function(c) { return c.status === 'Active'; });
    
    if (activeClients.length === 0) {
      container.innerHTML = '<div style="padding:8px; font-size:12px; color:var(--text-3); text-align:center;">No active clients found.</div>';
      return;
    }
    
    container.innerHTML = '';
    activeClients.forEach(function(c) {
      var html = '<div class="client-option-item" onclick="selectClientOption(\'' + c.id + '\', \'' + c.company + '\')" style="display:flex; align-items:center; gap:12px; padding:8px 12px; cursor:pointer; border-radius:6px;">' +
        '<div class="proj-avatar" style="width:28px; height:28px; font-size:11px; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; border-radius:50%; flex-shrink:0;">' + c.company.substring(0,2).toUpperCase() + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px; font-weight:700; color:var(--text-1);">' + c.company + '</div>' +
          '<div style="font-size:11px; color:var(--text-3);">' + c.contactPerson + ' &bull; ' + (c.industry || 'General') + '</div>' +
        '</div>' +
      '</div>';
      container.innerHTML += html;
    });

    // Add hover styles dynamically
    document.querySelectorAll('.client-option-item').forEach(function(el) {
      el.addEventListener('mouseover', function() { this.style.background = 'var(--bg-2)'; });
      el.addEventListener('mouseout', function() { this.style.background = 'transparent'; });
    });

    // Handle Prefill
    if (prefillCompany) {
      var matched = activeClients.find(function(c) { return c.company === prefillCompany || c.id === currentClientId; });
      if (matched) {
        window.selectClientOption(matched.id, matched.company);
      }
    }
  }

  function loadTeamMembers() {
    var container = document.getElementById('project-team-members');
    if (!container) return;

    if (window.VerdeServices && window.VerdeServices.Team && typeof window.VerdeServices.Team.getMembers === 'function') {
      window.VerdeServices.Team.getMembers().then(function(members) {
        if (!members || members.length === 0) {
          container.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-3); font-size: 14px;">No team members available.</div>';
          return;
        }

        var html = '';
        members.forEach(function(m) {
          var isActive = selectedTeam.indexOf(m.id) > -1 ? ' active' : '';
          var role = m.role || m.department || 'Team Member';
          var name = m.name || m.displayName || 'Unknown';
          var initials = m.initials || name.substring(0, 2).toUpperCase();
          var bg = m.avatarBg || 'var(--primary)';
          var workStr = '';
          if (m.workload || m.activeProjects !== undefined) {
              workStr = 'Workload: ' + (m.workload || '0%') + (m.activeProjects !== undefined ? ' (' + m.activeProjects + ' Active Projects)' : '');
          }

          html += '<div class="tm-card' + isActive + '" onclick="toggleTeamMember(this)" data-member="' + m.id + '" data-name="' + name + '">';
          html += '  <div class="tm-av" style="background:' + bg + ';">' + initials + '</div>';
          html += '  <div class="tm-info">';
          html += '    <div class="tm-name">' + name + '</div>';
          html += '    <div class="tm-role">' + role + '</div>';
          if (workStr) {
            html += '    <div class="tm-workload" style="font-size:11px; color:var(--text-3); margin-top:2px;">' + workStr + '</div>';
          }
          html += '  </div>';
          html += '</div>';
        });
        container.innerHTML = html;
      }).catch(function(e) {
        container.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--danger); font-size: 14px;">Unable to load team members.</div>';
      });
    } else {
        container.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--danger); font-size: 14px;">Unable to load team members.</div>';
    }
  }

  // Init
  function initWizard() {
    setupClientDropdown();
    
    var prefillCompany = null;
    var prefillStr = sessionStorage.getItem('verde_prefill_project');
    if (prefillStr) {
      try {
        var prefill = JSON.parse(prefillStr);
        prefillCompany = prefill.company || prefill.client || null;
        if (prefill.clientId) currentClientId = prefill.clientId;
        sessionStorage.removeItem('verde_prefill_project');
      } catch (e) {}
    }

    if (window.VerdeServices && window.VerdeServices.Crm) {
      window.VerdeServices.Crm.getClients().then(function(clients) {
        allClients = clients || [];
        renderClientOptions(prefillCompany);
      });
    }

    loadTeamMembers();
    renderStepper();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizard);
  } else {
    initWizard();
  }

})();