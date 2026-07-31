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
  var selectedTeam = ['SH', 'MI'];

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
    var client = document.getElementById('inpClient');
    var date = document.getElementById('inpDate');
    var valid = true;

    if (name && !name.value.trim()) {
      name.style.borderColor = 'var(--danger)';
      valid = false;
    } else if (name) {
      name.style.borderColor = 'var(--border)';
    }

    if (client && !client.value) {
      client.style.borderColor = 'var(--danger)';
      valid = false;
    } else if (client) {
      client.style.borderColor = 'var(--border)';
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
  };

  // Step 5 Review Population
  function populateReview() {
    var elName = document.getElementById('inpName');
    var elClient = document.getElementById('inpClient');
    var elDate = document.getElementById('inpDate');
    var elBudget = document.getElementById('inpBudget');

    if (document.getElementById('revName')) document.getElementById('revName').textContent = elName ? elName.value || 'Cabo Travels Website' : 'Cabo Travels Website';
    if (document.getElementById('revClient')) document.getElementById('revClient').textContent = elClient ? elClient.value || 'Cabo Travels' : 'Cabo Travels';
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
      var b = parseFloat(elBudget ? elBudget.value || 25000 : 25000).toLocaleString('en-US', { minimumFractionDigits: 2 });
      document.getElementById('revBudget').textContent = '$' + b;
    }
  }

  // Save Draft
  window.saveDraftWizard = function () {
    var payload = {
      name: document.getElementById('inpName') ? (document.getElementById('inpName').value.trim() || 'Draft Project') : 'Draft Project',
      client: document.getElementById('inpClient') ? document.getElementById('inpClient').value : 'Cabo Travels',
      category: selectedType,
      dueDate: document.getElementById('inpDate') ? document.getElementById('inpDate').value : '',
      budget: parseFloat(document.getElementById('inpBudget') ? document.getElementById('inpBudget').value : 0),
      team: ['SH'],
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
    var btn = document.getElementById('btnLaunch');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Launching...';
    }

    var payload = {
      name: document.getElementById('inpName') ? document.getElementById('inpName').value : 'New Project',
      client: document.getElementById('inpClient') ? document.getElementById('inpClient').value : 'Cabo Travels',
      category: selectedType,
      dueDate: document.getElementById('inpDate') ? document.getElementById('inpDate').value : '2026-08-30',
      budget: parseFloat(document.getElementById('inpBudget') ? document.getElementById('inpBudget').value : 25000),
      team: ['SH', 'MI']
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

  // Init
  function initWizard() {
    var prefillStr = sessionStorage.getItem('verde_prefill_project');
    if (prefillStr) {
      try {
        var prefill = JSON.parse(prefillStr);
        var elClient = document.getElementById('inpClient');
        if (elClient) elClient.value = prefill.company || prefill.client || '';
        if (prefill.clientId) currentClientId = prefill.clientId;
        sessionStorage.removeItem('verde_prefill_project');
      } catch (e) {}
    }
    renderStepper();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizard);
  } else {
    initWizard();
  }

})();