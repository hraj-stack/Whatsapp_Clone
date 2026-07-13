/**
 * chat.js – Chat logic, auto-reply engine, and message rendering.
 * No circular imports: only imports from storage.js.
 * Additions: date separators, read-receipt ticks.
 */

import { dbGetByIndex, dbPut, dbDelete, dbGetAll, getSetting } from './storage.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Return a human-readable date label for a given timestamp.
 * Today → "Today", Yesterday → "Yesterday", else → "Mon D, YYYY"
 */
function formatDateLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today))     return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * SVG double-tick for read receipts (sent messages).
 */
const TICK_SVG = `<svg class="bubble-ticks" viewBox="0 0 18 18" width="14" height="14" fill="currentColor">
  <path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076L8.21 15.19l-4.802-4.559a.434.434 0 0 0-.608.015l-.498.523a.434.434 0 0 0 .015.609l5.502 5.226a.434.434 0 0 0 .609-.015L17.47 5.644a.434.434 0 0 0-.076-.609zm-4.55-.306a.434.434 0 0 0-.609.076l-6.89 8.875-1.847-1.75a.434.434 0 0 0-.61.015l-.498.523a.434.434 0 0 0 .015.609l2.4 2.274a.434.434 0 0 0 .609-.015l7.506-9.398a.434.434 0 0 0-.076-.609z"/>
</svg>`;

// ─── Message persistence ──────────────────────────────────────────────────────

export async function getMessages(contactId) {
  const msgs = await dbGetByIndex('messages', 'contactId', contactId);
  return msgs.sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveMessage({ contactId, text, sender, timestamp }) {
  const msg = { id: generateId(), contactId, text, sender, timestamp };
  await dbPut('messages', msg);
  return msg;
}

export async function deleteMessagesForContact(contactId) {
  const msgs = await getMessages(contactId);
  for (const m of msgs) await dbDelete('messages', m.id);
}

export async function clearAllMessages() {
  const all = await dbGetAll('messages');
  for (const m of all) await dbDelete('messages', m.id);
}

// ─── Current chat state ───────────────────────────────────────────────────────

let currentContactId = null;
let isReplying = false;

export function setCurrentContact(id) { currentContactId = id; }
export function getCurrentContact() { return currentContactId; }

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

/**
 * Render a single message bubble into the chat list.
 * Includes read-receipt tick for sent messages.
 */
export function renderMessage(container, { text, sender, timestamp }, animate = false) {
  const li = document.createElement('li');
  li.className = `message-bubble ${sender === 'user' ? 'sent' : 'received'}`;
  if (animate) li.classList.add('animate-in');

  const isSent = sender === 'user';

  li.innerHTML = `
    <div class="bubble-text">${escapeHTML(text)}</div>
    <div class="bubble-time">
      ${formatTime(timestamp)}
      ${isSent ? TICK_SVG : ''}
    </div>
  `;

  container.appendChild(li);
  return li;
}

/**
 * Inject a date-separator <li> before the given message if the date differs
 * from the previous message's date, or if it is the very first message.
 * Returns true if a separator was inserted.
 */
function maybeInsertDateSeparator(container, timestamp, prevTimestamp) {
  const current = new Date(timestamp);
  const prev    = prevTimestamp !== null ? new Date(prevTimestamp) : null;

  const needsSep = !prev ||
    current.getFullYear() !== prev.getFullYear() ||
    current.getMonth()    !== prev.getMonth() ||
    current.getDate()     !== prev.getDate();

  if (!needsSep) return false;

  const sep = document.createElement('li');
  sep.className = 'date-separator';
  sep.innerHTML = `<span class="date-label">${formatDateLabel(timestamp)}</span>`;
  container.appendChild(sep);
  return true;
}

/**
 * Render all messages for the current chat, with date separators.
 */
export async function renderAllMessages(container, contactId) {
  container.innerHTML = '';
  const msgs = await getMessages(contactId);
  let prevTs = null;
  for (const msg of msgs) {
    maybeInsertDateSeparator(container, msg.timestamp, prevTs);
    renderMessage(container, msg, false);
    prevTs = msg.timestamp;
  }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export function showTypingIndicator(container) {
  const existing = container.querySelector('.typing-indicator');
  if (existing) return existing;

  const li = document.createElement('li');
  li.className = 'message-bubble received typing-indicator';
  li.innerHTML = `
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  container.appendChild(li);
  scrollToBottom(container);
  return li;
}

export function hideTypingIndicator(container) {
  const indicator = container.querySelector('.typing-indicator');
  if (indicator) indicator.remove();
}

// ─── Auto-Reply Engine ────────────────────────────────────────────────────────

/**
 * Pick the next reply for a contact based on its replyMode.
 */
function pickReply(contact) {
  const { replies, replyMode, replyIndex } = contact;
  if (!replies || replies.length === 0) return null;

  switch (replyMode) {
    case 'loop':
      return {
        text: replies[replyIndex % replies.length],
        nextIndex: (replyIndex + 1) % replies.length
      };
    case 'random':
      return {
        text: replies[Math.floor(Math.random() * replies.length)],
        nextIndex: replyIndex
      };
    case 'sequential':
    default:
      if (replyIndex >= replies.length) return null;
      return { text: replies[replyIndex], nextIndex: replyIndex + 1 };
  }
}

/**
 * Trigger the auto-reply flow after the user sends a message.
 * Accepts injected functions to avoid circular imports.
 */
export async function triggerAutoReply(
  contactId,
  getContactFn,
  updateContactFn,
  updateLastMessageFn,
  msgContainer,
  onReplyRendered
) {
  if (isReplying) return;
  isReplying = true;

  try {
    const contact = await getContactFn(contactId);
    const result  = pickReply(contact);
    if (!result) { isReplying = false; return; }

    const delay = await getSetting('typingDelay', 1500);

    // Show typing indicator
    showTypingIndicator(msgContainer);

    await sleep(delay);

    // Only proceed if still in the same chat
    if (getCurrentContact() !== contactId) { isReplying = false; return; }

    hideTypingIndicator(msgContainer);

    const timestamp = Date.now();
    const msg = await saveMessage({ contactId, text: result.text, sender: 'contact', timestamp });
    await updateLastMessageFn(contactId, result.text, timestamp);
    await updateContactFn(contactId, { replyIndex: result.nextIndex });

    // Insert date separator before the new message if day has changed
    const children = Array.from(msgContainer.children);
    const lastMsg  = children.filter(el => el.classList.contains('message-bubble') &&
                                          !el.classList.contains('typing-indicator')).pop();
    const lastTs   = lastMsg ? null : null; // separator handled by maybeInsertDateSeparator
    // Find previous non-separator message timestamp
    const prevMessage = children.filter(el =>
      el.classList.contains('message-bubble') &&
      !el.classList.contains('typing-indicator') &&
      !el.classList.contains('date-separator')
    ).pop();

    // We track the timestamp via a data attr so we can check for date changes
    const prevTs = prevMessage ? parseInt(prevMessage.dataset.ts || '0') : null;
    maybeInsertDateSeparator(msgContainer, timestamp, prevTs);

    const rendered = renderMessage(msgContainer, msg, true);
    rendered.dataset.ts = timestamp;
    scrollToBottom(msgContainer);

    if (onReplyRendered) onReplyRendered(msg);
  } finally {
    isReplying = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollToBottom(container) {
  const chatArea = container.closest('.chat-messages') || container.parentElement;
  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
