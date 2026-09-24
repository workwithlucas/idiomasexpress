#!/usr/bin/env node
// Gera os ícones PNG do PWA a partir de public/favicon.svg usando o Chromium
// do Playwright. Rode só quando o ícone mudar: npm run icons
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/favicon.svg', 'utf8');

const targets = [
  { file: 'public/icons/icon-192.png', size: 192, pad: 0, bg: 'transparent' },
  { file: 'public/icons/icon-512.png', size: 512, pad: 0, bg: 'transparent' },
  // Maskable: conteúdo dentro da "safe zone" (80%) e fundo sólido.
  { file: 'public/icons/icon-maskable-512.png', size: 512, pad: 0.12, bg: '#1d2a4d' },
  { file: 'public/apple-touch-icon.png', size: 180, pad: 0.06, bg: '#1d2a4d' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:${t.bg};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: t.file, omitBackground: t.bg === 'transparent' });
  console.log('✔', t.file);
}
await browser.close();
