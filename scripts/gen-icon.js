#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  BHB Live — Icon Generator
//  Creates build/icon.png (1024x1024) from scratch using Canvas.
//  electron-builder converts it to .icns (Mac) and .ico (Win).
//
//  Run: node scripts/gen-icon.js
// ═══════════════════════════════════════════════════════════════

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const OUT  = path.join(__dirname, '..', 'build', 'icon.png');

function generateIcon() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext('2d');

  // Background — dark rounded square
  const R = 180; // corner radius
  ctx.fillStyle = '#0d0d0d';
  roundRect(ctx, 0, 0, SIZE, SIZE, R);
  ctx.fill();

  // Yellow glow ring
  const grd = ctx.createRadialGradient(SIZE/2, SIZE/2, 120, SIZE/2, SIZE/2, 480);
  grd.addColorStop(0, 'rgba(245,208,0,0.18)');
  grd.addColorStop(1, 'rgba(245,208,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Big head circle (body)
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(SIZE/2, SIZE/2 + 40, 320, 0, Math.PI * 2);
  ctx.fill();

  // Head highlight
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(SIZE/2 - 60, SIZE/2 - 60, 80, 0, Math.PI * 2);
  ctx.fill();

  // Yellow accent eye left
  ctx.fillStyle = '#f5d000';
  ctx.beginPath();
  ctx.ellipse(SIZE/2 - 90, SIZE/2 + 10, 52, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.arc(SIZE/2 - 90, SIZE/2 + 10, 22, 0, Math.PI * 2);
  ctx.fill();

  // Yellow accent eye right
  ctx.fillStyle = '#f5d000';
  ctx.beginPath();
  ctx.ellipse(SIZE/2 + 90, SIZE/2 + 10, 52, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.arc(SIZE/2 + 90, SIZE/2 + 10, 22, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#f5d000';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(SIZE/2, SIZE/2 + 20, 140, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // "LIVE" text badge at bottom
  ctx.fillStyle = '#f5d000';
  roundRect(ctx, SIZE/2 - 100, SIZE - 160, 200, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#0d0d0d';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIVE', SIZE/2, SIZE - 132);

  // Save
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(OUT, buf);
  console.log(`✓ Icon written to ${OUT} (${SIZE}×${SIZE})`);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,       x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h,   x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h,       x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,           x + r, y);
  ctx.closePath();
}

try {
  generateIcon();
} catch (e) {
  console.error('Icon generation failed:', e.message);
  console.log('→ If "canvas" is not installed, run:  npm install canvas');
  console.log('→ Or manually place a 1024×1024 PNG at build/icon.png');
  process.exit(1);
}
