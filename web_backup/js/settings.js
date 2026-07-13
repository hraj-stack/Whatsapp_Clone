/**
 * settings.js – App settings: theme (light/dark/system), delay, export/import/clear.
 * Added: system theme detection via prefers-color-scheme media query.
 */

import { getSetting, setSetting, exportAllData, importAllData, clearAllData } from './storage.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

/** Read the device's preferred color scheme. */
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply a theme token to <html data-theme="…">.
 * 'system' resolves to the OS preference.
 */
export async function applyTheme() {
  const saved = await getSetting('theme', 'light');
  const effective = saved === 'system' ? getSystemTheme() : saved;
  document.documentElement.setAttribute('data-theme', effective);

  // Keep in sync when OS theme changes
  if (saved === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (getSetting('theme', 'light') === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }
  return effective;
}

/** Cycle: light → dark → system → light */
export async function toggleTheme() {
  const current = await getSetting('theme', 'light');
  const next    = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
  await setSetting('theme', next);
  const effective = next === 'system' ? getSystemTheme() : next;
  document.documentElement.setAttribute('data-theme', effective);
  return next;
}

// ─── Render Settings Panel ────────────────────────────────────────────────────

export async function renderSettings(container) {
  const theme = await getSetting('theme', 'light');
  const delay = await getSetting('typingDelay', 1500);
  const mode  = await getSetting('replyMode', 'sequential');

  container.innerHTML = `
    <!-- ── Appearance ── -->
    <h3 class="settings-section-title">Appearance</h3>
    <div class="settings-group">
      <div class="settings-row">
        <label for="theme-select" class="settings-label">
          <span class="settings-label-text">Theme</span>
          <span class="settings-label-sub">Choose your preferred appearance</span>
        </label>
        <select id="theme-select" class="settings-select">
          <option value="light"  ${theme === 'light'  ? 'selected' : ''}>Light Mode</option>
          <option value="dark"   ${theme === 'dark'   ? 'selected' : ''}>Dark Mode</option>
          <option value="system" ${theme === 'system' ? 'selected' : ''}>System Theme</option>
        </select>
      </div>
    </div>

    <!-- ── Auto Reply ── -->
    <h3 class="settings-section-title">Auto Reply</h3>
    <div class="settings-group">
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
    </div>

    <!-- ── Data ── -->
    <h3 class="settings-section-title">Data</h3>
    <div class="settings-group">
      <div class="settings-actions-col">
        <button id="export-btn" class="btn-secondary settings-btn">Export Data</button>
        <button id="import-btn" class="btn-secondary settings-btn">Import Data</button>
        <input type="file" id="import-file-input" accept=".json" style="display:none" />
      </div>
    </div>

    <!-- ── Backup & Restore ── -->
    <h3 class="settings-section-title">Backup & Restore</h3>
    <div class="settings-group">
      <div class="settings-actions-col">
        <button id="backup-btn" class="btn-secondary settings-btn">Backup</button>
        <button id="restore-btn" class="btn-secondary settings-btn">Restore</button>
        <input type="file" id="restore-file-input" accept=".json" style="display:none" />
      </div>
    </div>

    <!-- ── Maintenance ── -->
    <h3 class="settings-section-title">Maintenance</h3>
    <div class="settings-group">
      <div class="settings-actions-col">
        <button id="clear-btn" class="btn-danger settings-btn">Clear Chats</button>
      </div>
    </div>

    <!-- ── About ── -->
    <div class="settings-group settings-about">
      <p class="about-app-name">ChatSim</p>
      <p class="about-text">Version 2.0 · Educational use only</p>
      <p class="about-text">No real messages are sent or received.</p>
    </div>
  `;

  bindSettingsEvents(container);
}

// ─── Event Binding ────────────────────────────────────────────────────────────

function bindSettingsEvents(container) {
  // Theme select (light / dark / system)
  container.querySelector('#theme-select').addEventListener('change', async (e) => {
    const val = e.target.value;
    await setSetting('theme', val);
    const effective = val === 'system' ? getSystemTheme() : val;
    document.documentElement.setAttribute('data-theme', effective);
  });

  // Typing delay
  const delaySlider = container.querySelector('#typing-delay');
  const delayLabel  = container.querySelector('#delay-value-label');
  delaySlider.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value);
    delayLabel.textContent = `${val}ms`;
    await setSetting('typingDelay', val);
  });

  // Reply mode
  container.querySelector('#global-reply-mode').addEventListener('change', async (e) => {
    await setSetting('replyMode', e.target.value);
  });

  // Export Data
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

  // Import Data
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
      showToast('Error: Invalid backup file.');
    }
    fileInput.value = '';
  });

  // Backup
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

  // Restore
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

  // Clear chats
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
