const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="8" fill="#e60000"/>
  <circle cx="16" cy="16" r="6" stroke="#ffffff" strokeWidth="2.5"/>
  <circle cx="25" cy="8" r="2" fill="#ffffff"/>
  <circle cx="25" cy="16" r="2" fill="#e60000"/>
</svg>
`;

const sizes = [96, 180, 192, 512];
const outDir = path.join(__dirname, 'public');

async function generate() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Generate SVG icon
  fs.writeFileSync(path.join(outDir, 'icon.svg'), svg);

  // Generate PNGs
  const buffer = Buffer.from(svg);
  for (const size of sizes) {
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generate().catch(console.error);
