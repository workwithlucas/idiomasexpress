import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { ipa, playButton, segmented } from '../ui/components';
import { speak, speakSequence, stopSpeaking } from '../lib/tts';
import { pickRandom } from '../lib/text';
import type { MinimalPair, Word } from '../db/schema';

type Mode = 'which' | 'order';

interface Round {
  pair: MinimalPair;
  a: Word;
  b: Word;
  /** Modo "qual": palavra tocada. Modo "ordem": primeira palavra tocada. */
  target: Word;
  answered: boolean;
}

export const listeningView: View = () => {
  const c = content();
  let mode: Mode = 'which';
  let round: Round | null = null;
  let score = { right: 0, total: 0, streak: 0 };
  const stage = h('div', { class: 'stack' });

  const newRound = (): Round => {
    const pair = pickRandom(c.minimalPairs, round?.pair);
    const a = c.wordById.get(pair.word_a_id)!;
    const b = c.wordById.get(pair.word_b_id)!;
    return { pair, a, b, target: Math.random() < 0.5 ? a : b, answered: false };
  };

  const other = (r: Round) => (r.target === r.a ? r.b : r.a);

  const playRound = (r: Round) => (mode === 'which' ? speak(r.target.fr, { rate: 0.85 }) : speakSequence([r.target.fr, other(r).fr], 900));

  const answer = (r: Round, chosen: Word, btn: HTMLButtonElement) => {
    if (r.answered) return;
    r.answered = true;
    const correct = chosen === r.target;
    score = { right: score.right + (correct ? 1 : 0), total: score.total + 1, streak: correct ? score.streak + 1 : 0 };
    void logActivity(currentUser().id, 'listening', mode, { correct, word_id: r.target.id });
    btn.classList.add(correct ? 'option--right' : 'option--wrong');
    if (!correct) stage.querySelector<HTMLElement>(`[data-word="${r.target.id}"]`)?.classList.add('option--right');
    stage.querySelectorAll<HTMLButtonElement>('.option').forEach((b) => (b.disabled = true));
    stage.querySelectorAll('.option .ipa').forEach((el) => el.removeAttribute('hidden'));
    showFeedback(r, correct);
  };

  const showFeedback = (r: Round, correct: boolean) => {
    const fb = stage.querySelector('[data-slot="feedback"]')!;
    render(
      fb,
      h(
        'div',
        { class: `feedback feedback--${correct ? 'right' : 'wrong'}`, 'data-testid': 'listening-feedback' },
        icon(correct ? 'check' : 'x', 22),
        h(
          'div',
          null,
          h('strong', null, correct ? 'Isso!' : 'Quase.'),
          h('p', null, mode === 'which' ? `Você ouviu "${r.target.fr}".` : `A ordem foi "${r.target.fr}" → "${other(r).fr}".`),
        ),
      ),
      h(
        'div',
        { class: 'compare' },
        h('p', { class: 'compare__label' }, 'Compare os dois sons:'),
        h('div', { class: 'compare__row' }, [r.a, r.b].map((w) => h('div', { class: 'compare__item' }, playButton(w.fr, { wordId: w.id }), h('strong', { lang: 'fr' }, w.fr), ipa(w.ipa), h('small', null, w.pt)))),
      ),
      h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => start(), 'data-testid': 'next-round' }, 'Próximo', icon('arrowRight', 18)),
    );
    renderScore();
  };

  const renderScore = () => {
    const el = stage.querySelector('[data-slot="score"]');
    if (el) render(el, h('span', null, `${score.right}/${score.total} acertos`), score.streak >= 3 && h('span', { class: 'pill pill--good' }, icon('flame', 14), `${score.streak} seguidos`));
  };

  const start = () => {
    round = newRound();
    const r = round;
    const options: { label: HTMLElement; word: Word }[] =
      mode === 'which'
        ? [r.a, r.b].map((w) => ({ word: w, label: h('span', { class: 'option__text' }, h('strong', { lang: 'fr' }, w.fr), h('span', { class: 'ipa', hidden: true }, `/${w.ipa}/`)) }))
        : [
            { word: r.a, label: h('span', { class: 'option__text' }, h('strong', { lang: 'fr' }, `${r.a.fr} → ${r.b.fr}`)) },
            { word: r.b, label: h('span', { class: 'option__text' }, h('strong', { lang: 'fr' }, `${r.b.fr} → ${r.a.fr}`)) },
          ];

    render(
      stage,
      h(
        'div',
        { class: 'card listen' },
        h('div', { class: 'listen__top' }, h('span', { class: 'pill' }, r.pair.feature), h('span', { class: 'listen__score', 'data-slot': 'score' })),
        h('p', { class: 'listen__prompt' }, mode === 'which' ? 'Qual palavra você ouviu?' : 'Em que ordem as palavras foram ditas?'),
        h(
          'button',
          { class: 'big-play', type: 'button', 'aria-label': 'Tocar de novo', 'data-testid': 'listen-play', onclick: () => void playRound(r) },
          icon('play', 34),
          h('span', null, 'Ouvir de novo'),
        ),
        h(
          'div',
          { class: 'options' },
          options.map((o) => {
            const btn: HTMLButtonElement = h('button', { class: 'option', type: 'button', dataset: { word: o.word.id }, onclick: () => answer(r, o.word, btn) }, o.label);
            return btn;
          }),
        ),
        h('div', { 'data-slot': 'feedback' }),
      ),
    );
    renderScore();
    void playRound(r);
  };

  const intro = () =>
    render(
      stage,
      h(
        'div',
        { class: 'card intro' },
        h('div', { class: 'intro__icon' }, icon('ear', 30)),
        h('h2', null, `${c.minimalPairs.length} pares que confundem brasileiros`),
        h('p', null, 'Vogais nasais, o "u" francês, "eu" × "ô", s × z… Use fones de ouvido e responda sem pensar demais: o ouvido aprende com repetição.'),
        h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: () => start(), 'data-testid': 'listen-start' }, 'Começar', icon('play', 18)),
      ),
    );

  intro();

  return {
    title: 'Discriminação sonora',
    back: '/aprender',
    tab: 'learn',
    cleanup: stopSpeaking,
    content: h(
      'div',
      { class: 'stack' },
      segmented(
        [
          { value: 'which', label: 'Qual você ouviu?' },
          { value: 'order', label: 'Qual veio primeiro?' },
        ],
        mode,
        (v) => {
          mode = v;
          score = { right: 0, total: 0, streak: 0 };
          if (round) start();
        },
      ),
      stage,
    ),
  };
};
