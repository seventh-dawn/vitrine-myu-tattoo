// Google OAuth via full-page redirect (implicit flow). Popups are unreliable in
// iPad home-screen apps, a redirect always comes back into the app.
import { CONFIG } from './config.js';

// drive.file lets the app write its own files; drive.readonly lets it see files
// she saves straight into the vault folder from the Files or Drive app.
const FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const READ_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const SCOPE = `${FILE_SCOPE} ${READ_SCOPE}`;
const TOKEN_KEY = 'sv.token';
const STATE_KEY = 'sv.oauthState';
const SILENT_KEY = 'sv.silentTried';

function storage(kind) {
  return {
    get(k) { try { return JSON.parse(window[kind].getItem(k)); } catch { return null; } },
    set(k, v) {
      try { window[kind].setItem(k, JSON.stringify(v)); return window[kind].getItem(k) !== null; }
      catch { return false; }
    },
    del(k) { try { window[kind].removeItem(k); } catch { /* storage blocked */ } },
  };
}
const ls = storage('localStorage');
const ss = storage('sessionStorage');

// Always .../index.html: Next.js redirects a trailing-slash URL like /stencil-vault/ away.
export const redirectUri = () => location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html';

// Call once at startup. Returns null (no redirect), 'ok', or an OAuth error code.
export function captureRedirect() {
  const hash = location.hash;
  if (!hash.includes('access_token=') && !hash.includes('error=')) return null;
  const p = new URLSearchParams(hash.slice(1));
  history.replaceState(null, '', redirectUri() + location.search);
  const expected = ls.get(STATE_KEY);
  ls.del(STATE_KEY);
  if (!expected || p.get('state') !== expected) return 'state_mismatch';
  if (p.get('error')) return p.get('error');
  ls.set(TOKEN_KEY, {
    token: p.get('access_token'),
    scope: p.get('scope') || '',
    expires: Date.now() + Number(p.get('expires_in') || 3600) * 1000,
  });
  ss.del(SILENT_KEY);
  return 'ok';
}

export function getToken() {
  const t = ls.get(TOKEN_KEY);
  return t && t.expires - Date.now() > 60_000 ? t.token : null;
}

// False for tokens from before read access was added, or if she unticked it on
// Google's consent screen. Drive still works then, it just can't pick up drops.
export function canScan() {
  const t = ls.get(TOKEN_KEY);
  return !!t?.scope?.split(' ').includes(READ_SCOPE);
}

export function signIn({ silent = false, hint } = {}) {
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  ls.set(STATE_KEY, state);
  const p = new URLSearchParams({
    client_id: CONFIG.clientId,
    redirect_uri: redirectUri(),
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
    state,
  });
  if (hint) p.set('login_hint', hint);
  if (silent) p.set('prompt', 'none');
  location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
}

// Try a no-UI token refresh once per session. Returns true if it navigated away.
export function trySilent(hint) {
  if (ss.get(SILENT_KEY)) return false;
  if (!ss.set(SILENT_KEY, 1)) return false; // can't remember the attempt, so don't risk a loop
  signIn({ silent: true, hint });
  return true;
}

export function clear() { ls.del(TOKEN_KEY); }

export function signOut() {
  const t = ls.get(TOKEN_KEY);
  clear();
  if (t?.token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t.token)}`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
  }
}

export const isConfigured = () => !CONFIG.clientId.startsWith('YOUR_');
