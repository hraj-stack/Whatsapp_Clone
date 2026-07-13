/**
 * settings.js – App settings: theme, delay, reply mode, data actions.
 * Upgraded with Account, Privacy, Chats, Notifications, Storage, and Language sections.
 */

import { getSetting, setSetting, exportAllData, importAllData, clearAllData } from './storage.js';

// ─── Predefined Palette ───────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#0F766E', '#1565C0', '#2E7D32', '#AD1457', '#795548', '#6A1B9A', '#455A64', '#D84315'
];

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export async function applyTheme() {
  const saved = await getSetting('theme', 'light');
  const effective = saved === 'system' ? getSystemTheme() : saved;
  document.documentElement.setAttribute('data-theme', effective);
  return effective;
}

// ─── Settings Accordion SVGs ──────────────────────────────────────────────────

const SETTINGS_ICONS = {
  account: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`,
  privacy: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
  chats: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
  notifications: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`,
  storage: `<svg class="icon" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>`,
  language: `<svg class="icon" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.6 3.39 1.83 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.33-.14 2 0 .67.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.6-3.39-1.83-4.33-3.56zm2.95-8H5.08c.94-1.73 2.49-2.96 4.33-3.56-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.34-.16-2 0-.66.07-1.34.16-2h4.68c.09.66.16 1.34.16 2 0 .66-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.94 1.73-2.49 2.96-4.33 3.56zM16.36 14c.08-.66.14-1.33.14-2 0-.67-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>`,
  chevron: `<svg class="icon chevron-icon" viewBox="0 0 24 24" style="transition: transform 0.2s;"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>`,
};

// ─── Render Settings Panel ────────────────────────────────────────────────────

export async function renderSettings(container) {
  // Read current saved values
  const theme = await getSetting('theme', 'light');
  const delay = await getSetting('typingDelay', 1500);
  const mode  = await getSetting('replyMode', 'sequential');

  // Account
  const passkeyEnabled = await getSetting('passkeyEnabled', false);
  
  // Privacy
  const lastSeen = await getSetting('privacyLastSeen', 'everyone');
  const profilePhoto = await getSetting('privacyPhoto', 'everyone');
  const aboutStatus = await getSetting('privacyAbout', 'everyone');
  const readReceipts = await getSetting('privacyReceipts', true);
  const disappearing = await getSetting('privacyDisappearing', 'off');
  const blockedCount = await getSetting('privacyBlockedCount', 0);
  const appLock = await getSetting('privacyAppLock', false);
  const advancedIp = await getSetting('privacyAdvancedIp', false);
  const linkPreviews = await getSetting('privacyLinkPreviews', true);
  const screenshotBlock = await getSetting('privacyScreenshotBlock', false);

  // Chats
  const wallpaperType = await getSetting('chatWallpaper', 'doodle');
  const enterIsSend = await getSetting('chatEnterIsSend', true);
  const mediaVisibility = await getSetting('chatMediaVisibility', true);
  const fontSize = await getSetting('chatFontSize', 'medium');
  const keepArchived = await getSetting('chatKeepArchived', true);
  const selectedTheme = await getSetting('chatCustomTheme', 'teal');

  // Notifications
  const toneConversation = await getSetting('notifConversationTones', true);
  const toneNotification = await getSetting('notifTone', 'default');
  const popupNotif = await getSetting('notifPopup', true);
  const reactionNotif = await getSetting('notifReactions', true);
  const dndEnabled = await getSetting('notifDnd', false);
  const dndStart = await getSetting('notifDndStart', '22:00');
  const dndEnd = await getSetting('notifDndEnd', '07:00');
  const badgeCounter = await getSetting('notifBadgeCounter', 'unread_messages');

  // Storage
  const mediaDownloadCellular = await getSetting('storageCellular', false);
  const mediaDownloadWifi = await getSetting('storageWifi', true);
  const proxyEnabled = await getSetting('storageProxy', false);
  const mediaQuality = await getSetting('storageMediaQuality', 'standard');
  const autoClearCache = await getSetting('storageAutoClearCache', false);

  // Language
  const appLanguage = await getSetting('appLanguage', 'en');
  const realTimeTranslation = await getSetting('appTranslation', false);

  container.innerHTML = `
    <div class="settings-accordion">

      <!-- 👤 1. ACCOUNT SECTION -->
      <div class="settings-section-card" id="card-account">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.account}</span>
            <span>Account</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Security notifications</span>
              <span class="settings-label-sub">Show security notifications on this device</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="acc-security-notif" checked />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Two-step verification</span>
              <span class="settings-label-sub">Require a PIN when registering your number again</span>
            </div>
            <button class="btn-secondary" id="btn-twostep" style="padding:6px 12px; font-size:.85rem;">Manage PIN</button>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Change number</span>
              <span class="settings-label-sub">Migrate your account info, groups & settings</span>
            </div>
            <button class="btn-secondary" id="btn-chg-num" style="padding:6px 12px; font-size:.85rem;">Change</button>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Request account info</span>
              <span class="settings-label-sub">Request a report of your account information</span>
            </div>
            <button class="btn-secondary" id="btn-req-info" style="padding:6px 12px; font-size:.85rem;">Request</button>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Delete account</span>
              <span class="settings-label-sub">Erase all records, messages and profile data</span>
            </div>
            <button class="btn-danger" id="btn-del-account" style="padding:6px 12px; font-size:.85rem;">Delete</button>
          </div>

          <!-- NEW ACCOUNT FEATURES -->
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Passkeys & Biometrics</span>
              <span class="settings-label-sub">Setup hardware key, Windows Hello, or Touch ID</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="acc-biometrics" ${passkeyEnabled ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <div class="settings-label">
              <span class="settings-label-text">Active Sessions</span>
              <span class="settings-label-sub" style="margin-bottom:6px;">Devices currently logged into this account:</span>
            </div>
            <div style="font-size:.82rem; color:var(--text-secondary); width:100%; padding-left:4px; display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between;"><span>• Chrome (Windows) - Active</span> <span style="font-size:.75rem; color:var(--primary-dark)">This Device</span></div>
              <div>• Safari (iPhone) - Active 2 hrs ago</div>
              <div>• Firefox (Mac OS) - Active Yesterday</div>
            </div>
            <button class="btn-danger" id="btn-logout-others" style="width:100%; padding:8px; font-size:.85rem; margin-top:8px;">Log out from all other devices</button>
          </div>
        </div>
      </div>

      <!-- 🔒 2. PRIVACY SECTION -->
      <div class="settings-section-card" id="card-privacy">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.privacy}</span>
            <span>Privacy</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Last seen & online</span>
              <span class="settings-label-sub">Who can see my last seen timestamp</span>
            </div>
            <select id="priv-last-seen" class="settings-select">
              <option value="everyone" ${lastSeen === 'everyone' ? 'selected' : ''}>Everyone</option>
              <option value="contacts" ${lastSeen === 'contacts' ? 'selected' : ''}>My Contacts</option>
              <option value="nobody"   ${lastSeen === 'nobody'   ? 'selected' : ''}>Nobody</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Profile photo</span>
              <span class="settings-label-sub">Who can see my avatar image</span>
            </div>
            <select id="priv-photo" class="settings-select">
              <option value="everyone" ${profilePhoto === 'everyone' ? 'selected' : ''}>Everyone</option>
              <option value="contacts" ${profilePhoto === 'contacts' ? 'selected' : ''}>My Contacts</option>
              <option value="nobody"   ${profilePhoto === 'nobody'   ? 'selected' : ''}>Nobody</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">About / Status</span>
              <span class="settings-label-sub">Who can see my status bio</span>
            </div>
            <select id="priv-about" class="settings-select">
              <option value="everyone" ${aboutStatus === 'everyone' ? 'selected' : ''}>Everyone</option>
              <option value="contacts" ${aboutStatus === 'contacts' ? 'selected' : ''}>My Contacts</option>
              <option value="nobody"   ${aboutStatus === 'nobody'   ? 'selected' : ''}>Nobody</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Read receipts</span>
              <span class="settings-label-sub">If turned off, you won't send or receive read receipts</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="priv-receipts" ${readReceipts ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Disappearing messages</span>
              <span class="settings-label-sub">Start new chats with messages that fade away</span>
            </div>
            <select id="priv-disappearing" class="settings-select">
              <option value="off"    ${disappearing === 'off'    ? 'selected' : ''}>Off</option>
              <option value="24h"    ${disappearing === '24h'    ? 'selected' : ''}>24 Hours</option>
              <option value="7d"     ${disappearing === '7d'     ? 'selected' : ''}>7 Days</option>
              <option value="90d"    ${disappearing === '90d'    ? 'selected' : ''}>90 Days</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Groups & Live Location</span>
              <span class="settings-label-sub">Manage permissions and background tracking</span>
            </div>
            <button class="btn-secondary" id="btn-groups-priv" style="padding:6px 12px; font-size:.85rem;">Manage</button>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Blocked contacts</span>
              <span class="settings-label-sub">${blockedCount} blocked contacts list</span>
            </div>
            <button class="btn-secondary" id="btn-blocked-list" style="padding:6px 12px; font-size:.85rem;">View List</button>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">App fingerprint lock</span>
              <span class="settings-label-sub">Unlock ChatSim with fingerprint biometric</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="priv-app-lock" ${appLock ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>

          <!-- NEW PRIVACY FEATURES -->
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Advanced IP Protection</span>
              <span class="settings-label-sub">Relay calls through servers to obscure your IP address</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="priv-advanced-ip" ${advancedIp ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Link Previews Control</span>
              <span class="settings-label-sub">Disable rich previews to prevent IP logs by third-party sites</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="priv-link-previews" ${linkPreviews ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Profile Picture Screenshot Block</span>
              <span class="settings-label-sub">Restrict mobile web capture of your avatar preview</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="priv-screenshot-block" ${screenshotBlock ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 💬 3. CHATS & AUTO-REPLY SECTION -->
      <div class="settings-section-card" id="card-chats">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.chats}</span>
            <span>Chats & Auto Reply</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <!-- Theme selector (Keep themes fully functional!) -->
          <div class="settings-row">
            <label for="theme-select" class="settings-label">
              <span class="settings-label-text">Theme</span>
              <span class="settings-label-sub">Select light, dark or matching OS system theme</span>
            </label>
            <select id="theme-select" class="settings-select">
              <option value="light"  ${theme === 'light'  ? 'selected' : ''}>Light Mode</option>
              <option value="dark"   ${theme === 'dark'   ? 'selected' : ''}>Dark Mode</option>
              <option value="system" ${theme === 'system' ? 'selected' : ''}>System Theme</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Chat Wallpaper</span>
              <span class="settings-label-sub">Select chat thread background styling</span>
            </div>
            <select id="chat-wallpaper" class="settings-select">
              <option value="doodle" ${wallpaperType === 'doodle' ? 'selected' : ''}>Doodle Pattern</option>
              <option value="solid"  ${wallpaperType === 'solid'  ? 'selected' : ''}>Solid Color</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Enter is send</span>
              <span class="settings-label-sub">Enter key sends message on keyboard</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="chat-enter-send" ${enterIsSend ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Media visibility</span>
              <span class="settings-label-sub">Show newly downloaded media in your browser cache</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="chat-media-vis" ${mediaVisibility ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Font size</span>
              <span class="settings-label-sub">Resize chat conversation message bubble text</span>
            </div>
            <select id="chat-font-size" class="settings-select">
              <option value="small"  ${fontSize === 'small'  ? 'selected' : ''}>Small</option>
              <option value="medium" ${fontSize === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="large"  ${fontSize === 'large'  ? 'selected' : ''}>Large</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Keep chats archived</span>
              <span class="settings-label-sub">Archived chats will remain archived when new messages arrive</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="chat-keep-archived" ${keepArchived ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Chat history</span>
              <span class="settings-label-sub">Export, clear, or delete all messages records</span>
            </div>
            <button class="btn-danger" id="btn-clear-chats-history" style="padding:6px 12px; font-size:.85rem;">Clear All</button>
          </div>

          <!-- Existing Auto Reply (Keep fully functional!) -->
          <div class="settings-row">
            <label for="typing-delay" class="settings-label">
              <span class="settings-label-text">Typing Delay</span>
              <span class="settings-label-sub" id="delay-value-label">${delay}ms</span>
            </label>
            <input type="range" id="typing-delay" class="settings-slider"
              min="500" max="5000" step="100" value="${delay}" />
          </div>
          <div class="settings-row">
            <label for="global-reply-mode" class="settings-label">
              <span class="settings-label-text">Default Reply Mode</span>
              <span class="settings-label-sub">Applied to new contacts</span>
            </label>
            <select id="global-reply-mode" class="settings-select">
              <option value="sequential" ${mode === 'sequential' ? 'selected' : ''}>Sequential</option>
              <option value="loop"       ${mode === 'loop'       ? 'selected' : ''}>Loop</option>
              <option value="random"     ${mode === 'random'     ? 'selected' : ''}>Random</option>
            </select>
          </div>

          <!-- NEW CHATS FEATURES -->
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <div class="settings-label">
              <span class="settings-label-text">Chat Folders / Labels</span>
              <span class="settings-label-sub" style="margin-bottom:6px;">Organize chats into categories:</span>
            </div>
            <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">
              <span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:.78rem; font-weight:500;">Work</span>
              <span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:.78rem; font-weight:500;">Personal</span>
              <span style="background:var(--primary-light); color:var(--primary-dark); padding:4px 10px; border-radius:12px; font-size:.78rem; font-weight:500;">Unread</span>
              <button class="btn-secondary" style="padding:2px 8px; font-size:.75rem; border-radius:10px;">+ Add Label</button>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Custom Chat Themes</span>
              <span class="settings-label-sub">Set distinct backgrounds and colors per contact</span>
            </div>
            <select id="chat-custom-theme" class="settings-select">
              <option value="teal" ${selectedTheme === 'teal' ? 'selected' : ''}>Teal Accent (Default)</option>
              <option value="blue" ${selectedTheme === 'blue' ? 'selected' : ''}>Blue Accent</option>
              <option value="pink" ${selectedTheme === 'pink' ? 'selected' : ''}>Pink Accent</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 🔔 4. NOTIFICATIONS SECTION -->
      <div class="settings-section-card" id="card-notifications">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.notifications}</span>
            <span>Notifications</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Conversation tones</span>
              <span class="settings-label-sub">Play sounds for incoming and outgoing messages</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notif-conv-tones" ${toneConversation ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Notification tones</span>
              <span class="settings-label-sub">Select notification audio alert</span>
            </div>
            <select id="notif-tone" class="settings-select">
              <option value="default" ${toneNotification === 'default' ? 'selected' : ''}>Default Alert</option>
              <option value="chime"   ${toneNotification === 'chime'   ? 'selected' : ''}>Chime</option>
              <option value="none"    ${toneNotification === 'none'    ? 'selected' : ''}>None (Silent)</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Popup / High-priority</span>
              <span class="settings-label-sub">Show notification previews at top of screen</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notif-popup" ${popupNotif ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Reactions notifications</span>
              <span class="settings-label-sub">Show notifications for reactions to your messages</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notif-reactions" ${reactionNotif ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>

          <!-- NEW NOTIFICATIONS FEATURES -->
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <div class="settings-label">
                <span class="settings-label-text">Do Not Disturb / Quiet Hours</span>
                <span class="settings-label-sub">Schedule hours to mute web push notifications</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="notif-dnd" ${dndEnabled ? 'checked' : ''} />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>
            <div id="dnd-time-picker" style="display:${dndEnabled ? 'flex' : 'none'}; align-items:center; gap:8px; font-size:.85rem; width:100%; padding-left:4px; margin-top:4px;">
              <span>Mute from</span>
              <input type="time" id="notif-dnd-start" value="${dndStart}" style="border:1.5px solid var(--divider); padding:4px; border-radius:4px; background:var(--surface-2); color:var(--text-primary);" />
              <span>to</span>
              <input type="time" id="notif-dnd-end" value="${dndEnd}" style="border:1.5px solid var(--divider); padding:4px; border-radius:4px; background:var(--surface-2); color:var(--text-primary);" />
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Smart Badge Counter</span>
              <span class="settings-label-sub">Configure tab alert count metric</span>
            </div>
            <select id="notif-badge-counter" class="settings-select">
              <option value="unread_messages" ${badgeCounter === 'unread_messages' ? 'selected' : ''}>Unread Messages</option>
              <option value="unread_chats"    ${badgeCounter === 'unread_chats'    ? 'selected' : ''}>Unread Chats Count</option>
              <option value="off"             ${badgeCounter === 'off'             ? 'selected' : ''}>Off</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 📊 5. STORAGE AND DATA SECTION -->
      <div class="settings-section-card" id="card-storage">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.storage}</span>
            <span>Storage and Data</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
            <div class="settings-label">
              <span class="settings-label-text">Manage storage</span>
              <span class="settings-label-sub">View IndexedDB browser cache size</span>
            </div>
            <div style="width:100%; background:var(--surface-2); height:6px; border-radius:3px; overflow:hidden; margin-top:4px;">
              <div style="width:8%; background:var(--primary); height:100%;"></div>
            </div>
            <span style="font-size:.72rem; color:var(--text-secondary); margin-top:2px;">124 KB used · 24 MB free</span>
          </div>
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <div class="settings-label">
              <span class="settings-label-text">Network usage</span>
              <span class="settings-label-sub">Cumulative data sent/received since reset</span>
            </div>
            <div style="font-size:.82rem; color:var(--text-secondary); display:flex; gap:16px; margin-top:2px; padding-left:4px;">
              <span>Sent: 42 KB</span>
              <span>Received: 108 KB</span>
            </div>
          </div>
          <div class="settings-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
            <div class="settings-label" style="margin-bottom:4px;">
              <span class="settings-label-text">Media auto-download</span>
              <span class="settings-label-sub">Choose when attachments download automatically</span>
            </div>
            <div style="display:flex; gap:16px; font-size:.86rem; padding-left:4px;">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="storage-auto-cellular" ${mediaDownloadCellular ? 'checked' : ''} /> Cellular Data
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="storage-auto-wifi" ${mediaDownloadWifi ? 'checked' : ''} /> Wi-Fi
              </label>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Proxy connection</span>
              <span class="settings-label-sub">Setup network proxy server</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="storage-proxy" ${proxyEnabled ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>

          <!-- Existing functional Data Backup and Restore buttons (Keep exactly!) -->
          <div class="settings-row" style="flex-direction:column; align-items:stretch; gap:8px;">
            <span class="settings-label-text" style="font-size:.9rem; font-weight:500; color:var(--primary-dark)">Database Management</span>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <button id="export-btn" class="btn-secondary" style="padding:10px; font-size:.85rem;">Export Data</button>
              <button id="import-btn" class="btn-secondary" style="padding:10px; font-size:.85rem;">Import Data</button>
            </div>
            <input type="file" id="import-file-input" accept=".json" style="display:none" />
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <button id="backup-btn" class="btn-secondary" style="padding:10px; font-size:.85rem;">Backup</button>
              <button id="restore-btn" class="btn-secondary" style="padding:10px; font-size:.85rem;">Restore</button>
            </div>
            <input type="file" id="restore-file-input" accept=".json" style="display:none" />

            <button id="clear-btn" class="btn-danger" style="padding:10px; font-size:.85rem;">Clear Chats</button>
          </div>

          <!-- NEW STORAGE AND DATA FEATURES -->
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Media Quality Upload</span>
              <span class="settings-label-sub">Default compression quality for sent files</span>
            </div>
            <select id="storage-media-quality" class="settings-select">
              <option value="standard" ${mediaQuality === 'standard' ? 'selected' : ''}>Standard Quality</option>
              <option value="hd"       ${mediaQuality === 'hd'       ? 'selected' : ''}>HD Quality (Uncompressed)</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Auto-Clear Cache</span>
              <span class="settings-label-sub">Automatically purge local media cache older than 30 days</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="storage-clear-cache" ${autoClearCache ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 🌐 6. APP LANGUAGE SECTION -->
      <div class="settings-section-card" id="card-language">
        <div class="settings-section-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="color:var(--primary-dark); display:flex;">${SETTINGS_ICONS.language}</span>
            <span>App Language</span>
          </div>
          <span>${SETTINGS_ICONS.chevron}</span>
        </div>
        <div class="settings-section-content">
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Interface language</span>
              <span class="settings-label-sub">Change application language independently of OS</span>
            </div>
            <select id="app-language" class="settings-select">
              <option value="en" ${appLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="es" ${appLanguage === 'es' ? 'selected' : ''}>Español</option>
              <option value="fr" ${appLanguage === 'fr' ? 'selected' : ''}>Français</option>
              <option value="de" ${appLanguage === 'de' ? 'selected' : ''}>Deutsch</option>
            </select>
          </div>

          <!-- NEW APP LANGUAGE FEATURES -->
          <div class="settings-row">
            <div class="settings-label">
              <span class="settings-label-text">Real-time Message Translation</span>
              <span class="settings-label-sub">Automatically translate incoming texts to selected language</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="app-translation" ${realTimeTranslation ? 'checked' : ''} />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>

    </div>

    <!-- ── About Footer ── -->
    <div class="settings-group settings-about" style="margin-top:20px; background:none;">
      <p class="about-app-name">ChatSim Premium</p>
      <p class="about-text">Version 3.0 · Powered by IndexedDB & Web PWA</p>
      <p class="about-text">Educational messaging simulation client.</p>
    </div>
  `;

  bindSettingsEvents(container);
  setupAccordionListeners(container);
}

// ─── Accordion Logic ──────────────────────────────────────────────────────────

function setupAccordionListeners(container) {
  // Expand first card by default ("Account")
  const cards = container.querySelectorAll('.settings-section-card');
  if (cards.length > 0) cards[0].classList.add('open');

  cards.forEach(card => {
    const header = card.querySelector('.settings-section-header');
    header.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      
      // Close other accordions
      cards.forEach(c => c.classList.remove('open'));
      
      // Toggle current
      if (!isOpen) {
        card.classList.add('open');
      }
    });
  });
}

// ─── Event Binding & Local Storage Persistence ───────────────────────────────

function bindSettingsEvents(container) {
  // ── Theme Selector ──
  container.querySelector('#theme-select').addEventListener('change', async (e) => {
    const val = e.target.value;
    await setSetting('theme', val);
    const effective = val === 'system' ? getSystemTheme() : val;
    document.documentElement.setAttribute('data-theme', effective);
  });

  // ── Typing Delay ──
  const delaySlider = container.querySelector('#typing-delay');
  const delayLabel  = container.querySelector('#delay-value-label');
  delaySlider.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value);
    delayLabel.textContent = `${val}ms`;
    await setSetting('typingDelay', val);
  });

  // ── Default Auto-Reply Mode ──
  container.querySelector('#global-reply-mode').addEventListener('change', async (e) => {
    await setSetting('replyMode', e.target.value);
  });

  // ── Account Settings Toggles & Forms ──
  container.querySelector('#acc-biometrics').addEventListener('change', async (e) => {
    await setSetting('passkeyEnabled', e.target.checked);
    showToast(e.target.checked ? 'Passkey registered!' : 'Passkey removed.');
  });
  
  container.querySelector('#btn-logout-others').addEventListener('click', () => {
    showToast('Logged out from all other active sessions.');
  });

  container.querySelector('#btn-twostep').addEventListener('click', () => showToast('Two-step verification PIN is set.'));
  container.querySelector('#btn-chg-num').addEventListener('click', () => showToast('Migration form loaded.'));
  container.querySelector('#btn-req-info').addEventListener('click', () => showToast('Report request submitted. (Ready in 3 days)'));
  container.querySelector('#btn-del-account').addEventListener('click', () => {
    showConfirm('WARNING: Are you sure you want to delete your account? This is irreversible.', () => {
      showToast('Erase request scheduled.');
    });
  });

  // ── Privacy Toggles & dropdowns ──
  container.querySelector('#priv-last-seen').addEventListener('change', async (e) => {
    await setSetting('privacyLastSeen', e.target.value);
  });
  container.querySelector('#priv-photo').addEventListener('change', async (e) => {
    await setSetting('privacyPhoto', e.target.value);
  });
  container.querySelector('#priv-about').addEventListener('change', async (e) => {
    await setSetting('privacyAbout', e.target.value);
  });
  container.querySelector('#priv-receipts').addEventListener('change', async (e) => {
    await setSetting('privacyReceipts', e.target.checked);
  });
  container.querySelector('#priv-disappearing').addEventListener('change', async (e) => {
    await setSetting('privacyDisappearing', e.target.value);
  });
  container.querySelector('#priv-app-lock').addEventListener('change', async (e) => {
    await setSetting('privacyAppLock', e.target.checked);
  });
  container.querySelector('#priv-advanced-ip').addEventListener('change', async (e) => {
    await setSetting('privacyAdvancedIp', e.target.checked);
  });
  container.querySelector('#priv-link-previews').addEventListener('change', async (e) => {
    await setSetting('privacyLinkPreviews', e.target.checked);
  });
  container.querySelector('#priv-screenshot-block').addEventListener('change', async (e) => {
    await setSetting('privacyScreenshotBlock', e.target.checked);
  });

  container.querySelector('#btn-groups-priv').addEventListener('click', () => showToast('Group visibility settings loaded.'));
  container.querySelector('#btn-blocked-list').addEventListener('click', () => showToast('No blocked contacts in your list.'));

  // ── Chat Wallpaper, customization & Custom Label ──
  container.querySelector('#chat-wallpaper').addEventListener('change', async (e) => {
    await setSetting('chatWallpaper', e.target.value);
  });
  container.querySelector('#chat-enter-send').addEventListener('change', async (e) => {
    await setSetting('chatEnterIsSend', e.target.checked);
  });
  container.querySelector('#chat-media-vis').addEventListener('change', async (e) => {
    await setSetting('chatMediaVisibility', e.target.checked);
  });
  container.querySelector('#chat-font-size').addEventListener('change', async (e) => {
    await setSetting('chatFontSize', e.target.value);
  });
  container.querySelector('#chat-keep-archived').addEventListener('change', async (e) => {
    await setSetting('chatKeepArchived', e.target.checked);
  });
  container.querySelector('#chat-custom-theme').addEventListener('change', async (e) => {
    await setSetting('chatCustomTheme', e.target.value);
    showToast(`Accent theme set to: ${e.target.value}`);
  });
  container.querySelector('#btn-clear-chats-history').addEventListener('click', () => {
    showConfirm('Delete chat history? All messages will be wiped.', async () => {
      await clearAllData();
      showToast('Chat history cleared.');
    });
  });

  // ── Notifications settings DND toggle & select ──
  container.querySelector('#notif-conv-tones').addEventListener('change', async (e) => {
    await setSetting('notifConversationTones', e.target.checked);
  });
  container.querySelector('#notif-tone').addEventListener('change', async (e) => {
    await setSetting('notifTone', e.target.value);
  });
  container.querySelector('#notif-popup').addEventListener('change', async (e) => {
    await setSetting('notifPopup', e.target.checked);
  });
  container.querySelector('#notif-reactions').addEventListener('change', async (e) => {
    await setSetting('notifReactions', e.target.checked);
  });
  container.querySelector('#notif-badge-counter').addEventListener('change', async (e) => {
    await setSetting('notifBadgeCounter', e.target.value);
  });

  const dndToggle = container.querySelector('#notif-dnd');
  const dndPicker = container.querySelector('#dnd-time-picker');
  dndToggle.addEventListener('change', async (e) => {
    const isChecked = e.target.checked;
    await setSetting('notifDnd', isChecked);
    dndPicker.style.display = isChecked ? 'flex' : 'none';
    showToast(isChecked ? 'Do Not Disturb scheduled.' : 'DND deactivated.');
  });
  
  container.querySelector('#notif-dnd-start').addEventListener('change', async (e) => {
    await setSetting('notifDndStart', e.target.value);
  });
  container.querySelector('#notif-dnd-end').addEventListener('change', async (e) => {
    await setSetting('notifDndEnd', e.target.value);
  });

  // ── Storage settings ──
  container.querySelector('#storage-auto-cellular').addEventListener('change', async (e) => {
    await setSetting('storageCellular', e.target.checked);
  });
  container.querySelector('#storage-auto-wifi').addEventListener('change', async (e) => {
    await setSetting('storageWifi', e.target.checked);
  });
  container.querySelector('#storage-proxy').addEventListener('change', async (e) => {
    await setSetting('storageProxy', e.target.checked);
    showToast(e.target.checked ? 'Proxy configuration loaded.' : 'Proxy disabled.');
  });
  container.querySelector('#storage-media-quality').addEventListener('change', async (e) => {
    await setSetting('storageMediaQuality', e.target.value);
  });
  container.querySelector('#storage-clear-cache').addEventListener('change', async (e) => {
    await setSetting('storageAutoClearCache', e.target.checked);
  });

  // ── Language settings ──
  container.querySelector('#app-language').addEventListener('change', async (e) => {
    await setSetting('appLanguage', e.target.value);
    showToast(`Language switched to: ${e.target.value}`);
  });
  container.querySelector('#app-translation').addEventListener('change', async (e) => {
    await setSetting('appTranslation', e.target.checked);
  });

  // ── Database Backup, Restore, Export, Import and Clear Toggles (Keep exact!) ──
  container.querySelector('#export-btn').addEventListener('click', async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `chatsim-export-${new Date().toISOString().slice(0, 10)}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
  });

  const fileInput = container.querySelector('#import-file-input');
  container.querySelector('#import-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await importAllData(data);
      showToast('Data imported! Reloading…');
      setTimeout(() => location.reload(), 1200);
    } catch {
      showToast('Error: Invalid data file.');
    }
    fileInput.value = '';
  });

  container.querySelector('#backup-btn').addEventListener('click', async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `chatsim-backup-${new Date().toISOString().slice(0, 10)}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup completed successfully!');
  });

  const restoreInput = container.querySelector('#restore-file-input');
  container.querySelector('#restore-btn').addEventListener('click', () => restoreInput.click());
  restoreInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await importAllData(data);
      showToast('System restored from backup! Reloading…');
      setTimeout(() => location.reload(), 1200);
    } catch {
      showToast('Error: Invalid backup file.');
    }
    restoreInput.value = '';
  });

  container.querySelector('#clear-btn').addEventListener('click', () => {
    showConfirm('Clear all chat messages? Contacts will be kept.', async () => {
      await clearAllData();
      showToast('All chats cleared!');
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showToast(msg) {
  document.dispatchEvent(new CustomEvent('app:toast', { detail: { msg } }));
}

function showConfirm(msg, onConfirm) {
  document.dispatchEvent(new CustomEvent('app:confirm', { detail: { msg, onConfirm } }));
}
