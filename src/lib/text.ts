import type { Word } from '../db/schema';

/** Minúsculas, sem acentos, espaços normalizados e apóstrofo tipográfico → reto. */
export function normalize(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe').replace(/[’`]/g, "'")
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

const VOWEL_START = /^[aeiouyhâàäéèêëîïôöûùüœ]/i;

/** Forma de dicionário com artigo: "la banque", "l'école", "les parents". */
export function withArticle(w: Word): string {
  if (!w.gender) return w.fr;
  if (w.gender === 'mpl' || w.gender === 'fpl') return `les ${w.fr}`;
  if (VOWEL_START.test(w.fr)) return `l'${w.fr}`;
  return `${w.gender === 'm' ? 'le' : 'la'} ${w.fr}`;
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

export function pickRandom<T>(list: readonly T[], avoid?: T): T {
  if (list.length > 1 && avoid !== undefined) {
    const filtered = list.filter((x) => x !== avoid);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return list[Math.floor(Math.random() * list.length)];
}

export const THEME_LABELS: Record<string, string> = {
  essenciais: 'Essenciais',
  verbos: 'Verbos',
  cotidiano: 'Cotidiano',
  tempo: 'Tempo',
  pessoas: 'Pessoas',
  lugares: 'Lugares',
  numeros: 'Números',
  casa: 'Casa',
  trabalho: 'Trabalho',
  creche: 'Creche',
  banco: 'Banco',
  saude: 'Saúde',
  compras: 'Compras',
  transporte: 'Transporte',
  administracao: 'Administração',
  descricao: 'Descrição',
  sentimentos: 'Sentimentos',
};
