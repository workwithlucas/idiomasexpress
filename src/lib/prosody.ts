import type { PitchFrame } from './pitch';
import type { NativeTiming } from './tts';

/**
 * Melodia (entonação) e ritmo da frase.
 *
 * Por que o alvo é MODELADO: a Web Speech API toca a voz nativa direto no
 * alto-falante e não entrega as amostras de áudio — não há como medir o pitch
 * dela. O alvo segue a entonação padrão do francês, que é bem regular:
 *  - sílabas praticamente iguais em duração (língua "silábica");
 *  - a ÚLTIMA sílaba de cada grupo é mais longa e carrega a subida da voz;
 *  - frase afirmativa termina descendo; pergunta de sim/não termina subindo;
 *  - pergunta com où/quand/comment… começa alta e termina descendo.
 * Quando a voz nativa informa o início de cada palavra (eventos "boundary"),
 * o ritmo do alvo usa esses tempos reais em vez do modelo.
 */

export interface ContourPoint {
  /** Tempo normalizado 0–1. */
  t: number;
  /** Semitons relativos à mediana da própria voz (compara vozes graves e agudas). */
  st: number;
}

export interface TargetContour {
  points: ContourPoint[];
  /** Centro de cada sílaba (0–1). */
  syllables: number[];
  finalMove: 'rise' | 'fall';
  /** Duração esperada em segundos. */
  duration: number;
  /** "native" = ritmo medido da voz nativa; "model" = estimado. */
  timing: 'native' | 'model';
}

export interface UserContour {
  segments: ContourPoint[][];
  /** Picos de energia ≈ sílabas (0–1). */
  nuclei: number[];
  duration: number;
}

const VOWELS = 'aeiouyàâäéèêëîïôöùûüœæ';
const VOWEL_GROUP = new RegExp(`[${VOWELS}]+`, 'g');
const WH_WORDS = /^(où|quand|comment|pourquoi|combien|quel|quelle|quels|quelles|qui|que|qu'est)/i;

/** Contagem aproximada de sílabas faladas de uma palavra francesa escrita. */
export function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüœæç'-]/g, '');
  w = w.split(/['’]/).pop() ?? w; // "c'est" → "est"
  if (!new RegExp(`[${VOWELS}]`).test(w)) return 0;
  // E mudo final ("porte", "heures") não forma sílaba — exceto monossílabos (je, le, que).
  if (w.length > 3) w = w.replace(/([^aeiouyéèê])e?s?$/, (m, c: string) => (/e/.test(m) ? c : m));
  const groups = w.match(VOWEL_GROUP)?.length ?? 0;
  return Math.max(1, groups);
}

interface Syl {
  weight: number; // duração relativa
  groupEnd: boolean;
  groupIndex: number;
  indexInGroup: number;
  groupSize: number;
}

export function targetContour(text: string, native?: NativeTiming): TargetContour {
  const clean = text.trim();
  const words = clean.split(/\s+/).filter((w) => countSyllables(w) > 0 || /[a-z]/i.test(w));
  const isQuestion = /\?\s*$/.test(clean);
  const isWh = isQuestion && WH_WORDS.test(clean);
  const isExclaim = /!\s*$/.test(clean);

  // Grupos rítmicos: pontuação interna, e grupos longos (> 7 sílabas) partidos ao meio.
  const counts = words.map(countSyllables);
  const groups: number[][] = [[]];
  words.forEach((w, i) => {
    groups[groups.length - 1].push(i);
    if (/[,;:]$/.test(w) && i < words.length - 1) groups.push([]);
  });
  const split: number[][] = [];
  for (const g of groups) {
    const total = g.reduce((s, i) => s + counts[i], 0);
    if (total > 7 && g.length > 1) {
      let acc = 0;
      const cut = g.findIndex((i) => (acc += counts[i]) >= total / 2);
      split.push(g.slice(0, cut + 1), g.slice(cut + 1));
    } else split.push(g);
  }
  const rhythmGroups = split.filter((g) => g.length);

  // Sílabas com peso de duração (a última de cada grupo alonga ~1,7×).
  const syls: Syl[] = [];
  const sylWord: number[] = [];
  rhythmGroups.forEach((g, gi) => {
    const size = g.reduce((s, i) => s + counts[i], 0);
    let k = 0;
    for (const wi of g) {
      for (let s = 0; s < counts[wi]; s++, k++) {
        const groupEnd = k === size - 1;
        syls.push({ weight: groupEnd ? 1.7 : 1, groupEnd, groupIndex: gi, indexInGroup: k, groupSize: size });
        sylWord.push(wi);
      }
    }
  });
  if (!syls.length) return { points: [], syllables: [], finalMove: 'fall', duration: 0, timing: 'model' };

  // Tempos: medidos (boundary da voz nativa) ou modelados.
  let starts: number[] = [];
  let ends: number[] = [];
  let duration: number;
  let timing: TargetContour['timing'] = 'model';
  const wordTimes = native && native.duration > 0 ? alignWords(clean, words, native) : null;
  if (wordTimes) {
    timing = 'native';
    duration = native!.duration;
    for (let i = 0; i < syls.length; i++) {
      const wi = sylWord[i];
      const [ws, we] = wordTimes[wi];
      const inWord = syls.map((_, j) => j).filter((j) => sylWord[j] === wi);
      const total = inWord.reduce((s, j) => s + syls[j].weight, 0);
      const before = inWord.filter((j) => j < i).reduce((s, j) => s + syls[j].weight, 0);
      starts[i] = ws + ((we - ws) * before) / total;
      ends[i] = starts[i] + ((we - ws) * syls[i].weight) / total;
    }
  } else {
    const pause = 0.6;
    let t = 0;
    for (let i = 0; i < syls.length; i++) {
      starts[i] = t;
      t += syls[i].weight;
      ends[i] = t;
      if (syls[i].groupEnd && i < syls.length - 1) t += pause;
    }
    duration = syls.length / 5; // ~5 sílabas/s: fala clara, sem pressa
    const total = t;
    starts = starts.map((s) => s / total);
    ends = ends.map((e) => e / total);
  }
  if (timing === 'native') {
    starts = starts.map((s) => s / duration);
    ends = ends.map((e) => e / duration);
  }

  // Altura por sílaba (semitons).
  const lastGroup = rhythmGroups.length - 1;
  const points: ContourPoint[] = [];
  syls.forEach((s, i) => {
    const frac = s.groupSize > 1 ? s.indexInGroup / (s.groupSize - 1) : 1;
    const finalGroup = s.groupIndex === lastGroup;
    let from: number;
    let to: number;
    if (!finalGroup) {
      from = -0.5 + frac * 1.5;
      to = s.groupEnd ? from + 3.5 : from; // subida de continuação
    } else if (isWh || isExclaim) {
      from = 3 - frac * 3;
      to = s.groupEnd ? from - 4 : from;
    } else if (isQuestion) {
      from = 0.5 + frac * 0.5;
      to = s.groupEnd ? from + 5.5 : from; // pergunta de sim/não: sobe no fim
    } else {
      from = 1.5 - frac * 1.5; // declinação suave
      to = s.groupEnd ? from - 4 : from; // afirmativa: desce no fim
    }
    points.push({ t: starts[i], st: from }, { t: ends[i], st: to });
  });
  const med = median(points.map((p) => p.st));
  return {
    points: points.map((p) => ({ t: p.t, st: p.st - med })),
    syllables: starts.map((s, i) => (s + ends[i]) / 2),
    finalMove: isQuestion && !isWh ? 'rise' : 'fall',
    duration,
    timing,
  };
}

/** Início/fim de cada palavra a partir dos eventos "boundary" da voz nativa. */
function alignWords(text: string, words: string[], native: NativeTiming): [number, number][] | null {
  if (native.wordStarts.length < Math.max(1, Math.ceil(words.length * 0.6))) return null;
  // Posição de cada palavra no texto → boundary mais próximo.
  const positions: number[] = [];
  let from = 0;
  for (const w of words) {
    const at = text.indexOf(w, from);
    positions.push(at < 0 ? from : at);
    from = (at < 0 ? from : at) + w.length;
  }
  const startsSec = positions.map((pos) => {
    let best = native.wordStarts[0];
    for (const b of native.wordStarts) if (Math.abs(b.charIndex - pos) < Math.abs(best.charIndex - pos)) best = b;
    return best.t;
  });
  const out: [number, number][] = [];
  for (let i = 0; i < words.length; i++) {
    const s = startsSec[i];
    const e = i < words.length - 1 ? Math.max(s + 0.05, startsSec[i + 1]) : Math.max(s + 0.1, native.duration);
    out.push([s, e]);
  }
  return out;
}

// ---- Contorno da gravação --------------------------------------------------

function median(values: number[]): number {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function userContour(frames: PitchFrame[]): UserContour | null {
  if (frames.length < 5) return null;
  const peak = Math.max(...frames.map((f) => f.rms));
  const gate = Math.max(0.01, peak * 0.12);
  const loud = frames.filter((f) => f.rms >= gate);
  if (!loud.length) return null;
  const t0 = loud[0].t;
  const t1 = loud[loud.length - 1].t;
  const span = Math.max(0.2, t1 - t0);

  // Quadros vozeados, com filtro de mediana (5) para tirar saltos de oitava.
  const voiced = frames.filter((f) => f.hz !== null && f.rms >= gate && f.t >= t0 && f.t <= t1);
  if (voiced.length < 5) return null;
  const smoothHz = voiced.map((_, i) => median(voiced.slice(Math.max(0, i - 2), i + 3).map((f) => f.hz!)));
  const ref = median(smoothHz);
  const pts = voiced
    .map((f, i) => ({ t: (f.t - t0) / span, st: 12 * Math.log2(smoothHz[i] / ref), raw: f.t }))
    .filter((p) => Math.abs(p.st) <= 9);
  if (pts.length < 5) return null;

  const segments: ContourPoint[][] = [];
  let prev = -Infinity;
  for (const p of pts) {
    if (p.raw - prev > 0.08) segments.push([]);
    segments[segments.length - 1].push({ t: p.t, st: p.st });
    prev = p.raw;
  }

  // Núcleos silábicos ≈ picos locais de energia com pelo menos 120 ms entre si.
  const env = frames.map((f, i) => {
    const w = frames.slice(Math.max(0, i - 2), i + 3);
    return { t: f.t, e: w.reduce((s, x) => s + x.rms, 0) / w.length };
  });
  const nuclei: number[] = [];
  let lastPeak = -Infinity;
  for (let i = 1; i < env.length - 1; i++) {
    const { t, e } = env[i];
    if (t < t0 || t > t1) continue;
    if (e >= gate * 1.5 && e >= env[i - 1].e && e > env[i + 1].e && t - lastPeak >= 0.12) {
      nuclei.push((t - t0) / span);
      lastPeak = t;
    }
  }
  return { segments: segments.filter((s) => s.length > 1), nuclei, duration: span };
}

// ---- Comparação ------------------------------------------------------------

export interface ProsodyFeedback {
  melodyOk: boolean;
  rhythmOk: boolean;
  /** Frases curtas, no máximo duas, em tom leve. */
  lines: string[];
  /** Duração da pessoa ÷ duração nativa. */
  pace: number;
}

export function compareProsody(target: TargetContour, user: UserContour): ProsodyFeedback {
  const all = user.segments.flat();
  const tail = all.filter((p) => p.t >= 0.65);
  const mid = all.filter((p) => p.t >= 0.35 && p.t < 0.7);
  const endMove = tail.length && mid.length ? median(tail.slice(-4).map((p) => p.st)) - median(mid.map((p) => p.st)) : 0;
  const melodyOk = target.finalMove === 'rise' ? endMove >= 1.5 : endMove <= -1;
  const pace = target.duration > 0 ? user.duration / target.duration : 1;
  const rhythmOk = pace >= 0.75 && pace <= 1.6;

  const lines: string[] = [];
  if (target.finalMove === 'rise') {
    lines.push(melodyOk ? 'Sua voz subiu no fim, como pede a pergunta.' : 'É pergunta: deixe a voz subir no fim.');
  } else {
    lines.push(melodyOk ? 'Sua voz desceu no fim, bem como o francês faz.' : 'No fim, deixe a voz cair um pouco.');
  }
  if (pace > 1.6) lines.push('Você falou mais devagar que o nativo — normal no começo.');
  else if (pace < 0.75) lines.push('Você falou mais rápido que o nativo. Pode ir com calma.');
  else lines.push('Seu ritmo ficou parecido com o do nativo.');
  return { melodyOk, rhythmOk, lines, pace };
}
