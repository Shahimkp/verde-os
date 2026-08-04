/* ==========================================================================
   VERDE OS — AI HUB WORKSPACE CONTROLLER
   ========================================================================== */

(function () {
  'use strict';

  var aiPrompts = [];
  var aiHistory = [];
  var aiDocuments = [];
  var aiWorkflows = [];
  var aiWfStats = { execs: 0, success: 0, failed: 0 };
  var aiSettings = {};

  // ── MOCK AI RESPONSES ── //
  
  var defaultSettings = {
    aiEnabled: true,
    saveConv: true,
    saveHist: true,
    autoDoc: false,
    wfEnabled: true,
    model: 'Gemini 2.5 Pro',
    temp: '0.7',
    tokens: '2048',
    topp: '1.0',
    pres: '0.0',
    freq: '0.0',
    sysPrompt: '',
    style: '',
    length: 'Standard',
    lang: ''
  };

  var mockResponses = [
    "Here is the analysis you requested.\n\n**Key Points:**\n- Revenue increased by 14%\n- Engagement is up 20%\n\nLet me know if you need more details.",
    "I've drafted that for you.\n\n*Subject: Quarterly Update*\n\nDear Team,\n\nPlease find the quarterly report attached.\n\nBest,\nCopilot",
    "```javascript\nfunction calculateROI(revenue, cost) {\n  return ((revenue - cost) / cost) * 100;\n}\n```\n\nThis function calculates the ROI given revenue and cost.",
    "I have reviewed the parameters.\n\n### Recommendation\nProceed with the deployment as scheduled. All tests have passed."
  ];

  function loadStorage() {
    var p = localStorage.getItem('verde_ai_prompts');
    if (p) aiPrompts = JSON.parse(p);
    
    
    
    var w = localStorage.getItem('verde_ai_workflows');
    if (w) aiWorkflows = JSON.parse(w);

    
    var s = localStorage.getItem('verde_ai_settings');
    aiSettings = s ? Object.assign({}, defaultSettings, JSON.parse(s)) : Object.assign({}, defaultSettings);
    var ws = localStorage.getItem('verde_ai_workflow_stats');
    if (ws) aiWfStats = JSON.parse(ws);
    var d = localStorage.getItem('verde_ai_documents');
    if (d) aiDocuments = JSON.parse(d);
    var h = localStorage.getItem('verde_ai_history');
    if (h) aiHistory = JSON.parse(h);
  }

  function savePrompts() { localStorage.setItem('verde_ai_prompts', JSON.stringify(aiPrompts)); refreshAIDashboard(); }
  
  function saveWorkflows() { localStorage.setItem('verde_ai_workflows', JSON.stringify(aiWorkflows)); refreshWorkflowKPIs(); }
  function saveWfStats() { localStorage.setItem('verde_ai_workflow_stats', JSON.stringify(aiWfStats)); refreshWorkflowKPIs(); }
  function saveDocuments() { localStorage.setItem('verde_ai_documents', JSON.stringify(aiDocuments)); refreshAIDashboard(); }
  function saveHistory() { localStorage.setItem('verde_ai_history', JSON.stringify(aiHistory)); refreshAIDashboard(); }

  function genId(prefix) { return prefix + '-' + Math.floor(1000 + Math.random() * 9000); }
  
  function fmtDate(dStr) {
    if (!dStr) return '';
    var d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  }

  // ── TAB SWITCHING ── //
  window.switchAiTab = function (tabId) {
    document.querySelectorAll('.ai-tab').forEach(function (t) { 
      t.classList.remove('active'); 
      t.style.borderBottomColor = 'transparent';
      t.style.color = 'var(--text-3)';
      t.style.fontWeight = '600';
    });
    document.querySelectorAll('.ai-tab-content').forEach(function (v) { v.style.display = 'none'; });

    var viewEl = document.getElementById('tab-' + tabId);
    if (viewEl) viewEl.style.display = 'block';

    document.querySelectorAll('.ai-tab').forEach(function (t) {
      if (t.textContent.trim().toLowerCase().replace(' ', '-') === 'ai-' + tabId || t.textContent.trim().toLowerCase().includes(tabId)) {
        t.classList.add('active');
        t.style.borderBottomColor = 'var(--primary)';
        t.style.color = 'var(--text-1)';
        t.style.fontWeight = '800';
      }
    });

    if(tabId === 'dashboard') refreshAIDashboard();
    if(tabId === 'prompts') renderPrompts();
    if(tabId === 'history') renderHistory();
    if(tabId === 'settings') initSettings();
    if(tabId === 'documents') renderDocuments();
    if(tabId === 'workflows') { renderWorkflows(); refreshWorkflowKPIs(); }
  };

  // ── DASHBOARD SYNC ── //
  window.refreshAIDashboard = function() {
    var eReqs = document.getElementById('kpi-reqs');
    var eDocs = document.getElementById('kpi-docs');
    var eConvs = document.getElementById('kpi-convs');
    var ePrompts = document.getElementById('kpi-prompts');

    if(ePrompts) ePrompts.textContent = aiPrompts.length;
    
    // Calculate requests (history length)
    var reqs = aiHistory.length;
    if(eReqs) eReqs.textContent = reqs;
    if(eConvs) eConvs.textContent = Math.floor(reqs / 2); // mockup stat
    if(eDocs) eDocs.textContent = aiDocuments.length;
  };

  
  window.refreshWorkflowKPIs = function() {
    var eAct = document.getElementById('kpi-wf-active');
    var eEx = document.getElementById('kpi-wf-execs');
    var eSucc = document.getElementById('kpi-wf-success');
    var eFail = document.getElementById('kpi-wf-failed');
    
    if(eAct) {
      var activeCount = aiWorkflows.filter(x => x.status === 'Active').length;
      eAct.textContent = activeCount;
    }
    if(eEx) eEx.textContent = aiWfStats.execs;
    if(eSucc) eSucc.textContent = aiWfStats.success;
    if(eFail) eFail.textContent = aiWfStats.failed;
  };

  // ── PROMPT LIBRARY ── //
  window.renderPrompts = function() {
    var tb = document.getElementById('tbody-prompts');
    if(!tb) return;
    var sq = document.getElementById('ai-global-search');
    var query = sq ? sq.value.toLowerCase().trim() : '';
    
    var html = '';
    aiPrompts.forEach(function(p) {
      if(query && !(p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.text.toLowerCase().includes(query))) return;
      
      var favIcon = p.favorite ? '<span style="color:var(--warning);">★</span>' : '<span style="color:var(--text-3);">☆</span>';

      html += '<tr>' +
        '<td style="text-align:center; font-size:18px;">' + favIcon + '</td>' +
        '<td style="font-weight:600; color:var(--text-1);">' + p.title + '</td>' +
        '<td><span class="badge badge-neutral">' + p.category + '</span></td>' +
        '<td><div style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + p.text + '</div></td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="window.toggleAIMenu(event, \'' + p.id + '\', \'prompt\')">⋮</button></td>' +
        '</tr>';
    });
    if(html==='') html = '<tr><td colspan="5" style="text-align:center; padding:20px;">No prompts found.</td></tr>';
    tb.innerHTML = html;
  };

  window.openPromptModal = function(id) {
    var p = aiPrompts.find(x => x.id === id) || {};
    var html = '<div style="display:grid; grid-template-columns:1fr; gap:16px;">' +
      '<div><label style="font-size:12px;">Title</label><input type="text" id="m-p-tit" class="input" value="'+(p.title||'')+'" style="width:100%"></div>' +
      '<div><label style="font-size:12px;">Category</label><select id="m-p-cat" class="input" style="width:100%">' +
        '<option '+(p.category==='Marketing'?'selected':'')+'>Marketing</option>' +
        '<option '+(p.category==='Sales'?'selected':'')+'>Sales</option>' +
        '<option '+(p.category==='Development'?'selected':'')+'>Development</option>' +
        '<option '+(p.category==='General'?'selected':'')+'>General</option>' +
      '</select></div>' +
      '<div><label style="font-size:12px;">Prompt Text</label><textarea id="m-p-txt" class="input" style="width:100%; height:120px;">'+(p.text||'')+'</textarea></div>' +
      '<div><label style="font-size:12px; display:flex; align-items:center; gap:8px;"><input type="checkbox" id="m-p-fav" '+(p.favorite?'checked':'')+'> Favorite</label></div>' +
    '</div>';

    window.VerdeModal.confirm('Prompt Details', html, function() {
      var tit = document.getElementById('m-p-tit').value.trim();
      if(!tit) return alert('Title required');
      var prompt = id ? p : { id: genId('PR') };
      prompt.title = tit;
      prompt.category = document.getElementById('m-p-cat').value;
      prompt.text = document.getElementById('m-p-txt').value.trim();
      prompt.favorite = document.getElementById('m-p-fav').checked;
      if(!id) aiPrompts.push(prompt);
      savePrompts(); renderPrompts();
    });
  };

  window.togglePromptFavorite = function(id) {
    var p = aiPrompts.find(x => x.id === id);
    if(p) {
      p.favorite = !p.favorite;
      savePrompts(); renderPrompts();
    }
  };

  // ── HISTORY ── //
  window.renderHistory = function() {
    var tb = document.getElementById('tbody-history');
    if(!tb) return;
    
    // Sort descending by timestamp
    var sorted = [].concat(aiHistory).sort(function(a,b) { return new Date(b.timestamp) - new Date(a.timestamp); });

    var html = '';
    sorted.forEach(function(h) {
      var stCls = h.status === 'Completed' ? 'badge-success' : (h.status === 'Error' ? 'badge-danger' : 'badge-neutral');
      html += '<tr>' +
        '<td>' + fmtDate(h.timestamp) + '</td>' +
        '<td style="font-weight:600;">' + h.tool + '</td>' +
        '<td><div style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + h.prompt + '</div></td>' +
        '<td><span class="badge ' + stCls + '">' + h.status + '</span></td>' +
        '</tr>';
    });
    if(html==='') html = '<tr><td colspan="4" style="text-align:center; padding:20px;">No history found.</td></tr>';
    tb.innerHTML = html;
  };

  function logHistory(tool, promptTxt, status) {
    aiHistory.push({
      id: genId('HI'),
      timestamp: new Date().toISOString(),
      tool: tool,
      prompt: promptTxt,
      status: status
    });
    saveHistory();
    renderHistory();
  }

  // ── AI CHAT ── //
  var lastAiResponseHtml = "";
  
  function parseMarkdown(md) {
    var html = md;
    // Code blocks
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre style="background:var(--bg-2); padding:12px; border-radius:8px; overflow-x:auto;"><code>$2</code></pre>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return html;
  }

  window.sendAiMessage = function(regenerating) {
    var inp = document.getElementById('ai-chat-input');
    var msg = inp.value.trim();
    if(regenerating) {
      msg = "Regenerate previous response.";
    } else {
      if(!msg) return;
    }
    
    var container = document.getElementById('ai-chat-container');
    
    // Add user bubble
    if(!regenerating) {
      var uBubble = document.createElement('div');
      uBubble.className = 'chat-bubble chat-user';
      uBubble.innerHTML = msg + '<div class="chat-timestamp">Now</div>';
      container.appendChild(uBubble);
    }
    
    inp.value = '';
    container.scrollTop = container.scrollHeight;

    // Add thinking bubble
    var tBubble = document.createElement('div');
    tBubble.className = 'chat-bubble chat-system';
    tBubble.id = 'chat-thinking';
    tBubble.innerHTML = '<span style="display:flex; gap:4px; align-items:center; height:20px;">' +
      '<span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:pulse 1s infinite;"></span>' +
      '<span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:pulse 1s infinite 0.2s;"></span>' +
      '<span style="width:6px;height:6px;background:currentColor;border-radius:50%;animation:pulse 1s infinite 0.4s;"></span>' +
      '</span>';
    container.appendChild(tBubble);
    container.scrollTop = container.scrollHeight;

    // Fake network latency
    setTimeout(function() {
      container.removeChild(tBubble);
      
      var sBubble = document.createElement('div');
      sBubble.className = 'chat-bubble chat-system';
      
      var rawRes = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      var parsedHtml = parseMarkdown(rawRes);
      lastAiResponseHtml = rawRes; // save raw for copy
      
      sBubble.innerHTML = parsedHtml + '<div class="chat-timestamp">Now</div>';
      container.appendChild(sBubble);
      container.scrollTop = container.scrollHeight;

      logHistory('VERDE Copilot', msg, 'Completed');
      
    }, 1200);
  };

  window.clearAiChat = function() {
    var container = document.getElementById('ai-chat-container');
    container.innerHTML = '<div class="chat-bubble chat-system">Hello, I am your VERDE OS Copilot. Chat history cleared. How can I assist you today?<div class="chat-timestamp">Now</div></div>';
  };

  window.copyAiResponse = function() {
    if(!lastAiResponseHtml) return window.VerdeToast.show('No response to copy', 'error');
    navigator.clipboard.writeText(lastAiResponseHtml).then(function() {
      window.VerdeToast.show('Response copied to clipboard', 'success');
    });
  };

  window.regenerateAiResponse = function() {
    window.sendAiMessage(true);
  };

  // ── AI TOOLS ── //
  window.openAIToolModal = function(toolName) {
    window.VerdeModal.alert(toolName, "AI integration will be connected in the backend phase.", "info");
    logHistory(toolName, 'Opened Tool', 'Pending');
  };

  
  // ── DOCUMENT STUDIO ── //
  window.renderDocuments = function() {
    var tb = document.getElementById('tbody-documents');
    if(!tb) return;
    
    var sq = document.getElementById('ds-search');
    var sqVal = sq ? sq.value.toLowerCase().trim() : '';
    
    var fType = document.getElementById('ds-filter-type');
    var ftVal = fType ? fType.value : '';
    
    var fStatus = document.getElementById('ds-filter-status');
    var fsVal = fStatus ? fStatus.value : '';

    var sorted = [].concat(aiDocuments).sort(function(a,b) { return new Date(b.date) - new Date(a.date); });
    
    var html = '';
    sorted.forEach(function(d) {
      if(sqVal && !(d.title.toLowerCase().includes(sqVal) || d.type.toLowerCase().includes(sqVal) || (d.client && d.client.toLowerCase().includes(sqVal)))) return;
      if(ftVal && !d.type.includes(ftVal)) return;
      if(fsVal && d.status !== fsVal) return;

      var stCls = d.status === 'Saved' ? 'badge-success' : 'badge-neutral';
      
      html += '<tr>' +
        '<td>' + fmtDate(d.date).split(' ')[0] + '</td>' +
        '<td style="font-weight:600;">' + d.type + '</td>' +
        '<td style="color:var(--text-1);">' + d.title + '</td>' +
        '<td>' + (d.client || 'N/A') + '</td>' +
        '<td><span class="badge ' + stCls + '">' + d.status + '</span></td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="window.toggleAIMenu(event, \'' + d.id + '\', \'document\')">⋮</button></td>' +
        '</tr>';
    });
    if(html === '') html = '<tr><td colspan="6" style="text-align:center; padding:20px;">No documents found.</td></tr>';
    tb.innerHTML = html;
  };

  var pendingDocType = '';

  window.openDocStudioModal = function(docType) {
    pendingDocType = docType;
    var fields = '';
    if(docType === 'Proposal Generator' || docType === 'Project Report Generator') {
      fields = '<div><label style="font-size:12px;">Client / Company</label><input type="text" id="ds-f-client" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Project Name</label><input type="text" id="ds-f-project" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Budget / Value</label><input type="text" id="ds-f-budget" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Scope / Details</label><textarea id="ds-f-scope" class="input" style="width:100%; height:80px;"></textarea></div>';
    } else if (docType === 'Quotation Generator' || docType === 'Invoice Draft Generator') {
      fields = '<div><label style="font-size:12px;">Client Name</label><input type="text" id="ds-f-client" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Invoice/Quote Number</label><input type="text" id="ds-f-num" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Items (comma separated)</label><input type="text" id="ds-f-items" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Notes</label><textarea id="ds-f-scope" class="input" style="width:100%; height:60px;"></textarea></div>';
    } else if (docType === 'Meeting Minutes Generator') {
      fields = '<div><label style="font-size:12px;">Meeting Title</label><input type="text" id="ds-f-title" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Participants</label><input type="text" id="ds-f-client" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Decisions & Actions</label><textarea id="ds-f-scope" class="input" style="width:100%; height:100px;"></textarea></div>';
    } else {
      // Generic fallback
      fields = '<div><label style="font-size:12px;">Document Title</label><input type="text" id="ds-f-title" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Target / Subject</label><input type="text" id="ds-f-client" class="input" style="width:100%"></div>' +
               '<div><label style="font-size:12px;">Key Information</label><textarea id="ds-f-scope" class="input" style="width:100%; height:100px;"></textarea></div>';
    }

    var html = '<div style="display:grid; grid-template-columns:1fr; gap:16px;">' + fields + '</div>';

    window.VerdeModal.confirm('Generate ' + docType, html, function() {
      // Gather generic data
      var elClient = document.getElementById('ds-f-client');
      var elTitle = document.getElementById('ds-f-title');
      var elProject = document.getElementById('ds-f-project');
      
      var clientVal = elClient ? elClient.value.trim() : '';
      var titleVal = '';
      if(elTitle && elTitle.value.trim()) titleVal = elTitle.value.trim();
      else if(elProject && elProject.value.trim()) titleVal = elProject.value.trim();
      else titleVal = pendingDocType.replace(' Generator', '');

      var contentMock = "<h1>" + titleVal + "</h1>\n<p><strong>Prepared for:</strong> " + (clientVal||"N/A") + "</p>\n<p>This is a generated mock document for " + pendingDocType + ".</p>\n<p>Confidential and proprietary information.</p>";

      var newDoc = {
        id: genId('DOC'),
        type: pendingDocType.replace(' Generator', ''),
        title: titleVal,
        client: clientVal,
        content: contentMock,
        date: new Date().toISOString(),
        status: 'Draft'
      };

      aiDocuments.push(newDoc);
      saveDocuments();
      renderDocuments();
      logHistory(pendingDocType, 'Generated Document: ' + titleVal, 'Completed');
      window.VerdeToast.show('Document Generated', 'success');
    });
  };

  window.previewDocument = function(id) {
    var d = aiDocuments.find(x => x.id === id);
    if(!d) return;
    window.VerdeModal.alert(d.title, '<div style="background:var(--bg-2); padding:16px; border-radius:8px; max-height:400px; overflow-y:auto; line-height:1.6;">' + d.content + '</div>', 'info');
  };

  
  // ── WORKFLOW AUTOMATION ── //
  window.renderWorkflows = function() {
    var tb = document.getElementById('tbody-workflows');
    if(!tb) return;
    
    var sq = document.getElementById('wf-search');
    var sqVal = sq ? sq.value.toLowerCase().trim() : '';
    
    var fCat = document.getElementById('wf-filter-cat');
    var fcVal = fCat ? fCat.value : '';
    
    var fTrig = document.getElementById('wf-filter-trigger');
    var ftVal = fTrig ? fTrig.value : '';
    
    var fStatus = document.getElementById('wf-filter-status');
    var fsVal = fStatus ? fStatus.value : '';

    var sorted = [].concat(aiWorkflows).reverse(); // newest first based on array position
    
    var html = '';
    sorted.forEach(function(w) {
      if(sqVal && !(w.name.toLowerCase().includes(sqVal) || w.category.toLowerCase().includes(sqVal) || w.trigger.toLowerCase().includes(sqVal))) return;
      if(fcVal && w.category !== fcVal) return;
      if(ftVal && w.trigger !== ftVal) return;
      if(fsVal && w.status !== fsVal) return;

      var stCls = 'badge-neutral';
      if(w.status === 'Active') stCls = 'badge-success';
      if(w.status === 'Paused') stCls = 'badge-warning';
      
      html += '<tr>' +
        '<td style="color:var(--text-3); font-family:monospace;">' + w.id + '</td>' +
        '<td style="font-weight:600; color:var(--text-1);">' + w.name + '</td>' +
        '<td>' + w.category + '</td>' +
        '<td>' + w.trigger + '</td>' +
        '<td>' + (w.lastRun ? fmtDate(w.lastRun) : 'Never') + '</td>' +
        '<td><span class="badge ' + stCls + '">' + w.status + '</span></td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="window.toggleAIMenu(event, \'' + w.id + '\', \'workflow\')">⋮</button></td>' +
        '</tr>';
    });
    if(html === '') html = '<tr><td colspan="7" style="text-align:center; padding:20px;">No workflows found.</td></tr>';
    tb.innerHTML = html;
  };

  window.openWorkflowModal = function(templateData, existingId) {
    var w = {};
    if (existingId) {
      w = aiWorkflows.find(x => x.id === existingId) || {};
    } else if (templateData) {
      w = templateData;
    }
    
    var html = '<div style="display:grid; grid-template-columns:1fr; gap:16px;">' +
      '<div><label style="font-size:12px;">Workflow Name</label><input type="text" id="m-wf-name" class="input" value="'+(w.name||'')+'" style="width:100%"></div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
        '<div><label style="font-size:12px;">Category</label><select id="m-wf-cat" class="input" style="width:100%">' +
          '<option '+(w.category==='Sales'?'selected':'')+'>Sales</option>' +
          '<option '+(w.category==='HR'?'selected':'')+'>HR</option>' +
          '<option '+(w.category==='Finance'?'selected':'')+'>Finance</option>' +
          '<option '+(w.category==='Marketing'?'selected':'')+'>Marketing</option>' +
          '<option '+(w.category==='Operations'?'selected':'')+'>Operations</option>' +
        '</select></div>' +
        '<div><label style="font-size:12px;">Trigger</label><select id="m-wf-trig" class="input" style="width:100%">' +
          '<option '+(w.trigger==='Manual'?'selected':'')+'>Manual</option>' +
          '<option '+(w.trigger==='Scheduled'?'selected':'')+'>Scheduled</option>' +
          '<option '+(w.trigger==='Event Based'?'selected':'')+'>Event Based</option>' +
        '</select></div>' +
      '</div>' +
      '<div><label style="font-size:12px;">Status</label><select id="m-wf-status" class="input" style="width:100%">' +
        '<option '+(w.status==='Active'?'selected':'')+'>Active</option>' +
        '<option '+(w.status==='Paused'?'selected':'')+'>Paused</option>' +
        '<option '+(w.status==='Draft'?'selected':'')+'>Draft</option>' +
      '</select></div>' +
      '<div><label style="font-size:12px;">Description</label><textarea id="m-wf-desc" class="input" style="width:100%; height:80px;">'+(w.desc||'')+'</textarea></div>' +
    '</div>';

    window.VerdeModal.confirm(existingId ? 'Edit Workflow' : 'Create Workflow', html, function() {
      var name = document.getElementById('m-wf-name').value.trim();
      if(!name) return alert('Name required');
      
      var wf = existingId ? w : { id: genId('WF'), lastRun: null };
      wf.name = name;
      wf.category = document.getElementById('m-wf-cat').value;
      wf.trigger = document.getElementById('m-wf-trig').value;
      wf.status = document.getElementById('m-wf-status').value;
      wf.desc = document.getElementById('m-wf-desc').value.trim();
      
      if(!existingId) aiWorkflows.push(wf);
      saveWorkflows(); renderWorkflows();
    });
  };

  
  // ── AI SETTINGS ── //
  window.initSettings = function() {
    // Sliders
    function syncSlider(id, lblId, val) {
      var el = document.getElementById(id);
      var lbl = document.getElementById(lblId);
      if(el) el.value = val;
      if(lbl) lbl.textContent = val;
    }
    syncSlider('set-temp', 'lbl-temp', aiSettings.temp);
    syncSlider('set-tokens', 'lbl-tokens', aiSettings.tokens);
    syncSlider('set-topp', 'lbl-topp', aiSettings.topp);
    syncSlider('set-pres', 'lbl-pres', aiSettings.pres);
    syncSlider('set-freq', 'lbl-freq', aiSettings.freq);

    // Toggles
    if(document.getElementById('set-ai-enabled')) document.getElementById('set-ai-enabled').checked = aiSettings.aiEnabled;
    if(document.getElementById('set-save-conv')) document.getElementById('set-save-conv').checked = aiSettings.saveConv;
    if(document.getElementById('set-save-hist')) document.getElementById('set-save-hist').checked = aiSettings.saveHist;
    if(document.getElementById('set-auto-doc')) document.getElementById('set-auto-doc').checked = aiSettings.autoDoc;
    if(document.getElementById('set-wf-enabled')) document.getElementById('set-wf-enabled').checked = aiSettings.wfEnabled;

    // Inputs
    if(document.getElementById('set-model')) document.getElementById('set-model').value = aiSettings.model;
    if(document.getElementById('set-sys-prompt')) document.getElementById('set-sys-prompt').value = aiSettings.sysPrompt;
    if(document.getElementById('set-style')) document.getElementById('set-style').value = aiSettings.style;
    if(document.getElementById('set-length')) document.getElementById('set-length').value = aiSettings.length;
    if(document.getElementById('set-lang')) document.getElementById('set-lang').value = aiSettings.lang;
  };

  window.saveSettings = function() {
    aiSettings.aiEnabled = document.getElementById('set-ai-enabled').checked;
    aiSettings.saveConv = document.getElementById('set-save-conv').checked;
    aiSettings.saveHist = document.getElementById('set-save-hist').checked;
    aiSettings.autoDoc = document.getElementById('set-auto-doc').checked;
    aiSettings.wfEnabled = document.getElementById('set-wf-enabled').checked;

    aiSettings.model = document.getElementById('set-model').value;
    aiSettings.sysPrompt = document.getElementById('set-sys-prompt').value;
    aiSettings.style = document.getElementById('set-style').value;
    aiSettings.length = document.getElementById('set-length').value;
    aiSettings.lang = document.getElementById('set-lang').value;

    aiSettings.temp = document.getElementById('set-temp').value;
    aiSettings.tokens = document.getElementById('set-tokens').value;
    aiSettings.topp = document.getElementById('set-topp').value;
    aiSettings.pres = document.getElementById('set-pres').value;
    aiSettings.freq = document.getElementById('set-freq').value;

    localStorage.setItem('verde_ai_settings', JSON.stringify(aiSettings));
  };

  // Bind settings listeners
  document.querySelectorAll('.ai-setting-inp').forEach(function(inp) {
    inp.addEventListener('change', window.saveSettings);
  });
  ['temp','tokens','topp','pres','freq'].forEach(function(key) {
    var el = document.getElementById('set-' + key);
    if(el) {
      el.addEventListener('input', function(e) {
        var lbl = document.getElementById('lbl-' + key);
        if(lbl) lbl.textContent = e.target.value;
        window.saveSettings();
      });
    }
  });

  // Data Actions
  window.exportAIHistory = function() {
    if(aiHistory.length === 0) return window.VerdeToast.show('No history to export', 'error');
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aiHistory, null, 2));
    var a = document.createElement('a');
    a.href = dataStr;
    a.download = 'verde_ai_history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  window.clearAIHistory = function() {
    window.VerdeModal.confirm('Clear AI History', 'Are you sure you want to delete all AI interaction history? This cannot be undone.', function() {
      aiHistory = [];
      saveHistory();
      renderHistory();
      window.VerdeToast.show('History Cleared', 'success');
    });
  };

  window.resetAISettings = function() {
    window.VerdeModal.confirm('Reset AI Settings', 'Are you sure you want to restore all AI settings to their default values?', function() {
      aiSettings = Object.assign({}, defaultSettings);
      localStorage.setItem('verde_ai_settings', JSON.stringify(aiSettings));
      initSettings();
      window.VerdeToast.show('Settings Reset', 'success');
    });
  };

  // ── PORTAL ACTION MENU ── //
  window.toggleAIMenu = function(e, id, type) {
    e.stopPropagation();
    var portal = document.getElementById('ai-action-portal');
    if (!portal) return;

    var existing = portal.querySelector('.crm-menu');
    if (existing) portal.removeChild(existing);

    var rect = e.currentTarget.getBoundingClientRect();
    
    var menu = document.createElement('div');
    menu.className = 'crm-menu'; // reuse class for styling if possible, or manual styles
    menu.style.position = 'absolute';
    menu.style.background = 'var(--surface)';
    menu.style.border = '1px solid var(--border)';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = 'var(--shadow-lg)';
    menu.style.padding = '4px 0';
    menu.style.minWidth = '140px';
    menu.style.pointerEvents = 'auto';
    menu.style.zIndex = '9999';

    function addOpt(label, icon, onClickFn) {
      var btn = document.createElement('div');
      btn.style.padding = '8px 16px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '13px';
      btn.style.display = 'flex';
      btn.style.gap = '8px';
      btn.style.alignItems = 'center';
      btn.innerHTML = '<span>' + icon + '</span><span>' + label + '</span>';
      btn.onmouseover = function() { btn.style.background = 'var(--bg-2)'; };
      btn.onmouseout = function() { btn.style.background = 'transparent'; };
      btn.onclick = function(ev) {
        ev.stopPropagation();
        portal.removeChild(menu);
        onClickFn();
      };
      menu.appendChild(btn);
    }

    if (type === 'prompt') {
      var p = aiPrompts.find(x=>x.id===id);
      addOpt(p && p.favorite ? 'Unfavorite' : 'Favorite', '★', function() { window.togglePromptFavorite(id); });
      addOpt('Edit', '✏', function() { window.openPromptModal(id); });
      addOpt('Delete', '🗑', function() {
        if(!confirm('Delete this prompt?')) return;
        aiPrompts = aiPrompts.filter(x=>x.id!==id); 
        savePrompts(); renderPrompts();
      });
    }

    
    
    if (type === 'workflow') {
      var w = aiWorkflows.find(x=>x.id===id);
      
      addOpt('Run Workflow', '▶', function() {
        w.lastRun = new Date().toISOString();
        aiWfStats.execs++;
        
        // 90% success rate mock
        var isSuccess = Math.random() > 0.1;
        if(isSuccess) {
          aiWfStats.success++;
          window.VerdeToast.show('Workflow Executed Successfully', 'success');
        } else {
          aiWfStats.failed++;
          window.VerdeToast.show('Workflow Execution Failed', 'error');
        }
        
        saveWorkflows(); saveWfStats(); renderWorkflows();
      });
      
      if(w.status === 'Active') {
        addOpt('Pause', '⏸', function() { w.status = 'Paused'; saveWorkflows(); renderWorkflows(); });
      } else {
        addOpt('Resume (Set Active)', '▶', function() { w.status = 'Active'; saveWorkflows(); renderWorkflows(); });
      }
      
      addOpt('Edit', '✏', function() { window.openWorkflowModal(null, id); });
      
      addOpt('Duplicate', '📄', function() {
        var copy = JSON.parse(JSON.stringify(w));
        copy.id = genId('WF');
        copy.name = copy.name + ' (Copy)';
        copy.lastRun = null;
        aiWorkflows.push(copy);
        saveWorkflows(); renderWorkflows();
      });

      addOpt('Delete', '🗑', function() {
        if(!confirm('Delete this workflow?')) return;
        aiWorkflows = aiWorkflows.filter(x=>x.id!==id); 
        saveWorkflows(); renderWorkflows();
      });
    }

    if (type === 'document') {
      var d = aiDocuments.find(x=>x.id===id);
      addOpt('Preview', '👁', function() { window.previewDocument(id); });
      addOpt('Copy Content', '📄', function() {
        navigator.clipboard.writeText(d.content).then(function() { window.VerdeToast.show('Copied', 'success'); });
      });
      addOpt('Download TXT', '⬇', function() {
        var blob = new Blob([d.content.replace(/<[^>]*>?/gm, '')], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = d.title + '.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
      addOpt('Download PDF', '📑', function() {
        window.VerdeToast.show('PDF Engine starting...', 'info');
      });
      addOpt(d.status === 'Saved' ? 'Mark as Draft' : 'Save Document', '💾', function() {
        d.status = d.status === 'Saved' ? 'Draft' : 'Saved';
        saveDocuments(); renderDocuments();
      });
      addOpt('Delete', '🗑', function() {
        if(!confirm('Delete this document?')) return;
        aiDocuments = aiDocuments.filter(x=>x.id!==id); 
        saveDocuments(); renderDocuments();
      });
    }

    portal.appendChild(menu);

    var menuRect = menu.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;
    
    if (spaceBelow >= menuRect.height) {
      menu.style.top = rect.bottom + 'px';
    } else {
      menu.style.top = (rect.top - menuRect.height) + 'px';
    }
    menu.style.left = Math.max(0, rect.right - menuRect.width) + 'px';

    var closeMenu = function() {
      if(portal.contains(menu)) portal.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(function() { document.addEventListener('click', closeMenu); }, 0);
  };
  
  // Search bind
  var gs = document.getElementById('ai-global-search');
  if(gs) gs.addEventListener('input', function() {
    renderPrompts();
    renderHistory();
  });

  var dsSearch = document.getElementById('ds-search');
  if(dsSearch) dsSearch.addEventListener('input', function() {
    renderDocuments();
  });

  var wfSearch = document.getElementById('wf-search');
  if(wfSearch) wfSearch.addEventListener('input', function() {
    renderWorkflows();
  });

  // Init
  loadStorage();
  window.switchAiTab('dashboard');

})();
