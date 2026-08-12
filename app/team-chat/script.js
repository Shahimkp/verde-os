/* ==========================================================================
   VERDE OS — TEAM CHAT MODULE (PRODUCTION WIRED)
   ========================================================================== */

const ChatModule = (function () {
  'use strict';

  // --- 1. GLOBALS & REFERENCES ---
  const STORAGE_KEY = 'verde_os_team_chat_messages';
  let chatMessages = [];
  let activeConversationId = null;
  let currentUser = null;
  let teamEmployees = [];

  // --- 2. DATA SYNCHRONIZATION ---
  function loadTeamData() {
    // 1. Get Current User
    if (window.VERDE_SESSION && typeof window.VERDE_SESSION.initCore === 'function') {
      currentUser = window.VERDE_SESSION.initCore();
    }
    
    // Stop execution if no valid authenticated user
    if (!currentUser) {
      console.warn('VERDE OS Chat: No authenticated user found. Waiting for session redirect.');
      return;
    }

    // 2. Load Real Team Members
    const storedEmps = localStorage.getItem('verde_os_team_employees');
    if (storedEmps) {
      try {
        teamEmployees = JSON.parse(storedEmps);
      } catch (e) {
        teamEmployees = [];
      }
    } else {
      teamEmployees = [];
    }
    
    // Filter out ourselves so we can't personal-chat ourselves
    teamEmployees = teamEmployees.filter(emp => {
      if (emp.id === currentUser.id) return false;
      
      const empNum = emp.id ? String(emp.id).replace(/\D/g, '') : null;
      const curNum = currentUser.id ? String(currentUser.id).replace(/\D/g, '') : null;
      if (empNum && curNum && empNum === curNum) return false;
      
      if (emp.email && currentUser.email && emp.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
      
      const eName = (emp.name || '').toLowerCase().trim();
      const uName = (currentUser.name || '').toLowerCase().trim();
      if (eName && uName) {
        if (eName === uName) return false;
        if (eName.startsWith(uName + ' ') || uName.startsWith(eName + ' ')) return false;
      }
      
      return true;
    });
  }

  function loadChatData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        chatMessages = JSON.parse(stored);
      } catch (e) {
        chatMessages = [];
      }
    } else {
      chatMessages = [];
    }
  }

  function saveChatData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages));
  }

  // --- 3. CONVERSATION LOGIC ---
  function getConversationId(userId1, userId2) {
    if (userId2 === 'team') return 'team';
    return [userId1, userId2].sort().join('_');
  }

  function getUnreadCount(convId) {
    return chatMessages.filter(msg => 
      msg.conversationId === convId && 
      msg.senderId !== currentUser.id && 
      (!msg.readBy || !msg.readBy.includes(currentUser.id))
    ).length;
  }

  function getLastMessage(convId) {
    const msgs = chatMessages.filter(msg => msg.conversationId === convId);
    return msgs.length ? msgs[msgs.length - 1] : null;
  }

  // --- 4. UI RENDERING ---
  function renderSidebar() {
    const listEl = document.getElementById('chat-members-list');
    if (!listEl) return;
    
    let html = '';
    
    // A) Team Chat (Always available)
    const teamUnread = getUnreadCount('team');
    const teamLast = getLastMessage('team');
    
    html += `
      <div class="chat-item ${activeConversationId === 'team' ? 'active' : ''}" data-id="team" data-name="Team Chat" onclick="ChatModule.openConversation('team', 'Team Chat', 'TC')">
        <div class="chat-avatar" style="background:var(--primary); color:white;">TC</div>
        <div class="chat-item-info">
          <div class="chat-item-name">Team Chat ${teamUnread > 0 ? `<span class="chat-badge">${teamUnread}</span>` : ''}</div>
          <div class="chat-item-preview">${teamLast ? (teamLast.senderId === currentUser.id ? 'You: ' : teamLast.senderName + ': ') + teamLast.message : 'No messages yet'}</div>
        </div>
      </div>
    `;
    
    // B) Personal Chats (Rendered from active teamMembers)
    teamEmployees.forEach(emp => {
      const convId = getConversationId(currentUser.id, emp.id);
      const unread = getUnreadCount(convId);
      const last = getLastMessage(convId);
      
      const empName = emp.name || 'Unknown';
      const initials = emp.initials || empName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      const statusClass = emp.status === 'Present' || emp.status === 'Remote' || emp.status === 'Online' ? 'online' : emp.status === 'Leave' || emp.status === 'Half Day' ? 'busy' : 'offline';
      
      html += `
        <div class="chat-item ${activeConversationId === emp.id ? 'active' : ''}" data-id="${emp.id}" data-name="${empName}" onclick="ChatModule.openConversation('${emp.id}', '${empName.replace(/'/g, "\\'")}', '${initials}')">
          <div class="chat-avatar" style="background: ${emp.avatarBg || 'var(--primary-10)'}; color: ${emp.avatarBg ? 'white' : 'var(--primary)'};">
            ${initials}
            <div class="chat-status ${statusClass}"></div>
          </div>
          <div class="chat-item-info">
            <div class="chat-item-name">${empName} ${unread > 0 ? `<span class="chat-badge">${unread}</span>` : ''}</div>
            <div class="chat-item-preview">${last ? (last.senderId === currentUser.id ? 'You: ' : '') + last.message : 'No messages yet'}</div>
          </div>
        </div>
      `;
    });
    
    listEl.innerHTML = html;
  }

  function filterMembers(query) {
    query = (query || '').toLowerCase().trim();
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
      const name = (item.getAttribute('data-name') || '').toLowerCase();
      if (item.getAttribute('data-id') === 'team' || name.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function renderMessages(convId) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    const msgs = chatMessages.filter(msg => msg.conversationId === convId);
    
    if (msgs.length === 0) {
      container.innerHTML = `
        <div class="chat-empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span>No messages yet. Say hello!</span>
        </div>
      `;
      return;
    }
    
    let html = '';
    msgs.forEach(msg => {
      const isMine = msg.senderId === currentUser.id;
      const timeObj = new Date(msg.timestamp);
      // Format as "Today, 10:30 AM" or "Aug 12, 10:30 AM"
      let timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      if (timeObj.toDateString() === new Date().toDateString()) {
         timeStr = "Today, " + timeStr;
      } else {
         timeStr = timeObj.toLocaleDateString([], {month:'short', day:'numeric'}) + ", " + timeStr;
      }
      
      html += `
        <div class="chat-message ${isMine ? 'sent' : 'received'}">
          ${!isMine && convId === 'team' ? `<div class="chat-message-sender">${msg.senderName}</div>` : ''}
          <div class="chat-bubble">${msg.message.replace(/\\n/g, '<br>')}</div>
          <div class="chat-message-time">${timeStr}</div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function openConversation(participantId, participantName, participantInitials) {
    activeConversationId = participantId;
    
    const convId = getConversationId(currentUser.id, participantId);
    
    // Mark incoming messages as read
    let updated = false;
    chatMessages.forEach(msg => {
      if (msg.conversationId === convId && msg.senderId !== currentUser.id) {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(currentUser.id)) {
          msg.readBy.push(currentUser.id);
          updated = true;
        }
      }
    });
    
    if (updated) saveChatData();
    
    // Update Sidebar Active State
    renderSidebar(); 
    
    const mainArea = document.getElementById('chat-main-area');
    if (!mainArea) return;
    
    const avatarBg = participantId === 'team' ? 'background:var(--primary); color:white;' : 'background:var(--primary-10); color:var(--primary);';

    mainArea.innerHTML = `
      <div class="chat-header">
        <div class="chat-avatar" style="${avatarBg}">${participantInitials || participantName.charAt(0)}</div>
        <div style="font-weight: 600; color: var(--text-1);">${participantName}</div>
      </div>
      <div class="chat-messages" id="chat-messages-container">
        <!-- Rendered via JS -->
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input-field" placeholder="Type your message..." autocomplete="off">
        <button id="chat-send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    `;
    
    renderMessages(convId);
    
    // Bind Enter and Button
    const input = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('chat-send-btn');
    
    const handleSend = () => {
       ChatModule.sendMessage(participantId);
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
           e.preventDefault();
           handleSend();
        }
      });
      setTimeout(() => input.focus(), 10);
    }
  }

  function sendMessage(participantId) {
    const input = document.getElementById('chat-input-field');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    
    const convId = getConversationId(currentUser.id, participantId);
    
    const newMessage = {
      id: 'msg_' + Date.now() + Math.floor(Math.random()*1000),
      conversationId: convId,
      senderId: currentUser.id,
      senderName: currentUser.name || 'Unknown',
      message: text,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id]
    };
    
    chatMessages.push(newMessage);
    saveChatData();
    
    input.value = '';
    renderMessages(convId);
    renderSidebar();
  }

  function processNotifications() {
    let updated = false;
    
    chatMessages.forEach(msg => {
      if (msg.senderId === currentUser.id) return;
      if (msg.readBy && msg.readBy.includes(currentUser.id)) return;
      
      if (!msg.notifiedTo) msg.notifiedTo = [];
      
      if (!msg.notifiedTo.includes(currentUser.id)) {
        msg.notifiedTo.push(currentUser.id);
        updated = true;
        
        const isViewing = (msg.conversationId === 'team' && activeConversationId === 'team') || 
                          (msg.conversationId !== 'team' && activeConversationId && msg.conversationId === getConversationId(currentUser.id, activeConversationId));
                          
        if (!isViewing && window.VerdeServices && window.VerdeServices.Notifications) {
          const title = msg.conversationId === 'team' ? 'New message in Team Chat' : 'New message from ' + (msg.senderName || 'Team Member');
          const preview = msg.message.substring(0, 45) + (msg.message.length > 45 ? '...' : '');
          window.VerdeServices.Notifications.addNotification(title, preview);
        }
      }
    });
    
    if (updated) saveChatData();
  }

  // Handle external storage changes to sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadChatData();
      if (activeConversationId) {
        const convId = getConversationId(currentUser.id, activeConversationId);
        
        // Mark as read immediately if we are viewing it
        let markedRead = false;
        chatMessages.forEach(msg => {
          if (msg.conversationId === convId && msg.senderId !== currentUser.id) {
            if (!msg.readBy) msg.readBy = [];
            if (!msg.readBy.includes(currentUser.id)) {
              msg.readBy.push(currentUser.id);
              markedRead = true;
            }
          }
        });
        if (markedRead) saveChatData();
        
        renderMessages(convId);
      }
      processNotifications();
      renderSidebar();
    }
  });

  function init() {
    loadTeamData();
    if (!currentUser) return;
    loadChatData();
    processNotifications();
    renderSidebar();
  }

  // Public API
  return {
    init,
    openConversation,
    sendMessage,
    filterMembers
  };

})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ChatModule.init);
} else {
  ChatModule.init();
}
