import re

with open('app/team/script.js', 'r') as f:
    content = f.read()

# 1. Add rendering functions for Departments, Org Tree, and populateSelects
new_functions = """
  // ── DEPARTMENTS ──
  function renderDepartments() {
    window.VerdeServices.Team.getDepartments().then(deps => {
      window.VerdeServices.Team.getEmployees().then(emps => {
         const container = document.getElementById('departments-grid-container');
         if (!container) return;
         container.innerHTML = '';
         deps.filter(d => d.status !== 'Archived').forEach(d => {
            const head = emps.find(e => e.id === d.headId);
            const headName = head ? (head.firstName + ' ' + (head.lastName||'')) : 'Unassigned';
            const count = emps.filter(e => e.department === d.name && e.status !== 'Archived').length;
            
            container.innerHTML += `
              <div class="team-dir-card" style="align-items:flex-start; text-align:left;">
                <div style="font-size:18px; font-weight:800; color:var(--text-1); margin-bottom:16px;">${d.name}</div>
                <div style="font-size:12px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Department Head</div>
                <div style="font-size:14px; font-weight:600; color:var(--text-1); margin-bottom:16px;">${headName}</div>
                <div style="font-size:12px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Employees</div>
                <div style="font-size:14px; font-weight:600; color:var(--text-1);">${count} Members</div>
                
                <div style="margin-top:auto; width:100%; display:flex; gap:8px; padding-top:16px;">
                   <button class="btn btn-ghost btn-sm" style="flex:1; border:1px solid var(--border);" onclick="window.editDepartment('${d.id}')">Edit</button>
                   <button class="btn btn-ghost btn-sm" style="flex:1; border:1px solid var(--border); color:var(--danger);" onclick="window.archiveDepartment('${d.id}')">Archive</button>
                </div>
              </div>
            `;
         });
      });
    });
  }

  window.editDepartment = function(id) {
     window.VerdeServices.Team.getDepartments().then(deps => {
        const d = deps.find(x => x.id === id);
        if (!d) return;
        document.getElementById('dep-modal-title').textContent = 'Edit Department';
        document.getElementById('inpDepName').value = d.name;
        document.getElementById('selDepHead').value = d.headId || '';
        document.getElementById('create-dep-modal').dataset.editId = id;
        document.getElementById('create-dep-modal').style.display = 'flex';
     });
  };

  window.archiveDepartment = function(id) {
     if(confirm('Archive this department?')) {
        window.VerdeServices.Team.archiveDepartment(id).then(() => renderDepartments());
     }
  };

  function saveDepartment() {
     const name = document.getElementById('inpDepName').value.trim();
     const headId = document.getElementById('selDepHead').value;
     if (!name) { alert('Name required'); return; }
     
     const id = document.getElementById('create-dep-modal').dataset.editId;
     if (id) {
        window.VerdeServices.Team.updateDepartment(id, { name, headId }).then(() => {
           document.getElementById('create-dep-modal').style.display = 'none';
           renderDepartments();
        });
     } else {
        window.VerdeServices.Team.addDepartment({ name, headId, status: 'Active' }).then(() => {
           document.getElementById('create-dep-modal').style.display = 'none';
           renderDepartments();
        });
     }
  }

  // ── ORGANIZATION ──
  function buildTreeNode(node) {
     const hasChildren = node.children && node.children.length > 0;
     const avatar = getAvatar(node.firstName + ' ' + (node.lastName||''), node.avatarColor);
     
     let html = `
       <div class="org-child-wrapper">
         <div class="org-node" onclick="this.nextElementSibling ? (this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none' ? 'flex' : 'none') : null">
           <div style="width:40px; height:40px; border-radius:50%; background:${avatar.color}20; color:${avatar.color}; display:flex; align-items:center; justify-content:center; font-weight:800;">${avatar.initials}</div>
           <div>
             <div style="font-weight:800; font-size:14px; color:var(--text-1);">${node.firstName} ${node.lastName||''}</div>
             <div style="font-weight:600; font-size:12px; color:var(--text-3);">${node.role || 'Unassigned'} • ${node.department || 'N/A'}</div>
           </div>
           ${hasChildren ? '<div style="margin-left:auto; background:var(--bg-2); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; color:var(--text-2);">'+node.children.length+' Reports</div>' : ''}
         </div>
     `;
     
     if (hasChildren) {
       html += `<div class="org-node-children">`;
       node.children.forEach(child => {
          html += buildTreeNode(child);
       });
       html += `</div>`;
     }
     html += `</div>`;
     return html;
  }

  function renderOrganization() {
    window.VerdeServices.Team.getOrganizationTree().then(roots => {
       const container = document.getElementById('org-tree-container');
       if (!container) return;
       let html = '';
       roots.forEach(r => { html += buildTreeNode(r); });
       container.innerHTML = html;
    });
  }

  // ── FORMS ──
  function populateSelects(empIdToExclude) {
    Promise.all([
      window.VerdeServices.Team.getDepartments(),
      window.VerdeServices.Team.getRoles(),
      window.VerdeServices.Team.getEmployees()
    ]).then(results => {
       const [deps, roles, emps] = results;
       
       const selDept = document.getElementById('selEmpDept');
       if (selDept) selDept.innerHTML = deps.filter(d=>d.status!=='Archived').map(d => `<option value="${d.name}">${d.name}</option>`).join('');
       
       const selRole = document.getElementById('inpEmpRole'); 
       if (selRole) selRole.innerHTML = roles.filter(r=>r.status!=='Archived').map(r => `<option value="${r.name}">${r.name}</option>`).join('');
       
       const selMgr = document.getElementById('selEmpManager');
       if (selMgr) selMgr.innerHTML = '<option value="">None</option>' + emps.filter(e => e.status !== 'Archived' && e.id !== empIdToExclude).map(e => `<option value="${e.id}">${e.firstName} ${e.lastName||''}</option>`).join('');
       
       const selDepHead = document.getElementById('selDepHead');
       if (selDepHead) selDepHead.innerHTML = '<option value="">None</option>' + emps.filter(e => e.status !== 'Archived').map(e => `<option value="${e.id}">${e.firstName} ${e.lastName||''}</option>`).join('');
    });
  }

  // ── MODALS ──"""

content = re.sub(r'  // ── MODALS ──', new_functions, content)

# 2. Update openCreateModal
new_open_create = """  function openCreateModal(empId) {
    editingEmpId = empId || null;
    const modal = document.getElementById('create-emp-modal');
    const titleEl = document.getElementById('emp-modal-title');
    
    populateSelects(empId);
    
    setTimeout(() => {
      if (editingEmpId) {
        titleEl.textContent = 'Edit Employee';
        window.VerdeServices.Team.getEmployeeById(editingEmpId).then(function(emp) {
          document.getElementById('inpEmpFirstName').value = emp.firstName || '';
          document.getElementById('inpEmpLastName').value = emp.lastName || '';
          document.getElementById('selEmpDept').value = emp.department || '';
          document.getElementById('inpEmpRole').value = emp.role || '';
          document.getElementById('inpEmpEmail').value = emp.email || '';
          document.getElementById('inpEmpPhone').value = emp.phone || '';
          document.getElementById('inpEmpSkills').value = emp.skills || '';
          document.getElementById('inpEmpNotes').value = emp.notes || '';
          document.getElementById('selEmpStatus').value = emp.status || 'Active';
          document.getElementById('selEmpManager').value = emp.managerId || '';
          document.getElementById('inpEmpJoiningDate').value = emp.joiningDate || '';
          modal.style.display = 'flex';
        });
      } else {
        titleEl.textContent = 'Add Employee';
        document.getElementById('inpEmpFirstName').value = '';
        document.getElementById('inpEmpLastName').value = '';
        document.getElementById('inpEmpEmail').value = '';
        document.getElementById('inpEmpPhone').value = '';
        document.getElementById('inpEmpSkills').value = '';
        document.getElementById('inpEmpNotes').value = '';
        document.getElementById('selEmpStatus').value = 'Active';
        document.getElementById('selEmpManager').value = '';
        document.getElementById('inpEmpJoiningDate').value = new Date().toISOString().split('T')[0];
        modal.style.display = 'flex';
      }
    }, 100); // small delay to allow populating selects
  }"""

content = re.sub(
    r'  function openCreateModal\(empId\) \{.*?modal\.style\.display = \'flex\';\n    \}\n  \}',
    new_open_create,
    content,
    flags=re.DOTALL
)

# 3. Update saveEmployee
new_save = """  function saveEmployee(e) {
    try {
      if (e) e.preventDefault();
      const data = {
        firstName: document.getElementById('inpEmpFirstName').value.trim(),
        lastName: document.getElementById('inpEmpLastName').value.trim(),
        department: document.getElementById('selEmpDept').value,
        role: document.getElementById('inpEmpRole').value,
        email: document.getElementById('inpEmpEmail').value.trim(),
        phone: document.getElementById('inpEmpPhone').value.trim(),
        skills: document.getElementById('inpEmpSkills').value.trim(),
        notes: document.getElementById('inpEmpNotes').value.trim(),
        status: document.getElementById('selEmpStatus').value,
        managerId: document.getElementById('selEmpManager').value,
        joiningDate: document.getElementById('inpEmpJoiningDate').value
      };

      if (!data.firstName) {
        if (window.VerdeToast) window.VerdeToast.error('First Name is required');
        else alert('First Name is required');
        return;
      }"""

content = re.sub(
    r'  function saveEmployee\(e\) \{\n    try \{\n      if \(e\) e\.preventDefault\(\);\n      const data = \{.*?\};\n\n      if \(!data\.firstName\) \{.*?return;\n      \}',
    new_save,
    content,
    flags=re.DOTALL
)


# 4. Update Employee Drawer
new_drawer = """  function openEmployeeDrawer(empId) {
    const drawer = document.getElementById('employee-drawer');
    const content = document.getElementById('employee-drawer-content');
    
    window.VerdeServices.Team.getEmployees().then(emps => {
      const emp = emps.find(e => e.id === empId);
      if(!emp) return;
      const manager = emps.find(e => e.id === emp.managerId);
      const managerName = manager ? manager.firstName + ' ' + (manager.lastName||'') : 'None';
      const directReports = emps.filter(e => e.managerId === emp.id && e.status !== 'Archived').length;
      
      let yearsOfService = '0 yrs';
      if(emp.joiningDate) {
         const diff = new Date() - new Date(emp.joiningDate);
         const yrs = (diff / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
         yearsOfService = yrs + ' yrs';
      }

      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      const avatar = getAvatar(fullName, emp.avatarColor);
      
      let html = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:32px;">
          <div style="width:64px; height:64px; border-radius:50%; background:${avatar.color}20; color:${avatar.color}; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; flex-shrink:0;">${avatar.initials}</div>
          <div>
            <h2 style="font-size:20px; font-weight:900; color:var(--text-1); letter-spacing:-0.5px; margin:0 0 4px 0;">${fullName}</h2>
            <div style="font-size:14px; font-weight:600; color:var(--text-2);">${emp.role || 'Unassigned'} • ${emp.department || 'N/A'}</div>
          </div>
        </div>
        
        <div style="margin-bottom:24px;">
          <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Organization</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-1); font-weight:500;">
              <span style="color:var(--text-3);">Reports To:</span>
              <span style="font-weight:700;">${managerName}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-1); font-weight:500;">
              <span style="color:var(--text-3);">Direct Reports:</span>
              <span style="font-weight:700;">${directReports}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Contact Information</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-1); font-weight:500;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              ${emp.email || 'N/A'}
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-1); font-weight:500;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              ${emp.phone || 'N/A'}
            </div>
          </div>
        </div>
        
        <div style="margin-bottom:24px;">
          <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Employment Details</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
               <div style="font-size:12px; color:var(--text-3); font-weight:600;">Employee ID</div>
               <div style="font-size:14px; color:var(--text-1); font-weight:700;">${emp.id}</div>
            </div>
            <div>
               <div style="font-size:12px; color:var(--text-3); font-weight:600;">Status</div>
               <div style="font-size:14px; font-weight:700; display:flex; align-items:center; gap:6px;">
                 <div class="team-status-dot ${getStatusDot(emp.status)}" style="position:static; width:8px; height:8px; border:none;"></div>
                 ${emp.status}
               </div>
            </div>
            <div>
               <div style="font-size:12px; color:var(--text-3); font-weight:600;">Hire Date</div>
               <div style="font-size:14px; color:var(--text-1); font-weight:700;">${emp.joiningDate || new Date(emp.createdAt).toISOString().split('T')[0]}</div>
            </div>
            <div>
               <div style="font-size:12px; color:var(--text-3); font-weight:600;">Tenure</div>
               <div style="font-size:14px; color:var(--text-1); font-weight:700;">${yearsOfService}</div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom:24px;">
          <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Skills</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
      `;
      
      if (emp.skills) {
        emp.skills.split(',').forEach(s => {
          if (s.trim()) {
            html += `<span style="background:var(--bg-2); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; color:var(--text-2); border:1px solid var(--border);">${s.trim()}</span>`;
          }
        });
      }
      html += `</div></div>`;
      
      if (emp.notes) {
        html += `
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Notes</div>
            <div style="font-size:13px; font-weight:500; color:var(--text-2); line-height:1.5;">${emp.notes}</div>
          </div>
        `;
      }
      
      html += `<div id="emp-integrations-${emp.id}" style="margin-top:24px;"></div>`;
      
      content.innerHTML = html;
      drawer.style.display = 'flex';
      setTimeout(() => drawer.style.transform = 'translateX(0)', 10);
      
      // Integrations
      const intContainer = document.getElementById(`emp-integrations-${emp.id}`);
      if (!intContainer) return;
      
      intContainer.innerHTML = `
        <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:12px;">Assigned Work</div>
        <div style="font-size:13px; color:var(--text-3); padding:12px; background:var(--bg); border-radius:8px; border:1px dashed var(--border); text-align:center;">Loading tasks & projects...</div>
      `;
      
      // Fetch from Tasks
      if (window.VerdeServices.Tasks && window.VerdeServices.Projects) {
         Promise.all([
           window.VerdeServices.Tasks.getTasks(),
           window.VerdeServices.Projects.getProjects()
         ]).then(results => {
            const tasks = results[0].filter(t => t.assigneeId === emp.firstName || t.assigneeId === emp.id || t.assigneeId === (emp.firstName + ' ' + emp.lastName).trim());
            const projs = results[1].filter(p => (p.team || []).includes(emp.firstName) || (p.team || []).includes(emp.id) || p.manager === emp.firstName);
            
            let intHtml = `<div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:12px;">Assigned Work</div>`;
            
            intHtml += `
              <div style="display:flex; gap:12px; margin-bottom:16px;">
                <div style="flex:1; background:var(--bg-2); padding:12px; border-radius:8px; border:1px solid var(--border);">
                  <div style="font-size:20px; font-weight:800; color:var(--text-1);">${tasks.length}</div>
                  <div style="font-size:12px; font-weight:600; color:var(--text-3);">Active Tasks</div>
                </div>
                <div style="flex:1; background:var(--bg-2); padding:12px; border-radius:8px; border:1px solid var(--border);">
                  <div style="font-size:20px; font-weight:800; color:var(--text-1);">${projs.length}</div>
                  <div style="font-size:12px; font-weight:600; color:var(--text-3);">Active Projects</div>
                </div>
              </div>
            `;
            
            if (tasks.length > 0) {
               intHtml += `<div style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:8px;">Recent Tasks</div><div style="display:flex; flex-direction:column; gap:8px;">`;
               tasks.slice(0,3).forEach(t => {
                 intHtml += `
                   <div style="font-size:13px; font-weight:600; color:var(--text-1); padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:6px; display:flex; justify-content:space-between;">
                     <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</span>
                     <span style="color:var(--text-3); font-size:11px;">${t.status}</span>
                   </div>
                 `;
               });
               intHtml += `</div>`;
            }
            
            intContainer.innerHTML = intHtml;
         }).catch(() => {
            intContainer.innerHTML = `
              <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:12px;">Assigned Work</div>
              <div style="font-size:13px; color:var(--text-3); padding:12px; background:var(--bg); border-radius:8px; border:1px solid var(--border); text-align:center;">Could not load external integrations.</div>
            `;
         });
      } else {
         intContainer.innerHTML = '';
      }
    });
  }"""

content = re.sub(
    r'  function openEmployeeDrawer\(empId\) \{.*?\n  \}',
    new_drawer,
    content,
    flags=re.DOTALL
)

# 5. Update initTeamWorkspace to attach tab listeners
new_init = """  // ── INIT ──
  function initTeamWorkspace() {
    
    // Tabs Navigation
    document.querySelectorAll('.team-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.team-tab').forEach(t => {
          t.classList.remove('active');
          t.style.color = 'var(--text-3)';
          t.style.borderBottomColor = 'transparent';
        });
        this.classList.add('active');
        this.style.color = 'var(--primary)';
        this.style.borderBottomColor = 'var(--primary)';
        
        document.querySelectorAll('.team-tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('tab-' + this.dataset.tab).style.display = 'block';
        
        if (this.dataset.tab === 'departments') renderDepartments();
        if (this.dataset.tab === 'organization') renderOrganization();
      });
    });

    // Sort"""

content = content.replace("  // ── INIT ──\n  function initTeamWorkspace() {\n    \n    // Sort", new_init)


# 6. Add event listener for Create Department inside initTeamWorkspace
new_dep_listener = """
    // Modals
    const btnCreateDep = document.getElementById('btn-create-department');
    if (btnCreateDep) {
      btnCreateDep.addEventListener('click', () => {
         document.getElementById('dep-modal-title').textContent = 'Add Department';
         document.getElementById('inpDepName').value = '';
         document.getElementById('selDepHead').value = '';
         document.getElementById('create-dep-modal').dataset.editId = '';
         document.getElementById('create-dep-modal').style.display = 'flex';
         populateSelects(null);
      });
    }
    
    const btnSaveDep = document.getElementById('btn-save-dep');
    if (btnSaveDep) btnSaveDep.addEventListener('click', saveDepartment);
    
    const btnCreate = document.getElementById('btn-create-employee');"""

content = content.replace("    // Modals\n    const btnCreate = document.getElementById('btn-create-employee');", new_dep_listener)

with open('app/team/script.js', 'w') as f:
    f.write(content)
