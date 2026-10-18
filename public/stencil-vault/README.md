# Stencil Vault

A web app for the iPad that stores Procreate stencil drafts in Google Drive. Each design can be tagged and searched, and designs can be "packed" onto the iPad before a convention so they open without Wi-Fi.

- **Storage:** her own Google Drive, in a folder called `Stencil Vault`. She can add designs in the app, or save files straight into that folder from Procreate or the Files app and they show up on the next sync.
- **Permissions:** `drive.file` (create and change the app's own files) plus `drive.readonly` (see files she saves into the folder herself). Google has no folder-level permission, so the consent screen says the app can *see* her whole Drive. The code only ever lists the `Stencil Vault` folder and never changes a file it didn't create.
- **No server and no database.** The app is a set of static files. Tags and notes are kept in `stencil-vault-index.json` inside the Drive folder.
- **Offline:** the app itself is cached by a service worker. Packed designs are stored in the iPad's IndexedDB.

## One-time setup (about 15 minutes)

### 1. Host it (free)

Any static host works. Two easy options:

- **Cloudflare Pages:** Workers & Pages → Create → Pages → Upload assets → drag this folder in. You get a URL like `https://stencil-vault.pages.dev`.
- **GitHub Pages:** push this folder to a repo, then Settings → Pages → deploy from the `main` branch.

It has to be served over HTTPS (both options do this). Use `http://localhost` for local testing.

### 2. Create the Google OAuth client

1. Go to https://console.cloud.google.com/ and create a project (e.g. "Stencil Vault").
2. **APIs & Services → Library**: enable the **Google Drive API**.
3. **APIs & Services → OAuth consent screen** (also called "Google Auth Platform"):
   - User type: **External**. App name: Stencil Vault. Fill in your email where it's asked for.
   - Scopes: add `.../auth/drive.file` and `.../auth/drive.readonly`.
   - Audience: leave the app in **Testing** and add her Google account (and yours) as **test users**. `drive.readonly` is a "restricted" scope, so publishing would need a Google security review. In Testing mode it works for test users. She sees a "Google hasn't verified this app" screen when she connects: tap **Continue**, and make sure the Drive box is ticked.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised JavaScript origins: `https://encre-de-lune.art` (no trailing slash), plus `http://localhost:8080` for testing
   - Authorised redirect URIs: `https://encre-de-lune.art/stencil-vault/index.html`, plus `http://localhost:8080/index.html`
5. Copy the client ID into `config.js`, then deploy again.

### 3. Install it on her iPad

Open the URL in **Safari** → Share → **Add to Home Screen** → open it from the icon → **Connect Google Drive**.

## How she uses it

| Task | How |
|---|---|
| Add a design | **Either** in Procreate: Share → Procreate → Save to Files → Google Drive → `Stencil Vault`. It appears in the app on the next sync as an untagged design. **Or** in the app: **Add** → pick the `.procreate` plus the stencil PNG/PDF → add tags → **Upload to Drive**. Either way the thumbnail is taken from the Procreate file automatically. |
| Files saved straight into Drive | Loose files in `Stencil Vault` are grouped by name: `dragon.procreate` and `dragon-stencil.png` become one design. A sub-folder she makes becomes one design with all its files. A file saved into an existing design's folder is added to that design. Files deleted in Drive drop out of the app. |
| Tag new arrivals | Tap the **Untagged** chip to see everything that still needs tags. |
| Find one | Search box (matches title, tags, notes and file names) or tap tag chips. Tags combine, e.g. `#flash` + `#traditional`. |
| Open it in Procreate | Open the design → **Open in…** → Procreate. If the file isn't packed, the first tap downloads it and a second tap on **Ready** opens it, because iPadOS only shows the share sheet straight from a tap. |
| Pack for a convention | Filter by tags (e.g. `#flash`) → **Pack for offline**. Or use the **Keep on this iPad** switch on a single design. Packed designs get a violet stamp. Use the **On this iPad** chip to see only packed designs. |
| Clean up afterwards | **Unpack these** on a filter, or Account → **Unpack everything**. Nothing is deleted from Drive. |

## Good to know

- **Sign-in lasts about an hour.** The app quietly renews it when it can. If not, a **Reconnect** banner appears. Packed designs keep working offline either way.
- **Files she saved into Drive herself are read-only to the app.** Removing such a design or file in the app takes it out of Stencil Vault, but the file stays in Drive. Delete it in the Drive app if she wants it gone. Files added *through* the app go to the Drive trash as before. If that gets annoying, switching `drive.readonly` to the full `drive` scope in `auth.js` lets the app trash them too.
- **Thumbnails for dropped files** go in a `_thumbnails` folder inside `Stencil Vault`. They're read straight out of the `.procreate` file without downloading the whole thing.
- **Connected before this update?** A banner asks her to tap **Allow** once to grant the new read access.
- **Use the home-screen app at the convention, not a Safari tab.** iPadOS keeps the home-screen app's storage separate from Safari's and doesn't clear it automatically. Open it once on venue Wi-Fi beforehand and check that the stamps are there.
- **Large files:** `.procreate` files of 100–300 MB work, but packing a big set takes a while. Do it at home.
- **After editing the code,** bump `VERSION` in `sw.js` so installed copies pick up the new version.

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css` | Page structure and styling |
| `app.js` | UI, filtering, packing, upload flows |
| `auth.js` | Google sign-in (redirect flow, works in home-screen apps) |
| `drive.js` | Google Drive API calls (resumable uploads for big files) |
| `store.js` | IndexedDB storage for offline files and thumbnails |
| `preview.js` | Pulls the thumbnail out of `.procreate` files without loading the whole file |
| `sw.js` | Offline caching of the app itself |
| `config.js` | Your OAuth client ID |
