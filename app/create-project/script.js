// --- WIZARD LOGIC ---
    const steps = [
      { id: 1, name: 'Project Details' },
      { id: 2, name: 'Project Type' },
      { id: 3, name: 'Execution Plan' },
      { id: 4, name: 'Team Assignment' },
      { id: 5, name: 'Review & Launch' }
    ];

    let currentStep = 1;
    const totalSteps = steps.length;

    function renderStepper() {
      const container = document.getElementById('stepper');
      container.innerHTML = '';

      steps.forEach((step, index) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;
        let cls = 'step-item';
        if (isDone) cls += ' done';
        if (isActive) cls += ' active';

        container.innerHTML += `
      <div class="${cls}">
        <div class="step-num">${isDone ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : step.id}</div>
        <span>${step.name}</span>
      </div>
    `;

        if (index < totalSteps - 1) {
          container.innerHTML += `<div class="step-div"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>`;
        }
      });

      // Buttons
      document.getElementById('btnBack').style.display = currentStep > 1 ? 'inline-flex' : 'none';
      if (currentStep === totalSteps) {
        document.getElementById('btnNext').style.display = 'none';
        document.getElementById('btnLaunch').style.display = 'inline-flex';
        populateReview();
      } else {
        document.getElementById('btnNext').style.display = 'inline-flex';
        document.getElementById('btnLaunch').style.display = 'none';
      }

      // Content
      document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
      document.getElementById(`step-${currentStep}`).classList.add('active');
    }

    function validateStep1() {
      let valid = true;
      const name = document.getElementById('inpName');
      const client = document.getElementById('inpClient');
      const date = document.getElementById('inpDate');

      if (!name.value.trim()) { name.parentElement.classList.add('has-error', 'error'); name.classList.add('error'); valid = false; }
      else { name.parentElement.classList.remove('has-error'); name.classList.remove('error'); }

      if (!client.value.trim()) { client.parentElement.classList.add('has-error'); client.classList.add('error'); valid = false; }
      else { client.parentElement.classList.remove('has-error'); client.classList.remove('error'); }

      if (!date.value) { date.parentElement.classList.add('has-error'); date.classList.add('error'); valid = false; }
      else { date.parentElement.classList.remove('has-error'); date.classList.remove('error'); }

      return valid;
    }

    function nextStep() {
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep < totalSteps) {
        currentStep++;
        renderStepper();
      }
    }

    function prevStep() {
      if (currentStep > 1) {
        currentStep--;
        renderStepper();
      }
    }

    function selectTemplate(element) {
      document.querySelectorAll('.t-card').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
    }

    function toggleCard(element) {
      element.classList.toggle('active');
    }

    function populateReview() {
      document.getElementById('revName').textContent = document.getElementById('inpName').value || 'GreenLeaf E-Commerce';
      document.getElementById('revClient').textContent = document.getElementById('inpClient').value || 'GreenLeaf Organics';
      document.getElementById('revDate').textContent = document.getElementById('inpDate').value || 'Oct 15, 2026';
    }

    function launchProject() {
      const overlay = document.getElementById('successOverlay');
      overlay.classList.add('active');

      // Simulate API / Loading
      setTimeout(() => {
        document.getElementById('loadingState').style.display = 'none';
        const successState = document.getElementById('successState');
        successState.style.display = 'flex';
        // Trigger browser reflow to run animation
        void successState.offsetWidth;
      }, 1500);
    }

    // Init
    renderStepper();

    // Remove error styling on input
    document.querySelectorAll('.form-input').forEach(inp => {
      inp.addEventListener('input', function () {
        this.classList.remove('error');
        if (this.parentElement.classList.contains('has-error')) {
          this.parentElement.classList.remove('has-error');
        }
      });
    });

    // --- ADD MEMBER LOGIC ---
    let mockEmployeeDB = [];

    function saveNewMember() {
      const nameInp = document.getElementById('ne-name');
      const deptInp = document.getElementById('ne-dept');
      const roleInp = document.getElementById('ne-role');
      
      const name = nameInp.value.trim();
      const dept = deptInp.value.trim();
      const role = roleInp.value.trim();

      // Validation
      let valid = true;
      [nameInp, deptInp, roleInp].forEach(inp => {
        if(!inp.value.trim()) { inp.classList.add('error'); valid = false; }
        else { inp.classList.remove('error'); }
      });
      if(!valid) return;

      const newEmp = { id: 'emp_' + Date.now(), name, role, dept };
      mockEmployeeDB.push(newEmp);

      // Create new card HTML based exactly on the existing cards
      const initials = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const cardHTML = `
        <div class="tm-card" onclick="toggleCard(this)">
          <div class="tm-av" style="background:var(--primary)">${initials}</div>
          <div class="tm-info">
            <div class="tm-name">${name}</div>
            <div class="tm-role">${role} · ${dept}</div>
            <div class="tm-load">
              <div class="tm-load-bar" style="width: 0%; background: var(--success)"></div>
            </div>
          </div>
        </div>
      `;

      const grids = document.querySelectorAll('.tr-grid');
      if (grids.length >= 2) {
        // Append to Owner list
        grids[0].insertAdjacentHTML('beforeend', cardHTML);
        // Append to Execution Team list
        grids[1].insertAdjacentHTML('beforeend', cardHTML);
      }

      // Reset modal
      ['ne-name','ne-email','ne-phone','ne-dept','ne-role','ne-skills'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('modal-add-member').classList.remove('active');
    }