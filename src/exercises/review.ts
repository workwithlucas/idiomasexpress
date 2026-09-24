import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { playButton } from '../ui/components';
import { content, getReviewState, rateWord } from '../db/repo';
import type { ReviewResult, ReviewState } from '../db/schema';
import { newReviewState, previewIntervals } from '../lib/fsrs';
import { now } from '../lib/clock';
import { prefs } from '../lib/prefs';
import { withArticle } from '../lib/text';
import { speak, stopSpeaking } from '../lib/tts';
import { cue } from '../lib/sounds';
import { toast } from '../ui/toast';
import { friendlyWhen, type Exercise } from './common';

const BUTTONS: { result: ReviewResult; label: string; key: string }[] = [
  { result: 'again', label: 'Não lembrei', key: '1' },
  { result: 'hard', label: 'Difícil', key: '2' },
  { result: 'good', label: 'Lembrei', key: '3' },
  { result: 'easy', label: 'Fácil', key: '4' },
];

export type Direction = 'recognize' | 'produce';

/**
 * Direção do cartão, determinística pelo número de revisões já feitas:
 * par → reconhecer (francês → português); ímpar → produzir (português → francês).
 */
export function directionFor(state: Pick<ReviewState, 'reps'> | undefined): Direction {
  return (state?.reps ?? 0) % 2 === 0 ? 'recognize' : 'produce';
}

/**
 * Um cartão da revisão. Chama onRated com o novo estado salvo.
 * Atalhos de teclado: espaço mostra, 1–4 avaliam.
 */
export function reviewCard(wordId: string, userId: string, onRated: (next: ReviewState, result: ReviewResult) => void): Exercise {
  const c = content();
  const word = c.wordById.get(wordId)!;
  const el = h('div', { class: 'lesson review-card', dataset: { word: word.id } });
  let revealed = false;
  let rating = false;

  const build = (state: ReviewState, isNew: boolean) => {
    const dir = directionFor(state);
    const t = now();
    const intervals = previewIntervals(state, t);
    const rule = word.cognate_rule_id ? c.ruleById.get(word.cognate_rule_id) : undefined;
    const fr = h('p', { class: 'flash__fr', lang: 'fr', 'data-testid': 'flash-fr' }, withArticle(word));
    const pt = h('p', { class: 'flash__pt', 'data-testid': 'flash-pt' }, word.pt);
    const audio = playButton(word.fr, { wordId: word.id });

    const front = dir === 'recognize' ? h('div', { class: 'flash__front' }, fr, audio) : h('div', { class: 'flash__front' }, pt);
    const back =
      dir === 'recognize'
        ? h('div', { class: 'flash__answer', hidden: true }, pt, aids())
        : h('div', { class: 'flash__answer', hidden: true }, h('div', { class: 'flash__front' }, fr, audio), aids());

    function aids() {
      return [
        rule && h('p', { class: 'flash__aid' }, icon('link', 16), h('span', null, rule.pattern)),
        word.memory_hook_pt && h('p', { class: 'flash__aid' }, icon('sparkles', 16), h('span', null, word.memory_hook_pt)),
      ];
    }

    const rateRow = h(
      'div',
      { class: 'rate', hidden: true },
      BUTTONS.map((b) =>
        h(
          'button',
          { class: `rate__btn rate__btn--${b.result}`, type: 'button', dataset: { result: b.result }, onclick: () => void rate(b.result) },
          h('strong', null, b.label),
          h('small', null, friendlyWhen(t, intervals[b.result])),
        ),
      ),
    );
    const revealBtn = h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', onclick: () => reveal(), 'data-testid': 'reveal' }, 'Mostrar');

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      cue('tap');
      back.hidden = false;
      rateRow.hidden = false;
      revealBtn.remove();
      el.querySelector('.flash')?.classList.add('flash--open');
      if (dir === 'produce') void speak(word.fr);
    };

    const rate = async (result: ReviewResult) => {
      if (!revealed || rating) return;
      rating = true;
      try {
        const next = await rateWord(userId, word.id, result);
        cue(result === 'again' ? 'almost' : 'right');
        onRated(next, result);
      } catch (e) {
        console.error(e);
        toast('Não deu pra salvar. Tente de novo.', 'error');
      } finally {
        rating = false;
      }
    };

    el.replaceChildren(
      h(
        'article',
        { class: 'card flash', dataset: { direction: dir } },
        h('div', { class: 'flash__tags' }, isNew && h('span', { class: 'pill pill--new' }, 'Nova'), h('span', { class: 'pill', 'data-testid': 'flash-direction' }, dir === 'recognize' ? 'O que significa?' : 'Como se diz em francês?')),
        front,
        back,
      ),
      revealBtn,
      rateRow,
    );
    keyHandler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, select, textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        reveal();
      }
      const b = BUTTONS.find((x) => x.key === e.key);
      if (b) void rate(b.result);
    };
    if (dir === 'recognize' && prefs().autoplay) void speak(word.fr);
  };

  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  const onKey = (e: KeyboardEvent) => keyHandler?.(e);
  window.addEventListener('keydown', onKey);

  void getReviewState(userId, wordId).then((state) => build(state ?? newReviewState(userId, wordId, now()), !state || state.reps === 0));

  return {
    el,
    cleanup: () => {
      window.removeEventListener('keydown', onKey);
      stopSpeaking();
    },
  };
}
