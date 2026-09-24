import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { playButton } from '../ui/components';
import { addToReview, content, logActivity } from '../db/repo';
import type { CognateRule, Word } from '../db/schema';
import { diffWords, runs, tapHits } from '../lib/diff';
import { normalize } from '../lib/text';
import { speak } from '../lib/tts';
import { cue } from '../lib/sounds';
import { feedback, primaryButton, swap, type Done, type Exercise } from './common';

/** Palavra com os trechos que mudam destacados. */
function marked(word: string, changed: Set<number>, cls: string): HTMLElement {
  const chars = [...word];
  const el = h('span', { class: `marked ${cls}` });
  let k = 0;
  for (const [s, e] of runs(changed)) {
    if (s > k) el.append(chars.slice(k, s).join(''));
    el.append(h('mark', null, chars.slice(s, e + 1).join('')));
    k = e + 1;
  }
  if (k < chars.length) el.append(chars.slice(k).join(''));
  return el;
}

/**
 * A acepção em português mais parecida com o francês ("question" →
 * "questão", não "pergunta"): é ela que mostra o padrão.
 */
export function cognatePt(w: Word): string {
  const options = w.pt.split(/[;,]/).map((p) => p.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
  const fr = normalize(w.fr);
  return options.reduce((best, o) => (editDistance(normalize(o), fr) < editDistance(normalize(best), fr) ? o : best), options[0] ?? w.pt);
}

function pairRow(w: Word, highlight: boolean): HTMLElement {
  const pt = cognatePt(w);
  const d = diffWords(pt, w.fr);
  return h(
    'li',
    { class: 'pair-row' },
    h('span', { class: 'pair-row__pt' }, highlight ? marked(pt, d.pt, 'marked--pt') : pt),
    h('span', { class: 'pair-row__arrow', 'aria-hidden': 'true' }, icon('arrowRight', 16)),
    h('span', { class: 'pair-row__fr', lang: 'fr' }, highlight ? marked(w.fr, d.fr, 'marked--fr') : w.fr),
    playButton(w.fr, { wordId: w.id, size: 'sm' }),
  );
}

/**
 * Descoberta de uma regra de cognato:
 *  1. três pares PT → FR, sem dizer a regra; toque no pedaço que muda;
 *  2. só então a regra aparece, como confirmação;
 *  3. mais dois ou três exemplos para aplicar sozinho (digitando).
 */
export function cognateLesson(rule: CognateRule, userId: string, onDone: Done): Exercise {
  const c = content();
  const words = rule.examples.map((id) => c.wordById.get(id)!).filter(Boolean);
  const discover = words.slice(0, 3);
  const apply = words.slice(3, 6);
  const stage = h('div', { class: 'lesson', dataset: { rule: rule.id } });
  let applyRight = 0;

  const stepTap = () => {
    const target = discover[0];
    const changed = diffWords(cognatePt(target), target.fr).fr;
    let misses = 0;
    const tiles = h('div', { class: 'tiles', lang: 'fr', 'data-testid': 'tap-word' });
    [...target.fr].forEach((ch, i) => {
      const tile = h('button', { class: 'tile', type: 'button', dataset: { i: String(i) } }, ch);
      tile.addEventListener('click', () => {
        if (tapHits(i, changed)) {
          cue('right');
          reveal(true);
        } else {
          misses++;
          cue('almost');
          tile.classList.add('tile--miss');
          setTimeout(() => tile.classList.remove('tile--miss'), 450);
          if (misses >= 2) reveal(false);
          else hint.textContent = 'Quase! Compare com o português de novo.';
        }
      });
      tiles.append(tile);
    });
    const hint = h('p', { class: 'hint hint--center', 'aria-live': 'polite' });
    swap(
      stage,
      h('p', { class: 'eyebrow' }, 'Olhe os três'),
      h('ul', { class: 'pair-list' }, discover.map((w) => pairRow(w, false))),
      h('h2', { class: 'ask' }, 'O que muda do português pro francês?'),
      h('p', { class: 'ask-sub' }, 'Toque nessa parte:'),
      tiles,
      hint,
    );
  };

  const reveal = (found: boolean) => {
    void logActivity(userId, 'cognates', `discover:${rule.id}`, { correct: found });
    swap(
      stage,
      feedback(found ? 'right' : 'almost', found ? 'Isso mesmo!' : 'Quase — a mudança está aqui:'),
      h('div', { class: 'rule-card' }, h('p', { class: 'rule-card__pattern', 'data-testid': 'rule-pattern' }, rule.pattern)),
      h('ul', { class: 'pair-list' }, discover.map((w) => pairRow(w, true))),
      primaryButton('Agora você', () => stepApply(0)),
    );
  };

  const stepApply = (i: number) => {
    if (i >= apply.length) return finish();
    const w = apply[i];
    const input = h('input', {
      class: 'input input--big',
      type: 'text',
      lang: 'fr',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: false,
      placeholder: 'em francês…',
      'aria-label': `"${cognatePt(w)}" em francês`,
      'data-testid': 'apply-input',
    });
    const result = h('div');
    let answered = false;
    const check = (giveUp: boolean) => {
      if (answered) return;
      answered = true;
      const typed = normalize(input.value);
      const exact = !giveUp && typed === normalize(w.fr);
      const near = !giveUp && !exact && typed.length > 2 && editDistance(typed, normalize(w.fr)) <= 1;
      if (exact || near) applyRight++;
      cue(exact || near ? 'right' : 'almost');
      input.disabled = true;
      void addToReview(userId, w.id);
      swapResult(result, exact ? feedback('right', 'Isso!') : near ? feedback('right', 'Quase perfeito!', `É "${w.fr}".`) : feedback('almost', giveUp ? 'É assim:' : 'Quase!', `É "${w.fr}".`), w, () => stepApply(i + 1), i === apply.length - 1);
      void speak(w.fr);
    };
    swap(
      stage,
      h('p', { class: 'eyebrow' }, `Sua vez · ${i + 1} de ${apply.length}`),
      h('p', { class: 'big-word' }, cognatePt(w)),
      h(
        'form',
        { class: 'answer', onsubmit: (e: Event) => { e.preventDefault(); check(false); } },
        input,
        h('div', { class: 'row' }, h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => check(true), 'data-testid': 'dont-know' }, 'Não sei'), h('button', { class: 'btn btn--primary', type: 'submit', 'data-testid': 'check' }, 'Conferir')),
      ),
      result,
    );
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  };

  const finish = () => {
    for (const w of discover) void addToReview(userId, w.id);
    onDone({ correct: applyRight >= Math.ceil(apply.length / 2) });
  };

  stepTap();
  return { el: stage };
}

function swapResult(box: HTMLElement, fb: HTMLElement, w: Word, next: () => void, last: boolean): void {
  box.replaceChildren(
    h(
      'div',
      { class: 'step-in stack stack--sm' },
      fb,
      h('div', { class: 'row' }, h('span', { class: 'answer-word', lang: 'fr' }, w.fr), playButton(w.fr, { wordId: w.id, size: 'sm' })),
      primaryButton(last ? 'Concluir' : 'Próxima', next),
    ),
  );
}

export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}
