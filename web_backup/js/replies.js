/**
 * replies.js – Per-contact reply list management with drag-and-drop reorder.
 */

import { getContact, updateContact } from './contacts.js';

// ─── Render Replies Editor ────────────────────────────────────────────────────

/**
 * Renders the full reply editor into `container` for a given contactId.
 * @param {HTMLElement} container
 * @param {string} contactId
 */
export async function renderRepliesEditor(container, contactId) {
  const contact = await getContact(contactId);
  if (!contact) return;

  container.innerHTML = `
    <div class="replies-header">
      <h3 class="replies-title">Auto Replies</h3>
      <div class="reply-mode-row">
        <label class="reply-mode-label">Mode</label>
        <select id="reply-mode-select" class="reply-mode-select">
          <option value="sequential" ${contact.replyMode === 'sequential' ? 'selected' : ''}>Sequential (stop)</option>
          <option value="loop"       ${contact.replyMode === 'loop'       ? 'selected' : ''}>Loop</option>
          <option value="random"     ${contact.replyMode === 'random'     ? 'selected' : ''}>Random</option>
        </select>
        <button id="reset-reply-index" class="btn-icon" title="Reset reply index" aria-label="Reset reply index" style="color:var(--text-secondary)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
      </div>
    </div>

    <ul id="reply-list" class="reply-list" aria-label="Reply list">
      ${(contact.replies || []).map((r, i) => replyItemHTML(r, i)).join('')}
    </ul>

    <div class="reply-add-row">
      <input id="new-reply-input" type="text" class="reply-input" placeholder="Type a new reply…" maxlength="500" />
      <button id="add-reply-btn" class="btn-primary">Add</button>
    </div>
  `;

  bindReplyEvents(container, contactId);
  initDragAndDrop(container.querySelector('#reply-list'), contactId);
}

// ─── HTML template for one reply item ────────────────────────────────────────

function replyItemHTML(text, index) {
  return `
    <li class="reply-item" draggable="true" data-index="${index}">
      <span class="drag-handle" aria-label="Drag to reorder">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="color:var(--text-muted)">
          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </span>
      <span class="reply-text" data-index="${index}">${escapeHTML(text)}</span>
      <div class="reply-actions">
        <button class="btn-icon reply-edit-btn" data-index="${index}" title="Edit" aria-label="Edit reply">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="btn-icon reply-delete-btn" data-index="${index}" title="Delete" aria-label="Delete reply">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </li>
  `;
}

// ─── Event Binding ────────────────────────────────────────────────────────────

function bindReplyEvents(container, contactId) {
  // Mode select
  container.querySelector('#reply-mode-select').addEventListener('change', async (e) => {
    await updateContact(contactId, { replyMode: e.target.value });
  });

  // Reset index
  container.querySelector('#reset-reply-index').addEventListener('click', async () => {
    await updateContact(contactId, { replyIndex: 0 });
    showToast('Reply index reset to beginning.');
  });

  // Add reply
  const addBtn = container.querySelector('#add-reply-btn');
  const input = container.querySelector('#new-reply-input');

  const addReply = async () => {
    const text = input.value.trim();
    if (!text) return;
    const contact = await getContact(contactId);
    const replies = [...(contact.replies || []), text];
    await updateContact(contactId, { replies });
    input.value = '';
    await renderRepliesEditor(container, contactId);
  };

  addBtn.addEventListener('click', addReply);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addReply(); });

  // Edit / Delete (event delegation)
  container.querySelector('#reply-list').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.reply-edit-btn');
    const deleteBtn = e.target.closest('.reply-delete-btn');

    if (editBtn) {
      const idx = parseInt(editBtn.dataset.index);
      await editReply(container, contactId, idx);
    } else if (deleteBtn) {
      const idx = parseInt(deleteBtn.dataset.index);
      await deleteReply(contactId, idx);
      await renderRepliesEditor(container, contactId);
    }
  });
}

// ─── Edit inline ──────────────────────────────────────────────────────────────

async function editReply(container, contactId, index) {
  const contact = await getContact(contactId);
  const replies = [...contact.replies];
  const oldText = replies[index];

  const li = container.querySelector(`.reply-item[data-index="${index}"]`);
  const textSpan = li.querySelector('.reply-text');

  // Replace span with input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'reply-input reply-inline-edit';
  input.value = oldText;
  input.maxLength = 500;
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  const save = async () => {
    const newText = input.value.trim();
    if (newText && newText !== oldText) {
      replies[index] = newText;
      await updateContact(contactId, { replies });
    }
    await renderRepliesEditor(container, contactId);
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') { input.value = oldText; input.blur(); }
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteReply(contactId, index) {
  const contact = await getContact(contactId);
  const replies = contact.replies.filter((_, i) => i !== index);
  // Adjust replyIndex if needed
  const replyIndex = Math.min(contact.replyIndex, Math.max(0, replies.length - 1));
  await updateContact(contactId, { replies, replyIndex });
}

// ─── Drag and Drop Reorder ────────────────────────────────────────────────────

function initDragAndDrop(list, contactId) {
  if (!list) return;

  let dragSrcIndex = null;

  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.reply-item');
    if (!item) return;
    dragSrcIndex = parseInt(item.dataset.index);
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.reply-item');
    list.querySelectorAll('.reply-item').forEach(i => i.classList.remove('drag-over'));
    if (item) item.classList.add('drag-over');
  });

  list.addEventListener('dragleave', () => {
    list.querySelectorAll('.reply-item').forEach(i => i.classList.remove('drag-over'));
  });

  list.addEventListener('drop', async (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.reply-item');
    list.querySelectorAll('.reply-item').forEach(i => i.classList.remove('drag-over', 'dragging'));
    if (!targetItem || dragSrcIndex === null) return;

    const targetIndex = parseInt(targetItem.dataset.index);
    if (dragSrcIndex === targetIndex) return;

    const contact = await getContact(contactId);
    const replies = [...contact.replies];
    const [moved] = replies.splice(dragSrcIndex, 1);
    replies.splice(targetIndex, 0, moved);
    await updateContact(contactId, { replies, replyIndex: 0 });

    // Re-render
    const container = list.closest('.replies-editor');
    if (container) await renderRepliesEditor(container, contactId);
  });

  list.addEventListener('dragend', () => {
    list.querySelectorAll('.reply-item').forEach(i => i.classList.remove('dragging', 'drag-over'));
    dragSrcIndex = null;
  });

  // ── Touch-based reorder ──────────────────────────────────────────────────────
  let touchSrcIndex = null;
  let touchClone = null;
  let touchStartY = 0;

  list.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    const item = handle.closest('.reply-item');
    touchSrcIndex = parseInt(item.dataset.index);
    touchStartY = e.touches[0].clientY;

    touchClone = item.cloneNode(true);
    touchClone.style.cssText = `position:fixed;opacity:.7;pointer-events:none;z-index:9999;width:${item.offsetWidth}px;left:${item.getBoundingClientRect().left}px;top:${item.getBoundingClientRect().top}px;`;
    document.body.appendChild(touchClone);
    item.classList.add('touch-dragging');
    e.preventDefault();
  }, { passive: false });

  list.addEventListener('touchmove', (e) => {
    if (touchSrcIndex === null || !touchClone) return;
    const dy = e.touches[0].clientY - touchStartY;
    touchClone.style.transform = `translateY(${dy}px)`;
    e.preventDefault();
  }, { passive: false });

  list.addEventListener('touchend', async (e) => {
    if (touchSrcIndex === null) return;
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = el ? el.closest('.reply-item') : null;

    if (touchClone) touchClone.remove();
    list.querySelectorAll('.reply-item').forEach(i => i.classList.remove('touch-dragging'));

    if (targetItem) {
      const targetIndex = parseInt(targetItem.dataset.index);
      if (touchSrcIndex !== targetIndex) {
        const contact = await getContact(contactId);
        const replies = [...contact.replies];
        const [moved] = replies.splice(touchSrcIndex, 1);
        replies.splice(targetIndex, 0, moved);
        await updateContact(contactId, { replies, replyIndex: 0 });
        const container = list.closest('.replies-editor');
        if (container) await renderRepliesEditor(container, contactId);
      }
    }
    touchSrcIndex = null;
    touchClone = null;
  });
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  // Delegated to app.js via custom event
  document.dispatchEvent(new CustomEvent('app:toast', { detail: { msg } }));
}
