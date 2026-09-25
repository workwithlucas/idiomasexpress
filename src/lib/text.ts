import type { Word } from '../db/schema';

/** Minúsculas, sem acentos, espaços normalizados e apóstrofo tipográfico → reto. */
export function normalize(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe').replace(/[’`]/g, "'")
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Primeira acepção da tradução (antes de ";" ou ","), para encaixar em frases. */
export function primaryPt(w: Word): string {
  return w.pt.split(/[;,]/)[0].trim();
}

/** "je veux ___" + "manger" → "Je veux manger." */
export function fillFrame(template: string, fill: string): string {
  const s = template.replace('___', fill).trim();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.?!]$/.test(cap) ? cap : `${cap}.`;
}

export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/** Primeira letra maiúscula. */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
