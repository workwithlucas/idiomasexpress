import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { countIntroducedToday, getDueStates, getNewWords, getReviewStats } from '../db/repo';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { reviewCard } from '../exercises/review';
import { friendlyWhen, swap, type Exercise } from '../exercises/common';
import { now } from '../lib/clock';
import { prefs } from '../lib/prefs';
import { stopSpeaking } from '../lib/tts';
import { cue } from '../lib/sounds';
import { ring } from './session';

/** Cartões que voltam a vencer dentro deste intervalo são reapresentados na mesma rodada. */
const REQUEUE_WITHIN_MS = 20 * 60_000;

async function buildQueue(userId: string, extraNew = 0): Promise<string[]> {
  const due = (await getDueStates(userId)).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const remainingNew = Math.max(0, prefs().newPerDay - (await countIntroducedToday(userId))) + extraNew;
  const fresh = await getNewWords(userId, remainingNew);
  return [...due.map((s) => s.word_id), ...fresh.map((w) => w.id)];
}

export const reviewView: View = async () => {
  const user = currentUser();
  const stage = h('div');
  let queue = await buildQueue(user.id);
  let done = 0;
  let current: Exercise | null = null;

  const bar = h('span', { class: 'progress__bar' });
  const counter = h('span', { class: 'review-counter', 'data-testid': 'review-remaining' });
  const updateProgress = () => {
    const total = done + queue.length;
    bar.style.width = `${total ? (done / total) * 100 : 100}%`;
    counter.textContent = queue.length ? `faltam ${queue.length}` : '';
  };

  const showCard = () => {
    current?.cleanup?.();
    current = null;
    updateProgress();
    const wordId = queue[0];
    if (!wordId) return void showFinished();
    current = reviewCard(wordId, user.id, (next) => {
      queue.shift();
      done++;
      if (new Date(next.due_at).getTime() - now().getTime() <= REQUEUE_WITHIN_MS) queue.push(wordId);
      notifyProgressChanged();
      showCard();
    });
    swap(stage, current.el);
  };

  const showFinished = async () => {
    const stats = await getReviewStats(user.id);
    if (done) cue('done');
    swap(
      stage,
      h(
        'div',
        { class: 'session-done', 'data-testid': 'review-finished' },
        ring(1),
        h('h2', null, done ? 'Tudo revisado!' : 'Nada pra revisar agora'),
        stats.nextDue && h('p', { class: 'muted' }, `A próxima volta ${friendlyWhen(now(), stats.nextDue)}.`),
        h(
          'button',
          {
            class: 'btn btn--ghost btn--block',
            type: 'button',
            'data-testid': 'more-new',
            onclick: async () => {
              queue = await buildQueue(user.id, 5);
              done = 0;
              showCard();
            },
          },
          icon('plus', 18),
          'Mais 5 palavras novas',
        ),
        h('a', { class: 'btn btn--primary btn--block', href: '#/' }, 'Voltar ao início'),
      ),
    );
    updateProgress();
  };

  showCard();

  return {
    title: 'Revisar',
    tab: 'review',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: h('div', { class: 'stack' }, h('div', { class: 'session-top' }, h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progresso' }, bar), counter), stage),
  };
};
