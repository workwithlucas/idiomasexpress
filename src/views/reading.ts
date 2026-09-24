import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, getDiscovered } from '../db/repo';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { readingLesson, resolveExample } from '../exercises/reading';
import { swap, type Exercise } from '../exercises/common';
import { speakSequence, stopSpeaking } from '../lib/tts';
import type { ReadingRule } from '../db/schema';
import { progressDots } from './cognates';

export const readingView: View = async () => {
  const c = content();
  const user = currentUser();
  const body = h('div', { class: 'stack' });
  let current: Exercise | null = null;

  const home = async () => {
    current?.cleanup?.();
    current = null;
    const found = await getDiscovered(user.id);
    const rules = c.readingRules;
    const next = rules.find((r) => !found.has(r.id));
    const known = rules.filter((r) => found.has(r.id));
    swap(
      body,
      h(
        'section',
        { class: 'hero-lite' },
        progressDots(known.length, rules.length),
        h('h2', null, next ? 'Descubra como se lê' : 'Você já descobriu todas!'),
        h('p', { class: 'muted' }, `${known.length} de ${rules.length}`),
        h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', 'data-testid': 'discover-next', onclick: () => start(next ?? rules[Math.floor(Math.random() * rules.length)]) }, next ? 'Descobrir' : 'Praticar uma', icon('arrowRight', 18)),
      ),
      known.length > 0 &&
        h(
          'details',
          { class: 'known' },
          h('summary', null, 'O que você já descobriu'),
          h(
            'ul',
            { class: 'known__list' },
            known.map((r) =>
              h(
                'li',
                { class: 'known__row', dataset: { rule: r.id } },
                h('button', { class: 'icon-btn icon-btn--sm', type: 'button', 'aria-label': `Ouvir exemplos de ${r.grapheme}`, onclick: () => void speakSequence(r.examples.slice(0, 3).map((e) => resolveExample(e).fr), 450) }, icon('play', 14)),
                h('button', { class: 'known__item', type: 'button', onclick: () => start(r) }, h('span', { lang: 'fr' }, r.grapheme), ' → ', r.sound, icon('chevronRight', 16)),
              ),
            ),
          ),
        ),
    );
  };

  const start = (rule: ReadingRule) => {
    current = readingLesson(rule, user.id, () => {
      notifyProgressChanged();
      void home();
    });
    swap(body, current.el);
  };

  await home();

  return {
    title: 'Como se lê',
    back: '/aprender',
    tab: 'learn',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: body,
  };
};
