/* ==========================================================================
   VERDE OS — TEAM MANAGEMENT WORKSPACE CONTROLLER (SPEC 010)
   Employee Search, Department Filtering & Quick Actions
   ========================================================================== */

(function () {
  'use strict';

  let teamEmployees = [];
  let teamAttendance = [];
  let teamLeaves = [];
  let teamPayroll = [];

  function loadPayrollData() {
    const stored = localStorage.getItem('verde_os_team_payroll');
    if (stored) {
      teamPayroll = JSON.parse(stored);
    } else {
      teamPayroll = [
        { id: 'PR-001', empId: 'EMP-001', month: '2026-07', basic: 150000, allowances: 50000, bonus: 0, deductions: 10000, net: 190000, status: 'Paid' },
        { id: 'PR-002', empId: 'EMP-002', month: '2026-07', basic: 80000, allowances: 20000, bonus: 5000, deductions: 3000, net: 102000, status: 'Processed' },
        { id: 'PR-003', empId: 'EMP-003', month: '2026-07', basic: 60000, allowances: 15000, bonus: 0, deductions: 2000, net: 73000, status: 'Pending' }
      ];
      savePayrollData();
    }
  }

  function savePayrollData() {
    localStorage.setItem('verde_os_team_payroll', JSON.stringify(teamPayroll));
  }

  function loadLeaveData() {
    const stored = localStorage.getItem('verde_os_team_leaves');
    if (stored) {
      teamLeaves = JSON.parse(stored);
    } else {
      teamLeaves = [
        { id: 'LV-001', empId: 'EMP-004', type: 'Sick Leave', startDate: '2026-08-10', endDate: '2026-08-12', days: 3, reason: 'Flu', status: 'Pending' },
        { id: 'LV-002', empId: 'EMP-001', type: 'Annual Leave', startDate: '2026-09-01', endDate: '2026-09-05', days: 5, reason: 'Vacation', status: 'Approved' }
      ];
      saveLeaveData();
    }
  }

  function saveLeaveData() {
    localStorage.setItem('verde_os_team_leaves', JSON.stringify(teamLeaves));
    if (typeof updateDashboardKPIs === 'function') {
      updateDashboardKPIs();
    }
  }

  function loadTeamData() {
    const stored = localStorage.getItem('verde_os_team_employees');
    if (stored) {
      teamEmployees = JSON.parse(stored);
    } else {
      teamEmployees = window.VerdeMockData && window.VerdeMockData.employees ? [...window.VerdeMockData.employees] : [];
      localStorage.setItem('verde_os_team_employees', JSON.stringify(teamEmployees));
    }
  }

  function loadAttendanceData() {
    const stored = localStorage.getItem('verde_os_team_attendance');
    if (stored) {
      const parsed = JSON.parse(stored);
      const unique = {};
      parsed.forEach(record => {
        unique[record.empId + '|' + record.date] = record;
      });
      teamAttendance = Object.values(unique);
      saveAttendanceData();
    } else {
      const today = new Date().toISOString().split('T')[0];
      teamAttendance = [
        { id: 'ATT-' + Date.now() + 1, empId: 'EMP-001', date: today, checkIn: '08:30 AM', checkOut: '05:30 PM', hours: '9h 0m', status: 'Present' },
        { id: 'ATT-' + Date.now() + 2, empId: 'EMP-002', date: today, checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 0m', status: 'Present' },
        { id: 'ATT-' + Date.now() + 3, empId: 'EMP-003', date: today, checkIn: '09:15 AM', checkOut: '06:15 PM', hours: '9h 0m', status: 'Remote' },
        { id: 'ATT-' + Date.now() + 4, empId: 'EMP-004', date: today, checkIn: '', checkOut: '', hours: '0h 0m', status: 'Leave' }
      ];
      saveAttendanceData();
    }
  }

  function saveAttendanceData() {
    localStorage.setItem('verde_os_team_attendance', JSON.stringify(teamAttendance));
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
            <button class="btn btn-ghost btn-sm team-dir-action" style="border:1px solid var(--danger-10); color:var(--danger); width: 36px; display:flex; justify-content:center; align-items:center;" onclick="window.deleteEmployee && window.deleteEmployee('${emp.id}')" title="Delete Employee">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
      `;
      grid.appendChild(card);
    });

    if (typeof updateDashboardKPIs === 'function') {
      updateDashboardKPIs();
    }
  }

  function updateDashboardKPIs() {
    const totalEl = document.getElementById('kpi-total-employees');
    const onlineEl = document.getElementById('kpi-online-now');
    const leaveEl = document.getElementById('kpi-on-leave');
    const prodEl = document.getElementById('kpi-avg-productivity');

    if (totalEl) totalEl.textContent = teamEmployees.length;

    let onlineCount = 0;
    let leaveCount = 0;
    let totalProd = 0;
    let countProd = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const onLeaveEmpIds = new Set();
    
    if (typeof teamLeaves !== 'undefined') {
        teamLeaves.forEach(lv => {
            if (lv.status === 'Approved' && lv.startDate <= today && lv.endDate >= today) {
                onLeaveEmpIds.add(lv.empId);
            }
        });
    }

    teamEmployees.forEach(emp => {
      if (onLeaveEmpIds.has(emp.id)) {
          leaveCount++;
      } else {
          const status = (emp.status || 'Active').toLowerCase();
          if (status === 'online' || status === 'active') {
              onlineCount++;
          }
      }
      
      if (emp.productivity !== undefined && emp.productivity !== null) {
          const val = parseInt(emp.productivity);
          if (!isNaN(val)) {
              totalProd += val;
              countProd++;
          }
      }
    });

    if (onlineEl) onlineEl.textContent = onlineCount;
    if (leaveEl) leaveEl.textContent = leaveCount;
    
    if (prodEl) {
        if (countProd > 0) {
            prodEl.textContent = Math.round(totalProd / countProd) + '%';
        } else {
            prodEl.textContent = '0%';
        }
    }
  }

  function renderAttendanceKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = teamAttendance.filter(a => a.date === today);
    
    let present = 0, absent = 0, onLeave = 0;
    todaysRecords.forEach(r => {
      if (['Present', 'Remote', 'Half Day'].includes(r.status)) present++;
      if (r.status === 'Absent') absent++;
      if (r.status === 'Leave') onLeave++;
    });

    const elPresent = document.getElementById('kpi-present');
    const elAbsent = document.getElementById('kpi-absent');
    const elLeave = document.getElementById('kpi-leave');
    
    if (elPresent) elPresent.textContent = present;
    if (elAbsent) elAbsent.textContent = absent;
    if (elLeave) elLeave.textContent = onLeave;
    
    let totalMins = 0;
    let count = 0;
    teamAttendance.forEach(r => {
      if (r.hours && r.hours !== '0h 0m') {
        const parts = r.hours.split(' ');
        if (parts.length === 2) {
          const h = parseInt(parts[0]) || 0;
          const m = parseInt(parts[1]) || 0;
          totalMins += (h * 60 + m);
          count++;
        }
      }
    });
    const avgMins = count > 0 ? Math.floor(totalMins / count) : 0;
    const avgH = Math.floor(avgMins / 60);
    const avgM = avgMins % 60;
    const elAvgHours = document.getElementById('kpi-avg-hours');
    if (elAvgHours) elAvgHours.textContent = `${avgH}h ${avgM}m`;
  }

  function renderAttendanceTable() {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (teamAttendance.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-3);">No attendance records found</td></tr>`;
      return;
    }
    
    const sorted = [...teamAttendance].reverse();
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    
    sorted.forEach(record => {
      const emp = teamEmployees.find(e => e.id === record.empId) || { name: 'Unknown', id: record.empId, department: 'N/A', initials: 'XX', avatarBg: 'var(--text-3)' };
      const statusColor = record.status === 'Present' || record.status === 'Remote' ? 'success' : record.status === 'Leave' || record.status === 'Half Day' ? 'warning' : 'danger';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="team-avatar-lg" style="width:32px; height:32px; font-size:11px; background:${emp.avatarBg || 'var(--primary)'}-10; color:${emp.avatarBg || 'var(--primary)'};">${emp.initials || 'XX'}</div>
            <span style="font-weight:700;">${emp.name}</span>
          </div>
        </td>
        <td style="color:var(--text-2); font-size:13px;">${emp.id}</td>
        <td style="color:var(--text-2); font-size:13px;">${emp.department || 'N/A'}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.date}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.checkIn || '--'}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.checkOut || '--'}</td>
        <td style="font-weight:700;">${record.hours || '0h 0m'}</td>
        <td><span class="badge badge-${statusColor}">${record.status}</span></td>
        <td style="text-align: right;">
          ${isAdmin ? `
          <button class="btn btn-sm btn-ghost" style="margin-right:4px;" onclick="window.openMarkAttendanceModal('${record.id}')">Edit</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="window.deleteAttendanceRecord('${record.id}')">Delete</button>
          ` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderLeaveTable() {
    const tbody = document.getElementById('leave-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    const myEmpId = window.resolveCurrentUserEmpId ? window.resolveCurrentUserEmpId() : (window.VERDE_SESSION ? window.VERDE_SESSION.getUser().id : null);
    
    let filteredLeaves = isAdmin ? teamLeaves : teamLeaves.filter(r => r.empId === myEmpId);
    
    if (filteredLeaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:32px; color:var(--text-3);">No leave requests found</td></tr>`;
      return;
    }
    
    const sorted = [...filteredLeaves].reverse();
    
    sorted.forEach(record => {
      const emp = teamEmployees.find(e => e.id === record.empId) || { name: 'Unknown', id: record.empId, department: 'N/A', initials: 'XX', avatarBg: 'var(--text-3)' };
      const statusColor = record.status === 'Approved' ? 'success' : record.status === 'Pending' ? 'warning' : record.status === 'Cancelled' ? 'text-3' : 'danger';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="team-avatar-lg" style="width:32px; height:32px; font-size:11px; background:${emp.avatarBg || 'var(--primary)'}-10; color:${emp.avatarBg || 'var(--primary)'};">${emp.initials || 'XX'}</div>
            <span style="font-weight:700;">${emp.name}</span>
          </div>
        </td>
        <td style="color:var(--text-2); font-size:13px;">${emp.id}</td>
        <td style="color:var(--text-2); font-size:13px;">${emp.department || 'N/A'}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.type}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.startDate}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.endDate}</td>
        <td style="font-weight:700;">${record.days}</td>
        <td style="color:var(--text-2); font-size:13px;">${record.reason || '--'}</td>
        <td><span class="badge badge-${statusColor}" style="${record.status === 'Cancelled' ? 'background:var(--bg-2); color:var(--text-2);' : ''}">${record.status}</span></td>
        <td style="text-align: right;">
        <td style="text-align: right;">
          ${isAdmin ? `
            ${record.status === 'Pending' ? `
              <button class="btn btn-sm btn-ghost" style="color:var(--success); margin-right:4px;" onclick="window.approveLeave('${record.id}')">Approve</button>
              <button class="btn btn-sm btn-ghost" style="color:var(--danger); margin-right:4px;" onclick="window.rejectLeave('${record.id}')">Reject</button>
            ` : record.status === 'Approved' ? `
              <button class="btn btn-sm btn-ghost" style="color:var(--warning); margin-right:4px;" onclick="window.cancelLeave('${record.id}')">Cancel</button>
            ` : ''}
            <button class="btn btn-sm btn-ghost" style="margin-right:4px;" onclick="window.openLeaveModal('${record.id}')">Edit</button>
            <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="window.deleteLeaveRecord('${record.id}')">Delete</button>
          ` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderLeaveKPIs() {
    let pending = 0, approvedToday = 0, active = 0;
    const today = new Date().toISOString().split('T')[0];
    
    teamLeaves.forEach(r => {
      if (r.status === 'Pending') pending++;
      if (r.status === 'Approved' && r.startDate <= today && r.endDate >= today) active++;
      if (r.status === 'Approved') approvedToday++;
    });

    const elPending = document.getElementById('kpi-leave-pending');
    const elApproved = document.getElementById('kpi-leave-approved');
    const elActive = document.getElementById('kpi-leave-active');
    
    if (elPending) elPending.textContent = pending;
    if (elApproved) elApproved.textContent = approvedToday;
    if (elActive) elActive.textContent = active;
  }

  function formatCurrency(num) {
    return '₹' + Number(num).toLocaleString('en-IN');
  }

  function renderPayrollTable() {
    const tbody = document.getElementById('payroll-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (teamPayroll.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:32px; color:var(--text-3);">No payroll records found</td></tr>`;
      return;
    }
    
    const sorted = [...teamPayroll].reverse();
    
    sorted.forEach(record => {
      const emp = teamEmployees.find(e => e.id === record.empId) || { name: 'Unknown', id: record.empId, department: 'N/A', initials: 'XX', avatarBg: 'var(--text-3)' };
      const statusColor = record.status === 'Paid' ? 'success' : record.status === 'Processed' ? 'info' : 'warning';
      
      const monthStr = new Date(record.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="team-avatar-lg" style="width:32px; height:32px; font-size:11px; background:${emp.avatarBg || 'var(--primary)'}-10; color:${emp.avatarBg || 'var(--primary)'};">${emp.initials || 'XX'}</div>
            <span style="font-weight:700;">${emp.name}</span>
          </div>
        </td>
        <td style="color:var(--text-2); font-size:13px;">${emp.id}</td>
        <td style="color:var(--text-2); font-size:13px;">${emp.department || 'N/A'}</td>
        <td style="color:var(--text-2); font-size:13px; font-weight:600;">${monthStr}</td>
        <td style="color:var(--text-2); font-size:13px;">${formatCurrency(record.basic)}</td>
        <td style="color:var(--text-2); font-size:13px;">${formatCurrency(record.allowances)}</td>
        <td style="color:var(--text-2); font-size:13px;">${formatCurrency(record.bonus)}</td>
        <td style="color:var(--danger); font-size:13px;">${formatCurrency(record.deductions)}</td>
        <td style="font-weight:800; color:var(--text-1); font-size:14px;">${formatCurrency(record.net)}</td>
        <td><span class="badge badge-${statusColor}">${record.status}</span></td>
        <td style="text-align: right; min-width: 320px;">
          <button class="btn btn-sm btn-ghost" style="color:var(--primary); margin-right:4px;" onclick="window.generatePayslip('${record.id}')">View Payslip</button>
          <button class="btn btn-sm btn-ghost" style="margin-right:4px; ${record.status === 'Paid' ? 'opacity:0.5; cursor:not-allowed;' : ''}" onclick="window.editPayrollModal('${record.id}')" ${record.status === 'Paid' ? 'disabled' : ''}>Edit Payroll</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--success); margin-right:4px; ${record.status === 'Paid' ? 'opacity:0.5; cursor:not-allowed;' : ''}" onclick="window.markPayrollPaid('${record.id}')" ${record.status === 'Paid' ? 'disabled' : ''}>Mark as Paid</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--danger);" onclick="window.deletePayrollRecord('${record.id}')">Delete Payroll</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderPayrollKPIs() {
    let totalPayroll = 0;
    let paidCount = 0;
    let pendingCount = 0;
    
    teamPayroll.forEach(r => {
      totalPayroll += Number(r.net) || 0;
      if (r.status === 'Paid') {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    const avgSalary = teamPayroll.length > 0 ? (totalPayroll / teamPayroll.length) : 0;

    const elTotal = document.getElementById('kpi-payroll-total');
    const elPaid = document.getElementById('kpi-payroll-paid');
    const elPending = document.getElementById('kpi-payroll-pending');
    const elAvg = document.getElementById('kpi-payroll-avg');
    
    if (elTotal) elTotal.textContent = formatCurrency(totalPayroll);
    if (elPaid) elPaid.textContent = paidCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elAvg) elAvg.textContent = formatCurrency(Math.round(avgSalary));
  }

  function resolveCurrentUserEmpId() {
    const sessionUser = window.VERDE_SESSION && typeof window.VERDE_SESSION.getUser === 'function' ? window.VERDE_SESSION.getUser() : null;
    if (!sessionUser) return null;

    const sId = sessionUser.userId || sessionUser.id;

    let matched = sId ? teamEmployees.find(e => e.id === sId) : null;
    if (matched) return matched.id;

    const sessionNum = sId ? String(sId).replace(/\D/g, '') : null;
    if (sessionNum) {
      matched = teamEmployees.find(e => e.id && String(e.id).replace(/\D/g, '') === sessionNum);
      if (matched) return matched.id;
    }

    if (sessionUser.email) {
      matched = teamEmployees.find(e => e.email && e.email.toLowerCase() === sessionUser.email.toLowerCase());
      if (matched) return matched.id;
    }

    if (sessionUser.name) {
      matched = teamEmployees.find(e => e.name && e.name.toLowerCase() === sessionUser.name.toLowerCase());
      if (matched) return matched.id;
    }

    return null;
  }

  window.openMarkAttendanceModal = function(recordId = null) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    const myEmpId = resolveCurrentUserEmpId();

    if (!isAdmin && !myEmpId) {
      if(window.VerdeToast) window.VerdeToast.error('Access Denied');
      return;
    }

    let editRecord = null;
    if (recordId) {
      editRecord = teamAttendance.find(r => r.id === recordId);
      if (!editRecord) return;
      if (!isAdmin) {
        if(window.VerdeToast) window.VerdeToast.error('Only administrators can edit attendance.');
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let empOptions = '';
    
    if (isAdmin) {
      empOptions = teamEmployees.map(e => `<option value="${e.id}" ${editRecord && editRecord.empId === e.id ? 'selected' : (!editRecord && myEmpId === e.id ? 'selected' : '')}>${e.name} (${e.id})</option>`).join('');
    } else {
      const myEmp = teamEmployees.find(e => e.id === myEmpId);
      if (myEmp) {
        empOptions = `<option value="${myEmp.id}" selected>${myEmp.name} (${myEmp.id})</option>`;
      }
    }

    const formHtml = `
      <style>
        .att-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .att-form-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .att-form-input, .att-form-select { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; outline: none; background: var(--bg); color: var(--text-1); font-family: inherit; font-size: 13px; width: 100%; box-sizing: border-box; }
        .att-form-input:focus, .att-form-select:focus { border-color: var(--primary); }
      </style>
      <div id="attendance-modal-form">
        <div class="att-form-group">
          <label class="att-form-label">Employee</label>
          ${isAdmin 
            ? `<select id="att-empId" class="att-form-select" ${editRecord ? 'disabled' : ''}>${empOptions}</select>`
            : `<input type="text" class="att-form-input" value="${(teamEmployees.find(e => e.id === myEmpId) || {}).name} (${myEmpId})" readonly>
               <input type="hidden" id="att-empId" value="${myEmpId}">`
          }
        </div>
        <div class="att-form-group">
          <label class="att-form-label">Date</label>
          ${isAdmin
            ? `<input type="date" id="att-date" class="att-form-input" value="${editRecord ? editRecord.date : today}">`
            : `<input type="date" id="att-date" class="att-form-input" value="${today}" min="${today}" max="${today}" readonly>`
          }
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="att-form-group">
            <label class="att-form-label">Check-in Time</label>
            <input type="time" id="att-checkin" class="att-form-input" value="${editRecord && editRecord.checkIn ? convertToTimeInput(editRecord.checkIn) : '09:00'}">
          </div>
          <div class="att-form-group">
            <label class="att-form-label">Check-out Time</label>
            <input type="time" id="att-checkout" class="att-form-input" value="${editRecord && editRecord.checkOut ? convertToTimeInput(editRecord.checkOut) : '17:00'}">
          </div>
        </div>
        ${isAdmin ? `
        <div class="att-form-group">
          <label class="att-form-label">Status</label>
          <select id="att-status" class="att-form-select">
            <option value="Present" ${editRecord && editRecord.status === 'Present' ? 'selected' : ''}>Present</option>
            <option value="Remote" ${editRecord && editRecord.status === 'Remote' ? 'selected' : ''}>Remote</option>
            <option value="Half Day" ${editRecord && editRecord.status === 'Half Day' ? 'selected' : ''}>Half Day</option>
            <option value="Absent" ${editRecord && editRecord.status === 'Absent' ? 'selected' : ''}>Absent</option>
            <option value="Leave" ${editRecord && editRecord.status === 'Leave' ? 'selected' : ''}>Leave</option>
          </select>
        </div>
        ` : `<input type="hidden" id="att-status" value="Present">`}
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.create) {
      window.VerdeModal.create(
        editRecord ? 'Edit Attendance' : 'Mark Attendance',
        formHtml,
        function() {
        let empId = document.getElementById('att-empId').value;
        let date = document.getElementById('att-date').value;
        const checkin = document.getElementById('att-checkin').value;
        const checkout = document.getElementById('att-checkout').value;
        let status = document.getElementById('att-status').value;
        
        const currentLocalToday = new Date().toISOString().split('T')[0];
        
        if (!isAdmin) {
          empId = myEmpId;
          date = currentLocalToday;
          status = 'Present';
          
          if (empId !== myEmpId || date !== currentLocalToday || status !== 'Present') {
            if (window.VerdeToast) window.VerdeToast.error('Invalid member data.');
            return;
          }
        }

        if (!empId || !date) {
          if (window.VerdeToast) window.VerdeToast.error('Employee and Date are required.');
          return;
        }
        
        if (!editRecord) {
          const duplicate = teamAttendance.find(r => r.empId === empId && r.date === date);
          if (duplicate) {
            if (!isAdmin) {
              if (window.VerdeToast) window.VerdeToast.error('Attendance already marked for today.');
            } else {
              if (window.VerdeToast) window.VerdeToast.error('Attendance already exists for this employee on this date.');
            }
            setTimeout(() => window.openMarkAttendanceModal(editRecord ? editRecord.id : null), 250);
            return;
          }
        }

        let hoursStr = '0h 0m';
        let checkInFormatted = '';
        let checkOutFormatted = '';
        
        if (checkin && checkout && !['Absent', 'Leave'].includes(status)) {
          const t1 = checkin.split(':');
          const t2 = checkout.split(':');
          let m1 = parseInt(t1[0]) * 60 + parseInt(t1[1]);
          let m2 = parseInt(t2[0]) * 60 + parseInt(t2[1]);
          if (m2 < m1) m2 += 24 * 60;
          const diff = m2 - m1;
          hoursStr = `${Math.floor(diff/60)}h ${diff%60}m`;
          checkInFormatted = formatAMPM(new Date(2000, 0, 1, t1[0], t1[1]));
          checkOutFormatted = formatAMPM(new Date(2000, 0, 1, t2[0], t2[1]));
        } else if (status === 'Absent' || status === 'Leave') {
          checkInFormatted = '--';
          checkOutFormatted = '--';
        } else {
            if (checkin) checkInFormatted = formatAMPM(new Date(2000, 0, 1, checkin.split(':')[0], checkin.split(':')[1]));
            if (checkout) checkOutFormatted = formatAMPM(new Date(2000, 0, 1, checkout.split(':')[0], checkout.split(':')[1]));
        }

        if (editRecord) {
          editRecord.empId = empId;
          editRecord.date = date;
          editRecord.checkIn = checkInFormatted;
          editRecord.checkOut = checkOutFormatted;
          editRecord.hours = hoursStr;
          editRecord.status = status;
        } else {
          teamAttendance.push({
            id: 'ATT-' + Date.now(),
            empId: empId,
            date: date,
            checkIn: checkInFormatted,
            checkOut: checkOutFormatted,
            hours: hoursStr,
            status: status
          });
        }
        
        saveAttendanceData();
        renderAttendanceTable();
        renderAttendanceKPIs();
        if (window.VerdeToast) window.VerdeToast.success('Attendance record saved successfully.');
      });
    }
  };

  window.deleteAttendanceRecord = function(recordId) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_remove');
    const myEmpId = resolveCurrentUserEmpId();
    
    const record = teamAttendance.find(r => r.id === recordId);
    if (!record) return;

    if (!isAdmin) {
      if(window.VerdeToast) window.VerdeToast.error('Only administrators can delete attendance.');
      return;
    }
    if (window.VerdeModal && window.VerdeModal.delete) {
      window.VerdeModal.delete(
        'Delete Record',
        'Are you sure you want to delete this attendance record?',
        function() {
          teamAttendance = teamAttendance.filter(r => r.id !== recordId);
          saveAttendanceData();
          renderAttendanceTable();
          renderAttendanceKPIs();
          if (window.VerdeToast) window.VerdeToast.success('Record deleted.');
        }
      );
    }
  };

  function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  }
  
  function convertToTimeInput(timeStr) {
    if (!timeStr || timeStr === '--') return '';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '';
    let h = parseInt(match[1]);
    const m = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return (h < 10 ? '0'+h : h) + ':' + m;
  }

  function initTeamWorkspace() {
    loadTeamData();
    loadAttendanceData();
    loadLeaveData();
    loadPayrollData();
    renderTeamDirectory();
    renderAttendanceTable();
    renderAttendanceKPIs();
    renderLeaveTable();
    renderLeaveKPIs();
    renderPayrollTable();
    renderPayrollKPIs();

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

    const tabs = document.querySelectorAll('.team-main-tab');
    const views = document.querySelectorAll('.view-content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');
      });
    });
    
    const attSearch = document.getElementById('attendance-search-input');
    if (attSearch) {
        attSearch.addEventListener('input', function(e) {
            const q = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#attendance-table-body tr');
            rows.forEach(r => {
                const text = r.textContent.toLowerCase();
                r.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    const lvSearch = document.getElementById('leave-search-input');
    if (lvSearch) {
        lvSearch.addEventListener('input', function(e) {
            const q = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#leave-table-body tr');
            rows.forEach(r => {
                const text = r.textContent.toLowerCase();
                r.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    const prSearch = document.getElementById('payroll-search-input');
    if (prSearch) {
        prSearch.addEventListener('input', function(e) {
            const q = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#payroll-table-body tr');
            rows.forEach(r => {
                const text = r.textContent.toLowerCase();
                r.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }
  }

    window.openAddEmployeeModal = function(editEmpId = null) {
      if (editEmpId && window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
      if (!editEmpId && window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_add')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
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
    const emp = teamEmployees.find(e => e.id === empId);
    if (!emp) {
      if (window.VerdeToast) window.VerdeToast.error('Employee details not found.');
      return;
    }

    const ini = emp.initials || (emp.name ? emp.name.substring(0, 2).toUpperCase() : 'XX');
    const bg = emp.avatarBg || 'var(--primary)';
    
    const status = (emp.status || 'Offline');
    const statusColor = status.toLowerCase() === 'online' || status.toLowerCase() === 'active' ? 'success' : status.toLowerCase() === 'busy' || status.toLowerCase() === 'on leave' ? 'warning' : 'text-3';

    let skillsHtml = '<div style="color: var(--text-3); font-size: 13px; font-weight: 500;">No Data Available</div>';
    if (emp.skills && emp.skills.length > 0) {
      skillsHtml = emp.skills.map(s => `<span class="profile-skill">${s}</span>`).join('');
    } else if (!emp.skills) {
      // Mock some default skills if none exist to match original behavior slightly, but strictly user said "Use existing employee data. If unavailable, display No Data Available"
      // Wait, let's adhere strictly: if not available, show No Data Available.
    }

    const v = (val) => (val !== undefined && val !== null && val !== '') ? val : 'No Data Available';

    const empAttendance = teamAttendance.filter(a => a.empId === empId).reverse();
    let attHtml = '';
    if (empAttendance.length === 0) {
      attHtml = `<div style="text-align: center; padding: 60px 0; color: var(--text-3); font-size: 14px; font-weight: 600;">No Data Available</div>`;
    } else {
      attHtml = `
        <table class="table-enterprise" style="margin-top:0;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${empAttendance.map(a => `
              <tr>
                <td style="color:var(--text-2); font-size:13px;">${a.date}</td>
                <td style="color:var(--text-2); font-size:13px;">${a.checkIn || '--'}</td>
                <td style="color:var(--text-2); font-size:13px;">${a.checkOut || '--'}</td>
                <td style="font-weight:700; font-size:13px;">${a.hours || '0h 0m'}</td>
                <td><span class="badge badge-${a.status === 'Present' || a.status === 'Remote' ? 'success' : a.status === 'Leave' || a.status === 'Half Day' ? 'warning' : 'danger'}">${a.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const empLeaves = teamLeaves.filter(l => l.empId === empId).reverse();
    let leaveHtml = '';
    if (empLeaves.length === 0) {
      leaveHtml = `<div style="text-align: center; padding: 60px 0; color: var(--text-3); font-size: 14px; font-weight: 600;">No Leave History Available</div>`;
    } else {
      leaveHtml = `
        <table class="table-enterprise" style="margin-top:0;">
          <thead>
            <tr>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${empLeaves.map(l => {
              const stColor = l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : l.status === 'Cancelled' ? 'text-3' : 'danger';
              return `
              <tr>
                <td style="color:var(--text-2); font-size:13px; font-weight:600;">${l.type}</td>
                <td style="color:var(--text-2); font-size:13px;">${l.startDate}</td>
                <td style="color:var(--text-2); font-size:13px;">${l.endDate}</td>
                <td style="font-weight:700; font-size:13px;">${l.days}</td>
                <td><span class="badge badge-${stColor}" style="${l.status === 'Cancelled' ? 'background:var(--bg-2); color:var(--text-2);' : ''}">${l.status}</span></td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      `;
    }

    const profileHtml = `
      <style>
        .profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; flex-shrink: 0; }
        .profile-info { flex: 1; }
        .profile-name { font-size: 24px; font-weight: 800; color: var(--text-1); margin-bottom: 4px; display: flex; align-items: center; }
        .profile-role { font-size: 14px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
        
        .profile-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .profile-summary-card { background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
        .profile-summary-val { font-size: 20px; font-weight: 800; color: var(--text-1); }
        .profile-summary-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; margin-top: 4px; }
        
        .profile-tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 24px; gap: 24px; }
        .profile-tab { padding: 8px 0; font-size: 14px; font-weight: 700; color: var(--text-3); cursor: pointer; border-bottom: 2px solid transparent; }
        .profile-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        
        .profile-tab-content { display: none; }
        .profile-tab-content.active { display: block; }
        
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .profile-section { display: flex; flex-direction: column; gap: 16px; }
        .profile-field { display: flex; flex-direction: column; gap: 4px; }
        .profile-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .profile-val { font-size: 14px; font-weight: 500; color: var(--text-1); }
        
        .profile-skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .profile-skill { font-size: 11px; font-weight: 600; padding: 4px 10px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; color: var(--text-2); }
      </style>

      <div style="max-height: 70vh; overflow-y: auto; padding-right: 8px; width: 650px; max-width: 100%;" id="employee-profile-container">
        
        <div class="profile-header">
          <div class="profile-avatar" style="background: ${bg}-10; color: ${bg};">${ini}</div>
          <div class="profile-info">
            <div class="profile-name">
              ${v(emp.name)} 
              <span class="badge" style="margin-left: 12px; font-size:12px; font-weight:700; padding: 4px 10px; border-radius: 12px; background: var(--${statusColor}-10); color: var(--${statusColor}); line-height: 1;">${status}</span>
            </div>
            <div class="profile-role">${v(emp.role)} • ${v(emp.department)}</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-3); margin-top: 4px;">Employee ID: ${v(emp.id)}</div>
          </div>
        </div>

        <div class="profile-summary-grid">
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.workload)}</div>
            <div class="profile-summary-label">Current Workload</div>
          </div>
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.assignedProjects)}</div>
            <div class="profile-summary-label">Assigned Projects</div>
          </div>
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.assignedTasks)}</div>
            <div class="profile-summary-label">Assigned Tasks</div>
          </div>
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.completedTasks)}</div>
            <div class="profile-summary-label">Completed Tasks</div>
          </div>
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.productivity)}</div>
            <div class="profile-summary-label">Productivity %</div>
          </div>
          <div class="profile-summary-card">
            <div class="profile-summary-val">${v(emp.attendancePct)}</div>
            <div class="profile-summary-label">Attendance %</div>
          </div>
        </div>

        <div class="profile-tabs">
          <div class="profile-tab active" data-tab="overview">Overview</div>
          <div class="profile-tab" data-tab="projects">Projects</div>
          <div class="profile-tab" data-tab="tasks">Tasks</div>
          <div class="profile-tab" data-tab="attendance">Attendance</div>
          <div class="profile-tab" data-tab="leave">Leaves</div>
          <div class="profile-tab" data-tab="documents">Documents</div>
        </div>
        
        <div class="profile-tab-content active" id="tab-overview">
          <div class="profile-grid">
            <div class="profile-section">
              <div class="profile-field">
                <div class="profile-label">Employment Type</div>
                <div class="profile-val">${v(emp.employmentType)}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Reporting Manager</div>
                <div class="profile-val">${v(emp.manager)}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Joining Date</div>
                <div class="profile-val">${v(emp.joinDate)}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Company Email</div>
                <div class="profile-val">${v(emp.email)}</div>
              </div>
            </div>
            <div class="profile-section">
              <div class="profile-field">
                <div class="profile-label">Personal Email</div>
                <div class="profile-val">${v(emp.personalEmail)}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Phone Number</div>
                <div class="profile-val">${v(emp.phone)}</div>
              </div>
              <div class="profile-field">
                <div class="profile-label">Emergency Contact</div>
                <div class="profile-val">${v(emp.emergencyContact)}</div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 24px;">
            <div class="profile-field" style="margin-bottom: 24px;">
              <div class="profile-label" style="margin-bottom: 8px;">Skills</div>
              <div class="profile-skills">
                ${skillsHtml}
              </div>
            </div>
            <div class="profile-field">
              <div class="profile-label" style="margin-bottom: 8px;">Notes</div>
              <div class="profile-val" style="background: var(--bg-2); padding: 16px; border-radius: 12px; line-height: 1.6;">${v(emp.notes)}</div>
            </div>
          </div>
        </div>

        <div class="profile-tab-content" id="tab-projects">
          <div style="text-align: center; padding: 60px 0; color: var(--text-3); font-size: 14px; font-weight: 600;">No Data Available</div>
        </div>
        <div class="profile-tab-content" id="tab-tasks">
          <div style="text-align: center; padding: 60px 0; color: var(--text-3); font-size: 14px; font-weight: 600;">No Data Available</div>
        </div>
        <div class="profile-tab-content" id="tab-attendance">
          ${attHtml}
        </div>
        <div class="profile-tab-content" id="tab-leave">
          ${leaveHtml}
        </div>
        <div class="profile-tab-content" id="tab-documents">
          <div style="text-align: center; padding: 60px 0; color: var(--text-3); font-size: 14px; font-weight: 600;">No Data Available</div>
        </div>
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.confirm) {
      window.VerdeModal.confirm({
        title: 'Employee Profile',
        body: profileHtml,
        confirmText: 'Close',
        confirmClass: 'btn-ghost',
        cancelText: '', // Hide cancel button
      });

      setTimeout(() => {
        const modals = document.querySelectorAll('.modal-overlay.active');
        if (!modals.length) return;
        const modal = modals[modals.length - 1];

        // Hide cancel button
        const cancelBtn = modal.querySelector('.modal-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        // Fix modal width
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.maxWidth = '700px';
          modalContent.style.width = '100%';
        }

        // Tab Switching Logic
        const tabs = modal.querySelectorAll('.profile-tab');
        const contents = modal.querySelectorAll('.profile-tab-content');

        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            // Remove active from all tabs & contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');

            // Show corresponding content
            const targetId = 'tab-' + tab.getAttribute('data-tab');
            const targetContent = modal.querySelector('#' + targetId);
            if (targetContent) {
              targetContent.classList.add('active');
            }
          });
        });
      }, 10);
    } else {
      alert('Modal system missing!');
    }
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

  window.deleteEmployee = function(empId) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_remove')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    const emp = teamEmployees.find(e => e.id === empId);
    if (!emp) return;

    const fn = (emp.name || '').split(' ')[0] || '';
    const ln = (emp.name || '').split(' ')[1] || '';
    const initials = (emp.initials || (fn.substring(0,1) + ln.substring(0,1)) || 'XX').toUpperCase();

    const hasProjects = window.VerdeMockData && window.VerdeMockData.projects && window.VerdeMockData.projects.some(p => p.status === 'Active' && p.team && p.team.includes(initials));
    const hasTasks = window.VerdeMockData && window.VerdeMockData.tasks && window.VerdeMockData.tasks.some(t => t.status !== 'Completed' && t.assigneeInitials === initials);

    const hasAssignedProjectsField = parseInt(emp.assignedProjects, 10) > 0;
    const hasAssignedTasksField = parseInt(emp.assignedTasks, 10) > 0;

    if (hasProjects || hasTasks || hasAssignedProjectsField || hasAssignedTasksField) {
      if (window.VerdeToast) {
        window.VerdeToast.error('This employee is assigned to active work. Reassign or remove assignments before deleting.');
      } else {
        alert('This employee is assigned to active work. Reassign or remove assignments before deleting.');
      }
      return;
    }

    if (window.VerdeModal && window.VerdeModal.delete) {
      window.VerdeModal.delete(
        'Delete Employee', 
        'Are you sure you want to permanently delete this employee?', 
        function() {
          teamEmployees = teamEmployees.filter(e => e.id !== empId);
          saveTeamData();
          renderTeamDirectory();
          if (window.VerdeToast) window.VerdeToast.success('Employee deleted successfully.');
        }
      );
    } else {
      if (confirm('Are you sure you want to permanently delete this employee?')) {
        teamEmployees = teamEmployees.filter(e => e.id !== empId);
        saveTeamData();
        renderTeamDirectory();
        if (window.VerdeToast) window.VerdeToast.success('Employee deleted successfully.');
      }
    }
  };

  window.openLeaveModal = function(recordId = null) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    const myEmpId = window.resolveCurrentUserEmpId ? window.resolveCurrentUserEmpId() : (window.VERDE_SESSION ? window.VERDE_SESSION.getUser().id : null);
    
    let editRecord = null;
    if (recordId) {
      editRecord = teamLeaves.find(r => r.id === recordId);
      if (!editRecord) return;
      if (!isAdmin) {
        if (window.VerdeToast) window.VerdeToast.error('Only administrators can edit leave requests.');
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let empOptions = '';
    if (isAdmin) {
      empOptions = teamEmployees.map(e => `<option value="${e.id}" ${editRecord && editRecord.empId === e.id ? 'selected' : (!editRecord && myEmpId === e.id ? 'selected' : '')}>${e.name} (${e.id})</option>`).join('');
    }

    const formHtml = `
      <style>
        .lv-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .lv-form-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .lv-form-input, .lv-form-select, .lv-form-textarea { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; outline: none; background: var(--bg); color: var(--text-1); font-family: inherit; font-size: 13px; width: 100%; box-sizing: border-box; }
        .lv-form-input:focus, .lv-form-select:focus, .lv-form-textarea:focus { border-color: var(--primary); }
      </style>
      <div id="leave-modal-form">
        <div class="lv-form-group">
          <label class="lv-form-label">Employee</label>
          ${isAdmin 
            ? `<select id="lv-empId" class="lv-form-select" ${editRecord ? 'disabled' : ''}>${empOptions}</select>`
            : `<input type="text" class="lv-form-input" value="${(teamEmployees.find(e => e.id === myEmpId) || {}).name} (${myEmpId})" readonly>
               <input type="hidden" id="lv-empId" value="${myEmpId}">`
          }
        </div>
        <div class="lv-form-group">
          <label class="lv-form-label">Leave Type</label>
          <select id="lv-type" class="lv-form-select">
            <option value="Sick Leave" ${editRecord && editRecord.type === 'Sick Leave' ? 'selected' : ''}>Sick Leave</option>
            <option value="Annual Leave" ${editRecord && editRecord.type === 'Annual Leave' ? 'selected' : ''}>Annual Leave</option>
            <option value="Casual Leave" ${editRecord && editRecord.type === 'Casual Leave' ? 'selected' : ''}>Casual Leave</option>
            <option value="Unpaid Leave" ${editRecord && editRecord.type === 'Unpaid Leave' ? 'selected' : ''}>Unpaid Leave</option>
          </select>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="lv-form-group">
            <label class="lv-form-label">Start Date</label>
            <input type="date" id="lv-start" class="lv-form-input" value="${editRecord ? editRecord.startDate : today}" onchange="window.calculateLeaveDays()">
          </div>
          <div class="lv-form-group">
            <label class="lv-form-label">End Date</label>
            <input type="date" id="lv-end" class="lv-form-input" value="${editRecord ? editRecord.endDate : today}" onchange="window.calculateLeaveDays()">
          </div>
        </div>
        <div class="lv-form-group">
          <label class="lv-form-label">Total Days</label>
          <input type="number" id="lv-days" class="lv-form-input" value="${editRecord ? editRecord.days : 1}" readonly style="background: var(--bg-2);">
        </div>
        <div class="lv-form-group">
          <label class="lv-form-label">Reason</label>
          <textarea id="lv-reason" class="lv-form-textarea" rows="3">${editRecord ? editRecord.reason : ''}</textarea>
        </div>
        ${isAdmin ? `
        <div class="lv-form-group">
          <label class="lv-form-label">Status</label>
          <select id="lv-status" class="lv-form-select">
            <option value="Pending" ${editRecord && editRecord.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Approved" ${editRecord && editRecord.status === 'Approved' ? 'selected' : ''}>Approved</option>
            <option value="Rejected" ${editRecord && editRecord.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            <option value="Cancelled" ${editRecord && editRecord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        ` : ``}
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.create) {
      window.VerdeModal.create(
        editRecord ? 'Edit Leave Request' : 'Create Leave Request',
        formHtml,
        function() {
          let empId = document.getElementById('lv-empId').value;
          const type = document.getElementById('lv-type').value;
          const start = document.getElementById('lv-start').value;
          const end = document.getElementById('lv-end').value;
          const days = parseInt(document.getElementById('lv-days').value) || 0;
          const reason = document.getElementById('lv-reason').value;
          let statusElement = document.getElementById('lv-status');
          let status = statusElement ? statusElement.value : 'Pending';

          const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
          const myEmpId = window.resolveCurrentUserEmpId ? window.resolveCurrentUserEmpId() : (window.VERDE_SESSION ? window.VERDE_SESSION.getUser().id : null);

          if (!isAdmin) {
            if (empId !== myEmpId) {
              if (window.VerdeToast) window.VerdeToast.error('You can only submit leave for yourself.');
              return;
            }
            empId = myEmpId;
            status = 'Pending';
          }

          if (!empId || !start || !end) {
            if (window.VerdeToast) window.VerdeToast.error('Please fill in all required fields.');
            return;
          }

          if (new Date(end) < new Date(start)) {
            if (window.VerdeToast) window.VerdeToast.error('End Date cannot be before Start Date.');
            return;
          }

          const overlapping = teamLeaves.find(r => 
            r.empId === empId && 
            r.status !== 'Rejected' && r.status !== 'Cancelled' &&
            ((start >= r.startDate && start <= r.endDate) || (end >= r.startDate && end <= r.endDate) || (start <= r.startDate && end >= r.endDate)) &&
            (!editRecord || r.id !== editRecord.id)
          );

          if (overlapping) {
            if (window.VerdeToast) window.VerdeToast.error('Leave request overlaps with an existing request for this employee.');
            return;
          }

          if (editRecord) {
            editRecord.empId = empId;
            editRecord.type = type;
            editRecord.startDate = start;
            editRecord.endDate = end;
            editRecord.days = days;
            editRecord.reason = reason;
            editRecord.status = status;
          } else {
            teamLeaves.push({
              id: 'LV-' + Date.now(),
              empId: empId,
              type: type,
              startDate: start,
              endDate: end,
              days: days,
              reason: reason,
              status: status
            });
          }
          
          saveLeaveData();
          renderLeaveTable();
          renderLeaveKPIs();
          
          if (window.VerdeToast) window.VerdeToast.success(editRecord ? 'Leave request updated.' : 'Leave request submitted.');
        }
      );
    }
  };

  window.calculateLeaveDays = function() {
    const start = document.getElementById('lv-start').value;
    const end = document.getElementById('lv-end').value;
    if (start && end) {
        const d1 = new Date(start);
        const d2 = new Date(end);
        if (d2 >= d1) {
            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            document.getElementById('lv-days').value = diffDays;
        } else {
            document.getElementById('lv-days').value = 0;
        }
    }
  };

  window.deleteLeaveRecord = function(recordId) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    if (!isAdmin) { if(window.VerdeToast) window.VerdeToast.error('Only administrators can delete leave requests.'); return; }
    if (window.VerdeModal && window.VerdeModal.delete) {
      window.VerdeModal.delete(
        'Delete Request',
        'Are you sure you want to delete this leave request?',
        function() {
          teamLeaves = teamLeaves.filter(r => r.id !== recordId);
          saveLeaveData();
          renderLeaveTable();
          renderLeaveKPIs();
          if (window.VerdeToast) window.VerdeToast.success('Leave request deleted.');
        }
      );
    }
  };

  window.approveLeave = function(recordId) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    if (!isAdmin) { if(window.VerdeToast) window.VerdeToast.error('Only administrators can manage leave approvals.'); return; }
    const record = teamLeaves.find(r => r.id === recordId);
    if (record) {
      record.status = 'Approved';
      saveLeaveData();
      renderLeaveTable();
      renderLeaveKPIs();
      if (window.VerdeToast) window.VerdeToast.success('Leave approved.');
    }
  };

  window.rejectLeave = function(recordId) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    if (!isAdmin) { if(window.VerdeToast) window.VerdeToast.error('Only administrators can manage leave approvals.'); return; }
    const record = teamLeaves.find(r => r.id === recordId);
    if (record) {
      record.status = 'Rejected';
      saveLeaveData();
      renderLeaveTable();
      renderLeaveKPIs();
      if (window.VerdeToast) window.VerdeToast.success('Leave rejected.');
    }
  };

  window.cancelLeave = function(recordId) {
    const isAdmin = window.VERDE_PERMISSIONS && window.VERDE_PERMISSIONS.can('team_add');
    if (!isAdmin) { if(window.VerdeToast) window.VerdeToast.error('Only administrators can manage leave requests.'); return; }
    const record = teamLeaves.find(r => r.id === recordId);
    if (record) {
      record.status = 'Cancelled';
      saveLeaveData();
      renderLeaveTable();
      renderLeaveKPIs();
      if (window.VerdeToast) window.VerdeToast.success('Leave cancelled.');
    }
  };

  window.openPayrollModal = function() {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_add')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    const currentMonth = new Date().toISOString().substring(0, 7);
    let empOptions = teamEmployees.map(e => {
        let defaultBasic = e.salary ? e.salary : 0;
        return `<option value="${e.id}" data-basic="${defaultBasic}">${e.name} (${e.id})</option>`;
    }).join('');

    const formHtml = `
      <style>
        .pr-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .pr-form-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .pr-form-input, .pr-form-select { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; outline: none; background: var(--bg); color: var(--text-1); font-family: inherit; font-size: 13px; width: 100%; box-sizing: border-box; }
        .pr-form-input:focus, .pr-form-select:focus { border-color: var(--primary); }
      </style>
      <div id="payroll-modal-form">
        <div class="pr-form-group">
          <label class="pr-form-label">Employee</label>
          <select id="pr-empId" class="pr-form-select" onchange="window.updatePayrollBasicFromEmp()">
            <option value="">Select Employee</option>
            ${empOptions}
          </select>
        </div>
        <div class="pr-form-group">
          <label class="pr-form-label">Payroll Month</label>
          <input type="month" id="pr-month" class="pr-form-input" value="${currentMonth}">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="pr-form-group">
            <label class="pr-form-label">Basic Salary (₹)</label>
            <input type="number" id="pr-basic" class="pr-form-input" value="0" oninput="window.calculatePayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Allowances (₹)</label>
            <input type="number" id="pr-allowances" class="pr-form-input" value="0" oninput="window.calculatePayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Bonus (₹)</label>
            <input type="number" id="pr-bonus" class="pr-form-input" value="0" oninput="window.calculatePayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Deductions (₹)</label>
            <input type="number" id="pr-deductions" class="pr-form-input" value="0" oninput="window.calculatePayrollNet()">
          </div>
        </div>
        <div class="pr-form-group">
          <label class="pr-form-label">Net Salary (₹)</label>
          <input type="number" id="pr-net" class="pr-form-input" value="0" readonly style="background: var(--bg-2); font-weight:bold; color:var(--text-1); font-size:16px;">
        </div>
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.create) {
      window.VerdeModal.create('Generate Payroll', formHtml);

      setTimeout(() => {
        const modals = document.querySelectorAll('.modal-overlay.active');
        if (!modals.length) return;
        const modal = modals[modals.length - 1];

        const btnSave = modal.querySelector('.modal-confirm-btn');
        if (btnSave) {
          const clone = btnSave.cloneNode(true);
          clone.textContent = 'Generate Record';
          btnSave.parentNode.replaceChild(clone, btnSave);

          clone.addEventListener('click', function() {
            const empId = document.getElementById('pr-empId').value;
            const month = document.getElementById('pr-month').value;
            const basic = parseFloat(document.getElementById('pr-basic').value) || 0;
            const allowances = parseFloat(document.getElementById('pr-allowances').value) || 0;
            const bonus = parseFloat(document.getElementById('pr-bonus').value) || 0;
            const deductions = parseFloat(document.getElementById('pr-deductions').value) || 0;
            const net = parseFloat(document.getElementById('pr-net').value) || 0;

            if (!empId || !month || !basic) {
              if (window.VerdeToast) window.VerdeToast.error('Employee, Payroll Month, and Basic Salary are required.');
              return;
            }

            const exists = teamPayroll.find(r => r.empId === empId && r.month === month);
            if (exists) {
              if (window.VerdeToast) window.VerdeToast.error('Payroll record for this employee and month already exists.');
              return;
            }

            teamPayroll.push({
              id: 'PR-' + Date.now(),
              empId: empId,
              month: month,
              basic: basic,
              allowances: allowances,
              bonus: bonus,
              deductions: deductions,
              net: net,
              status: 'Pending'
            });

            savePayrollData();
            renderPayrollTable();
            renderPayrollKPIs();

            if (window.VerdeToast) window.VerdeToast.success('Payroll record generated.');
            
            modal.classList.remove('active');
            setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
          });
        }
      }, 10);
    }
  };

  window.updatePayrollBasicFromEmp = function() {
    const sel = document.getElementById('pr-empId');
    if (!sel) return;
    const option = sel.options[sel.selectedIndex];
    if (option && option.value) {
      const basic = parseFloat(option.getAttribute('data-basic')) || 0;
      document.getElementById('pr-basic').value = basic;
      window.calculatePayrollNet();
    }
  };

  window.calculatePayrollNet = function() {
    const basic = parseFloat(document.getElementById('pr-basic').value) || 0;
    const allowances = parseFloat(document.getElementById('pr-allowances').value) || 0;
    const bonus = parseFloat(document.getElementById('pr-bonus').value) || 0;
    const deductions = parseFloat(document.getElementById('pr-deductions').value) || 0;
    const net = basic + allowances + bonus - deductions;
    const el = document.getElementById('pr-net');
    if(el) el.value = net;
  };

  window.editPayrollModal = function(recordId) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    const editRecord = teamPayroll.find(r => r.id === recordId);
    if (!editRecord || editRecord.status === 'Paid') return;

    const emp = teamEmployees.find(e => e.id === editRecord.empId) || { name: 'Unknown', id: editRecord.empId };

    const formHtml = `
      <style>
        .pr-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .pr-form-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
        .pr-form-input { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; outline: none; background: var(--bg); color: var(--text-1); font-family: inherit; font-size: 13px; width: 100%; box-sizing: border-box; }
        .pr-form-input:focus { border-color: var(--primary); }
      </style>
      <div id="payroll-edit-form">
        <div class="pr-form-group">
          <label class="pr-form-label">Employee</label>
          <input type="text" class="pr-form-input" value="${emp.name} (${emp.id})" disabled style="background: var(--bg-2);">
        </div>
        <div class="pr-form-group">
          <label class="pr-form-label">Payroll Month</label>
          <input type="month" class="pr-form-input" value="${editRecord.month}" disabled style="background: var(--bg-2);">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="pr-form-group">
            <label class="pr-form-label">Basic Salary (₹)</label>
            <input type="number" id="pr-edit-basic" class="pr-form-input" value="${editRecord.basic}" oninput="window.calculateEditPayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Allowances (₹)</label>
            <input type="number" id="pr-edit-allowances" class="pr-form-input" value="${editRecord.allowances}" oninput="window.calculateEditPayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Bonus (₹)</label>
            <input type="number" id="pr-edit-bonus" class="pr-form-input" value="${editRecord.bonus}" oninput="window.calculateEditPayrollNet()">
          </div>
          <div class="pr-form-group">
            <label class="pr-form-label">Deductions (₹)</label>
            <input type="number" id="pr-edit-deductions" class="pr-form-input" value="${editRecord.deductions}" oninput="window.calculateEditPayrollNet()">
          </div>
        </div>
        <div class="pr-form-group">
          <label class="pr-form-label">Net Salary (₹)</label>
          <input type="number" id="pr-edit-net" class="pr-form-input" value="${editRecord.net}" readonly style="background: var(--bg-2); font-weight:bold; color:var(--text-1); font-size:16px;">
        </div>
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.edit) {
      window.VerdeModal.edit('Edit Payroll', formHtml);

      setTimeout(() => {
        const modals = document.querySelectorAll('.modal-overlay.active');
        if (!modals.length) return;
        const modal = modals[modals.length - 1];

        const btnSave = modal.querySelector('.modal-confirm-btn');
        if (btnSave) {
          const clone = btnSave.cloneNode(true);
          clone.textContent = 'Save Changes';
          btnSave.parentNode.replaceChild(clone, btnSave);

          clone.addEventListener('click', function() {
            const basic = parseFloat(document.getElementById('pr-edit-basic').value) || 0;
            const allowances = parseFloat(document.getElementById('pr-edit-allowances').value) || 0;
            const bonus = parseFloat(document.getElementById('pr-edit-bonus').value) || 0;
            const deductions = parseFloat(document.getElementById('pr-edit-deductions').value) || 0;
            const net = parseFloat(document.getElementById('pr-edit-net').value) || 0;

            if (basic <= 0) {
              if (window.VerdeToast) window.VerdeToast.error('Basic Salary must be greater than 0.');
              return;
            }

            editRecord.basic = basic;
            editRecord.allowances = allowances;
            editRecord.bonus = bonus;
            editRecord.deductions = deductions;
            editRecord.net = net;

            savePayrollData();
            renderPayrollTable();
            renderPayrollKPIs();

            if (window.VerdeToast) window.VerdeToast.success('Payroll record updated.');
            
            modal.classList.remove('active');
            setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
          });
        }
      }, 10);
    }
  };

  window.calculateEditPayrollNet = function() {
    const basic = parseFloat(document.getElementById('pr-edit-basic').value) || 0;
    const allowances = parseFloat(document.getElementById('pr-edit-allowances').value) || 0;
    const bonus = parseFloat(document.getElementById('pr-edit-bonus').value) || 0;
    const deductions = parseFloat(document.getElementById('pr-edit-deductions').value) || 0;
    const net = basic + allowances + bonus - deductions;
    const el = document.getElementById('pr-edit-net');
    if(el) el.value = net;
  };

  window.markPayrollPaid = function(recordId) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_edit')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    const record = teamPayroll.find(r => r.id === recordId);
    if (record && record.status !== 'Paid') {
      record.status = 'Paid';
      savePayrollData();
      renderPayrollTable();
      renderPayrollKPIs();
      if (window.VerdeToast) window.VerdeToast.success('Payroll marked as paid.');
    }
  };

  window.deletePayrollRecord = function(recordId) {
    if (window.VERDE_PERMISSIONS && !window.VERDE_PERMISSIONS.can('team_remove')) { if(window.VerdeToast) window.VerdeToast.error('Access Denied'); return; }
    if (window.VerdeModal && window.VerdeModal.delete) {
      window.VerdeModal.delete(
        'Delete Payroll',
        'Are you sure you want to delete this payroll record?',
        function() {
          teamPayroll = teamPayroll.filter(r => r.id !== recordId);
          savePayrollData();
          renderPayrollTable();
          renderPayrollKPIs();
          if (window.VerdeToast) window.VerdeToast.success('Payroll record deleted.');
        }
      );
    }
  };

  window.generatePayslip = function(recordId) {
    const record = teamPayroll.find(r => r.id === recordId);
    if (!record) return;
    const emp = teamEmployees.find(e => e.id === record.empId) || { name: 'Unknown', id: record.empId, department: 'N/A', role: 'N/A' };
    const monthStr = new Date(record.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

    const payslipHtml = `
      <style>
        .payslip-container { padding: 24px; background: #fff; color: #000; border-radius: 8px; }
        .payslip-header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 16px; margin-bottom: 24px; }
        .payslip-logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #111; }
        .payslip-title { font-size: 18px; font-weight: 700; color: #555; text-align: right; }
        .payslip-meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .payslip-meta-col { display: flex; flex-direction: column; gap: 8px; }
        .payslip-meta-item { font-size: 13px; }
        .payslip-meta-item strong { font-weight: 700; width: 100px; display: inline-block; }
        .payslip-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .payslip-table th, .payslip-table td { padding: 12px; border: 1px solid #ddd; font-size: 13px; }
        .payslip-table th { background: #f9f9f9; font-weight: 700; text-align: left; }
        .payslip-table td.amount { text-align: right; font-family: monospace; font-size: 14px; }
        .payslip-table th.amount { text-align: right; }
        .payslip-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #eee; padding-top: 24px; }
        .payslip-net { font-size: 20px; font-weight: 800; }
        .payslip-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef08a; color: #854d0e; }
        .status-processed { background: #e0f2fe; color: #075985; }
        
        @media print {
            body * { visibility: hidden; }
            #payslip-print-area, #payslip-print-area * { visibility: visible; }
            #payslip-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      </style>
      <div id="payslip-print-area" class="payslip-container">
        <div class="payslip-header">
          <div>
            <div class="payslip-logo">VERDE OS</div>
            <div style="font-size:12px; color:#666; margin-top:4px;">123 Business Avenue, Suite 100<br>New York, NY 10001</div>
          </div>
          <div>
            <div class="payslip-title">PAYSLIP</div>
            <div style="font-size:13px; color:#666; margin-top:4px; text-align:right;">${monthStr}</div>
          </div>
        </div>
        
        <div class="payslip-meta">
          <div class="payslip-meta-col">
            <div class="payslip-meta-item"><strong>Employee Name:</strong> ${emp.name}</div>
            <div class="payslip-meta-item"><strong>Employee ID:</strong> ${emp.id}</div>
          </div>
          <div class="payslip-meta-col">
            <div class="payslip-meta-item"><strong>Department:</strong> ${emp.department}</div>
            <div class="payslip-meta-item"><strong>Designation:</strong> ${emp.role}</div>
          </div>
        </div>
        
        <table class="payslip-table">
          <thead>
            <tr>
              <th style="width:50%;">Earnings</th>
              <th class="amount">Amount</th>
              <th style="width:50%; border-left: 2px solid #ddd;">Deductions</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td class="amount">${formatCurrency(record.basic)}</td>
              <td style="border-left: 2px solid #ddd;">Tax / Other Deductions</td>
              <td class="amount">${formatCurrency(record.deductions)}</td>
            </tr>
            <tr>
              <td>Allowances</td>
              <td class="amount">${formatCurrency(record.allowances)}</td>
              <td style="border-left: 2px solid #ddd;"></td>
              <td class="amount"></td>
            </tr>
            <tr>
              <td>Bonus</td>
              <td class="amount">${formatCurrency(record.bonus)}</td>
              <td style="border-left: 2px solid #ddd;"></td>
              <td class="amount"></td>
            </tr>
            <tr style="background:#f9f9f9; font-weight:700;">
              <td>Total Earnings</td>
              <td class="amount">${formatCurrency(record.basic + record.allowances + record.bonus)}</td>
              <td style="border-left: 2px solid #ddd;">Total Deductions</td>
              <td class="amount">${formatCurrency(record.deductions)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="payslip-footer">
          <div>
            <span class="payslip-status status-${record.status.toLowerCase()}">${record.status}</span>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; color:#666; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Net Salary</div>
            <div class="payslip-net">${formatCurrency(record.net)}</div>
          </div>
        </div>
      </div>
      <!-- Injecting extra buttons to bypass default footer limitations -->
      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;" id="payslip-custom-footer">
        <button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);" onclick="const m = this.closest('.modal-overlay'); m.classList.remove('active'); setTimeout(()=>m.remove(),200);">Close</button>
        <button class="btn btn-primary btn-sm" onclick="window.print()">Print</button>
        <button class="btn btn-primary btn-sm" onclick="window.print()">Download PDF</button>
      </div>
    `;

    if (window.VerdeModal && window.VerdeModal.confirm) {
      window.VerdeModal.confirm({
        title: 'Payslip',
        body: payslipHtml,
        confirmText: 'Dummy', 
        cancelText: 'Dummy'
      });

      setTimeout(() => {
        const modals = document.querySelectorAll('.modal-overlay.active');
        if (!modals.length) return;
        const modal = modals[modals.length - 1];
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.maxWidth = '800px';
          modalContent.style.width = '100%';
          
          // Hide the default modal footer which is placed automatically by VerdeModal.confirm
          const divs = modalContent.querySelectorAll('div');
          const defaultFooter = divs[divs.length - 1];
          if (defaultFooter && defaultFooter.style.justifyContent === 'flex-end') {
            defaultFooter.style.display = 'none';
          }
        }
      }, 10);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamWorkspace);
  } else {
    initTeamWorkspace();
  }
})();