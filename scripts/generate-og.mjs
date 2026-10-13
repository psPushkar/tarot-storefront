/**
 * Generates public/og.png — the OpenGraph card.
 *
 * Written as a raw PNG encoder rather than pulling in an image library: the
 * artwork is pure geometry (a gilt frame, an ambient glow and the eight-pointed
 * star motif), so a dependency would buy nothing. Run with:
 *
 *   node scripts/generate-og.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;

const CANVAS = [0x0c, 0x0b, 0x0f];
const GOLD = [0xc9, 0xa5, 0x5c];
const GOLD_DIM = [0x9a, 0x7d, 0x42];

const pixels = new Uint8Array(WIDTH * HEIGHT * 3);

function setPixel(x, y, [r, g, b], alpha = 1) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) return;
  const i = (py * WIDTH + px) * 3;
  pixels[i] = Math.round(pixels[i] * (1 - alpha) + r * alpha);
  pixels[i + 1] = Math.round(pixels[i + 1] * (1 - alpha) + g * alpha);
  pixels[i + 2] = Math.round(pixels[i + 2] * (1 - alpha) + b * alpha);
}

// 1. Base canvas with an ambient gilt glow falling from the top edge.
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const dx = (x - WIDTH / 2) / (WIDTH * 0.55);
    const dy = y / (HEIGHT * 0.9);
    const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) ** 2.2 * 0.11;
    const i = (y * WIDTH + x) * 3;
    pixels[i] = Math.round(CANVAS[0] + (GOLD[0] - CANVAS[0]) * glow);
    pixels[i + 1] = Math.round(CANVAS[1] + (GOLD[1] - CANVAS[1]) * glow);
    pixels[i + 2] = Math.round(CANVAS[2] + (GOLD[2] - CANVAS[2]) * glow);
  }
}

// 2. A gilt hairline frame, inset like a plate mark.
const INSET = 40;
for (let x = INSET; x <= WIDTH - INSET; x++) {
  setPixel(x, INSET, GOLD_DIM, 0.55);
  setPixel(x, HEIGHT - INSET, GOLD_DIM, 0.55);
}
for (let y = INSET; y <= HEIGHT - INSET; y++) {
  setPixel(INSET, y, GOLD_DIM, 0.55);
  setPixel(WIDTH - INSET, y, GOLD_DIM, 0.55);
}

// 3. The eight-pointed star, filled by even-odd scanline testing.
const STAR = [
  [12, 0], [13.4, 9.2], [20.5, 3.5], [14.8, 10.6], [24, 12], [14.8, 13.4],
  [20.5, 20.5], [13.4, 14.8], [12, 24], [10.6, 14.8], [3.5, 20.5], [9.2, 13.4],
  [0, 12], [9.2, 10.6], [3.5, 3.5], [10.6, 9.2],
];

function drawStar(cx, cy, size, colour, alpha) {
  const scale = size / 24;
  const points = STAR.map(([px, py]) => [cx + (px - 12) * scale, cy + (py - 12) * scale]);

  const minY = Math.floor(Math.min(...points.map((p) => p[1])));
  const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));

  for (let y = minY; y <= maxY; y++) {
    const crossings = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if (y1 === y2) continue;
      const sampleY = y + 0.5;
      if (sampleY >= Math.min(y1, y2) && sampleY < Math.max(y1, y2)) {
        crossings.push(x1 + ((sampleY - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      for (let x = Math.round(crossings[i]); x < Math.round(crossings[i + 1]); x++) {
        setPixel(x, y, colour, alpha);
      }
    }
  }
}

drawStar(WIDTH / 2, HEIGHT / 2 - 30, 190, GOLD, 0.95);

// 4. A hairline rule beneath the mark, echoing the divider motif.
const RULE_Y = Math.round(HEIGHT / 2 + 130);
for (let x = WIDTH / 2 - 190; x < WIDTH / 2 + 190; x++) {
  const distance = Math.abs(x - WIDTH / 2) / 190;
  setPixel(x, RULE_Y, GOLD_DIM, 0.5 * (1 - distance));
}
drawStar(WIDTH / 2, RULE_Y, 22, GOLD_DIM, 0.75);

/* ── Encode ────────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

// Each scanline is prefixed with filter type 0 (None).
const raw = Buffer.alloc(HEIGHT * (WIDTH * 3 + 1));
const source = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
for (let y = 0; y < HEIGHT; y++) {
  const offset = y * (WIDTH * 3 + 1);
  raw[offset] = 0;
  source.copy(raw, offset + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: truecolour
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`Wrote ${out} (${WIDTH}x${HEIGHT}, ${(png.length / 1024).toFixed(1)} kB)`);
