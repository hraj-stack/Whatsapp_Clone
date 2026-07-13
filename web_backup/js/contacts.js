/**
 * contacts.js – Contact CRUD operations.
 * No circular imports: only imports from storage.js.
 */

import { dbGetAll, dbGet, dbPut, dbDelete } from './storage.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllContacts() {
  const contacts = await dbGetAll('contacts');
  return contacts.sort((a, b) => (b.lastMessageTime || b.createdAt) - (a.lastMessageTime || a.createdAt));
}

export async function getContact(id) {
  return dbGet('contacts', id);
}

export async function createContact({ name, phone = '', avatar = null }) {
  const contact = {
    id: generateId(),
    name: name.trim(),
    phone: phone.trim(),
    avatar,                  // base64 string or null
    replyMode: 'sequential', // sequential | loop | random
    replyIndex: 0,
    replies: [],
    createdAt: Date.now(),
    lastMessage: '',
    lastMessageTime: null,
  };
  await dbPut('contacts', contact);
  return contact;
}

export async function updateContact(id, updates) {
  const contact = await getContact(id);
  if (!contact) throw new Error(`Contact ${id} not found`);
  const updated = { ...contact, ...updates };
  await dbPut('contacts', updated);
  return updated;
}

/**
 * Delete a contact. Message cleanup is handled by the caller (app.js) to avoid
 * circular imports with chat.js.
 */
export async function deleteContactRecord(id) {
  await dbDelete('contacts', id);
}

// ─── Avatar helper ────────────────────────────────────────────────────────────

export function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Update last message snippet ─────────────────────────────────────────────

export async function updateLastMessage(contactId, text, time) {
  const contact = await getContact(contactId);
  if (contact) {
    await dbPut('contacts', {
      ...contact,
      lastMessage: text,
      lastMessageTime: time,
    });
  }
}
