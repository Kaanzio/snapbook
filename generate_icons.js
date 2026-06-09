/**
 * PWA ikon üretici — 3D interlaced aperture tasarımı
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgSource = `<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bladeGrad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E50914"/>
      <stop offset="100%" stop-color="#8A050C"/>
    </linearGradient>
    <clipPath id="overlapClip">
      <polygon points="50,50 100,50 100,95 75,95" />
    </clipPath>
  </defs>
  <g>
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" transform="rotate(60,50,50)" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" transform="rotate(120,50,50)" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" transform="rotate(180,50,50)" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" transform="rotate(240,50,50)" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" transform="rotate(300,50,50)" fill="url(#bladeGrad)" />
    <path d="M 94,50 A 44,44 0 0,1 28,88 L 50,66 A 16,16 0 0,0 64,58 Z" clip-path="url(#overlapClip)" fill="url(#bladeGrad)" />
  </g>
</svg>`;

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [
  { size: 192, out: path.join(iconsDir, 'icon-192.png') },
  { size: 512, out: path.join(iconsDir, 'icon-512.png') },
  { size: 180, out: path.join(__dirname, 'public', 'icon-180.png') },
];

(async () => {
  for (const { size, out } of sizes) {
    await sharp(Buffer.from(svgSource))
      .resize(size, size)
      .png()
      .toFile(out);
    console.log(`✓ ${path.basename(out)} (${size}×${size})`);
  }
  console.log('\n🎉 PWA ikonları güncellendi!');
})();
