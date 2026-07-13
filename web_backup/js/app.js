/**
 * app.js – Application bootstrap, SPA router, view manager.
 * All views rendered into #app-root via hash-based routing.
 * UI additions: voice/video call, camera, ripple effects, dynamic Send/Mic toggle.
 */

import { openDB } from './storage.js';
import { applyTheme, renderSettings } from './settings.js';
import {
  getAllContacts, getContact, createContact, updateContact,
  deleteContactRecord, readAvatarFile, updateLastMessage
} from './contacts.js';
import {
  renderAllMessages, renderMessage, triggerAutoReply, setCurrentContact,
  getCurrentContact, saveMessage, deleteMessagesForContact, clearAllMessages
} from './chat.js';
import { renderRepliesEditor } from './replies.js';

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL SVG ICON LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

const ICONS = {
  back:    `<svg class="icon" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
  settings:`<svg class="icon" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
  search:  `<svg class="icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  add:     `<svg class="icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  send:    `<svg class="icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  emoji:   `<svg class="icon" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
  attach:  `<svg class="icon" viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>`,
  camera:  `<svg class="icon" viewBox="0 0 24 24"><path d="M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`,
  mic:     `<svg class="icon" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>`,
  phone:   `<svg class="icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
  videocam:`<svg class="icon" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
  more:    `<svg class="icon" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
  edit:    `<svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  replies: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`,
  delete:  `<svg class="icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  chat:    `<svg class="icon" viewBox="0 0 24 24" width="36" height="36"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function attachRipple(el) {
  el.classList.add('ripple-host');
  el.addEventListener('pointerdown', function (e) {
    const rect   = this.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
    `;
    this.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  });
}

function applyRipples(root) {
  root.querySelectorAll('.btn-primary, .btn-secondary, .btn-danger, .fab, .btn-send').forEach(el => {
    attachRipple(el);
  });
  root.querySelectorAll('.btn-icon').forEach(el => {
    attachRipple(el);
  });
  root.querySelectorAll('.contact-item, .settings-row').forEach(el => {
    el.classList.add('ripple-dark');
    attachRipple(el);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════════

async function init() {
  await openDB();
  await applyTheme();
  registerServiceWorker();
  setupGlobalEvents();
  route();
  window.addEventListener('hashchange', route);
}

function route() {
  const hash = location.hash || '#/';

  if (hash === '#/' || hash === '#/home') {
    showView('home');
  } else if (hash.startsWith('#/chat/')) {
    showView('chat', hash.replace('#/chat/', ''));
  } else if (hash.startsWith('#/contact/new')) {
    showView('contact-form', null);
  } else if (hash.startsWith('#/contact/edit/')) {
    showView('contact-form', hash.replace('#/contact/edit/', ''));
  } else if (hash.startsWith('#/replies/')) {
    showView('replies', hash.replace('#/replies/', ''));
  } else if (hash === '#/settings') {
    showView('settings');
  } else {
    showView('home');
  }
}

async function showView(view, param) {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  switch (view) {
    case 'home':         await renderHomeView(root);           break;
    case 'chat':         await renderChatView(root, param);    break;
    case 'contact-form': await renderContactForm(root, param); break;
    case 'replies':      await renderRepliesView(root, param); break;
    case 'settings':     await renderSettingsView(root);       break;
  }

  applyRipples(root);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME VIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function renderHomeView(root) {
  root.innerHTML = `
    <div class="view home-view">
      <header class="app-header">
        <div class="app-logo">
          <span class="logo-icon">${ICONS.chat}</span>
          <span class="logo-text">ChatSim</span>
        </div>
        <div class="header-actions">
          <button class="btn-icon" id="settings-btn" title="Settings" aria-label="Settings">
            ${ICONS.settings}
          </button>
        </div>
      </header>

      <div class="search-bar-wrap">
        <div class="search-bar">
          <span class="search-icon">${ICONS.search}</span>
          <input type="text" id="search-input" placeholder="Search or start new chat"
            class="search-input" aria-label="Search contacts" />
        </div>
      </div>

      <ul id="contact-list" class="contact-list" aria-label="Contact list">
        <li class="contact-list-loading">Loading…</li>
      </ul>

      <button class="fab ripple-host" id="new-contact-btn" aria-label="New contact" title="New contact">
        <span class="fab-icon">${ICONS.add}</span>
      </button>
    </div>
  `;

  document.getElementById('settings-btn').addEventListener('click', () => {
    location.hash = '#/settings';
  });
  document.getElementById('new-contact-btn').addEventListener('click', () => {
    location.hash = '#/contact/new';
  });

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', () => renderContactList(searchInput.value.trim()));

  await renderContactList('');
}

async function renderContactList(query = '') {
  const list = document.getElementById('contact-list');
  if (!list) return;

  const contacts = await getAllContacts();
  const filtered = query
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query))
    : contacts;

  if (filtered.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="empty-icon">${ICONS.chat}</div>
        <p class="empty-text">${query ? 'No contacts found' : 'No chats yet'}</p>
        ${!query ? '<p class="empty-sub">Tap + to add your first contact</p>' : ''}
      </li>`;
    return;
  }

  list.innerHTML = filtered.map(c => `
    <li class="contact-item ripple-dark" data-id="${c.id}" role="button" tabindex="0"
        aria-label="Open chat with ${escapeHTML(c.name)}">
      <div class="contact-avatar-wrap">
        ${avatarHTML(c)}
        <span class="online-dot"></span>
      </div>
      <div class="contact-info">
        <div class="contact-row">
          <span class="contact-name">${escapeHTML(c.name)}</span>
          <span class="contact-time">${c.lastMessageTime ? formatRelativeTime(c.lastMessageTime) : ''}</span>
        </div>
        <div class="contact-row">
          <span class="contact-preview">${escapeHTML(c.lastMessage || c.phone || 'No messages yet')}</span>
        </div>
      </div>
    </li>
  `).join('');

  list.querySelectorAll('.contact-item').forEach(item => {
    attachRipple(item);
    item.addEventListener('click', () => { location.hash = `#/chat/${item.dataset.id}`; });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') location.hash = `#/chat/${item.dataset.id}`;
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT VIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function renderChatView(root, contactId) {
  const contact = await getContact(contactId);
  if (!contact) { location.hash = '#/'; return; }

  setCurrentContact(contactId);

  root.innerHTML = `
    <div class="view chat-view">
      <!-- ── Chat Header ── -->
      <header class="chat-header">
        <button class="btn-icon back-btn" id="back-btn" aria-label="Go back">
          ${ICONS.back}
        </button>

        <div class="chat-header-info" id="chat-header-info" role="button" tabindex="0"
             aria-label="Contact info for ${escapeHTML(contact.name)}">
          ${avatarHTML(contact, 'avatar-sm')}
          <div class="chat-header-text">
            <span class="chat-contact-name">${escapeHTML(contact.name)}</span>
            <span class="chat-status" id="chat-status">online</span>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn-icon" id="voice-call-btn" title="Voice call" aria-label="Voice call">
            ${ICONS.phone}
          </button>
          <button class="btn-icon" id="video-call-btn" title="Video call" aria-label="Video call">
            ${ICONS.videocam}
          </button>
          <button class="btn-icon" id="chat-more-btn"    title="More options"   aria-label="More options">
            ${ICONS.more}
          </button>
        </div>
      </header>

      <!-- ── Messages ── -->
      <div class="chat-messages" id="chat-messages" aria-live="polite" aria-label="Messages">
        <ul id="message-list" class="message-list"></ul>
      </div>

      <!-- ── Input Composer ── -->
      <footer class="chat-input-bar">
        <div class="message-input-wrap">
          <button class="input-action-btn" id="emoji-btn" aria-label="Emoji" title="Emoji">
            ${ICONS.emoji}
          </button>
          <textarea id="message-input" class="message-input" rows="1"
            placeholder="Message" aria-label="Type a message" maxlength="1000"></textarea>
          <button class="input-action-btn" id="attach-btn" aria-label="Attach file" title="Attach file">
            ${ICONS.attach}
          </button>
          <button class="input-action-btn" id="camera-btn" aria-label="Camera" title="Camera">
            ${ICONS.camera}
          </button>
        </div>
        <button class="btn-send ripple-host" id="send-btn" aria-label="Voice message" title="Voice message">
          ${ICONS.mic}
        </button>
      </footer>
    </div>
  `;

  const msgList      = document.getElementById('message-list');
  const msgContainer = document.getElementById('chat-messages');
  const msgInput     = document.getElementById('message-input');
  const sendBtn      = document.getElementById('send-btn');
  const statusEl     = document.getElementById('chat-status');

  await renderAllMessages(msgList, contactId);
  scrollToBottom(msgContainer);

  // ── Navigation ──
  document.getElementById('back-btn').addEventListener('click', () => {
    setCurrentContact(null);
    location.hash = '#/';
  });

  // ── Chat header click → edit ──
  document.getElementById('chat-header-info').addEventListener('click', () => {
    location.hash = `#/contact/edit/${contactId}`;
  });

  // ── More menu ──
  document.getElementById('chat-more-btn').addEventListener('click', () => {
    showMoreMenu(contactId, contact);
  });

  // ── Dynamic Send/Mic button toggle ──
  msgInput.addEventListener('input', () => {
    const hasText = msgInput.value.trim().length > 0;
    if (hasText) {
      sendBtn.innerHTML = ICONS.send;
      sendBtn.setAttribute('aria-label', 'Send message');
      sendBtn.setAttribute('title', 'Send');
    } else {
      sendBtn.innerHTML = ICONS.mic;
      sendBtn.setAttribute('aria-label', 'Voice message');
      sendBtn.setAttribute('title', 'Voice message');
    }

    // Auto grow textarea height
    msgInput.style.height = 'auto';
    msgInput.style.height = msgInput.scrollHeight + 'px';
  });

  // ── UI-only call/camera/attach buttons ──
  document.getElementById('voice-call-btn').addEventListener('click', () =>
    showToast(`Calling ${contact.name}… (UI only)`));
  document.getElementById('video-call-btn').addEventListener('click', () =>
    showToast(`Video calling ${contact.name}… (UI only)`));
  document.getElementById('emoji-btn').addEventListener('click',  () => showToast('Emoji picker coming soon!'));
  document.getElementById('attach-btn').addEventListener('click', () => showToast('Attachments coming soon!'));
  document.getElementById('camera-btn').addEventListener('click', () => showToast('Camera coming soon!'));

  // ── Send/Mic Click ──
  const handleAction = async () => {
    const text = msgInput.value.trim();
    if (!text) {
      // Voice message mode (mic icon clicked)
      showToast('Voice message feature coming soon! 🎤');
      return;
    }

    msgInput.value = '';
    msgInput.style.height = 'auto';
    sendBtn.innerHTML = ICONS.mic;
    sendBtn.setAttribute('aria-label', 'Voice message');
    sendBtn.setAttribute('title', 'Voice message');
    msgInput.focus();

    const timestamp = Date.now();
    const msg = await saveMessage({ contactId, text, sender: 'user', timestamp });
    await updateLastMessage(contactId, text, timestamp);

    // Add date separator if day changed
    const lastBubble = Array.from(msgList.children)
      .filter(el => el.classList.contains('message-bubble') &&
                    !el.classList.contains('typing-indicator'))
      .pop();
    const prevTs = lastBubble ? parseInt(lastBubble.dataset.ts || '0') : null;
    if (needsDateSeparator(timestamp, prevTs)) {
      const sep = document.createElement('li');
      sep.className = 'date-separator';
      sep.innerHTML = `<span class="date-label">${formatDateLabel(timestamp)}</span>`;
      msgList.appendChild(sep);
    }

    const rendered = renderMessage(msgList, msg, true);
    rendered.dataset.ts = timestamp;
    scrollToBottom(msgContainer);

    // Auto reply flow
    statusEl.textContent = 'typing…';
    statusEl.classList.add('typing');

    await triggerAutoReply(
      contactId,
      getContact,
      updateContact,
      updateLastMessage,
      msgList,
      () => {
        statusEl.textContent = 'online';
        statusEl.classList.remove('typing');
        scrollToBottom(msgContainer);
      }
    );

    statusEl.textContent = 'online';
    statusEl.classList.remove('typing');
  };

  sendBtn.addEventListener('click', handleAction);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAction(); }
  });

  // Focus input on load
  setTimeout(() => msgInput.focus(), 200);
}

function showMoreMenu(contactId, contact) {
  document.getElementById('more-menu-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'more-menu-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9990;
    background:rgba(0,0,0,.15);
    animation:fade-in 150ms ease;
  `;

  const menu = document.createElement('div');
  menu.style.cssText = `
    position:absolute; top:60px; right:8px;
    background:var(--surface-1);
    border-radius:8px;
    box-shadow:var(--shadow-md);
    overflow:hidden;
    min-width:180px;
    animation:dialog-pop 180ms cubic-bezier(.34,1.56,.64,1);
  `;

  const actions = [
    { label: 'Edit contact',    icon: ICONS.edit,    fn: () => { location.hash = `#/contact/edit/${contactId}`; } },
    { label: 'Manage replies',  icon: ICONS.replies, fn: () => { location.hash = `#/replies/${contactId}`; } },
    { label: 'Delete contact',  icon: ICONS.delete,  fn: () => {
        overlay.remove();
        showConfirm(`Delete "${contact.name}" and all messages?`, async () => {
          await deleteContactRecord(contactId);
          await deleteMessagesForContact(contactId);
          location.hash = '#/';
        });
      }
    },
  ];

  actions.forEach(({ label, icon, fn }) => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      display:flex; align-items:center; gap:12px;
      width:100%; padding:13px 18px;
      background:none; border:none; cursor:pointer;
      font-family:'Roboto',sans-serif; font-size:.93rem; font-weight:400;
      color:var(--text-primary);
      transition:background 120ms ease;
      text-align:left;
    `;
    btn.innerHTML = `<span style="color:var(--text-secondary)">${icon}</span>${label}`;
    btn.addEventListener('pointerenter', () => btn.style.background = 'var(--surface-2)');
    btn.addEventListener('pointerleave', () => btn.style.background = '');
    btn.addEventListener('click', () => { overlay.remove(); fn(); });
    menu.appendChild(btn);
  });

  overlay.appendChild(menu);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT FORM (Create / Edit)
// ═══════════════════════════════════════════════════════════════════════════════

async function renderContactForm(root, contactId) {
  const isEdit  = !!contactId;
  const contact = isEdit ? await getContact(contactId) : null;

  root.innerHTML = `
    <div class="view contact-form-view">
      <header class="app-header">
        <button class="btn-icon back-btn" id="back-btn" aria-label="Go back">${ICONS.back}</button>
        <h2 class="header-title">${isEdit ? 'Edit Contact' : 'New Contact'}</h2>
        <div style="width:40px"></div>
      </header>

      <div class="form-body">
        <div class="avatar-upload-wrap">
          <div class="avatar-upload" id="avatar-upload" role="button" tabindex="0"
               aria-label="Upload profile picture">
            <img
              src="${contact?.avatar || 'assets/default-avatar.png'}"
              alt="Profile picture"
              class="avatar avatar-lg"
              id="avatar-preview"
            />
            <div class="avatar-overlay">${ICONS.camera}</div>
          </div>
          <input type="file" id="avatar-input" accept="image/*" style="display:none"
                 aria-label="Choose profile picture" />
          <p class="avatar-hint">Tap to change photo</p>
        </div>

        <div class="form-group">
          <label for="contact-name" class="form-label">Name *</label>
          <input type="text" id="contact-name" class="form-input"
            placeholder="Enter contact name"
            value="${contact ? escapeHTML(contact.name) : ''}"
            maxlength="60" required />
        </div>

        <div class="form-group">
          <label for="contact-phone" class="form-label">Phone</label>
          <input type="tel" id="contact-phone" class="form-input"
            placeholder="+1 234 567 8900"
            value="${contact ? escapeHTML(contact.phone) : ''}"
            maxlength="25" />
        </div>

        ${isEdit ? `
        <div class="form-group">
          <a href="#/replies/${contactId}" class="btn-secondary form-wide-btn" style="text-decoration:none;">
            Manage Auto Replies
          </a>
        </div>` : ''}

        <div class="form-actions">
          <button id="save-contact-btn" class="btn-primary form-wide-btn">
            ${isEdit ? 'Save Changes' : 'Create Contact'}
          </button>
          ${isEdit ? `<button id="delete-contact-btn" class="btn-danger form-wide-btn">Delete Contact</button>` : ''}
        </div>
      </div>
    </div>
  `;

  let selectedAvatar = contact?.avatar || null;

  const avatarUpload  = document.getElementById('avatar-upload');
  const avatarInput   = document.getElementById('avatar-input');
  const avatarPreview = document.getElementById('avatar-preview');

  avatarUpload.addEventListener('click', () => avatarInput.click());
  avatarUpload.addEventListener('keydown', (e) => { if (e.key === 'Enter') avatarInput.click(); });
  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedAvatar = await readAvatarFile(file);
    avatarPreview.src = selectedAvatar;
  });

  document.getElementById('back-btn').addEventListener('click', () => history.back());

  document.getElementById('save-contact-btn').addEventListener('click', async () => {
    const name  = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    if (!name) { showToast('Name is required.'); return; }

    if (isEdit) {
      await updateContact(contactId, { name, phone, avatar: selectedAvatar });
      showToast('Contact updated!');
      location.hash = `#/chat/${contactId}`;
    } else {
      const c = await createContact({ name, phone, avatar: selectedAvatar });
      showToast(`"${name}" created!`);
      location.hash = `#/chat/${c.id}`;
    }
  });

  if (isEdit) {
    document.getElementById('delete-contact-btn')?.addEventListener('click', () => {
      showConfirm(`Delete "${contact.name}" and all messages?`, async () => {
        await deleteContactRecord(contactId);
        await deleteMessagesForContact(contactId);
        location.hash = '#/';
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPLIES VIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function renderRepliesView(root, contactId) {
  const contact = await getContact(contactId);
  if (!contact) { location.hash = '#/'; return; }

  root.innerHTML = `
    <div class="view replies-view">
      <header class="app-header">
        <button class="btn-icon back-btn" id="back-btn" aria-label="Go back">${ICONS.back}</button>
        <h2 class="header-title">${escapeHTML(contact.name)} – Replies</h2>
        <div style="width:40px"></div>
      </header>
      <div class="replies-editor" id="replies-editor"></div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => history.back());
  await renderRepliesEditor(document.getElementById('replies-editor'), contactId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function renderSettingsView(root) {
  root.innerHTML = `
    <div class="view settings-view">
      <header class="app-header">
        <button class="btn-icon back-btn" id="back-btn" aria-label="Go back">${ICONS.back}</button>
        <h2 class="header-title">Settings</h2>
        <div style="width:40px"></div>
      </header>
      <div class="settings-body" id="settings-body"></div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => history.back());
  await renderSettings(document.getElementById('settings-body'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

function setupGlobalEvents() {
  document.addEventListener('app:toast',   (e) => showToast(e.detail.msg));
  document.addEventListener('app:confirm', (e) => showConfirm(e.detail.msg, e.detail.onConfirm));
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function showConfirm(msg, onConfirm) {
  document.getElementById('confirm-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirm-overlay';
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog" role="dialog" aria-modal="true" aria-label="Confirm action">
      <p class="confirm-msg">${escapeHTML(msg)}</p>
      <div class="confirm-actions">
        <button class="btn-secondary" id="confirm-cancel-btn">Cancel</button>
        <button class="btn-danger"    id="confirm-ok-btn">Delete</button>
      </div>
    </div>
  `;

  overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-ok-btn').focus();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function avatarHTML(contact, cls = 'avatar-md') {
  if (contact.avatar) {
    return `<img src="${contact.avatar}" alt="${escapeHTML(contact.name)}" class="avatar ${cls}" />`;
  }
  const initials = contact.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue      = Math.abs(contact.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
  return `<div class="avatar ${cls} avatar-initials" style="--hue:${hue}">${initials}</div>`;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelativeTime(ts) {
  const diff  = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7)   return `${days}d`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateLabel(ts) {
  const d         = new Date(ts);
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today))     return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function needsDateSeparator(ts, prevTs) {
  if (!prevTs) return true;
  const a = new Date(ts), b = new Date(prevTs);
  return a.getFullYear() !== b.getFullYear() ||
         a.getMonth()    !== b.getMonth()    ||
         a.getDate()     !== b.getDate();
}

function scrollToBottom(el) { el.scrollTop = el.scrollHeight; }

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', init);
