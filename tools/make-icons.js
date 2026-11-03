// Genera los iconos PNG de la app (compás sobre fondo índigo) sin dependencias.
// Uso: node tools/make-icons.js   → escribe brujula/icons/*.png y los mipmap de Android si existe ../brujula-apk
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Geometría del icono en coordenadas 0..1
const BG = [79, 70, 229], WHITE = [255, 255, 255], MINT = [167, 243, 208];
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function sdRoundRect(px, py, r) { const dx = Math.abs(px - 0.5) - (0.5 - r), dy = Math.abs(py - 0.5) - (0.5 - r); return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r; }
function sdCircle(px, py, cx, cy, r) { return Math.hypot(px - cx, py - cy) - r; }
function sdTri(px, py, ax, ay, bx, by, cx, cy) { // signed distance to triangle
  const seg = (px, py, ax, ay, bx, by) => { const ex = bx - ax, ey = by - ay, wx = px - ax, wy = py - ay; const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey))); return Math.hypot(wx - ex * t, wy - ey * t); };
  const d = Math.min(seg(px, py, ax, ay, bx, by), seg(px, py, bx, by, cx, cy), seg(px, py, cx, cy, ax, ay));
  const s1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax), s2 = (cx - bx) * (py - by) - (cy - by) * (px - bx), s3 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
  const inside = (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
  return inside ? -d : d;
}
function shade(maskable) {
  return (x, y, size) => {
    const px = x / size, py = y / size, aa = 1 / size;
    const cov = (d) => Math.max(0, Math.min(1, 0.5 - d / aa)); // antialias
    let col = BG, alpha = 1;
    if (!maskable) alpha = cov(sdRoundRect(px, py, 0.22));
    // sutil degradado
    col = mix(BG, [99, 102, 241], py);
    const s = maskable ? 0.8 : 1; // zona segura en maskable
    const cx = 0.5, cy = 0.5;
    const ring = Math.abs(sdCircle(px, py, cx, cy, 0.33 * s)) - 0.035 * s;
    col = mix(col, WHITE, cov(ring) * 0.95);
    // aguja: triángulo norte (menta) y sur (blanco)
    const n = sdTri(px, py, cx, cy - 0.26 * s, cx - 0.085 * s, cy, cx + 0.085 * s, cy);
    const so = sdTri(px, py, cx, cy + 0.26 * s, cx - 0.085 * s, cy, cx + 0.085 * s, cy);
    col = mix(col, MINT, cov(n));
    col = mix(col, WHITE, cov(so) * 0.92);
    col = mix(col, BG, cov(sdCircle(px, py, cx, cy, 0.04 * s)));
    return [Math.round(col[0]), Math.round(col[1]), Math.round(col[2]), Math.round(alpha * 255)];
  };
}

const root = path.join(__dirname, '..');
const out = path.join(root, 'icons');
fs.mkdirSync(out, { recursive: true });
for (const s of [180, 192, 512]) fs.writeFileSync(path.join(out, `icon-${s}.png`), png(s, shade(false)));
fs.writeFileSync(path.join(out, 'icon-512-maskable.png'), png(512, shade(true)));
console.log('icons escritos en', out);

// Android (Capacitor): reemplaza los mipmap si el proyecto existe
const res = path.join(root, '..', 'brujula-apk', 'android', 'app', 'src', 'main', 'res');
if (fs.existsSync(res)) {
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(dens)) {
    const dir = path.join(res, `mipmap-${d}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png(s, shade(false)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png(s, shade(true)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), png(Math.round(s * 1.5), shade(true)));
  }
  const colors = path.join(res, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(colors)) fs.writeFileSync(colors, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4F46E5</color>\n</resources>\n');
  console.log('mipmap de Android actualizados');
}
