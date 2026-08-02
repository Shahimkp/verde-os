/* ==========================================================================
   VERDE OS — TEAM MANAGEMENT WORKSPACE CONTROLLER (SPEC 010)
   Employee Search, Department Filtering & Quick Actions
   ========================================================================== */

(function () {
  'use strict';

  let teamEmployees = [];

  function loadTeamData() {
    const stored = localStorage.getItem('verde_os_team_employees');
    if (stored) {
      teamEmployees = JSON.parse(stored);
    } else {
      teamEmployees = window.VerdeMockData && window.VerdeMockData.employees ? [...window.VerdeMockData.employees] : [];
      localStorage.setItem('verde_os_team_employees', JSON.stringify(teamEmployees));
    }
  }

  function saveTeamData() {
    localStorage.setItem('verde_os_team_employees', JSON.stringify(teamEmployees));
  }

  function renderTeamDirectory() {
    const grid = document.querySelector('.team-dir-grid');
    if (!grid) return;
    

    
    grid.innerHTML = ''; // clear hardcoded cards
    
    if (!Array.isArray(teamEmployees)) {
      console.error('teamEmployees is not an array:', teamEmployees);
      return;
    }
    
    teamEmployees.forEach(emp => {
      if (!emp) return;
      const empName = emp.name || 'Unknown Employee';
      const fn = empName.split(' ')[0] || '';
      const ln = empName.split(' ')[1] || '';
      const initials = (emp.initials || (fn.substring(0,1) + ln.substring(0,1)) || 'XX').toUpperCase();
      const statusVal = emp.status || 'Active';
      
      const card = document.createElement('div');
      card.className = 'team-dir-card';
      card.innerHTML = `
          <div class="team-status-dot ${statusVal.toLowerCase() === 'online' || statusVal.toLowerCase() === 'active' ? 'status-online' : statusVal.toLowerCase() === 'on leave' ? 'status-busy' : 'status-offline'}"></div>
          <div class="team-avatar-lg" style="background:${emp.avatarBg || 'var(--primary)'}-10; color:${emp.avatarBg || 'var(--primary)'};">${initials}</div>
          <div>
            <div class="team-dir-name">${empName}</div>
            <div class="team-dir-role">${emp.role}</div>
          </div>
          <div class="team-dir-dept">${emp.department}</div>
          <div class="team-dir-workload">
            <div class="team-wl-label"><span>Current Workload</span> <span>0%</span></div>
            <div class="team-wl-bar">
              <div class="team-wl-fill" style="width: 0%; background:var(--primary);"></div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm team-dir-action" style="border:1px solid var(--border); flex:1;" onclick="window.openEmployeeProfile && window.openEmployeeProfile('${emp.id}')">View Profile</button>
            <button class="btn btn-ghost btn-sm team-dir-action" style="border:1px solid var(--border); width: 36px; display:flex; justify-content:center; align-items:center;" onclick="window.openAddEmployeeModal && window.openAddEmployeeModal('${emp.id}')" title="Edit Employee">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
      `;
      grid.appendChild(card);
    });

    const valEls = document.querySelectorAll('.kpi-val');
    valEls.forEach(el => {
        const labelEl = el.parentElement ? el.parentElement.querySelector('.kpi-label') : null;
        if(labelEl && labelEl.textContent.includes('Total Employees')) {
            el.textContent = teamEmployees.length;
        }
    });
  }

  function initTeamWorkspace() {
    loadTeamData();
    renderTeamDirectory();

    // 1. Search Filter for Employee Directory
    const searchInput = document.getElementById('team-search-input');

    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        const query = e.target.value.toLowerCase().trim();
        const memberCards = document.querySelectorAll('.team-dir-card');
        memberCards.forEach(card => {
          const text = card.textContent.toLowerCase();
          if (text.includes(query)) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }

    // 2. Action Buttons Triggers
    const btnInvite = document.getElementById('btn-invite-member-main');
    if (btnInvite) {
      btnInvite.addEventListener('click', function () {
        alert('Team Workspace: Opening Team Member Invitation Modal...');
      });
    }

    const btnExport = document.getElementById('btn-export-team');
    if (btnExport) {
      btnExport.addEventListener('click', function () {
        alert('Team Workspace: Exporting Team Roster to CSV...');
      });
    }
  }

    window.openAddEmployeeModal = function(editEmpId = null) {
    let editEmp = null;
    if (editEmpId) {
        editEmp = teamEmployees.find(e => e.id === editEmpId);
        if (!editEmp) return;
    }
    const formHtml = `
      <style>
        .emp-form-section { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .emp-form-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .emp-form-section-title { font-size: 14px; font-weight: 800; color: var(--text-1); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        .emp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .emp-form-group { display: flex; flex-direction: column; gap: 6px; }
        .emp-form-group.full { grid-column: span 2; }
        .emp-form-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .emp-form-label.req::after { content: '*'; color: var(--danger); margin-left: 4px; }
        .emp-form-input { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; outline: none; background: var(--bg); color: var(--text-1); font-family: inherit; font-size: 13px; transition: border-color 0.2s; }
        .emp-form-input:focus { border-color: var(--primary); }
        .emp-form-error { font-size: 11px; color: var(--danger); display: none; margin-top: 2px; }
      </style>
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;" id="add-emp-scroll-container">
        
        <!-- 1. Personal Information -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Personal Information</div>
          <div class="emp-form-grid">
            ${editEmp ? `
            <div class="emp-form-group full">
              <label class="emp-form-label">Employee ID</label>
              <input type="text" class="emp-form-input" value="${editEmp.id}" readonly style="background: var(--bg-2); cursor: not-allowed;" />
            </div>
            ` : ''}
            <div class="emp-form-group">
              <label class="emp-form-label req">First Name</label>
              <input type="text" class="emp-form-input" id="emp-fn" placeholder="John" />
              <div class="emp-form-error" id="err-fn">First Name is required.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label req">Last Name</label>
              <input type="text" class="emp-form-input" id="emp-ln" placeholder="Doe" />
              <div class="emp-form-error" id="err-ln">Last Name is required.</div>
            </div>
            <div class="emp-form-group full">
              <label class="emp-form-label">Profile Photo URL (Optional)</label>
              <input type="text" class="emp-form-input" id="emp-photo" placeholder="https://..." />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Gender</label>
              <select class="emp-form-input" id="emp-gender">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Date of Birth</label>
              <input type="date" class="emp-form-input" id="emp-dob" />
            </div>
          </div>
        </div>

        <!-- 2. Work Information -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Work Information</div>
          <div class="emp-form-grid">
            <div class="emp-form-group">
              <label class="emp-form-label req">Department</label>
              <select class="emp-form-input" id="emp-dept">
                <option value="">Select Department</option>
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
              <div class="emp-form-error" id="err-dept">Department is required.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label req">Designation / Job Title</label>
              <input type="text" class="emp-form-input" id="emp-role" placeholder="e.g. Senior Developer" />
              <div class="emp-form-error" id="err-role">Designation is required.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Employment Type</label>
              <select class="emp-form-input" id="emp-type">
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Reporting Manager</label>
              <input type="text" class="emp-form-input" id="emp-manager" placeholder="e.g. Shahim" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label req">Joining Date</label>
              <input type="date" class="emp-form-input" id="emp-join" />
              <div class="emp-form-error" id="err-join">Joining Date is required.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Employment Status</label>
              <select class="emp-form-input" id="emp-status">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Probation">Probation</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. Contact Information -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Contact Information</div>
          <div class="emp-form-grid">
            <div class="emp-form-group">
              <label class="emp-form-label req">Company Email</label>
              <input type="email" class="emp-form-input" id="emp-email" placeholder="john@verdelabs.com" />
              <div class="emp-form-error" id="err-email">Valid Email is required.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Personal Email</label>
              <input type="email" class="emp-form-input" id="emp-pemail" placeholder="john.doe@gmail.com" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label req">Phone Number</label>
              <input type="tel" class="emp-form-input" id="emp-phone" placeholder="+1 555-0123" />
              <div class="emp-form-error" id="err-phone">Valid Phone Number is required.</div>
            </div>
            <div class="emp-form-group"></div>
            <div class="emp-form-group">
              <label class="emp-form-label">Emergency Contact Name</label>
              <input type="text" class="emp-form-input" id="emp-em-name" placeholder="Jane Doe" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Emergency Contact Number</label>
              <input type="tel" class="emp-form-input" id="emp-em-phone" placeholder="+1 555-0124" />
            </div>
          </div>
        </div>

        <!-- 4. Address -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Address</div>
          <div class="emp-form-grid">
            <div class="emp-form-group full">
              <label class="emp-form-label">Address Line</label>
              <input type="text" class="emp-form-input" id="emp-addr" placeholder="123 Main St, Apt 4B" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">City</label>
              <input type="text" class="emp-form-input" id="emp-city" placeholder="New York" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">State</label>
              <input type="text" class="emp-form-input" id="emp-state" placeholder="NY" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Country</label>
              <input type="text" class="emp-form-input" id="emp-country" placeholder="USA" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">PIN / Zip Code</label>
              <input type="text" class="emp-form-input" id="emp-pin" placeholder="10001" />
            </div>
          </div>
        </div>

        <!-- 5. Professional Details -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Professional Details</div>
          <div class="emp-form-grid">
            <div class="emp-form-group full">
              <label class="emp-form-label">Skills (Comma separated)</label>
              <input type="text" class="emp-form-input" id="emp-skills" placeholder="JavaScript, React, Node.js" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Experience (Years)</label>
              <input type="number" class="emp-form-input" id="emp-exp" placeholder="5" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Education</label>
              <input type="text" class="emp-form-input" id="emp-edu" placeholder="B.S. Computer Science" />
            </div>
            <div class="emp-form-group full">
              <label class="emp-form-label">Certifications</label>
              <input type="text" class="emp-form-input" id="emp-certs" placeholder="AWS Certified, PMP" />
            </div>
            <div class="emp-form-group full">
              <label class="emp-form-label">Notes</label>
              <textarea class="emp-form-input" id="emp-notes" placeholder="Any additional notes..." rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- 6. Salary Information -->
        <div class="emp-form-section">
          <div class="emp-form-section-title">Salary & Banking Information</div>
          <div class="emp-form-grid">
            <div class="emp-form-group">
              <label class="emp-form-label">Monthly Salary (INR)</label>
              <input type="number" class="emp-form-input" id="emp-salary" placeholder="50000" />
              <div class="emp-form-error" id="err-salary">Salary must be numeric.</div>
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Bank Account Number</label>
              <input type="text" class="emp-form-input" id="emp-bank" placeholder="Account Number" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">IFSC Code</label>
              <input type="text" class="emp-form-input" id="emp-ifsc" placeholder="IFSC Code" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">PAN Number</label>
              <input type="text" class="emp-form-input" id="emp-pan" placeholder="ABCDE1234F" />
            </div>
            <div class="emp-form-group">
              <label class="emp-form-label">Aadhaar Number</label>
              <input type="text" class="emp-form-input" id="emp-aadhaar" placeholder="1234 5678 9012" />
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.create) {
        window.VerdeModal.create(editEmp ? 'Edit Employee' : 'Add Employee', formHtml, function() {});
        
        setTimeout(() => {
          const modals = document.querySelectorAll('.modal-overlay.active');
          if (!modals.length) return;
          const modal = modals[modals.length - 1];
          const confirmBtn = modal.querySelector('.modal-confirm-btn');
          if (!confirmBtn) return;
          
          const newBtn = confirmBtn.cloneNode(true);
          confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
          
          if (editEmp) {
              const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
              setVal('emp-fn', editEmp.name ? editEmp.name.split(' ')[0] : '');
              setVal('emp-ln', editEmp.name ? editEmp.name.split(' ').slice(1).join(' ') : '');
              setVal('emp-photo', editEmp.avatarBg !== 'var(--primary)' ? editEmp.avatarBg : '');
              setVal('emp-gender', editEmp.gender || '');
              setVal('emp-dob', editEmp.dob || '');
              
              setVal('emp-dept', editEmp.department);
              setVal('emp-role', editEmp.role);
              setVal('emp-type', editEmp.employmentType || '');
              setVal('emp-status', editEmp.status);
              setVal('emp-join', editEmp.joinDate);
              
              setVal('emp-email', editEmp.email);
              setVal('emp-phone', editEmp.phone);
              setVal('emp-location', editEmp.location || '');
              
              setVal('emp-salary', editEmp.salary || '');
              setVal('emp-currency', editEmp.currency || 'USD');
              setVal('emp-bank', editEmp.bank || '');
              
              setVal('emp-skills', editEmp.skills ? editEmp.skills.join(', ') : '');
              setVal('emp-notes', editEmp.notes);
          }
          
          newBtn.addEventListener('click', function(e) {
            const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
            const fn = val('emp-fn');
            const ln = val('emp-ln');
            const dept = val('emp-dept');
            const role = val('emp-role');
            const join = val('emp-join');
            const email = val('emp-email');
            const phone = val('emp-phone');
            const salary = val('emp-salary');

            let hasError = false;
            const setError = (id, show) => {
              const el = document.getElementById(id);
              if (el) {
                el.style.display = show ? 'block' : 'none';
                if(show) {
                    const input = el.previousElementSibling;
                    if(input) input.style.borderColor = 'var(--danger)';
                } else {
                    const input = el.previousElementSibling;
                    if(input) input.style.borderColor = 'var(--border)';
                }
              }
              if (show) hasError = true;
            };

            setError('err-fn', !fn);
            setError('err-ln', !ln);
            setError('err-dept', !dept);
            setError('err-role', !role);
            setError('err-join', !join);

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let isEmailValid = email && emailRegex.test(email);
            if (isEmailValid) {
                const duplicateEmail = teamEmployees.find(e => e.email === email && (!editEmp || e.id !== editEmp.id));
                if (duplicateEmail) {
                    isEmailValid = false;
                    const errEmail = document.getElementById('err-email');
                    if (errEmail) errEmail.textContent = 'Company Email is already in use by another employee.';
                }
            } else {
                const errEmail = document.getElementById('err-email');
                if (errEmail) errEmail.textContent = 'Valid Company Email is required.';
            }
            setError('err-email', !isEmailValid);

            const phoneRegex = /^[\d\+\-\s\(\)]+$/;
            setError('err-phone', !phone || !phoneRegex.test(phone));

            if (salary !== '') {
              setError('err-salary', isNaN(Number(salary)));
            } else {
              setError('err-salary', false);
            }

            if (hasError) {
              if (window.VerdeToast) window.VerdeToast.error('Please correct the highlighted errors.');
              return; // Do not close modal
            }

            const statusVal = val('emp-status') || 'Active';
            
            if (editEmp) {
                editEmp.name = fn + ' ' + ln;
                editEmp.department = dept;
                editEmp.role = role;
                editEmp.status = statusVal;
                editEmp.joinDate = join;
                editEmp.email = email;
                editEmp.phone = phone;
                if (val('emp-photo')) editEmp.avatarBg = val('emp-photo');
                editEmp.skills = val('emp-skills') ? val('emp-skills').split(',').map(s=>s.trim()) : [];
                editEmp.notes = val('emp-notes');
                editEmp.gender = val('emp-gender');
                editEmp.dob = val('emp-dob');
                editEmp.employmentType = val('emp-type');
                editEmp.location = val('emp-location');
                editEmp.salary = salary;
                editEmp.currency = val('emp-currency');
                editEmp.bank = val('emp-bank');
                
                saveTeamData();
                if (window.VerdeToast) window.VerdeToast.success('Employee ' + editEmp.name + ' updated successfully.');
                
                modal.classList.remove('active');
                setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
                
                renderTeamDirectory();
            } else {
                const maxId = teamEmployees.reduce((max, e) => {
                    if (e.id && e.id.startsWith('EMP-')) {
                        const num = parseInt(e.id.replace('EMP-', ''), 10);
                        return num > max ? num : max;
                    }
                    return max;
                }, 0);
                const newId = `EMP-${String(maxId + 1).padStart(3, '0')}`;
                
                const newEmp = {
                    id: newId,
                    name: fn + ' ' + ln,
                    department: dept,
                    role: role,
                    status: statusVal,
                    joinDate: join,
                    email: email,
                    phone: phone,
                    avatarBg: val('emp-photo') || 'var(--primary)',
                    skills: val('emp-skills') ? val('emp-skills').split(',').map(s=>s.trim()) : [],
                    notes: val('emp-notes'),
                    gender: val('emp-gender'),
                    dob: val('emp-dob'),
                    employmentType: val('emp-type'),
                    location: val('emp-location'),
                    salary: salary,
                    currency: val('emp-currency'),
                    bank: val('emp-bank')
                };
                
                teamEmployees.push(newEmp);
                saveTeamData();
                
                if (window.VerdeToast) window.VerdeToast.success('Employee ' + newEmp.name + ' added successfully.');
                
                modal.classList.remove('active');
                setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
                
                renderTeamDirectory();
            }
            
          });
        }, 10);
    } else {
        alert('Modal system missing!');
    }
  };

  window.openEmployeeProfile = function(empId) {
    const drawer = document.getElementById('employee-profile-drawer');
    if (!drawer) return;

    const emp = teamEmployees.find(e => e.id === empId);
    if (!emp) {
      if (window.VerdeToast) window.VerdeToast.error('Employee details not found.');
      return;
    }

    // Populate data
    const ini = emp.initials || emp.name.substring(0, 2).toUpperCase();
    const bg = emp.avatarBg || 'var(--primary)';
    
    document.getElementById('drawer-emp-avatar').textContent = ini;
    document.getElementById('drawer-emp-avatar').style.background = `${bg}-10`;
    document.getElementById('drawer-emp-avatar').style.color = bg;
    
    document.getElementById('drawer-emp-name').textContent = emp.name || 'N/A';
    document.getElementById('drawer-emp-role').textContent = emp.role || 'N/A';
    
    const status = (emp.status || 'Offline');
    const statusEl = document.getElementById('drawer-emp-status');
    statusEl.textContent = status;
    statusEl.style.background = `var(--${status.toLowerCase() === 'online' ? 'success' : status.toLowerCase() === 'busy' ? 'warning' : 'text-3'})-10`;
    statusEl.style.color = `var(--${status.toLowerCase() === 'online' ? 'success' : status.toLowerCase() === 'busy' ? 'warning' : 'text-3'})`;

    document.getElementById('drawer-emp-id').textContent = emp.id;
    document.getElementById('drawer-emp-dept').textContent = emp.department || 'N/A';
    document.getElementById('drawer-emp-email').textContent = emp.email || emp.name.toLowerCase().replace(' ', '.') + '@verdelabs.com';
    document.getElementById('drawer-emp-phone').textContent = emp.phone || '+1 (555) 019-8234';
    document.getElementById('drawer-emp-joined').textContent = emp.joinDate || 'Jan 15, 2026';
    
    document.getElementById('drawer-emp-notes').textContent = emp.notes || 'Reliable team member. Needs to complete Q3 compliance training.';
    
    // Skills
    const skills = emp.skills || ['Leadership', 'Communication', 'Agile'];
    const skillsContainer = document.getElementById('drawer-emp-skills');
    skillsContainer.innerHTML = '';
    skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.style.cssText = 'font-size:11px; font-weight:600; padding:4px 10px; background:var(--bg-2); border:1px solid var(--border); border-radius:12px; color:var(--text-2);';
      tag.textContent = skill;
      skillsContainer.appendChild(tag);
    });

    // Open drawer
    drawer.style.display = 'block';
    // Small delay to allow display:block to apply before animating transform
    setTimeout(() => {
      drawer.style.transform = 'translateX(0)';
    }, 10);
  };

  window.closeEmployeeProfile = function() {
    const drawer = document.getElementById('employee-profile-drawer');
    if (drawer) {
      drawer.style.transform = 'translateX(100%)';
      setTimeout(() => {
        drawer.style.display = 'none';
      }, 300); // Wait for transition
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamWorkspace);
  } else {
    initTeamWorkspace();
  }
})();