#!/usr/bin/env node
// Gera tests/fixtures/voz-sintetica.wav: sinal "tipo voz" (série harmônica),
// ~5 sílabas por segundo e melodia que desce no fim — usado como microfone
// falso do Chromium nos testes E2E da melodia (--use-file-for-fake-audio-capture).
import { writeFileSync, mkdirSync } from 'node:fs';

const sr = 48_000;
const seconds = 2.4;
const n = Math.round(sr * seconds);
const pcm = new Int16Array(n);
let phase = 0;
for (let i = 0; i < n; i++) {
  const t = i / sr;
  const speech = t > 0.3 && t < 2.0; // silêncio antes e depois
  const f0 = 190 + 15 * Math.sin(2 * Math.PI * 0.8 * t) - (t > 1.5 ? 70 * (t - 1.5) : 0);
  phase += (2 * Math.PI * f0) / sr;
  let v = 0;
  for (let h = 1; h <= 10; h++) v += Math.sin(h * phase) / h;
  const syll = 0.55 + 0.45 * Math.sin(2 * Math.PI * 5 * (t - 0.3)); // ritmo silábico
  pcm[i] = speech ? Math.round(v * syll * 0.25 * 32767 * 0.5) : 0;
}
const data = Buffer.from(pcm.buffer);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sr, 24);
header.writeUInt32LE(sr * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
mkdirSync('tests/fixtures', { recursive: true });
writeFileSync('tests/fixtures/voz-sintetica.wav', Buffer.concat([header, data]));
console.log('✔ tests/fixtures/voz-sintetica.wav');
