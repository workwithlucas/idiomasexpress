/**
 * Alinha a palavra em português com a francesa (distância de edição) e diz
 * quais letras mudam em cada uma. Usado no "toque no pedaço que muda" e para
 * destacar a mudança depois.
 */
export interface WordDiff {
  /** Índices de letras do francês que diferem do português. */
  fr: Set<number>;
  /** Índices de letras do português que diferem do francês. */
  pt: Set<number>;
}

export function diffWords(pt: string, fr: string): WordDiff {
  const a = [...pt.toLowerCase()];
  const b = [...fr.toLowerCase()];
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), dp[i - 1][j] + 1, dp[i][j - 1] + 1);
    }
  }
  const out: WordDiff = { fr: new Set(), pt: new Set() };
  let i = m;
  let j = n;
  const gaps: number[] = []; // posições no francês onde uma letra do português sumiu
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      out.pt.add(i - 1);
      out.fr.add(j - 1);
      i--;
      j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      out.fr.add(j - 1);
      j--;
    } else {
      out.pt.add(i - 1);
      gaps.push(j);
      i--;
    }
  }
  // Letra do português que sumiu sem nenhuma mudança ao lado: a vizinha no
  // francês marca o lugar (ex.: "escola" → "école").
  for (const g of gaps) {
    if (!out.fr.has(g - 1) && !out.fr.has(g) && n > 0) out.fr.add(Math.max(0, Math.min(n - 1, g - 1)));
  }
  return out;
}

/** Junta índices em trechos contínuos, tolerando buracos de 1 letra (t-i-o-n). */
export function runs(indices: Set<number>): [number, number][] {
  const sorted = [...indices].sort((x, y) => x - y);
  const out: [number, number][] = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && k - last[1] <= 2) last[1] = k;
    else out.push([k, k]);
  }
  return out;
}

/** Aceita o toque se cair num trecho que muda (com 1 letra de folga). */
export function tapHits(index: number, changed: Set<number>): boolean {
  return runs(changed).some(([s, e]) => index >= s - 1 && index <= e + 1);
}
