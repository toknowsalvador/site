// Converts selected images from public/ to optimized WebP in plan/assets/.
// Usage: npm install --no-save --no-package-lock sharp@0.33.5 && node tools/optimize-images.mjs public/a.jpeg:hero public/b.png:about:900
// Optional third part = max width in px (default 1600); use ~900 for portrait photos shown narrow.
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const pairs = process.argv.slice(2);
if (pairs.length === 0) {
  console.error('usage: node tools/optimize-images.mjs <src>:<name>[:<maxWidth>] [...]');
  process.exit(2);
}
mkdirSync('plan/assets', { recursive: true });
for (const pair of pairs) {
  const [src, name, maxWidth = '1600'] = pair.split(':');
  const out = `plan/assets/${name}.webp`;
  const info = await sharp(src).rotate().resize({ width: Number(maxWidth), withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
