(function () {
  'use strict';

  /* ==========================================================================
     VERDE OS — REPORTS & ANALYTICS CONTROLLER
     ========================================================================== */

  const data = {
  months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  revenue: [42000, 55000, 48000, 68000, 72000, 142500],
  pipeline: [60000, 65000, 80000, 75000, 110000, 95000],
  expenses: [12000, 14000, 13500, 15000, 16000, 18000],
  sales: [
    { name: 'Sarah J.', val: 85000 },
    { name: 'Mark D.', val: 45000 },
    { name: 'Anna R.', val: 12500 }
  ],
  projSuccess: [88, 92, 90, 94, 96, 98],
  deptHours: [
    { name: 'Engineering', val: 420 },
    { name: 'Design', val: 380 },
    { name: 'Sales', val: 210 },
    { name: 'Marketing', val: 180 }
  ],
  topClients: [
    { name: 'Nova Corp', val: 120000 },
    { name: 'Echo Sys', val: 85000 },
    { name: 'Pinnacle', val: 65000 }
  ],
  velocity: [120, 145, 130, 180, 195, 210]
};

/* ══════════════════════════════════════════════
   ROUTING
   ══════════════════════════════════════════════ */

function navigate(view) {
  document.querySelectorAll('.route').forEach(r => r.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const routeEl = document.getElementById(`route-${view}`);
  if(routeEl) routeEl.classList.add('active');

  const navMap = { 'exec':0, 'sales':1, 'projects':2, 'team':3, 'finance':4, 'client':5, 'productivity':6, 'custom':7 };
  if(navMap[view] !== undefined) document.querySelectorAll('.nav-item')[navMap[view]].classList.add('active');

  const titleMap = {
    'exec': 'Executive Overview', 'sales': 'Sales Reports', 'projects': 'Project Reports', 
    'team': 'Team Performance', 'finance': 'Finance Reports', 'client': 'Client Reports', 
    'productivity': 'Productivity Velocity', 'custom': 'Custom Reports Builder'
  };
  
  document.getElementById('topNavTitle').textContent = titleMap[view] || 'Analytics';

  // Trigger animations on view switch
  setTimeout(triggerUpdate, 50);
}

/* ══════════════════════════════════════════════
   CHART RENDERING (CSS/HTML)
   ══════════════════════════════════════════════ */

function renderBarChart(containerId, dataArray, labels, color, isCurrency=false) {
  const container = document.getElementById(containerId);
  if(!container) return;
  
  const max = Math.max(...dataArray) * 1.1; // 10% headroom
  
  container.innerHTML = dataArray.map((val, i) => {
    const height = (val / max) * 100;
    const displayVal = isCurrency ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN');
    return `
      <div class="bar-col">
        <div class="bar" style="height:0%; background:var(--${color})" data-height="${height}%">
          <div class="bar-tooltip">${displayVal}</div>
        </div>
        <div class="bar-label" style="bottom:-32px;">${labels[i]}</div>
      </div>
    `;
  }).join('');
}

function renderMultiBarChart(containerId, dataArray1, dataArray2, labels) {
  const container = document.getElementById(containerId);
  if(!container) return;
  
  const max = Math.max(...dataArray1, ...dataArray2) * 1.1;
  
  container.innerHTML = dataArray1.map((val1, i) => {
    const val2 = dataArray2[i];
    const h1 = (val1 / max) * 100;
    const h2 = (val2 / max) * 100;
    return `
      <div class="bar-col" style="flex-direction:row; align-items:flex-end; gap:4px; padding-bottom:0;">
        <div class="bar" style="height:0%; background:var(--primary); width:16px;" data-height="${h1}%">
          <div class="bar-tooltip">₹${val1.toLocaleString('en-IN')}</div>
        </div>
        <div class="bar" style="height:0%; background:var(--danger); width:16px;" data-height="${h2}%">
          <div class="bar-tooltip">₹${val2.toLocaleString('en-IN')}</div>
        </div>
        <div class="bar-label" style="bottom:-32px; left:50%; transform:translateX(-50%)">${labels[i]}</div>
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════════════════
   ANIMATIONS & UPDATES
   ══════════════════════════════════════════════ */

function animateCounters() {
  const counters = document.querySelectorAll('.active .counter');
  const speed = 200;

  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const inc = target / speed;
    let count = 0;

    const updateCount = () => {
      count += inc;
      if (count < target) {
        counter.innerText = Math.ceil(count).toLocaleString('en-IN');
        requestAnimationFrame(updateCount);
      } else {
        counter.innerText = target.toLocaleString('en-IN');
      }
    };
    updateCount();
  });
}

function animateBars() {
  const bars = document.querySelectorAll('.active .bar');
  bars.forEach(bar => {
    const targetH = bar.getAttribute('data-height');
    setTimeout(() => { bar.style.height = targetH; }, 100);
  });
  
  const progressFills = document.querySelectorAll('.active .p-fill');
  progressFills.forEach(fill => {
    const targetW = fill.getAttribute('data-width');
    setTimeout(() => { fill.style.width = targetW; }, 100);
  });
}

function triggerUpdate() {
  // Re-render charts based on DOM context
  renderBarChart('chart-exec-rev', data.revenue, data.months, 'primary', true);
  renderBarChart('chart-exec-pipeline', data.pipeline, data.months, 'warning', true);
  
  renderBarChart('chart-sales', data.sales.map(s=>s.val), data.sales.map(s=>s.name), 'secondary', true);
  
  renderBarChart('chart-proj', data.projSuccess, data.months, 'success', false);
  
  renderBarChart('chart-team-dept', data.deptHours.map(d=>d.val), data.deptHours.map(d=>d.name), 'primary', false);
  
  renderMultiBarChart('chart-fin', data.revenue, data.expenses, data.months);
  
  renderBarChart('chart-client', data.topClients.map(c=>c.val), data.topClients.map(c=>c.name), 'primary', true);
  
  renderBarChart('chart-prod', data.velocity, data.months, 'secondary', false);

  window.navigate = navigate;
  window.triggerUpdate = triggerUpdate;

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { navigate('exec'); });
  } else {
    navigate('exec');
  }
})();