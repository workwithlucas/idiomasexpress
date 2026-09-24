import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import {
  content, countIntroducedToday, getDueStates, getNewWords, getReviewState, getReviewStats, rateWord,
} from '../db/repo';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { ipa, playButton } from '../ui/components';
import { speak, stopSpeaking } from '../lib/tts';
import { formatInterval, newReviewState, previewIntervals } from '../lib/fsrs';
import { now } from '../lib/clock';
import { prefs } from '../lib/prefs';
import { withArticle } from '../lib/text';
import type { ReviewResult } from '../db/schema';

interface QueueItem {
  wordId: string;
  isNew: boolean;
}

/** Cartões que voltam a vencer dentro deste intervalo são reapresentados na mesma sessão. */
const REQUEUE_WITHIN_MS = 20 * 60_000;

const BUTTONS: { result: ReviewResult; label: string; key: string }[] = [
  { result: 'again', label: 'Errei', key: '1' },
  { result: 'hard', label: 'Difícil', key: '2' },
  { result: 'good', label: 'Bom', key: '3' },
  { result: 'easy', label: 'Fácil', key: '4' },
];

async function buildQueue(userId: string, extraNew = 0): Promise<QueueItem[]> {
  const due = (await getDueStates(userId)).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const remainingNew = Math.max(0, prefs().newPerDay - (await countIntroducedToday(userId))) + extraNew;
  const fresh = await getNewWords(userId, remainingNew);
  return [
    ...due.map((s) => ({ wordId: s.word_id, isNew: s.reps === 0 })),
    ...fresh.map((w) => ({ wordId: w.id, isNew: true })),
  ];
}

export const reviewView: View = async () => {
  const user = currentUser();
  const c = content();
  const stage = h('div', { class: 'stack' });
  let queue = await buildQueue(user.id);
  let done = { total: 0, again: 0 };
  let revealed = false;
  let rating = false;

  const progress = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progresso da sessão' }, h('span', { class: 'progress__bar' }));
  const counter = h('span', { class: 'review-counter', 'data-testid': 'review-remaining' });

  const updateProgress = () => {
    const total = done.total + queue.length;
    (progress.firstChild as HTMLElement).style.width = `${total ? (done.total / total) * 100 : 100}%`;
    counter.textContent = `${queue.length} restante${queue.length === 1 ? '' : 's'}`;
  };

  const showCard = async () => {
    updateProgress();
    const item = queue[0];
    if (!item) return showFinished();
    revealed = false;
    const word = c.wordById.get(item.wordId);
    if (!word) {
      queue.shift();
      return showCard();
    }
    const state = (await getReviewState(user.id, word.id)) ?? newReviewState(user.id, word.id, now());
    const t = now();
    const intervals = previewIntervals(state, t);
    const rule = word.cognate_rule_id ? c.ruleById.get(word.cognate_rule_id) : undefined;

    const answer = h(
      'div',
      { class: 'flash__answer', hidden: true },
      h('p', { class: 'flash__pt', 'data-testid': 'flash-pt' }, word.pt),
      rule && h('p', { class: 'flash__aid' }, icon('link', 16), h('span', null, `Cognato: ${rule.pattern}`)),
      word.memory_hook_pt && h('p', { class: 'flash__aid' }, icon('sparkles', 16), h('span', null, word.memory_hook_pt)),
    );

    const rateRow = h(
      'div',
      { class: 'rate', hidden: true },
      BUTTONS.map((b) =>
        h(
          'button',
          { class: `rate__btn rate__btn--${b.result}`, type: 'button', dataset: { result: b.result }, onclick: () => void rate(b.result) },
          h('strong', null, b.label),
          h('small', null, formatInterval(t, intervals[b.result])),
        ),
      ),
    );

    const revealBtn = h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', onclick: () => reveal(), 'data-testid': 'reveal' }, 'Mostrar resposta');

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      answer.hidden = false;
      rateRow.hidden = false;
      revealBtn.remove();
    };

    const rate = async (result: ReviewResult) => {
      if (!revealed || rating) return;
      rating = true;
      const next = await rateWord(user.id, word.id, result);
      queue.shift();
      done.total++;
      if (result === 'again') done.again++;
      if (new Date(next.due_at).getTime() - now().getTime() <= REQUEUE_WITHIN_MS) {
        queue.push({ wordId: word.id, isNew: false });
      }
      notifyProgressChanged();
      rating = false;
      void showCard();
    };

    render(
      stage,
      h(
        'article',
        { class: 'card flash', 'data-word': word.id },
        h('div', { class: 'flash__tags' }, item.isNew && h('span', { class: 'pill pill--new' }, 'Nova'), h('span', { class: 'pill' }, `#${word.freq_rank}`)),
        h('p', { class: 'flash__fr', lang: 'fr', 'data-testid': 'flash-fr' }, withArticle(word)),
        h('div', { class: 'flash__ipa' }, ipa(word.ipa), playButton(word.fr, { wordId: word.id })),
        answer,
      ),
      revealBtn,
      rateRow,
      h('p', { class: 'hint hint--center' }, 'Atalhos: espaço mostra a resposta · 1–4 avaliam'),
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
    if (prefs().autoplay) void speak(word.fr);
  };

  const showFinished = async () => {
    keyHandler = null;
    const stats = await getReviewStats(user.id);
    const t = now();
    render(
      stage,
      h(
        'div',
        { class: 'card finished', 'data-testid': 'review-finished' },
        h('div', { class: 'finished__icon' }, icon(done.total ? 'check' : 'sparkles', 30)),
        h('h3', null, done.total ? 'Sessão concluída!' : 'Nada para revisar agora'),
        h(
          'p',
          null,
          done.total
            ? `${done.total} avaliações · ${done.total - done.again} lembradas de primeira.`
            : 'Você está em dia com as revisões e já viu as palavras novas de hoje.',
        ),
        stats.nextDue && h('p', { class: 'muted' }, `Próxima revisão em ${formatInterval(t, stats.nextDue)} (${stats.nextDue.toLocaleString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}).`),
        h(
          'div',
          { class: 'row row--wrap row--center' },
          h('a', { class: 'btn btn--ghost', href: '#/' }, 'Voltar ao início'),
          h(
            'button',
            {
              class: 'btn btn--primary',
              type: 'button',
              'data-testid': 'more-new',
              onclick: async () => {
                queue = await buildQueue(user.id, 5);
                done = { total: 0, again: 0 };
                void showCard();
              },
            },
            icon('plus', 18),
            'Mais 5 palavras novas',
          ),
        ),
      ),
    );
    updateProgress();
  };

  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  const onKey = (e: KeyboardEvent) => keyHandler?.(e);
  window.addEventListener('keydown', onKey);

  void showCard();

  return {
    title: 'Revisão',
    tab: 'review',
    cleanup: () => {
      window.removeEventListener('keydown', onKey);
      stopSpeaking();
    },
    content: h('div', { class: 'stack' }, h('div', { class: 'review-top' }, progress, counter), stage),
  };
};
