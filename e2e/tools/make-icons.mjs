// Génère les icônes PNG de l'application installable à partir de frontend/public/icon.svg.
// Usage : node tools/make-icons.mjs   (depuis e2e/, avec Chrome installé)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'public');
const svg = readFileSync(join(publicDir, 'icon.svg'), 'utf8');

const browser = await chromium.launch({ channel: 'chrome' });
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(publicDir, `icon-${size}.png`) });
  await page.close();
}
await browser.close();
console.log('icônes générées');
