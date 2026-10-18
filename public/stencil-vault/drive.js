// Thin Google Drive v3 client. Writes only ever touch files the app created
// (drive.file); read access is used to list the vault folder.
import { getToken } from './auth.js';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
export const FOLDER = 'application/vnd.google-apps.folder';
const SMALL = 4 * 1024 * 1024;

export class AuthError extends Error {
  constructor() { super('Google Drive session expired'); this.name = 'AuthError'; }
}
// The app may read the file but not change it (she put it in Drive herself).
export class Forbidden extends Error {
  constructor() { super('Stencil Vault can’t change this file in Google Drive'); this.name = 'Forbidden'; }
}
export class NotFound extends Error {
  constructor() { super('Not found in Google Drive'); this.name = 'NotFound'; }
}

async function call(url, opts = {}) {
  const token = getToken();
  if (!token) throw new AuthError();
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...opts.headers } });
  if (res.status === 401) throw new AuthError();
  if (res.status === 404) throw new NotFound();
  if (!res.ok) {
    let msg = res.statusText;
    let reason = '';
    try { const e = (await res.json()).error; msg = e.message; reason = e.errors?.[0]?.reason || ''; } catch { /* keep statusText */ }
    if (res.status === 403 && !/ratelimit/i.test(reason)) throw new Forbidden();
    throw new Error(`Google Drive: ${msg}`);
  }
  return res;
}
const json = r => r.json();
const jsonHeaders = { 'Content-Type': 'application/json; charset=UTF-8' };

export async function about() {
  const a = await call(`${API}/about?fields=user(emailAddress)`).then(json);
  return a.user;
}

async function findOne(q) {
  const p = new URLSearchParams({ q, fields: 'files(id,name)', spaces: 'drive', pageSize: '1' });
  const r = await call(`${API}/files?${p}`).then(json);
  return r.files[0] || null;
}

const LIST_FIELDS = 'nextPageToken,files(id,name,mimeType,size,parents,appProperties,createdTime)';

// Everything directly inside the given folders, across all pages.
export async function listChildren(parentIds) {
  const out = [];
  for (let i = 0; i < parentIds.length; i += 40) {
    const parents = parentIds.slice(i, i + 40).map(id => `'${id}' in parents`).join(' or ');
    let pageToken = '';
    do {
      const p = new URLSearchParams({ q: `(${parents}) and trashed=false`, fields: LIST_FIELDS, spaces: 'drive', pageSize: '1000' });
      if (pageToken) p.set('pageToken', pageToken);
      const r = await call(`${API}/files?${p}`).then(json);
      out.push(...r.files);
      pageToken = r.nextPageToken;
    } while (pageToken);
  }
  return out;
}

export async function findOrCreateChild(parentId, role, name) {
  const hit = await findOne(`appProperties has { key='stencilVault' and value='${role}' } and '${parentId}' in parents and trashed=false`);
  return hit || createFolder(name, parentId, { stencilVault: role });
}

export function createFolder(name, parent, appProperties) {
  return call(`${API}/files?fields=id`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name, mimeType: FOLDER, parents: parent ? [parent] : undefined, appProperties }),
  }).then(json);
}

export async function findOrCreateVault(folderName) {
  let folder = await findOne("appProperties has { key='stencilVault' and value='root' } and trashed=false");
  if (!folder) folder = await createFolder(folderName, null, { stencilVault: 'root' });
  let index = await findOne(`appProperties has { key='stencilVault' and value='index' } and '${folder.id}' in parents and trashed=false`);
  if (!index) {
    const blob = new Blob([JSON.stringify({ version: 1, projects: [] })], { type: 'application/json' });
    index = await uploadMultipart(blob, {
      name: 'stencil-vault-index.json',
      parents: [folder.id],
      appProperties: { stencilVault: 'index' },
    });
  }
  return { folderId: folder.id, indexFileId: index.id };
}

function uploadMultipart(blob, meta) {
  const boundary = `sv${Math.random().toString(36).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
    `--${boundary}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ]);
  return call(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  }).then(json);
}

// Uploads a file, reporting bytes sent. Large files use a resumable session.
export async function upload(blob, meta, onProgress) {
  if (blob.size < SMALL) {
    const r = await uploadMultipart(blob, meta);
    onProgress?.(blob.size);
    return r;
  }
  const init = await call(`${UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: 'POST',
    headers: { ...jsonHeaders, 'X-Upload-Content-Type': blob.type || 'application/octet-stream' },
    body: JSON.stringify(meta),
  });
  const location = init.headers.get('Location');
  if (!location) throw new Error('Google Drive did not start the upload');
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('PUT', location);
    x.responseType = 'json';
    x.upload.onprogress = e => onProgress?.(e.loaded);
    x.onload = () => (x.status < 300 ? resolve(x.response) : reject(new Error(`Upload failed (${x.status})`)));
    x.onerror = () => reject(new Error('Network error during upload'));
    x.send(blob);
  });
}

// Downloads file content as a Blob, reporting (loaded, total).
export function download(id, onProgress) {
  const token = getToken();
  if (!token) return Promise.reject(new AuthError());
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('GET', `${API}/files/${encodeURIComponent(id)}?alt=media`);
    x.setRequestHeader('Authorization', `Bearer ${token}`);
    x.responseType = 'blob';
    x.onprogress = e => onProgress?.(e.loaded, e.lengthComputable ? e.total : 0);
    x.onload = () => {
      if (x.status === 200) resolve(x.response);
      else if (x.status === 401) reject(new AuthError());
      else if (x.status === 404) reject(new NotFound());
      else reject(new Error(`Download failed (${x.status})`));
    };
    x.onerror = () => reject(new Error('Network error during download'));
    x.send();
  });
}

// A File-like view of a Drive file that reads byte ranges on demand, so the
// thumbnail can be pulled out of a 200 MB .procreate without downloading it.
export function remoteFile({ id, name, size, mimeType }) {
  const range = (a, b) => call(`${API}/files/${encodeURIComponent(id)}?alt=media`, { headers: { Range: `bytes=${a}-${b - 1}` } });
  return {
    name,
    size,
    type: mimeType || '',
    slice(a = 0, b = size) {
      b = Math.min(b, size);
      return {
        async arrayBuffer() {
          if (b <= a) return new ArrayBuffer(0);
          const r = await range(a, b);
          const buf = await r.arrayBuffer();
          return r.status === 206 ? buf : buf.slice(a, b);
        },
        stream() {
          const ts = new TransformStream();
          range(a, b).then(r => r.body.pipeTo(ts.writable)).catch(e => ts.writable.abort(e).catch(() => {}));
          return ts.readable;
        },
      };
    },
  };
}

export function readJson(id) {
  return call(`${API}/files/${encodeURIComponent(id)}?alt=media`, { cache: 'no-store' }).then(json);
}

export function writeJson(id, data) {
  return call(`${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=media`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });
}

export function rename(id, name) {
  return call(`${API}/files/${encodeURIComponent(id)}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ name }) });
}

// Moves to Drive trash (recoverable for 30 days) rather than deleting.
export function trash(id) {
  return call(`${API}/files/${encodeURIComponent(id)}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ trashed: true }) });
}
