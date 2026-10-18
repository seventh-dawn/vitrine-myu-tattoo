import { CONFIG } from './config.js';
import * as auth from './auth.js';
import * as drive from './drive.js';
import * as db from './store.js';
import { makePreview } from './preview.js';
import { I } from './icons.js';

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const normTag = t => t.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
const now = () => new Date().toISOString();
const titleFrom = name => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
const sumSize = files => files.reduce((a, f) => a + (f.size || 0), 0);

function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// Small deterministic tilt so the grid reads like pinned sheets, not a spreadsheet.
function tilt(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 13) - 6) / 10;
}

function limiter(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => { active--; next(); });
  };
  return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}

// ---------- state ----------
const state = {
  index: null, // { version, projects: [...] }
  folderId: null,
  indexFileId: null,
  thumbsId: null, // folder for thumbnails of designs that came in through Drive
  email: null,
  query: '',
  tags: new Set(),
  packedOnly: false,
  untaggedOnly: false,
  packed: new Set(), // project ids stored on this device
  fresh: new Set(), // just-packed ids, for the stamp animation
  panel: null, // null | 'new' | 'account' | project id
  status: null, // null | 'syncing' | 'reconnect'
  lastSync: 0,
};

const projects = () => state.index?.projects ?? [];
const findProject = id => projects().find(p => p.id === id);
// Designs made in the app live in a folder whose id is the design id. Ones picked
// up from Drive record where their files are: her own sub-folder, or the vault root.
const folderOf = p => p.folder ?? p.id;
const canReachDrive = () => navigator.onLine && !!auth.getToken();

// Recently downloaded (not packed) files, so "Open in…" can fire on the next tap.
const memBlobs = new Map();
function remember(id, blob) {
  memBlobs.set(id, blob);
  while (memBlobs.size > 2) memBlobs.delete(memBlobs.keys().next().value);
}

// ---------- persistence ----------
const saveMeta = () => db.set('meta', { folderId: state.folderId, indexFileId: state.indexFileId, email: state.email }).catch(() => {});
const savePacked = () => db.set('packed', [...state.packed]).catch(() => {});
const saveIndex = () => db.set('index', state.index).catch(() => {});

// ---------- toasts ----------
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => dismiss(el), kind === 'error' ? 6000 : 3200);
}
function dismiss(el) {
  el.classList.add('out');
  setTimeout(() => el.remove(), 180);
}
function progressToast(label) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="label"><span></span><span>0%</span></div><span class="sub"></span><div class="progress"><i></i></div>`;
  const [title, pct] = el.querySelectorAll('.label span');
  title.textContent = label;
  $('#toasts').append(el);
  return {
    set(frac, sub) {
      const f = Math.max(0, Math.min(1, frac));
      pct.textContent = `${Math.round(f * 100)}%`;
      $('.progress i', el).style.transform = `scaleX(${f})`;
      if (sub !== undefined) $('.sub', el).textContent = sub;
    },
    label(text) { title.textContent = text; },
    done(msg) { dismiss(el); if (msg) toast(msg); },
    fail() { dismiss(el); },
  };
}

function handleError(e) {
  console.error(e);
  if (e instanceof drive.AuthError) {
    auth.clear();
    state.status = 'reconnect';
    renderStatus();
    toast('Google Drive needs you to sign in again.', 'error');
  } else if (e?.name === 'QuotaExceededError') {
    toast('This iPad is out of space for packed designs. Unpack some first.', 'error');
  } else if (!navigator.onLine) {
    renderStatus();
    toast('You’re offline.', 'error');
  } else {
    toast(e?.message || 'Something went wrong.', 'error');
  }
}

function requireDrive() {
  if (!navigator.onLine) throw new Error('You’re offline — connect to Wi-Fi to change things in Drive.');
  if (!auth.getToken()) throw new drive.AuthError();
}

// ---------- Drive sync ----------
async function ensureVault() {
  if (state.folderId && state.indexFileId) return;
  Object.assign(state, await drive.findOrCreateVault(CONFIG.folderName));
  if (!state.email) state.email = (await drive.about()).emailAddress;
  await saveMeta();
}

async function fetchIndex() {
  await ensureVault();
  let ix;
  try {
    ix = await drive.readJson(state.indexFileId);
  } catch (e) {
    if (!(e instanceof drive.NotFound)) throw e;
    state.folderId = state.indexFileId = null; // vault was moved or deleted: find or recreate it
    await ensureVault();
    ix = await drive.readJson(state.indexFileId);
  }
  if (!Array.isArray(ix.projects)) ix.projects = [];
  return ix;
}

let refreshing = null;
function refresh() {
  refreshing ??= (async () => {
    if (!navigator.onLine) return renderStatus();
    if (!auth.getToken()) {
      if (state.email && auth.trySilent(state.email)) return;
      state.status = 'reconnect';
      return renderStatus();
    }
    state.status = 'syncing';
    renderStatus();
    try {
      state.index = await fetchIndex();
      state.lastSync = Date.now();
      state.status = null;
      await saveIndex();
      $('#welcome').hidden = true;
      render();
      // Don't clobber unsaved edits (e.g. coming back from Procreate mid-edit).
      const saveBtn = $('#d-save');
      if (findProject(state.panel) && (!saveBtn || saveBtn.hidden)) renderPanel();
      await importDrops().catch(handleError);
      syncPacked();
      makeThumbnails();
    } catch (e) {
      if (state.status === 'syncing') state.status = null;
      handleError(e);
    } finally {
      renderStatus();
    }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

// Read-modify-write the index so edits from another device aren't lost.
async function mutate(fn) {
  requireDrive();
  const ix = await fetchIndex();
  fn(ix);
  await drive.writeJson(state.indexFileId, ix);
  state.index = ix;
  await saveIndex();
  render();
}

function updateProject(ix, id, fn) {
  const p = ix.projects.find(x => x.id === id);
  if (!p) throw new Error('This design was removed on another device.');
  fn(p);
  p.updatedAt = now();
}

// ---------- files saved straight into Drive ----------
const toFile = f => ({ id: f.id, name: f.name, mimeType: f.mimeType || '', size: Number(f.size) || 0 });
const importable = f => f.mimeType !== drive.FOLDER && !f.mimeType.startsWith('application/vnd.google-apps.')
  && !f.name.startsWith('.') && !f.appProperties?.stencilVault;
// "dragon.procreate" and "dragon-stencil.png" belong together.
const stem = name => name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[\s_-]*stencil$/, '').trim();
const isProcreate = f => /\.procreate$/i.test(f.name);

function knownIds(ix) {
  const ids = new Set(ix.ignored || []);
  for (const p of ix.projects) {
    if (p.previewId) ids.add(p.previewId);
    for (const f of p.files) ids.add(f.id);
  }
  return ids;
}

function importedDesign(id, folder, title, raw) {
  const created = raw.map(f => f.createdTime).filter(Boolean).sort()[0] || now();
  const files = [...raw].sort((a, b) => isProcreate(b) - isProcreate(a)).map(toFile);
  return { id, folder, title, tags: [], notes: '', previewId: null, files, imported: true, createdAt: created, updatedAt: now() };
}

// Lists the vault folder and every design folder, then brings the index in line:
// new loose files and new sub-folders become designs, files dropped into a
// design's folder join it, and files deleted in Drive drop out.
async function importDrops() {
  if (!auth.canScan() || !state.index) return;
  const before = projects();
  const known = knownIds(state.index);
  const byFolder = new Map(before.filter(p => folderOf(p) !== state.folderId).map(p => [folderOf(p), p]));

  const rootItems = await drive.listChildren([state.folderId]);
  const newFolders = rootItems.filter(f => f.mimeType === drive.FOLDER && !f.appProperties?.stencilVault
    && !byFolder.has(f.id) && !known.has(f.id));
  const inner = await drive.listChildren([...byFolder.keys(), ...newFolders.map(f => f.id)]);

  const present = new Set([...rootItems, ...inner].map(f => f.id));
  const gone = new Set(before.flatMap(p => p.files.map(f => f.id)).filter(id => !present.has(id)));

  const added = new Map(); // design id -> new files
  const fresh = [];
  for (const f of inner) {
    if (!importable(f) || known.has(f.id)) continue;
    const parent = f.parents.find(id => byFolder.has(id));
    if (parent) {
      const id = byFolder.get(parent).id;
      added.set(id, [...(added.get(id) || []), toFile(f)]);
    }
  }
  for (const folder of newFolders) {
    const files = inner.filter(f => f.parents.includes(folder.id) && importable(f) && !known.has(f.id));
    if (files.length) fresh.push(importedDesign(folder.id, folder.id, folder.name, files));
  }
  const groups = new Map();
  for (const f of rootItems) {
    if (!importable(f) || known.has(f.id)) continue;
    groups.set(stem(f.name), [...(groups.get(stem(f.name)) || []), f]);
  }
  for (const files of groups.values()) {
    const lead = files.find(isProcreate) || files[0];
    fresh.push(importedDesign(lead.id, state.folderId, titleFrom(lead.name), files));
  }

  if (!fresh.length && !added.size && !gone.size) return;
  await mutate(ix => {
    const seen = knownIds(ix);
    for (const p of ix.projects) {
      const had = p.files.length;
      p.files = p.files.filter(f => !gone.has(f.id));
      const more = (added.get(p.id) || []).filter(f => !seen.has(f.id));
      if (more.length) {
        p.files.push(...more);
        if (!p.previewId) p.previewChecked = false;
      }
      if (had !== p.files.length || more.length) p.updatedAt = now();
      if (had && !p.files.length) p.removed = true; // everything was deleted in Drive
    }
    ix.projects = ix.projects.filter(p => !p.removed);
    const ids = new Set(ix.projects.map(p => p.id));
    ix.projects.unshift(...fresh.filter(d => !ids.has(d.id) && d.files.every(f => !seen.has(f.id))));
  });
  if (fresh.length) {
    toast(`${plural(fresh.length, 'new design')} from Google Drive. Tap “Untagged” to tag ${fresh.length === 1 ? 'it' : 'them'}.`);
  }
}

async function thumbsFolder() {
  state.thumbsId ||= (await drive.findOrCreateChild(state.folderId, 'thumbs', '_thumbnails')).id;
  return state.thumbsId;
}

// .procreate thumbnails are read in place; images are small enough to download.
async function previewFromDrive(f) {
  if (isProcreate(f)) return makePreview(drive.remoteFile(f));
  if (!/^image\//.test(f.mimeType) && !/\.(png|jpe?g|webp|heic)$/i.test(f.name)) return null;
  if (f.size > 40 * 1024 * 1024) return null;
  const blob = await drive.download(f.id);
  return makePreview(new File([blob], f.name, { type: f.mimeType || blob.type }));
}

let thumbing = false;
async function makeThumbnails() {
  if (thumbing) return;
  thumbing = true;
  try {
    for (const p of projects().filter(x => x.imported && !x.previewId && !x.previewChecked && x.files.length)) {
      if (!canReachDrive()) break;
      let previewId = null;
      for (const f of p.files) {
        const blob = await previewFromDrive(f).catch(() => null);
        if (blob) { previewId = await uploadPreview(await thumbsFolder(), blob); break; }
      }
      await mutate(ix => {
        const q = ix.projects.find(x => x.id === p.id);
        if (q && !q.previewId) Object.assign(q, { previewId, previewChecked: true });
      });
      if (state.panel === p.id) renderPanel();
    }
  } catch (e) {
    handleError(e);
  } finally {
    thumbing = false;
  }
}

// Trashes what the app is allowed to; returns the ids it had to leave alone.
async function trashOrKeep(ids) {
  const kept = [];
  for (const id of ids) {
    try { await drive.trash(id); } catch (e) {
      if (e instanceof drive.Forbidden) kept.push(id);
      else if (!(e instanceof drive.NotFound)) throw e;
    }
  }
  return kept;
}

// ---------- previews ----------
const previewUrls = new Map();
const previewPending = new Map();
const previewQueue = limiter(4);

function previewUrl(id) {
  if (previewUrls.has(id)) return Promise.resolve(previewUrls.get(id));
  if (!previewPending.has(id)) {
    previewPending.set(id, (async () => {
      let blob = await db.getPreview(id).catch(() => null);
      if (!blob) {
        if (!canReachDrive()) throw new Error('Preview unavailable offline');
        blob = await previewQueue(() => drive.download(id));
        db.putPreview(id, blob).catch(() => {});
      }
      const url = URL.createObjectURL(blob);
      previewUrls.set(id, url);
      return url;
    })().finally(() => previewPending.delete(id)));
  }
  return previewPending.get(id);
}

function loadImg(img) {
  previewUrl(img.dataset.preview)
    .then(url => { img.src = url; img.classList.add('loaded'); })
    .catch(() => {});
}
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); loadImg(e.target); }
}, { rootMargin: '400px' });

function imgTag(previewId, alt = '') {
  const url = previewUrls.get(previewId);
  return url
    ? `<img alt="${esc(alt)}" src="${url}" class="loaded" width="300" height="375">`
    : `<img alt="${esc(alt)}" data-preview="${esc(previewId)}" width="300" height="375">`;
}

// ---------- offline packing ----------
async function packMany(list) {
  if (!list.length) return;
  requireDrive();
  navigator.storage?.persist?.().catch(() => {});
  const total = sumSize(list.flatMap(p => p.files)) || 1;
  let done = 0;
  const t = progressToast(list.length === 1 ? `Packing “${list[0].title}”` : `Packing ${plural(list.length, 'design')}`);
  try {
    for (const p of list) {
      for (const f of p.files) {
        if (!(await db.hasBlob(f.id))) {
          const blob = memBlobs.get(f.id) || await drive.download(f.id, loaded => t.set((done + loaded) / total, f.name));
          await db.putBlob(f.id, blob);
        }
        done += f.size || 0;
        t.set(done / total, f.name);
      }
      if (p.previewId) previewUrl(p.previewId).catch(() => {}); // make sure the thumbnail is cached too
      state.packed.add(p.id);
      state.fresh.add(p.id);
      await savePacked();
    }
    t.done(list.length === 1 ? 'Packed — opens without Wi-Fi.' : `${plural(list.length, 'design')} packed — they open without Wi-Fi.`);
  } catch (e) {
    t.fail();
    handleError(e);
  } finally {
    render();
    if (state.panel && state.panel !== 'new') renderPanel();
  }
}

async function unpackMany(list) {
  for (const p of list) {
    await Promise.all(p.files.map(f => { localHandles.delete(f.id); return db.delBlob(f.id).catch(() => {}); }));
    state.packed.delete(p.id);
  }
  await savePacked();
  render();
}

// Packed designs that gained files on another device get topped up quietly.
async function syncPacked() {
  const ids = new Set(projects().map(p => p.id));
  for (const id of state.packed) if (!ids.has(id)) state.packed.delete(id);
  await savePacked();
  const stale = [];
  for (const p of projects()) {
    if (!state.packed.has(p.id)) continue;
    for (const f of p.files) {
      if (!(await db.hasBlob(f.id).catch(() => true))) { stale.push(p); break; }
    }
  }
  if (stale.length && canReachDrive()) packMany(stale);
}

// Handles to packed blobs for the open design, looked up ahead of time so the
// share sheet can open synchronously from the tap.
const localHandles = new Map();
async function getLocalBlob(id) {
  return memBlobs.get(id) || localHandles.get(id) || await db.getBlob(id).catch(() => null);
}

function shareOrSave(meta, blob) {
  // Drive reports .procreate as a generic zip/binary type, which hides Procreate
  // from the share sheet. With no type, iPadOS goes by the extension instead.
  const type = /\.procreate$/i.test(meta.name) ? '' : blob.type || 'application/octet-stream';
  const file = new File([blob], meta.name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    return navigator.share({ files: [file] }).catch(e => {
      if (e.name !== 'AbortError') saveFile(file);
    });
  }
  saveFile(file);
}
function saveFile(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
}

// ---------- create / edit ----------
async function uploadInto(folderId, files, t) {
  const total = sumSize(files) || 1;
  let done = 0;
  const out = [];
  for (const f of files) {
    const send = parent => drive.upload(f, { name: f.name, parents: [parent] }, loaded => t.set((done + loaded) / total, f.name));
    // A folder she made in Drive may not accept files from the app; the vault root always does.
    const r = await send(folderId).catch(e => {
      if (!(e instanceof drive.Forbidden) || folderId === state.folderId) throw e;
      folderId = state.folderId;
      return send(folderId);
    });
    out.push({ id: r.id, name: f.name, mimeType: f.type || '', size: f.size });
    done += f.size;
    t.set(done / total);
  }
  return out;
}

async function uploadPreview(folderId, preview) {
  const r = await drive.upload(preview, { name: 'preview.jpg', parents: [folderId], mimeType: 'image/jpeg', appProperties: { stencilVault: 'preview' } });
  await db.putPreview(r.id, preview).catch(() => {});
  return r.id;
}

async function firstPreview(files) {
  for (const f of files) {
    const p = await makePreview(f).catch(() => null);
    if (p) return p;
  }
  return null;
}

async function createProject({ title, tags, notes, files, preview }, t) {
  requireDrive();
  await ensureVault();
  const folder = await drive.createFolder(title, state.folderId);
  const stored = await uploadInto(folder.id, files, t);
  const previewId = preview ? await uploadPreview(folder.id, preview) : null;
  const project = { id: folder.id, title, tags, notes, previewId, files: stored, createdAt: now(), updatedAt: now() };
  await mutate(ix => ix.projects.unshift(project));
  return project;
}

async function addFiles(p, files) {
  const t = progressToast(`Adding ${plural(files.length, 'file')}`);
  try {
    requireDrive();
    const stored = await uploadInto(folderOf(p), files, t);
    const pr = p.previewId ? null : await firstPreview(files);
    const previewId = p.previewId || (pr ? await uploadPreview(p.imported ? await thumbsFolder() : p.id, pr) : null);
    await mutate(ix => updateProject(ix, p.id, q => {
      q.files.push(...stored);
      q.previewId ||= previewId;
    }));
    if (state.packed.has(p.id)) {
      await Promise.all(stored.map((s, i) => db.putBlob(s.id, files[i])));
    }
    t.done(`Added to “${p.title}”.`);
  } catch (e) {
    t.fail();
    handleError(e);
  }
  renderPanel();
}

async function removeFile(p, f) {
  const where = p.imported
    ? 'If it was saved into Google Drive directly, it stays there. Otherwise it goes to the Drive trash.'
    : 'It goes to the Google Drive trash.';
  if (!confirm(`Remove “${f.name}” from this design?\n${where}`)) return;
  try {
    requireDrive();
    const kept = await trashOrKeep([f.id]);
    await db.delBlob(f.id).catch(() => {});
    await mutate(ix => {
      updateProject(ix, p.id, q => { q.files = q.files.filter(x => x.id !== f.id); });
      if (kept.length) ix.ignored = [...(ix.ignored || []), ...kept];
    });
    renderPanel();
  } catch (e) { handleError(e); }
}

async function deleteProject(p) {
  const ask = p.imported
    ? `Remove “${p.title}” from Stencil Vault?\nFiles saved into Google Drive directly stay there. Anything added through the app goes to the Drive trash.`
    : `Move “${p.title}” and all its files to the Google Drive trash?`;
  if (!confirm(ask)) return;
  try {
    requireDrive();
    let kept = [];
    if (p.imported) {
      kept = await trashOrKeep([...p.files.map(f => f.id), p.previewId].filter(Boolean));
      // Remember her folder too, so the next sync doesn't bring the design back.
      if (folderOf(p) !== state.folderId) kept.push(...await trashOrKeep([folderOf(p)]));
    } else {
      await trashOrKeep([p.id]);
    }
    await mutate(ix => {
      ix.projects = ix.projects.filter(x => x.id !== p.id);
      if (kept.length) ix.ignored = [...(ix.ignored || []), ...kept];
    });
    await unpackMany([p]);
    if (p.previewId) db.delPreview(p.previewId).catch(() => {});
    closePanel();
    toast(kept.length ? `“${p.title}” removed. Its files are still in Google Drive.` : `“${p.title}” moved to Drive trash.`);
  } catch (e) { handleError(e); }
}

// ---------- filtering ----------
function filtered() {
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  return projects().filter(p => {
    if (state.packedOnly && !state.packed.has(p.id)) return false;
    if (state.untaggedOnly && p.tags.length) return false;
    for (const t of state.tags) if (!p.tags.includes(t)) return false;
    if (!words.length) return true;
    const hay = [p.title, p.notes, ...p.tags.map(t => `#${t}`), ...p.files.map(f => f.name)].join(' ').toLowerCase();
    return words.every(w => hay.includes(w));
  });
}

function allTags() {
  const counts = new Map();
  for (const p of projects()) for (const t of p.tags) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// ---------- rendering ----------
function render() {
  renderTags();
  renderGrid();
  renderPackbar();
  renderStatus();
}

function renderStatus() {
  const n = projects().length;
  $('#count').innerHTML = state.status === 'syncing'
    ? `<span class="dot"></span>Syncing with Drive`
    : esc(plural(n, 'design'));

  const el = $('#status');
  if (!navigator.onLine) {
    el.innerHTML = `${I.offline}<p>Offline. Packed designs open as normal; the rest need Wi-Fi.</p>`;
    el.hidden = false;
  } else if (state.status === 'reconnect') {
    el.innerHTML = `${I.sync}<p>Google Drive needs you to sign in again.</p><button class="btn btn-ink btn-sm" data-reconnect type="button">Reconnect</button>`;
    el.hidden = false;
  } else if (auth.getToken() && !auth.canScan()) {
    el.innerHTML = `${I.folder}<p>Let Stencil Vault see files you save into its Google Drive folder.</p><button class="btn btn-ink btn-sm" data-reconnect type="button">Allow</button>`;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function renderTags() {
  const packedCount = projects().filter(p => state.packed.has(p.id)).length;
  const untagged = projects().filter(p => !p.tags.length).length;
  const tags = allTags();
  for (const t of state.tags) if (!tags.some(([x]) => x === t)) tags.push([t, 0]);
  $('#tags').innerHTML =
    `<button class="chip chip-packed" type="button" data-packed aria-pressed="${state.packedOnly}">${I.pack}On this iPad <b>${packedCount}</b></button>` +
    (untagged || state.untaggedOnly ? `<button class="chip" type="button" data-untagged aria-pressed="${state.untaggedOnly}">Untagged <b>${untagged}</b></button>` : '') +
    tags.map(([t, n]) => `<button class="chip" type="button" data-tag="${esc(t)}" aria-pressed="${state.tags.has(t)}">#${esc(t)} <b>${n}</b></button>`).join('');
}

function cardHtml(p) {
  const packed = state.packed.has(p.id);
  const classes = ['sheet'];
  if (!packed && !canReachDrive()) classes.push('is-unavailable');
  if (state.panel === p.id) classes.push('is-active');
  const stamp = packed ? `<span class="stamp${state.fresh.has(p.id) ? ' fresh' : ''}">Packed</span>` : '';
  return `<button class="${classes.join(' ')}" type="button" data-open="${esc(p.id)}" style="--tilt:${tilt(p.id)}deg">
    <span class="sheet-paper">${p.previewId ? imgTag(p.previewId) : `<span class="blank">${I.file}</span>`}${stamp}</span>
    <span class="sheet-title">${esc(p.title)}</span>
    <span class="sheet-tags">${p.tags.length ? p.tags.map(t => `#${esc(t)}`).join(' ') : `${plural(p.files.length, 'file')}`}</span>
  </button>`;
}

function renderGrid() {
  const list = filtered();
  const grid = $('#grid');
  grid.innerHTML = list.map(cardHtml).join('');
  state.fresh.clear();
  for (const img of grid.querySelectorAll('img[data-preview]')) io.observe(img);

  const empty = $('#empty');
  if (!state.index) {
    empty.hidden = true;
  } else if (!projects().length) {
    empty.innerHTML = `<h2>No designs yet.</h2><p>Add a .procreate file and its stencil here, or save them from Procreate into the “${esc(CONFIG.folderName)}” folder in Google Drive. Tag them and they’re findable forever.</p><button class="btn btn-ink" type="button" data-add>${I.plus}Add the first one</button>`;
    empty.hidden = false;
  } else if (!list.length) {
    empty.innerHTML = `<h2>Nothing matches.</h2><p>No design matches all of those filters${state.query ? ' and that search' : ''}.</p><button class="btn btn-ghost" type="button" data-clear>Clear filters</button>`;
    empty.hidden = false;
  } else {
    empty.hidden = true;
  }
}

function renderPackbar() {
  const bar = $('#packbar');
  const list = filtered();
  if (!(state.tags.size || state.query || state.untaggedOnly) || state.packedOnly || !list.length) { bar.hidden = true; return; }
  const missing = list.filter(p => !state.packed.has(p.id));
  bar.innerHTML = missing.length
    ? `<p><b>${plural(list.length, 'design')}</b> match · ${missing.length} not on this iPad (${fmtSize(sumSize(missing.flatMap(p => p.files)))})</p>
       <button class="btn btn-violet btn-sm" type="button" data-pack-all>${I.pack}Pack for offline</button>`
    : `<p>All <b>${list.length}</b> are packed on this iPad.</p>
       <button class="btn btn-ghost btn-sm" type="button" data-unpack-all>Unpack these</button>`;
  bar.hidden = false;
}

// ---------- panel ----------
function openPanel(what) {
  state.panel = what;
  renderPanel();
  const panel = $('#panel');
  panel.inert = false;
  panel.classList.add('open');
  document.body.classList.add('panel-open');
  $('#panel-body').scrollTop = 0;
  markActive();
}

function closePanel() {
  state.panel = null;
  const panel = $('#panel');
  panel.classList.remove('open');
  panel.inert = true;
  document.body.classList.remove('panel-open');
  markActive();
}

function markActive() {
  for (const el of document.querySelectorAll('.sheet')) el.classList.toggle('is-active', el.dataset.open === state.panel);
}

function renderPanel() {
  const body = $('#panel-body');
  if (state.panel === 'new') return renderNew(body);
  if (state.panel === 'account') return renderAccount(body);
  const p = findProject(state.panel);
  if (p) renderDetail(body, p);
  else closePanel();
}

const panelHead = eyebrow => `<header class="panel-head"><p class="eyebrow">${eyebrow}</p><button class="icon-btn" type="button" data-close aria-label="Close">${I.close}</button></header>`;

function tagEditor(root, initial) {
  const tags = [...initial];
  root.innerHTML = `<div class="tag-input"><span class="tag-list"></span><input type="text" placeholder="Add a tag" enterkeyhint="done" autocapitalize="none" autocomplete="off" spellcheck="false" aria-label="Add a tag"></div><div class="tag-suggest"></div>`;
  const list = $('.tag-list', root);
  const input = $('input', root);
  const suggest = $('.tag-suggest', root);
  const changed = () => root.dispatchEvent(new Event('tagschange', { bubbles: true }));
  const draw = () => {
    list.innerHTML = tags.map((t, i) => `<span class="tag">#${esc(t)}<button type="button" data-rm="${i}" aria-label="Remove tag ${esc(t)}">${I.close}</button></span>`).join('');
    const q = normTag(input.value);
    suggest.innerHTML = allTags().map(([t]) => t)
      .filter(t => !tags.includes(t) && (!q || t.includes(q)))
      .slice(0, 12)
      .map(t => `<button type="button" class="chip chip-sm" data-add="${esc(t)}">#${esc(t)}</button>`).join('');
  };
  const add = value => {
    let added = false;
    for (const part of value.split(',')) {
      const t = normTag(part);
      if (t && !tags.includes(t)) { tags.push(t); added = true; }
    }
    input.value = '';
    draw();
    if (added) changed();
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
    else if (e.key === 'Backspace' && !input.value && tags.length) { tags.pop(); draw(); changed(); }
  });
  input.addEventListener('input', () => (input.value.includes(',') ? add(input.value) : draw()));
  root.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { tags.splice(Number(rm.dataset.rm), 1); draw(); changed(); return; }
    const sug = e.target.closest('[data-add]');
    if (sug) { add(sug.dataset.add); input.focus(); }
  });
  draw();
  return { get() { if (input.value.trim()) add(input.value); return [...tags]; } };
}

function renderNew(body) {
  body.innerHTML = `${panelHead('New design')}
    <label class="picker">
      <input type="file" multiple id="nf-files" aria-label="Choose files">
      <span class="picker-art">${I.plus}</span>
      <span><strong>Choose files</strong><small>The .procreate plus its stencil PNG or PDF. Pick several to keep them together.</small></span>
    </label>
    <div class="detail-paper nf-preview" hidden><img alt="Preview"></div>
    <ul class="file-list" id="nf-list"></ul>
    <label class="field"><span>Title</span><input id="nf-title" type="text" autocomplete="off"></label>
    <div class="field"><span>Tags</span><div id="nf-tags"></div></div>
    <label class="field"><span>Notes</span><textarea id="nf-notes" rows="3" placeholder="Size, placement, client, price…"></textarea></label>
    <button class="btn btn-violet btn-wide" type="button" id="nf-save" disabled>Upload to Drive</button>
    <div class="progress" id="nf-progress" hidden><i></i></div>`;

  const te = tagEditor($('#nf-tags', body), [...state.tags]);
  const title = $('#nf-title', body);
  const save = $('#nf-save', body);
  const previewBox = $('.nf-preview', body);
  let files = [];
  let preview = null;
  let previewObjUrl = null;

  $('#nf-files', body).addEventListener('change', async e => {
    files = [...e.target.files];
    $('#nf-list', body).innerHTML = files.map(f => `<li class="file-row"><span class="file-ico">${I.file}</span><span class="file-meta"><b>${esc(f.name)}</b><small>${fmtSize(f.size)}</small></span></li>`).join('');
    if (files.length && !title.value.trim()) title.value = titleFrom(files[0].name);
    save.disabled = !files.length;
    preview = await firstPreview(files);
    if (previewObjUrl) URL.revokeObjectURL(previewObjUrl);
    previewObjUrl = preview ? URL.createObjectURL(preview) : null;
    previewBox.hidden = !preview;
    if (preview) {
      const img = $('img', previewBox);
      img.src = previewObjUrl;
      img.classList.add('loaded');
    }
  });

  save.addEventListener('click', async () => {
    const name = title.value.trim() || titleFrom(files[0]?.name || 'Untitled');
    save.disabled = true;
    save.textContent = 'Uploading…';
    const bar = $('#nf-progress', body);
    bar.hidden = false;
    const t = {
      set: frac => { $('i', bar).style.transform = `scaleX(${Math.min(1, frac)})`; },
    };
    try {
      const p = await createProject({ title: name, tags: te.get(), notes: $('#nf-notes', body).value.trim(), files, preview }, t);
      toast(`“${p.title}” saved to Drive.`);
      openPanel(p.id);
    } catch (e) {
      handleError(e);
      save.disabled = false;
      save.textContent = 'Upload to Drive';
      bar.hidden = true;
    }
  });
}

function fileRow(f) {
  const ready = memBlobs.has(f.id);
  return `<li class="file-row">
    <span class="file-ico">${I.file}</span>
    <span class="file-meta"><b>${esc(f.name)}</b><small>${fmtSize(f.size || 0)}</small></span>
    <button class="btn ${ready ? 'btn-violet' : 'btn-ink'} btn-sm" type="button" data-file-open="${esc(f.id)}">${I.share}${ready ? 'Ready' : 'Open in…'}</button>
    <button class="icon-btn sm" type="button" data-file-rm="${esc(f.id)}" aria-label="Remove ${esc(f.name)}">${I.trash}</button>
  </li>`;
}

function renderDetail(body, p) {
  const packed = state.packed.has(p.id);
  body.innerHTML = `${panelHead(`Added ${fmtDate(p.createdAt)}`)}
    <div class="detail-paper">${p.previewId ? imgTag(p.previewId, p.title) : `<span class="blank">${I.file}No preview</span>`}${packed ? '<span class="stamp">Packed</span>' : ''}</div>
    <h2 class="detail-title">${esc(p.title)}</h2>

    <section class="block">
      <h3>Files</h3>
      <ul class="file-list">${p.files.map(fileRow).join('') || '<li class="muted">No files yet.</li>'}</ul>
      <label class="btn btn-ghost btn-sm" style="position:relative">${I.plus}Add files<input type="file" multiple id="d-add" class="vh"></label>
    </section>

    <section class="block block-row">
      <div><h3>Keep on this iPad</h3><p class="muted">${fmtSize(sumSize(p.files))} · opens without Wi-Fi</p></div>
      <button class="switch" type="button" role="switch" id="d-pack" aria-checked="${packed}" aria-label="Keep on this iPad"><i></i></button>
    </section>

    <section class="block">
      <h3>Details</h3>
      <label class="field"><span>Title</span><input id="d-title" type="text" value="${esc(p.title)}" autocomplete="off"></label>
      <div class="field"><span>Tags</span><div id="d-tags"></div></div>
      <label class="field"><span>Notes</span><textarea id="d-notes" rows="3" placeholder="Size, placement, client, price…">${esc(p.notes || '')}</textarea></label>
      <button class="btn btn-ink" type="button" id="d-save" hidden>Save changes</button>
    </section>

    <footer class="detail-foot">
      <a class="link" href="https://drive.google.com/drive/folders/${encodeURIComponent(folderOf(p))}" target="_blank" rel="noopener">${I.folder}Open in Google Drive</a>
      <button class="link danger" type="button" id="d-delete">${I.trash}Move to trash</button>
    </footer>`;

  const img = $('img[data-preview]', body);
  if (img) loadImg(img);
  localHandles.clear();
  if (packed) for (const f of p.files) db.getBlob(f.id).then(b => b && localHandles.set(f.id, b)).catch(() => {});

  const te = tagEditor($('#d-tags', body), p.tags);
  const saveBtn = $('#d-save', body);
  const showSave = () => { saveBtn.hidden = false; };
  $('#d-title', body).addEventListener('input', showSave);
  $('#d-notes', body).addEventListener('input', showSave);
  $('#d-tags', body).addEventListener('tagschange', showSave);

  saveBtn.addEventListener('click', async () => {
    const title = $('#d-title', body).value.trim() || p.title;
    const tags = te.get();
    const notes = $('#d-notes', body).value.trim();
    saveBtn.disabled = true;
    try {
      await mutate(ix => updateProject(ix, p.id, q => Object.assign(q, { title, tags, notes })));
      if (title !== p.title && !p.imported) drive.rename(p.id, title).catch(() => {}); // keep the Drive folder name in step
      toast('Saved.');
      renderPanel();
    } catch (e) {
      handleError(e);
      saveBtn.disabled = false;
    }
  });

  $('#d-pack', body).addEventListener('click', async e => {
    const sw = e.currentTarget;
    sw.setAttribute('aria-busy', 'true');
    if (state.packed.has(p.id)) await unpackMany([p]);
    else {
      try { requireDrive(); await packMany([p]); } catch (err) { handleError(err); }
    }
    renderPanel();
  });

  $('#d-add', body).addEventListener('change', e => {
    const files = [...e.target.files];
    if (files.length) addFiles(p, files);
  });
  $('#d-delete', body).addEventListener('click', () => deleteProject(p));

  body.querySelectorAll('[data-file-rm]').forEach(btn => btn.addEventListener('click', () => {
    const f = p.files.find(x => x.id === btn.dataset.fileRm);
    if (f) removeFile(p, f);
  }));
  body.querySelectorAll('[data-file-open]').forEach(btn => btn.addEventListener('click', () => {
    const f = p.files.find(x => x.id === btn.dataset.fileOpen);
    if (f) openFile(f, btn);
  }));
}

// iPadOS only allows the share sheet straight from a tap, so a file that has to
// be downloaded first takes two taps: download, then "Ready" opens it.
async function openFile(f, btn) {
  if (btn.dataset.busy) return;
  const local = await getLocalBlob(f.id);
  if (local) return shareOrSave(f, local);
  if (!navigator.onLine) return toast('Offline — this design isn’t packed on this iPad.', 'error');
  if (!auth.getToken()) return handleError(new drive.AuthError());
  btn.dataset.busy = '1';
  const original = btn.innerHTML;
  try {
    const blob = await drive.download(f.id, (loaded, total) => {
      btn.textContent = `${Math.round((100 * loaded) / (total || f.size || 1))}%`;
    });
    remember(f.id, blob);
    btn.innerHTML = `${I.share}Ready`;
    btn.classList.replace('btn-ink', 'btn-violet');
    toast('Downloaded. Tap Ready to open it in Procreate.');
  } catch (e) {
    btn.innerHTML = original;
    handleError(e);
  } finally {
    delete btn.dataset.busy;
  }
}

async function renderAccount(body) {
  const packedList = projects().filter(p => state.packed.has(p.id));
  body.innerHTML = `${panelHead('Account')}
    <section class="block" style="border-top:0;padding-top:4px">
      <h3>Google Drive</h3>
      <p class="account-email">${esc(state.email || 'Not connected')}</p>
      <p class="muted">Everything lives in the “${esc(CONFIG.folderName)}” folder in this Drive. Files saved into it from Procreate or the Files app show up here on the next sync. Put several files in a sub-folder to keep them together as one design.</p>
    </section>
    <section class="block">
      <h3>This iPad</h3>
      <p class="muted" id="acc-usage">${plural(packedList.length, 'design')} packed</p>
      <div class="meter"><i id="acc-meter" style="transform:scaleX(0)"></i></div>
    </section>
    <section class="block stack">
      <button class="btn btn-ghost" type="button" id="acc-sync">${I.sync}Sync now</button>
      <button class="btn btn-ghost" type="button" id="acc-unpack" ${packedList.length ? '' : 'disabled'}>Unpack everything</button>
      ${state.email
        ? `<button class="btn btn-ghost" type="button" id="acc-out" style="color:var(--danger)">Disconnect &amp; clear this iPad</button>`
        : `<button class="btn btn-ink" type="button" data-reconnect>Connect Google Drive</button>`}
    </section>`;

  $('#acc-sync', body).addEventListener('click', () => refresh());
  $('#acc-unpack', body).addEventListener('click', async () => {
    if (!confirm('Remove all packed designs from this iPad? They stay safe in Google Drive.')) return;
    await db.clearBlobs().catch(() => {});
    state.packed.clear();
    await savePacked();
    render();
    renderPanel();
  });
  $('#acc-out', body)?.addEventListener('click', async () => {
    if (!confirm('Disconnect Google Drive and remove everything stored on this iPad? Nothing in Drive is deleted.')) return;
    auth.signOut();
    await db.wipe().catch(() => {});
    location.reload();
  });

  const est = await navigator.storage?.estimate?.().catch(() => null);
  if (est?.quota) {
    $('#acc-usage', body).textContent = `${plural(packedList.length, 'design')} packed · ${fmtSize(est.usage || 0)} used of ${fmtSize(est.quota)} available to the app`;
    $('#acc-meter', body).style.transform = `scaleX(${Math.min(1, (est.usage || 0) / est.quota)})`;
  }
}

// ---------- welcome ----------
function showWelcome(note = '') {
  const el = $('#welcome');
  el.innerHTML = auth.isConfigured()
    ? `<div class="welcome-inner">
        <h1>Stencil <span>Vault</span></h1>
        <p class="lede">Every draft, tagged and findable. Packed for the road when the convention Wi-Fi dies.</p>
        <button class="btn btn-violet" type="button" data-reconnect>Connect Google Drive</button>
        ${note ? `<p class="fine">${esc(note)}</p>` : ''}
        <hr class="cut">
        <p class="fine">Files stay in your own Google Drive, in a folder called “${esc(CONFIG.folderName)}”. Google will ask for permission to see your Drive. The app only ever looks inside that folder, and only changes files it created itself.</p>
      </div>`
    : `<div class="welcome-inner">
        <h1>Stencil <span>Vault</span></h1>
        <p class="lede">Almost there. Add your Google OAuth client ID to <code>config.js</code>, then reload.</p>
        <p class="fine">Step-by-step instructions are in README.md.</p>
      </div>`;
  el.hidden = false;
}

// ---------- events ----------
function bindUI() {
  $('.search-ico').innerHTML = I.search;
  $('#btn-add').innerHTML = `${I.plus}Add`;
  $('#btn-account').innerHTML = I.user;

  let qTimer;
  $('#q').addEventListener('input', e => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.query = e.target.value; renderGrid(); renderPackbar(); }, 120);
  });

  document.addEventListener('click', e => {
    const t = e.target.closest('button, [data-open]');
    if (!t) return;
    if (t.matches('[data-open]')) return openPanel(t.dataset.open);
    if (t.matches('[data-close]')) return closePanel();
    if (t.matches('#btn-add, [data-add]:not(.chip)')) return openPanel('new');
    if (t.matches('#btn-account')) return openPanel('account');
    if (t.matches('[data-reconnect]')) return auth.signIn({ hint: state.email || undefined });
    if (t.matches('[data-tag]')) {
      const tag = t.dataset.tag;
      state.tags.has(tag) ? state.tags.delete(tag) : state.tags.add(tag);
      return render();
    }
    if (t.matches('[data-packed]')) { state.packedOnly = !state.packedOnly; return render(); }
    if (t.matches('[data-untagged]')) { state.untaggedOnly = !state.untaggedOnly; return render(); }
    if (t.matches('[data-clear]')) {
      state.tags.clear(); state.query = ''; state.packedOnly = state.untaggedOnly = false; $('#q').value = '';
      return render();
    }
    if (t.matches('[data-pack-all]')) {
      try { requireDrive(); packMany(filtered().filter(p => !state.packed.has(p.id))); } catch (err) { handleError(err); }
      return;
    }
    if (t.matches('[data-unpack-all]')) return unpackMany(filtered());
  });

  $('#scrim').addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.panel) closePanel(); });

  window.addEventListener('online', () => { render(); refresh(); });
  window.addEventListener('offline', () => render());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - state.lastSync > 120_000 && state.index) refresh();
  });
}

// ---------- boot ----------
async function boot() {
  const authResult = auth.captureRedirect();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

  const [meta, index, packed] = await Promise.all([
    db.get('meta').catch(() => null),
    db.get('index').catch(() => null),
    db.get('packed').catch(() => null),
  ]);
  Object.assign(state, meta || {});
  state.index = index || null;
  state.packed = new Set(packed || []);

  bindUI();
  render();

  if (!auth.isConfigured()) return showWelcome();

  const declined = authResult && authResult !== 'ok';
  if (!state.index && !auth.getToken()) {
    // A failed silent sign-in just means we need the full prompt.
    const note = declined && !['interaction_required', 'login_required', 'consent_required'].includes(authResult)
      ? `Google sign-in didn’t finish (${authResult}). Try again.` : '';
    return showWelcome(note);
  }
  if (declined) state.status = 'reconnect';
  refresh();
}

boot();
