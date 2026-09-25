import { h } from './dom';
import type { LineToken, MomentoLine } from '../db/schema';
import { liaisonBetween } from '../lib/liaison';
import { liaisonWord } from '../exercises/common';

export const YOU = 'Você';

/** Texto corrido da fala (para tocar e para o leitor de tela). */
export const lineText = (l: MomentoLine) => l.tokens.map((t) => t.t).join('');

/**
 * Uma fala em francês. Com `onWord`, cada palavra do banco vira um botão
 * (passo 2); `knownIds` marca as de ponte (acendem com surface-soft).
 * As ligações (liaison) saem marcadas como no resto do app.
 */
export function lineView(
  line: MomentoLine,
  opts: { onWord?: (token: LineToken, el: HTMLElement) => void; knownIds?: Set<string> } = {},
): HTMLElement {
  const el = h('p', { class: 'fr', lang: 'fr' });
  const tokens = line.tokens;
  tokens.forEach((tok, i) => {
    // Ligação: palavra seguida só de espaço e de outra palavra.
    const gap = tokens[i + 1];
    const next = tokens[i + 2];
    const liaison = tok.w && gap && !gap.w && /^\s+$/.test(gap.t) && next?.w ? liaisonBetween(tok.t, next.t) : null;
    const face = liaison ? liaisonWord(tok.t, liaison) : tok.t;
    if (!tok.w) {
      el.append(tok.t);
    } else if (opts.onWord) {
      const known = !!opts.knownIds?.has(tok.w);
      const b = h('button', { class: 'tok', type: 'button', dataset: { word: tok.w, known: known ? '1' : '0' } }, face);
      b.addEventListener('click', () => opts.onWord!(tok, b));
      el.append(b);
    } else {
      el.append(face);
    }
  });
  return el;
}
