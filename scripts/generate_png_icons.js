import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b) {
  // Minimal PNG generator using Node zlib
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 2; // RGB color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // calculate CRC
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc >>> 0, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // Raw image data with scanlines: filter byte (0) + RGB pixels
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Draw a subtle mountain silhouette gradient
      const cy = y / height;
      const cx = x / width;
      // mountain peak in center:
      const peakY = 0.4 + Math.abs(cx - 0.5) * 0.8;
      if (cy > peakY) {
        // mountain color #1e293b
        rawData[pxOffset] = 30;
        rawData[pxOffset + 1] = 41;
        rawData[pxOffset + 2] = 59;
      } else {
        // Sky gradient teal #0f766e to #14b8a6
        const skyR = Math.round(15 + cy * 10);
        const skyG = Math.round(118 + cy * 40);
        const skyB = Math.round(110 + cy * 30);
        rawData[pxOffset] = skyR;
        rawData[pxOffset + 1] = skyG;
        rawData[pxOffset + 2] = skyB;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSolidPNG(192, 192, 15, 118, 110));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSolidPNG(512, 512, 15, 118, 110));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSolidPNG(512, 512, 15, 118, 110));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPNG(180, 180, 15, 118, 110));

console.log('PNG Icons successfully generated in /public!');
