// app.js – Mini Scratch editor core
// Deobfuscated and rewritten from original

import { packageProject } from './packager.js';
import { translate }       from './translate.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY        = 'miniScratch.project.v1';
const URL_REVOKE_DELAY   = 5000; // ms before revoking object URLs

const DEFAULT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My Project</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f4f8; }
    h1   { color: #1e3a5f; }
  </style>
</head>
<body>
  <h1>Hello from Mini Scratch! 👋</h1>
  <script src="app.js"></script>
</body>
</html>`;

const DEFAULT_JS = `// app.js – Edit me!
console.log('Hello from Mini Scratch!');
`;

const BINARY_EXTENSIONS = new Set([
  'sb3', 'jpg', 'png', 'jpeg', 'gif', 'bmp', 'mp3', 'wav', 'mp4', 'ogg', 'ico', 'webp',
]);

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {Map<string, {content: string|Uint8Array, isBinary: boolean}>} */
let files      = new Map();
let activeFile = null;
let renameTarget = null;

// ─── Initialise ───────────────────────────────────────────────────────────────

loadFromStorage();

if (files.size === 0) {
  addFile('index.html', DEFAULT_HTML);
  addFile('app.js',     DEFAULT_JS);
}

renderTabs();
renderFilesList();

if (!activeFile) setActive(files.keys().next().value);

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const $textEditor      = q('#textEditor');
const $blocksArea      = q('#blocksArea');
const $tabs            = q('#tabs');
const $htmlPreview     = q('#htmlPreview');
const $consoleOut      = q('#consoleOut');
const $filesList       = q('#filesList');
const $fileInput       = q('#fileInput');
const $sb3Input        = q('#sb3Input');
const $turbowarpFrame  = q('#turbowarpFrame');

// ─── Top-bar button listeners ─────────────────────────────────────────────────

q('#btnNewFile').addEventListener('click', () => openModal('modalNewFile'));
q('#btnUpload') .addEventListener('click', () => $fileInput.click());
$fileInput.addEventListener('change', handleUpload);

q('#btnDownloadZip').addEventListener('click', handlePackageZip);
q('#btnTranslate')  .addEventListener('click', handleTranslate);

q('#btnOpenSb3') .addEventListener('click', () => $sb3Input.click());
$sb3Input.addEventListener('change', handleOpenSb3);
q('#btnExportSb3').addEventListener('click', handleExportSb3);

// ─── Right-pane tab switching ─────────────────────────────────────────────────

q('.rightTabs').addEventListener('click', e => {
  const tab = e.target.closest('.rtab');
  if (!tab) return;
  const view = tab.dataset.view;
  document.querySelectorAll('.rtab').forEach(t => {
    t.classList.toggle('active',  t === tab);
    t.setAttribute('aria-selected', String(t === tab));
  });
  document.querySelectorAll('.view').forEach(v => {
    const active = v.id === 'view' + capitalize(view);
    v.classList.toggle('active', active);
    v.classList.toggle('hidden', !active);
  });
});

// ─── New-file modal ───────────────────────────────────────────────────────────

q('#confirmNewFile').addEventListener('click', () => {
  const input    = q('#newFileName');
  const filename = input.value.trim();
  if (!filename) { input.focus(); return; }
  if (files.has(filename)) {
    consoleLog(`⚠ File "${filename}" already exists.`);
    closeModal('modalNewFile');
    setActive(filename);
    return;
  }
  addFile(filename, '');
  renderTabs();
  renderFilesList();
  setActive(filename);
  saveToStorage();
  input.value = '';
  closeModal('modalNewFile');
});

q('#cancelNewFile').addEventListener('click', () => {
  q('#newFileName').value = '';
  closeModal('modalNewFile');
});

q('#newFileName').addEventListener('keydown', e => {
  if (e.key === 'Enter') q('#confirmNewFile').click();
});

// ─── Rename modal ─────────────────────────────────────────────────────────────

q('#confirmRename').addEventListener('click', () => {
  const input   = q('#renameInput');
  const newName = input.value.trim();
  if (!newName || !renameTarget) { input.focus(); return; }
  if (newName !== renameTarget && files.has(newName)) {
    consoleLog(`⚠ A file named "${newName}" already exists.`);
    return;
  }
  renameFile(renameTarget, newName);
  renameTarget = null;
  closeModal('modalRename');
});

q('#cancelRename').addEventListener('click', () => {
  renameTarget = null;
  closeModal('modalRename');
});

q('#renameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') q('#confirmRename').click();
});

// ─── Translate-error modal ────────────────────────────────────────────────────

q('#confirmDeleteCode').addEventListener('click', () => {
  applyTranslation('', activeFile, q('#translateTo').value);
  closeModal('modalTranslateError');
});

q('#cancelTranslate').addEventListener('click', () => closeModal('modalTranslateError'));

// ─── Alert modal ──────────────────────────────────────────────────────────────

q('#confirmAlert').addEventListener('click', () => closeModal('modalAlert'));

// ─── Console clear ────────────────────────────────────────────────────────────

q('#btnClearConsole').addEventListener('click', () => { $consoleOut.textContent = ''; });

// ─── Text editor events ───────────────────────────────────────────────────────

$textEditor.addEventListener('input', () => {
  if (!activeFile) return;
  const file = files.get(activeFile);
  if (file) {
    file.content = $textEditor.value;
    saveToStorage();
    refreshPreview();
  }
});

$textEditor.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = $textEditor.selectionStart;
    const end   = $textEditor.selectionEnd;
    $textEditor.value =
      $textEditor.value.slice(0, start) + '  ' + $textEditor.value.slice(end);
    $textEditor.selectionStart = $textEditor.selectionEnd = start + 2;
    $textEditor.dispatchEvent(new Event('input'));
  }
});

// ─── File management ──────────────────────────────────────────────────────────

function addFile(name, content, isBinary = false) {
  files.set(name, { content, isBinary });
}

function setActive(name) {
  if (!files.has(name)) return;
  // Save current editor content back to state
  if (activeFile && files.has(activeFile)) {
    files.get(activeFile).content = $textEditor.value;
  }
  activeFile = name;
  const file   = files.get(name);
  const isSb3  = name.toLowerCase().endsWith('.sb3');
  $textEditor .classList.toggle('hidden', isSb3);
  $blocksArea .classList.toggle('hidden', !isSb3);
  if (!isSb3) {
    $textEditor.value = file.content;
    $textEditor.focus();
  }
  renderTabs();
  refreshPreview();
}

function renameFile(oldName, newName) {
  const file = files.get(oldName);
  if (!file) return;
  const rebuilt = new Map();
  for (const [k, v] of files) {
    rebuilt.set(k === oldName ? newName : k, v);
  }
  files = rebuilt;
  if (activeFile === oldName) activeFile = newName;
  renderTabs();
  renderFilesList();
  saveToStorage();
}

function deleteFile(name) {
  files.delete(name);
  if (activeFile === name) {
    activeFile = null;
    const next = files.keys().next().value;
    if (next) {
      setActive(next);
    } else {
      $textEditor.value = '';
      $blocksArea.classList.add('hidden');
      $textEditor.classList.remove('hidden');
    }
  }
  renderTabs();
  renderFilesList();
  saveToStorage();
}

function downloadFile(name) {
  const file = files.get(name);
  if (!file) return;
  const bytes = file.content instanceof Uint8Array
    ? file.content
    : new TextEncoder().encode(file.content);
  triggerDownload(new Blob([bytes]), name);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderTabs() {
  $tabs.innerHTML = '';
  for (const name of files.keys()) {
    const tab = document.createElement('div');
    tab.className = 'tab' + (name === activeFile ? ' active' : '');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(name === activeFile));

    const label = document.createElement('button');
    label.className = 'tab-name';
    label.textContent = name;
    label.title = `Switch to ${name}`;
    label.addEventListener('click', () => {
      if (name === activeFile) openRenameModal(name);
      else setActive(name);
    });
    label.addEventListener('dblclick', () => openRenameModal(name));

    const closeBtn = document.createElement('button');
    closeBtn.className = 'x';
    closeBtn.title = `Close ${name}`;
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', `Close ${name}`);
    closeBtn.addEventListener('click', e => { e.stopPropagation(); deleteFile(name); });

    tab.appendChild(label);
    tab.appendChild(closeBtn);
    $tabs.appendChild(tab);
  }
}

function renderFilesList() {
  $filesList.innerHTML = '';
  for (const name of files.keys()) {
    const entry = document.createElement('div');
    entry.className = 'file-entry';

    const nameBtn = document.createElement('button');
    nameBtn.className = 'file-entry__name';
    nameBtn.textContent = name;
    nameBtn.title = `Open ${name}`;
    nameBtn.addEventListener('click', () => setActive(name));

    const actions = document.createElement('div');
    actions.className = 'file-entry__actions';

    const renameBtn = document.createElement('button');
    renameBtn.textContent = '✏️';
    renameBtn.title = 'Rename';
    renameBtn.addEventListener('click', () => openRenameModal(name));

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '⬇️';
    downloadBtn.title = 'Download';
    downloadBtn.addEventListener('click', () => downloadFile(name));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', () => deleteFile(name));

    actions.appendChild(renameBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);
    entry.appendChild(nameBtn);
    entry.appendChild(actions);
    $filesList.appendChild(entry);
  }
}

function refreshPreview() {
  if (!activeFile) return;
  const nameLower = activeFile.toLowerCase();
  if (!nameLower.endsWith('.html') && nameLower !== 'index.html') return;
  const file = files.get(activeFile);
  if (!file) return;
  $htmlPreview.srcdoc = file.content;
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function openRenameModal(name) {
  renameTarget = name;
  const input = q('#renameInput');
  input.value = name;
  openModal('modalRename');
  setTimeout(() => input.select(), 0);
}

function openModal(id) {
  const el = q('#' + id);
  el.classList.remove('hidden');
  const focusable = el.querySelector('input');
  if (focusable) setTimeout(() => focusable.focus(), 0);
}

function closeModal(id) {
  q('#' + id).classList.add('hidden');
}

function showAlert(title, message) {
  q('#modalAlertTitle').textContent = title;
  q('#modalAlertMsg').textContent   = message;
  openModal('modalAlert');
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleUpload(e) {
  const input    = e.target;
  const fileList = input.files;
  if (!fileList || fileList.length === 0) return;

  for (const f of fileList) {
    if (isBinaryExtension(f.name)) {
      const buf  = await f.arrayBuffer();
      const data = new Uint8Array(buf);
      addFile(f.name, data, true);
    } else {
      const text = await f.text();
      addFile(f.name, text);
    }
    consoleLog(`Uploaded: ${f.name}`);
  }
  renderTabs();
  renderFilesList();
  saveToStorage();
  setActive(fileList[fileList.length - 1].name);
  input.value = '';
}

async function handleOpenSb3(e) {
  const input = e.target;
  const file  = input.files && input.files[0];
  if (!file) return;
  const buf  = await file.arrayBuffer();
  const data = new Uint8Array(buf);
  addFile(file.name, data, true);
  consoleLog(`Opened .sb3: ${file.name}`);
  renderTabs();
  renderFilesList();
  saveToStorage();
  setActive(file.name);
  input.value = '';
  $turbowarpFrame.contentWindow?.postMessage({ type: 'tw-load-sb3', buffer: buf }, '*');
}

function handleExportSb3() {
  $turbowarpFrame.contentWindow?.postMessage({ type: 'tw-export-sb3' }, '*');
  showAlert('Export .sb3', 'The export request has been sent to the TurboWarp frame. Use the save button inside TurboWarp if it does not download automatically.');
}

async function handlePackageZip() {
  if (files.size === 0) {
    showAlert('Package ZIP', 'No files to package. Create or upload some files first.');
    return;
  }
  consoleLog('Packaging ZIP…');
  try {
    await packageProject(files, 'project.zip');
    consoleLog('✔ ZIP downloaded.');
  } catch (err) {
    consoleLog(`⚠ Packaging error: ${err.message}`);
    showAlert('Packaging Error', err.message);
  }
}

function handleTranslate() {
  if (!activeFile) {
    showAlert('Translate', 'No active file. Open or create a file first.');
    return;
  }
  const fromLang = q('#translateFrom').value;
  const toLang   = q('#translateTo').value;
  const code     = $textEditor.value;
  const result   = translate(fromLang, toLang, code);
  if (result.ok) {
    applyTranslation(result.output, activeFile, toLang);
  } else {
    q('#modalTranslateErrorMsg').textContent = result.error;
    openModal('modalTranslateError');
  }
}

function applyTranslation(newCode, fileName, toLang) {
  const extMap = { js: '.js', html: '.html', blocks: '.sb3', vbs: '.vbs', text: '.txt' };
  const newExt = extMap[toLang];
  let newName  = fileName;
  if (newExt) {
    newName = fileName.replace(/\.[^.]+$/, '') + newExt;
  }
  if (newName !== fileName) renameFile(fileName, newName);
  const file = files.get(newName);
  if (file) { file.content = newCode; file.isBinary = false; }
  $textEditor.value = newCode;
  setActive(newName);
  saveToStorage();
  consoleLog(`✔ Translated to ${toLang}: ${newName}`);
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function saveToStorage() {
  try {
    const entries = [];
    for (const [name, file] of files) {
      if (file.isBinary || file.content instanceof Uint8Array) {
        const bytes  = file.content instanceof Uint8Array
          ? file.content
          : new TextEncoder().encode(file.content);
        // Encode binary in chunks to avoid stack overflow
        const CHUNK  = 0x8000;
        let b64 = '';
        for (let i = 0; i < bytes.length; i += CHUNK) {
          b64 += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        entries.push({ name, content: btoa(b64), isBinary: true });
      } else {
        entries.push({ name, content: file.content, isBinary: false });
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ files: entries, active: activeFile }));
  } catch (err) {
    consoleLog(`⚠ Could not save to localStorage: ${err.message}`);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    for (const entry of data.files || []) {
      if (entry.isBinary) {
        const decoded = atob(entry.content);
        const bytes   = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        files.set(entry.name, { content: bytes, isBinary: true });
      } else {
        files.set(entry.name, { content: entry.content, isBinary: false });
      }
    }
    if (data.active && files.has(data.active)) activeFile = data.active;
  } catch (err) {
    files.clear();
    consoleLog(`⚠ Could not load from localStorage: ${err.message}`);
  }
}

// ─── Console ──────────────────────────────────────────────────────────────────

function consoleLog(message) {
  const line = `[${timestamp()}] ${message}\n`;
  $consoleOut.textContent += line;
  $consoleOut.scrollTop = $consoleOut.scrollHeight;
}

function timestamp() {
  return new Date().toLocaleTimeString();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function q(selector) {
  return document.querySelector(selector);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download  = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), URL_REVOKE_DELAY);
}

function isBinaryExtension(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return BINARY_EXTENSIONS.has(ext);
}
