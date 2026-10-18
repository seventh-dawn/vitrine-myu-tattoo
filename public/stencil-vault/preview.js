// Builds a small JPEG preview from a .procreate file (its embedded QuickLook
// thumbnail) or from an image. Returns null for files with no preview (PDF etc).
const MAX_SIDE = 900;

export async function makePreview(file) {
  const name = file.name.toLowerCase();
  let src = null;
  if (name.endsWith('.procreate')) src = await readZipEntry(file, 'QuickLook/Thumbnail.png');
  else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|heic)$/.test(name)) src = file;
  return src ? toJpeg(src) : null;
}

async function toJpeg(blob) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; // transparent Procreate canvases become white paper
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return new Promise((resolve, reject) => {
    c.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode preview'))), 'image/jpeg', 0.85);
  });
}

// A .procreate file is a zip. Read only the central directory and the one entry
// we need, so a 200 MB file never has to be loaded into memory.
async function readZipEntry(file, wanted) {
  const u32 = (v, o) => v.getUint32(o, true);
  const u16 = (v, o) => v.getUint16(o, true);
  const u64 = (v, o) => Number(v.getBigUint64(o, true));

  const tailLen = Math.min(file.size, 65_557 + 20);
  const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (u32(tail, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;

  let cdSize = u32(tail, eocd + 12);
  let cdOff = u32(tail, eocd + 16);
  if (cdSize === 0xffffffff || cdOff === 0xffffffff) {
    const loc = eocd - 20;
    if (loc < 0 || u32(tail, loc) !== 0x07064b50) return null;
    const z64 = u64(tail, loc + 8);
    const z = new DataView(await file.slice(z64, z64 + 56).arrayBuffer());
    if (u32(z, 0) !== 0x06064b50) return null;
    cdSize = u64(z, 40);
    cdOff = u64(z, 48);
  }

  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const decoder = new TextDecoder();
  for (let p = 0; p + 46 <= cd.byteLength && u32(cd, p) === 0x02014b50;) {
    const method = u16(cd, p + 10);
    let csize = u32(cd, p + 20);
    let usize = u32(cd, p + 24);
    const nameLen = u16(cd, p + 28);
    const extraLen = u16(cd, p + 30);
    const commentLen = u16(cd, p + 32);
    let localOff = u32(cd, p + 42);
    const name = decoder.decode(new Uint8Array(cd.buffer, p + 46, nameLen));

    if (name === wanted) {
      if (csize === 0xffffffff || usize === 0xffffffff || localOff === 0xffffffff) {
        for (let x = p + 46 + nameLen, end = x + extraLen; x + 4 <= end; x += 4 + u16(cd, x + 2)) {
          if (u16(cd, x) !== 1) continue;
          let q = x + 4;
          if (usize === 0xffffffff) { usize = u64(cd, q); q += 8; }
          if (csize === 0xffffffff) { csize = u64(cd, q); q += 8; }
          if (localOff === 0xffffffff) localOff = u64(cd, q);
          break;
        }
      }
      const lh = new DataView(await file.slice(localOff, localOff + 30).arrayBuffer());
      if (u32(lh, 0) !== 0x04034b50) return null;
      const start = localOff + 30 + u16(lh, 26) + u16(lh, 28);
      const data = file.slice(start, start + csize);
      if (method === 0) return new Blob([data], { type: 'image/png' });
      if (method === 8) {
        const raw = await new Response(data.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
        return new Blob([raw], { type: 'image/png' });
      }
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
