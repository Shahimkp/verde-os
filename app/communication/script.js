(function () {
  'use strict';

  /* ==========================================================================
     VERDE OS — COMMUNICATION WORKSPACE CONTROLLER
     ========================================================================== */

  const state = {
    me: { initials: 'ME', name: 'You' },
    activeChannel: 'proj-greenleaf',
    activeView: 'chat', // chat, notif, ann
    messages: {
      'proj-greenleaf': [
        { id:1, author:'Sarah J.', initials:'SJ', time:'10:30 AM', text:'Hey team! Client just approved the kickoff for GreenLeaf.', type:'text' },
        { id:2, author:'Anna R.', initials:'AR', time:'10:35 AM', text:'Great! I have the initial wireframes ready for review.', type:'file', fileName:'Wireframes_v2.pdf', fileSize:'2.4 MB' },
        { id:3, author:'Mark D.', initials:'MD', time:'11:00 AM', text:'Can you drop the API key for the staging environment here?', type:'text' },
        { id:4, author:'Sarah J.', initials:'SJ', time:'11:05 AM', text:'Here it is:', type:'code', codeContent:'export const API_KEY = "pk_live_verde_89237492837";\nexport const ENV = "staging";' }
      ],
      'dept-dev': [
        { id:1, author:'Mark D.', initials:'MD', time:'Yesterday', text:'Reminder: Weekly sync is moved to 3 PM.', type:'text' },
        { id:2, author:'Sarah J.', initials:'SJ', time:'Yesterday', text:'Got it.', type:'audio', duration:'0:14' }
      ]
    },
    notifications: [
      { id:1, text:'<strong>Sarah J.</strong> assigned you to task <strong>Homepage Design</strong>', time:'10 mins ago', type:'task', read:false },
      { id:2, text:'Invoice <strong>INV-26-081</strong> was paid by Nova Corp', time:'1 hour ago', type:'finance', read:false },
      { id:3, text:'<strong>Managing Director</strong> posted a new announcement', time:'2 hours ago', type:'announcement', read:true }
    ]
  };

  /* ── ROUTING ── */
  function switchView(view, evt) {
    state.activeView = view;
    
    // Manage DOM visibility
    const viewChat = document.getElementById('view-chat');
    const viewNotif = document.getElementById('view-notif');
    const viewAnn = document.getElementById('view-ann');
    const rsPanel = document.getElementById('rs-panel');

    if (viewChat) viewChat.classList.add('hide');
    if (viewNotif) viewNotif.classList.remove('active');
    if (viewAnn) viewAnn.classList.remove('active');
    if (rsPanel) rsPanel.classList.add('hide');

    if (evt && evt.currentTarget) {
      document.querySelectorAll('.comm-nav .nav-item').forEach(n => n.classList.remove('active'));
      evt.currentTarget.classList.add('active');
    }

    if (view === 'notifications') {
      if (viewNotif) viewNotif.classList.add('active');
      renderNotifications();
    } else if (view === 'announcements') {
      if (viewAnn) viewAnn.classList.add('active');
    }
  }

  function switchChannel(channelId, evt) {
    state.activeView = 'chat';
    state.activeChannel = channelId;
    
    const viewChat = document.getElementById('view-chat');
    const viewNotif = document.getElementById('view-notif');
    const viewAnn = document.getElementById('view-ann');
    const rsPanel = document.getElementById('rs-panel');

    if (viewChat) viewChat.classList.remove('hide');
    if (viewNotif) viewNotif.classList.remove('active');
    if (viewAnn) viewAnn.classList.remove('active');
    if (rsPanel) rsPanel.classList.remove('hide');

    if (evt && evt.currentTarget) {
      document.querySelectorAll('.comm-nav .nav-item').forEach(n => n.classList.remove('active'));
      evt.currentTarget.classList.add('active');
    }


  // Update Header
  const titleMap = {
    'proj-greenleaf': '# GreenLeaf Website',
    'proj-nova': '# Nova ERP Phase 1',
    'dept-dev': '# Engineering',
    'dept-design': '# Design Studio',
    'dm-sarah': 'Sarah J.',
    'dm-mark': 'Mark D.'
  };
  document.getElementById('chat-title').textContent = titleMap[channelId] || 'Chat';
  
  // Fake typing indicator clearing
  document.getElementById('typing-ind').classList.remove('active');

  renderMessages();
}

/* ══════════════════════════════════════════════
   RENDERING
   ══════════════════════════════════════════════ */

function renderMessages() {
  const container = document.getElementById('chat-history');
  const msgs = state.messages[state.activeChannel] || [];
  
  let html = `<div class="date-separator"><span>Today</span></div>`;
  
  msgs.forEach(m => {
    let contentHtml = `<div class="msg-text">${m.text}</div>`;
    
    if (m.type === 'file') {
      contentHtml += `
        <div class="msg-attachment">
          <div class="msg-att-icon">PDF</div>
          <div class="msg-att-info">
            <div class="msg-att-name">${m.fileName}</div>
            <div class="msg-att-size">${m.fileSize}</div>
          </div>
        </div>
      `;
    } else if (m.type === 'code') {
      contentHtml += `<div class="msg-code">${m.codeContent}</div>`;
    } else if (m.type === 'audio') {
      contentHtml = `
        <div class="msg-audio">
          <div class="ma-play"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          <div class="ma-wave"></div>
          <div class="ma-time">${m.duration}</div>
        </div>
      `;
    }

    html += `
      <div class="message">
        <div class="msg-avatar">${m.initials}</div>
        <div class="msg-content">
          <div class="msg-meta">
            <span class="msg-author">${m.author}</span>
            <span class="msg-time">${m.time}</span>
          </div>
          ${contentHtml}
        </div>
        <div class="msg-hover-actions">
          <div class="ha-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></div>
          <div class="ha-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg></div>
        </div>
      </div>
    `;
  });
  
  if (msgs.length === 0) {
    html = `<div style="text-align:center;color:var(--text-3);margin-top:40px;">This is the beginning of the channel.</div>`;
  }

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function renderNotifications() {
  const container = document.getElementById('notif-list');
  container.innerHTML = state.notifications.map(n => `
    <div class="notif-card ${n.read ? '' : 'unread'}">
      <div class="notif-icon">
        ${n.type === 'task' ? '✓' : n.type === 'finance' ? '$' : '!'}
      </div>
      <div class="notif-content">
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');

  const unreadCount = state.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('badge-notif');
  if(unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════
   ACTIONS
   ══════════════════════════════════════════════ */

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;

  if(!state.messages[state.activeChannel]) {
    state.messages[state.activeChannel] = [];
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  state.messages[state.activeChannel].push({
    id: Date.now(),
    author: state.me.name,
    initials: state.me.initials,
    time: timeStr,
    text: text,
    type: 'text'
  });

  input.value = '';
  renderMessages();
}

  window.switchView = switchView;
  window.switchChannel = switchChannel;
  window.sendMessage = sendMessage;
  window.markAllRead = markAllRead;

  // Enter to send
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderMessages();
      renderNotifications();
    });
  } else {
    renderMessages();
    renderNotifications();
  }
})();