import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content } from '../db/repo';
import { currentUser } from '../ui/session';
import { segmented } from '../ui/components';
import { pairRound, type PairMode } from '../exercises/pair';
import { swap, type Exercise } from '../exercises/common';
import { pickRandom } from '../lib/text';
import { stopSpeaking } from '../lib/tts';
import type { MinimalPair } from '../db/schema';

export const listeningView: View = () => {
  const c = content();
  const user = currentUser();
  const stage = h('div');
  const tally = h('div', { class: 'tally', 'aria-live': 'polite' });
  let mode: PairMode = 'which';
  let last: MinimalPair | undefined;
  let current: Exercise | null = null;
  const results: boolean[] = [];

  const renderTally = () =>
    tally.replaceChildren(...results.slice(-10).map((r) => h('span', { class: `tally__dot${r ? ' tally__dot--on' : ''}` })));

  const next = () => {
    current?.cleanup?.();
    last = pickRandom(c.minimalPairs, last);
    current = pairRound(last, mode, user.id, (r) => {
      results.push(r.correct);
      renderTally();
      next();
    });
    swap(stage, current.el);
  };

  swap(
    stage,
    h(
      'div',
      { class: 'hero-lite' },
      h('div', { class: 'intro__icon' }, icon('ear', 30)),
      h('h2', null, 'Sons parecidos, vozes diferentes'),
      h('p', { class: 'muted' }, 'Use fones. Responda sem pensar muito.'),
      h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', onclick: next, 'data-testid': 'listen-start' }, 'Começar', icon('play', 18)),
    ),
  );

  return {
    title: 'Ouvido fino',
    back: '/aprender',
    tab: 'learn',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: h(
      'div',
      { class: 'stack' },
      segmented(
        [
          { value: 'which', label: 'Qual você ouviu?' },
          { value: 'order', label: 'Qual veio antes?' },
        ],
        mode,
        (v) => {
          mode = v;
          if (current) next();
        },
      ),
      tally,
      stage,
    ),
  };
};
