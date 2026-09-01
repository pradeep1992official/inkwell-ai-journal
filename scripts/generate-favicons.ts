import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Lucide Feather icon path geometry normalized for 24x24 viewBox
// <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
// <line x1="16" y1="8" x2="2" y2="22"/>
// <line x1="17.5" y1="15" x2="9" y2="15"/>

function getSvg({ size = 512, padding = 0.12, cornerRadius = 0.22, isMaskable = false }: { size?: number; padding?: number; cornerRadius?: number; isMaskable?: boolean }) {
  const pad = isMaskable ? size * 0.18 : size * padding;
  const iconSize = size - pad * 2;
  const rx = isMaskable ? 0 : size * cornerRadius;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Brand Gradient matching top nav: from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] -->
    <linearGradient id="inkwellGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1A73E8" />
      <stop offset="50%" stop-color="#7B1FA2" />
      <stop offset="100%" stop-color="#E91E63" />
    </linearGradient>
    <linearGradient id="quillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F3E8FF" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${size * 0.015}" stdDeviation="${size * 0.02}" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background Squircle / Rounded Container -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="url(#inkwellGrad)" />
  
  <!-- Subtle Inner Highlight Rim -->
  <rect x="${size * 0.01}" y="${size * 0.01}" width="${size * 0.98}" height="${size * 0.98}" rx="${Math.max(0, rx - size * 0.01)}" fill="none" stroke="#FFFFFF" stroke-width="${size * 0.02}" stroke-opacity="0.25" />

  <!-- Feather Quill Brand Mark (Lucide Feather precisely centered & scaled) -->
  <g transform="translate(${pad}, ${pad}) scale(${iconSize / 24})" filter="url(#subtleShadow)">
    <path 
      d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" 
      fill="none" 
      stroke="url(#quillGrad)" 
      stroke-width="2.2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <line 
      x1="16" y1="8" x2="2" y2="22" 
      stroke="url(#quillGrad)" 
      stroke-width="2.2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
    <line 
      x1="17.5" y1="15" x2="9" y2="15" 
      stroke="url(#quillGrad)" 
      stroke-width="2.2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    />
  </g>
</svg>`;
}

// Function to generate standard .ico file containing multiple PNG images (16x16, 32x32, 48x48)
function createIco(pngBuffers: { width: number; height: number; buffer: Buffer }[]): Buffer {
  // ICO Header: 6 bytes
  // 0-1: Reserved (0)
  // 2-3: Type (1 = ICO)
  // 4-5: Number of images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + (pngBuffers.length * 16);
  const directoryEntries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];

  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);   // Width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // Height
    entry.writeUInt8(0, 2);                                  // Color palette (0 = no palette)
    entry.writeUInt8(0, 3);                                  // Reserved
    entry.writeUInt16LE(1, 4);                               // Color planes
    entry.writeUInt16LE(32, 6);                              // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8);               // Image size in bytes
    entry.writeUInt32LE(offset, 12);                         // Offset of image data
    
    directoryEntries.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...directoryEntries, ...imageBuffers]);
}

async function generateAllFavicons() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating SVG favicon...');
  const svg512 = getSvg({ size: 512, padding: 0.14, cornerRadius: 0.22 });
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg512);

  console.log('Generating PNG favicons & app icons...');
  const sizes = [
    { name: 'favicon-16x16.png', size: 16, pad: 0.10, radius: 0.22 },
    { name: 'favicon-32x32.png', size: 32, pad: 0.12, radius: 0.22 },
    { name: 'favicon.png', size: 32, pad: 0.12, radius: 0.22 },
    { name: 'apple-touch-icon.png', size: 180, pad: 0.14, radius: 0.22 },
    { name: 'apple-touch-icon-precomposed.png', size: 180, pad: 0.14, radius: 0.22 },
    { name: 'icon-192.png', size: 192, pad: 0.14, radius: 0.22 },
    { name: 'icon-512.png', size: 512, pad: 0.14, radius: 0.22 },
    { name: 'icon-maskable-192.png', size: 192, pad: 0.20, isMaskable: true },
    { name: 'icon-maskable-512.png', size: 512, pad: 0.20, isMaskable: true },
  ];

  const pngBuffersForIco: { width: number; height: number; buffer: Buffer }[] = [];

  for (const item of sizes) {
    const svgContent = getSvg({ 
      size: item.size, 
      padding: item.pad, 
      cornerRadius: item.radius ?? 0.22,
      isMaskable: item.isMaskable ?? false
    });
    const buffer = await sharp(Buffer.from(svgContent))
      .resize(item.size, item.size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, item.name), buffer);
    console.log(`✓ Created public/${item.name} (${item.size}x${item.size})`);
  }

  // Generate 16, 32, 48 buffers for favicon.ico
  for (const s of [16, 32, 48]) {
    const svgForIco = getSvg({ size: s, padding: 0.10, cornerRadius: 0.22 });
    const buf = await sharp(Buffer.from(svgForIco))
      .resize(s, s)
      .png()
      .toBuffer();
    pngBuffersForIco.push({ width: s, height: s, buffer: buf });
  }

  const icoBuffer = createIco(pngBuffersForIco);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Created public/favicon.ico');

  console.log('All favicon & PWA icon assets generated successfully!');
}

generateAllFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
