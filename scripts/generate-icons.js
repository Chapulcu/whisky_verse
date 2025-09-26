#!/usr/bin/env node

/**
 * WhiskyVerse App Icon Generator
 * Generates all required PWA icons in different sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Shortcut icons
const shortcutIcons = [
  { name: 'collection-icon.png', emoji: '📚', size: 96 },
  { name: 'discover-icon.png', emoji: '🔍', size: 96 },
  { name: 'camera-icon.png', emoji: '📷', size: 96 }
];

// Create SVG icon template
function createSVGIcon(size, emoji = '🥃') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${(size-8)/2}" fill="url(#bg-gradient)" filter="url(#shadow)"/>

  <!-- Inner Circle for contrast -->
  <circle cx="${size/2}" cy="${size/2}" r="${(size-16)/2}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>

  <!-- Emoji Icon -->
  <text x="${size/2}" y="${size/2 + size*0.1}" font-size="${size*0.4}" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>

  <!-- App Name (for larger icons) -->
  ${size >= 192 ? `<text x="${size/2}" y="${size - 20}" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-weight="bold">WhiskyVerse</text>` : ''}
</svg>`;
}

// Create maskable version with safe area
function createMaskableSVGIcon(size, emoji = '🥃') {
  const safeArea = size * 0.8; // 80% safe area for maskable icons
  const centerOffset = (size - safeArea) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Full background for maskable -->
  <rect width="${size}" height="${size}" fill="url(#bg-gradient)"/>

  <!-- Safe area circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${safeArea/2}" fill="rgba(255,255,255,0.1)"/>

  <!-- Emoji Icon in safe area -->
  <text x="${size/2}" y="${size/2 + safeArea*0.05}" font-size="${safeArea*0.35}" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>
</svg>`;
}

// Convert SVG to different formats (simplified base64 data URI)
function svgToDataUri(svgContent) {
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

// Create directories
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating WhiskyVerse App Icons...\n');

// Generate main app icons
iconSizes.forEach(({ size, name }) => {
  console.log(`📱 Creating ${name} (${size}x${size})`);

  // Create both regular and maskable versions
  const regularSvg = createSVGIcon(size);
  const maskableSvg = createMaskableSVGIcon(size);

  // For now, we'll create SVG files (in production, you'd convert to PNG)
  const svgName = name.replace('.png', '.svg');
  const maskableSvgName = name.replace('.png', '-maskable.svg');

  fs.writeFileSync(path.join(iconsDir, svgName), regularSvg);
  fs.writeFileSync(path.join(iconsDir, maskableSvgName), maskableSvg);

  console.log(`  ✅ Created ${svgName} and ${maskableSvgName}`);
});

// Generate shortcut icons
console.log('\n🔗 Creating shortcut icons...');
shortcutIcons.forEach(({ name, emoji, size }) => {
  console.log(`🎯 Creating ${name}`);

  const svg = createSVGIcon(size, emoji);
  const svgName = name.replace('.png', '.svg');

  fs.writeFileSync(path.join(iconsDir, svgName), svg);
  console.log(`  ✅ Created ${svgName}`);
});

// Generate favicon
console.log('\n🔖 Creating favicon...');
const faviconSvg = createSVGIcon(32, '🥃');
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), faviconSvg);

// Create Apple Touch Icon
const appleTouchIcon = createSVGIcon(180, '🥃');
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);

// Create a simple HTML preview file
const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhiskyVerse Icons Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 40px;
            background: #f5f5f5;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .icon-item {
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon-item img {
            display: block;
            margin: 0 auto 10px;
            border-radius: 8px;
        }
        h1 { color: #d97706; }
        h2 { color: #92400e; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>🥃 WhiskyVerse Icons Preview</h1>

    <h2>📱 Main App Icons</h2>
    <div class="icon-grid">
        ${iconSizes.map(({ size, name }) => `
            <div class="icon-item">
                <img src="icons/${name.replace('.png', '.svg')}" width="${Math.min(size, 96)}" height="${Math.min(size, 96)}" alt="${name}">
                <div><strong>${size}×${size}</strong></div>
                <div>${name}</div>
            </div>
        `).join('')}
    </div>

    <h2>🔗 Shortcut Icons</h2>
    <div class="icon-grid">
        ${shortcutIcons.map(({ name, emoji, size }) => `
            <div class="icon-item">
                <img src="icons/${name.replace('.png', '.svg')}" width="64" height="64" alt="${name}">
                <div><strong>${emoji} ${size}×${size}</strong></div>
                <div>${name}</div>
            </div>
        `).join('')}
    </div>

    <h2>🔖 Special Icons</h2>
    <div class="icon-grid">
        <div class="icon-item">
            <img src="favicon.svg" width="32" height="32" alt="favicon">
            <div><strong>Favicon</strong></div>
            <div>32×32</div>
        </div>
        <div class="icon-item">
            <img src="icons/apple-touch-icon.svg" width="64" height="64" alt="apple-touch-icon">
            <div><strong>Apple Touch</strong></div>
            <div>180×180</div>
        </div>
    </div>

    <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 12px;">
        <h3>📋 Next Steps:</h3>
        <ol>
            <li>Convert SVG files to PNG using a tool like ImageMagick or online converter</li>
            <li>Optimize PNG files for smaller file sizes</li>
            <li>Update manifest.json to point to PNG files</li>
            <li>Test PWA installation on different devices</li>
            <li>Submit to app stores</li>
        </ol>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../public/icon-preview.html'), previewHtml);

console.log('\n🎉 Icon generation completed!');
console.log('\n📋 Generated files:');
console.log(`  📁 Icons: ${iconSizes.length * 2 + shortcutIcons.length + 2} files`);
console.log(`  🌐 Preview: http://localhost:5173/icon-preview.html`);
console.log('\n💡 Note: SVG files generated. Convert to PNG for production use.');
console.log('🔧 Use tools like ImageMagick: magick input.svg -resize 192x192 output.png');